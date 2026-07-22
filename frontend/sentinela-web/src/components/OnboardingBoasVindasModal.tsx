"use client";

import { useState } from "react";
import { PerfilUsuario, TipoVeiculo, apiUsuarios, apiVeiculos } from "@/lib/api";
import CnhDocumentVisual from "@/components/CnhDocumentVisual";
import { ShieldCheck, Sparkles, AlertCircle, Loader2, Car, Bike, PlusCircle, CheckCircle2 } from "lucide-react";

interface Props {
  perfil: PerfilUsuario;
  /** Chamado só ao final do fluxo (veículo cadastrado OU "configurar depois").
   *  O pai deve remutar perfil + veículos — o modal some sozinho quando
   *  precisaOnboarding vira false. */
  onConcluido: () => void;
}

const campoClasses =
  "w-full rounded-lg border border-borda bg-fundo/60 px-3 py-2.5 text-sm text-texto placeholder-nevoa focus:border-verdeSinal/50 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all";

const labelClasses = "block text-[11px] font-mono text-nevoa mb-1.5 uppercase tracking-widest";

const formatarCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11);
const formatarPlaca = (v: string) => v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7);

/**
 * Onboarding em duas etapas, exibido no primeiro acesso (ou sempre que Nome,
 * CPF ou Nº de registro da CNH estiverem em branco no perfil):
 *
 * 1) Dados da conta (Nome/CPF/Registro CNH) — obrigatório, sem como pular.
 *    Sem esses dados o Sentinela não consegue montar o cartão de CNH nem
 *    identificar o proprietário do veículo monitorado.
 * 2) Primeiro veículo (placa/RENAVAM/tipo/CPF opcional) — aqui SIM existe um
 *    "Configurar depois", porque cadastrar veículo é uma ação com mais
 *    fricção (placa na mão) e não deve travar quem só quer entrar no painel.
 *
 * onConcluido só é chamado ao final da etapa 2 (criando veículo ou pulando)
 * — nunca ao final da etapa 1, senão o pai recalcularia precisaOnboarding
 * e desmontaria o modal antes da etapa 2 aparecer.
 */
export default function OnboardingBoasVindasModal({ perfil, onConcluido }: Props) {
  const [etapa, setEtapa] = useState<"dados" | "veiculo">("dados");

  const [formDados, setFormDados] = useState({
    nome: perfil.nome ?? "",
    cpf: perfil.cpf ?? "",
    numeroRegistroCnh: perfil.numeroRegistroCnh ?? "",
  });
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [erroDados, setErroDados] = useState("");

  const [formVeiculo, setFormVeiculo] = useState<{
    placa: string;
    renavam: string;
    tipo: TipoVeiculo;
    cpfProprietario: string;
  }>({ placa: "", renavam: "", tipo: "Carro", cpfProprietario: "" });
  const [mostrarCpfVeiculo, setMostrarCpfVeiculo] = useState(false);
  const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
  const [erroVeiculo, setErroVeiculo] = useState("");

  const validarDados = (): string | null => {
    if (!formDados.nome.trim()) return "Informe seu nome completo.";
    if (formDados.cpf.length !== 11) return "CPF é obrigatório e deve ter 11 dígitos.";
    if (!formDados.numeroRegistroCnh.trim()) return "Informe o número de registro da sua CNH.";
    return null;
  };

  const handleSubmitDados = async (e: React.FormEvent) => {
    e.preventDefault();
    const erro = validarDados();
    if (erro) {
      setErroDados(erro);
      return;
    }
    setSalvandoDados(true);
    setErroDados("");
    try {
      await apiUsuarios.atualizar({
        nome: formDados.nome.trim(),
        cpf: formDados.cpf,
        numeroRegistroCnh: formDados.numeroRegistroCnh.trim().toUpperCase(),
      });
      setEtapa("veiculo");
    } catch (err: any) {
      setErroDados(err.message ?? "Erro ao salvar seus dados. Tente novamente.");
    } finally {
      setSalvandoDados(false);
    }
  };

  const handleSubmitVeiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formVeiculo.placa.length < 7) {
      setErroVeiculo("Placa inválida. Use o formato AAA9999 ou AAA9A99.");
      return;
    }
    if (formVeiculo.renavam.replace(/\D/g, "").length < 9) {
      setErroVeiculo("RENAVAM inválido. Deve ter 9 ou 11 dígitos.");
      return;
    }
    if (formVeiculo.cpfProprietario && formVeiculo.cpfProprietario.length !== 11) {
      setErroVeiculo("CPF do proprietário inválido. Deve ter 11 dígitos, ou deixe em branco.");
      return;
    }
    setSalvandoVeiculo(true);
    setErroVeiculo("");
    try {
      await apiVeiculos.criar(
        formVeiculo.placa,
        formVeiculo.renavam.replace(/\D/g, ""),
        "RJ",
        formVeiculo.cpfProprietario || undefined,
        formVeiculo.tipo
      );
      onConcluido();
    } catch (err: any) {
      setErroVeiculo(err.message ?? "Erro ao cadastrar veículo.");
    } finally {
      setSalvandoVeiculo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      {/* Overlay sem onClick — bloqueante de propósito, não fecha sozinho */}
      <div className="absolute inset-0 drawer-overlay animate-fade-in" />

      {etapa === "dados" ? (
        <div className="relative z-10 w-full max-w-3xl my-6 grid grid-cols-1 md:grid-cols-[minmax(0,320px)_1fr] gap-8 items-center">
          {/* Cartão de CNH animado — vai se preenchendo ao vivo com o que a
              pessoa digita, reforçando visualmente por que os dados importam. */}
          <div className="hidden md:block animate-scale-in" style={{ animationDelay: "80ms" }}>
            <div className="animate-welcome-card-in">
              <CnhDocumentVisual
                nome={formDados.nome}
                cpf={formDados.cpf}
                numeroRegistroCnh={formDados.numeroRegistroCnh}
                categoriaCnh={perfil.categoriaCnh}
                dataExpedicaoCnh={perfil.dataExpedicaoCnh}
                validade={perfil.validadeCnh}
                situacaoCnh={perfil.situacaoCnh}
                cnhValidadaEm={perfil.cnhValidadaEm}
              />
            </div>
          </div>

          <div className="card !rounded-3xl p-7 md:p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-verdeSinal/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-verdeSinal" />
              </div>
              <h2 className="font-display text-xl font-bold text-texto leading-tight">
                Bem-vindo(a) ao Sentinela
              </h2>
            </div>
            <p className="text-sm text-nevoa mb-6 leading-relaxed">
              Para monitorar seus veículos de forma efetiva — consultando o SERPRO/RADAR
              e te avisando de novas multas — precisamos de três dados seus.
            </p>

            {/* Cartão de CNH em miniatura, versão mobile */}
            <div className="md:hidden mb-6 animate-welcome-card-in">
              <CnhDocumentVisual
                nome={formDados.nome}
                cpf={formDados.cpf}
                numeroRegistroCnh={formDados.numeroRegistroCnh}
                categoriaCnh={perfil.categoriaCnh}
                dataExpedicaoCnh={perfil.dataExpedicaoCnh}
                validade={perfil.validadeCnh}
                situacaoCnh={perfil.situacaoCnh}
                cnhValidadaEm={perfil.cnhValidadaEm}
              />
            </div>

            <form onSubmit={handleSubmitDados} className="space-y-4">
              <div>
                <label className={labelClasses}>
                  Nome completo <span className="text-vermelhoSinal">*</span>
                </label>
                <input
                  className={campoClasses}
                  value={formDados.nome}
                  onChange={(e) => setFormDados({ ...formDados, nome: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>
                    CPF <span className="text-vermelhoSinal">*</span>
                  </label>
                  <input
                    className={`${campoClasses} font-mono`}
                    value={formDados.cpf}
                    onChange={(e) => setFormDados({ ...formDados, cpf: formatarCpf(e.target.value) })}
                    placeholder="Somente números"
                    inputMode="numeric"
                    maxLength={11}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    Nº registro CNH <span className="text-vermelhoSinal">*</span>
                  </label>
                  <input
                    className={`${campoClasses} font-mono`}
                    value={formDados.numeroRegistroCnh}
                    onChange={(e) => setFormDados({ ...formDados, numeroRegistroCnh: e.target.value })}
                    placeholder="Nº da CNH"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>E-mail (login)</label>
                <input className={`${campoClasses} opacity-60 cursor-not-allowed`} value={perfil.email} disabled />
              </div>

              {erroDados && (
                <div className="rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] px-4 py-3 text-sm text-vermelhoSinal flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{erroDados}</p>
                </div>
              )}

              <div className="bg-azulMercosul/[0.06] border border-azulMercosul/15 rounded-xl px-4 py-3 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-azulMercosul shrink-0 mt-0.5" />
                <p className="text-xs text-nevoa leading-relaxed">
                  CPF e nº de registro da CNH podem ser corrigidos depois nas abas Minha Conta e CNH.
                </p>
              </div>

              <button
                type="submit"
                disabled={salvandoDados}
                className="w-full rounded-xl bg-verdeSinal py-3.5 font-semibold text-white hover:bg-verdeSinal/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {salvandoDados ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>Continuar</>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-sm card !rounded-3xl p-7 shadow-2xl animate-scale-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-verdeSinal/10 flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5 text-verdeSinal" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-texto leading-tight">Cadastre seu veículo</h2>
              <p className="text-xs text-nevoa mt-1">Passo 2 de 2 · varredura diária às 10:00</p>
            </div>
          </div>
          <p className="text-sm text-nevoa mt-3 mb-5 leading-relaxed">
            Com a placa e o RENAVAM, o Sentinela já começa a monitorar multas automaticamente.
          </p>

          <form onSubmit={handleSubmitVeiculo} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-nevoa mb-1.5">Tipo de veículo</label>
              <div className="grid grid-cols-2 gap-2">
                {(["Carro", "Moto"] as const).map((t) => {
                  const ativo = formVeiculo.tipo === t;
                  const Icone = t === "Carro" ? Car : Bike;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormVeiculo({ ...formVeiculo, tipo: t })}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        ativo
                          ? "border-verdeSinal/50 bg-verdeSinal/10 text-verdeSinal"
                          : "border-borda text-nevoa hover:text-texto hover:border-bordaGlow"
                      }`}
                    >
                      <Icone className="w-4 h-4" />
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-nevoa mb-1.5">Placa do veículo</label>
              <input
                type="text"
                value={formVeiculo.placa}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, placa: formatarPlaca(e.target.value) })}
                placeholder="AAA0000 ou AAA0A00"
                maxLength={7}
                className={`${campoClasses} font-mono tracking-[0.15em] uppercase`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-nevoa mb-1.5">RENAVAM</label>
              <input
                type="text"
                value={formVeiculo.renavam}
                onChange={(e) => setFormVeiculo({ ...formVeiculo, renavam: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                placeholder="9 ou 11 dígitos"
                inputMode="numeric"
                className={`${campoClasses} font-mono`}
              />
            </div>

            {!mostrarCpfVeiculo ? (
              <button
                type="button"
                onClick={() => setMostrarCpfVeiculo(true)}
                className="text-xs font-medium text-azulMercosul hover:underline"
              >
                Este veículo não está no meu CPF (opcional)
              </button>
            ) : (
              <div>
                <label className="block text-xs font-medium text-nevoa mb-1.5">CPF do proprietário do veículo</label>
                <input
                  type="text"
                  value={formVeiculo.cpfProprietario}
                  onChange={(e) => setFormVeiculo({ ...formVeiculo, cpfProprietario: formatarCpf(e.target.value) })}
                  placeholder="Só os 11 dígitos"
                  inputMode="numeric"
                  className={`${campoClasses} font-mono`}
                />
              </div>
            )}

            {erroVeiculo && (
              <div className="rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] px-4 py-3 text-sm text-vermelhoSinal flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{erroVeiculo}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={salvandoVeiculo}
              className="w-full rounded-xl bg-verdeSinal py-3.5 font-semibold text-white hover:bg-verdeSinal/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {salvandoVeiculo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Iniciar monitoramento
                </>
              )}
            </button>

            {/* "Configurar depois" existe só nesta etapa — cadastrar veículo dá
                mais trabalho (placa/RENAVAM na mão) que os dados da etapa 1, e
                não deve travar o acesso ao painel. */}
            <button
              type="button"
              onClick={onConcluido}
              disabled={salvandoVeiculo}
              className="w-full text-center text-sm text-nevoa hover:text-texto transition-colors py-1"
            >
              Configurar depois
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
