// ─────────────────────────────────────────────────────────────────────────────
// API Client — wrapper centralizado para todas as chamadas ao backend
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Tipos de resposta ────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  usuarioId: string;
  nome: string;
  email: string;
}

export interface CnhValidadeInfo {
  dataValidade: string;
  anosValidade: number;
  diasParaVencer: number;
  nivelStatus: "Regular" | "Atencao" | "Vencida";
}

export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  whatsAppNumero: string | null;
  notificarEmail: boolean;
  notificarWhatsApp: boolean;
  atividadeRemunerada: boolean;
  cpf: string | null;
  numeroRegistroCnh: string | null;
  categoriaCnh: string | null;
  dataNascimento: string | null;
  dataExpedicaoCnh: string | null;
  nomeMae: string | null;
  situacaoCnh: string | null;
  cnhValidadaEm: string | null;
  validadeCnh: CnhValidadeInfo | null;
  criadoEm: string;
  totalVeiculos: number;
  totalMultas: number;
}

export interface ValidarCnhResultado {
  sucesso: boolean;
  situacaoCnh: string | null;
  categoriaCnh: string | null;
  dataExpedicaoCnh: string | null;
  validadeCnhOficial: string | null;
  cnhValidadaEm: string;
  avisos: string[];
}

export interface MultaPontuacaoItem {
  multaId: string;
  descricaoInfracao: string;
  artigoCtb: string;
  gravidade: "Leve" | "Media" | "Grave" | "Gravissima";
  pontos: number;
  dataInfracao: string;
  dataExpiracao: string;
}

export interface PontuacaoCnh {
  atividadeRemunerada: boolean;
  pontosAtuais: number;
  limiteAplicavel: number;
  infracoesGravissimasNoPeriodo: number;
  pontosRestantesParaSuspensao: number;
  percentualDoLimite: number;
  nivelStatus: "Regular" | "Atencao" | "Risco";
  elegivelReciclagemPreventiva: boolean;
  multasConsideradas: MultaPontuacaoItem[];
}

export interface Veiculo {
  id: string;
  placa: string;
  renavam: string;
  uf: string;
  monitoramentoAtivo: boolean;
  ultimaVerificacaoEm: string | null;
  criadoEm: string;
  totalMultas: number;
  multasAbertas: number;
  ultimaMultaEm: string | null;
}

export interface Multa {
  id: string;
  numeroAutoInfracao: string;
  orgaoAutuador: string;
  codigoInfracaoCtb: string;
  artigoCtb: string;
  descricaoInfracao: string;
  gravidade: "Leve" | "Media" | "Grave" | "Gravissima";
  valor: number;
  pontos: number;
  dataInfracao: string;
  prazoDefesaPrevia: string | null;
  prazoRecursoJari: string | null;
  status: StatusRecurso;
  analiseIa: string | null;
  fundamentacaoRecurso: string | null;
  textoDefesa: string | null;
  comoEvitarNoFuturo: string | null;
  chanceRecursoPercent: number | null;
  ondeRecorrer: string | null;
  ondeObterDesconto: string | null;
  localInfracao: string | null;
  autuacaoPdfUrl?: string | null;
  boletoPdfUrl?: string | null;
  detectadaEm: string;
  analisadaEm: string | null;
  placaVeiculo?: string;
  veiculoId?: string;
  diasParaPrazo?: number | null;
}

export type StatusRecurso =
  | "NaoAvaliado"
  | "RecursoViavel"
  | "RecursoNaoRecomendado"
  | "DefesaGerada"
  | "Protocolado"
  | "Deferido"
  | "Indeferido";

// ─── Storage do token ─────────────────────────────────────────────────────────

const TOKEN_KEY = "sentinela_token";
const USER_KEY = "sentinela_user";

export const auth = {
  salvarSessao(resp: AuthResponse) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, resp.token);
    localStorage.setItem(USER_KEY, JSON.stringify({ id: resp.usuarioId, nome: resp.nome, email: resp.email }));
  },
  limparSessao() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser(): { id: string; nome: string; email: string } | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  isLogado(): boolean {
    return !!this.getToken();
  },
};

// ─── Fetch base ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    auth.limparSessao();
    window.location.href = "/entrar";
    throw new Error("Sessão expirada");
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ mensagem: res.statusText }));
    throw new Error(errBody.mensagem ?? "Erro desconhecido");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Endpoints de Auth ────────────────────────────────────────────────────────

export const apiAuth = {
  async registrar(nome: string, email: string, senha: string): Promise<AuthResponse> {
    return apiFetch("/api/auth/registrar", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    });
  },
  async entrar(email: string, senha: string): Promise<AuthResponse> {
    return apiFetch("/api/auth/entrar", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
  },
};

// ─── Endpoints de Usuário ─────────────────────────────────────────────────────

export const apiUsuarios = {
  async perfil(): Promise<PerfilUsuario> {
    return apiFetch("/api/usuarios/me");
  },
  async atualizar(data: Partial<{
    nome: string;
    whatsAppNumero: string;
    notificarEmail: boolean;
    notificarWhatsApp: boolean;
    atividadeRemunerada: boolean;
    cpf: string;
    numeroRegistroCnh: string;
    categoriaCnh: string;
    dataNascimento: string;
    dataExpedicaoCnh: string;
    nomeMae: string;
  }>) {
    return apiFetch("/api/usuarios/me", { method: "PATCH", body: JSON.stringify(data) });
  },
  async pontuacaoCnh(): Promise<PontuacaoCnh> {
    return apiFetch("/api/usuarios/pontuacao-cnh");
  },
  async validarCnh(codigoSeguranca: string): Promise<ValidarCnhResultado> {
    return apiFetch("/api/usuarios/validar-cnh", {
      method: "POST",
      body: JSON.stringify({ codigoSeguranca }),
    });
  },
};

// ─── Endpoints de Veículos ────────────────────────────────────────────────────

export const apiVeiculos = {
  async listar(): Promise<Veiculo[]> {
    return apiFetch("/api/veiculos");
  },
  async criar(placa: string, renavam: string, uf = "RJ"): Promise<Veiculo> {
    return apiFetch("/api/veiculos", {
      method: "POST",
      body: JSON.stringify({ placa, renavam, uf }),
    });
  },
  async remover(id: string): Promise<void> {
    return apiFetch(`/api/veiculos/${id}`, { method: "DELETE" });
  },
  async verificarAgora(id: string) {
    return apiFetch(`/api/veiculos/${id}/verificar-agora`, { method: "POST" });
  },
  async alternarMonitoramento(id: string, ativo: boolean) {
    return apiFetch(`/api/veiculos/${id}/monitoramento?ativo=${ativo}`, { method: "PATCH" });
  },
};

// ─── Endpoints de Multas ──────────────────────────────────────────────────────

export const apiMultas = {
  async minhas(): Promise<Multa[]> {
    return apiFetch("/api/multas/minha");
  },
  async porVeiculo(veiculoId: string): Promise<Multa[]> {
    return apiFetch(`/api/multas/veiculo/${veiculoId}`);
  },
  async detalhe(id: string): Promise<Multa> {
    return apiFetch(`/api/multas/${id}`);
  },
  async gerarDefesa(id: string) {
    return apiFetch(`/api/multas/${id}/gerar-defesa`, { method: "POST" });
  },
  async atualizarStatus(id: string, status: StatusRecurso) {
    return apiFetch(`/api/multas/${id}/status?status=${status}`, { method: "PATCH" });
  },
};

// ─── SWR Keys ────────────────────────────────────────────────────────────────

export const swrKeys = {
  veiculos: "/api/veiculos",
  multasMinhas: "/api/multas/minha",
  perfil: "/api/usuarios/me",
  pontuacaoCnh: "/api/usuarios/pontuacao-cnh",
  multaDetalhe: (id: string) => `/api/multas/${id}`,
};
