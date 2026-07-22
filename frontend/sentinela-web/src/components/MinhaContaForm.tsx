"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PerfilUsuario, apiUsuarios, apiAuth, auth } from "@/lib/api";
import { Save, AlertCircle, CheckCircle2, MailWarning, Bell, Trash2, ShieldAlert } from "lucide-react";

interface Props {
  perfil: PerfilUsuario;
  onUpdate?: () => void;
}

const campoClasses =
  "w-full rounded-lg border border-borda bg-fundo/60 px-3 py-2.5 text-sm text-texto placeholder-nevoa focus:border-verdeSinal/50 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all";

const labelClasses = "block text-[11px] font-mono text-nevoa mb-1.5 uppercase tracking-widest";

const formatarWhatsApp = (v: string) => v.replace(/\D/g, "").slice(0, 13);
const formatarCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11);

/// Nome, CPF e WhatsApp são obrigatórios: sem eles, o cartão de CNH e a
/// identificação do proprietário do veículo ficam sempre incompletos, e
/// não há como notificar por WhatsApp. E-mail não é editável aqui — é o mesmo
/// usado para login, definido no cadastro da conta.
export default function MinhaContaForm({ perfil, onUpdate }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: perfil.nome ?? "",
    cpf: perfil.cpf ?? "",
    whatsAppNumero: perfil.whatsAppNumero ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const [notificarEmail, setNotificarEmail] = useState(perfil.notificarEmail);
  const [salvandoPreferencia, setSalvandoPreferencia] = useState(false);

  const [reenviando, setReenviando] = useState(false);
  const [verificacaoReenviada, setVerificacaoReenviada] = useState(false);

  const [mostrarExclusao, setMostrarExclusao] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  const alternarNotificarEmail = async (valor: boolean) => {
    setNotificarEmail(valor);
    setSalvandoPreferencia(true);
    try {
      await apiUsuarios.atualizar({ notificarEmail: valor });
    } catch {
      setNotificarEmail(!valor); // reverte se falhar
    } finally {
      setSalvandoPreferencia(false);
    }
  };

  const reenviarVerificacao = async () => {
    setReenviando(true);
    try {
      await apiAuth.reenviarVerificacao();
      setVerificacaoReenviada(true);
    } catch {
      // silencioso — não é uma ação crítica o suficiente para travar a tela
    } finally {
      setReenviando(false);
    }
  };

  const excluirConta = async () => {
    if (!senhaExclusao) {
      setErroExclusao("Informe sua senha para confirmar.");
      return;
    }
    setExcluindo(true);
    setErroExclusao("");
    try {
      await apiUsuarios.excluirConta(senhaExclusao);
      auth.limparSessao();
      router.push("/entrar");
    } catch (e: any) {
      setErroExclusao(e.message ?? "Não foi possível excluir a conta.");
    } finally {
      setExcluindo(false);
    }
  };

  const validar = (): string | null => {
    if (!form.nome.trim()) return "Nome é obrigatório.";
    if (form.cpf.length !== 11) return "CPF é obrigatório e deve ter 11 dígitos.";
    if (form.whatsAppNumero.length < 10) return "WhatsApp é obrigatório (DDD + número).";
    return null;
  };

  const salvar = async () => {
    const erroValidacao = validar();
    if (erroValidacao) {
      setErro(erroValidacao);
      setSucesso(false);
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      await apiUsuarios.atualizar({
        nome: form.nome.trim(),
        cpf: form.cpf,
        whatsAppNumero: form.whatsAppNumero,
      });
      onUpdate?.();
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (e: any) {
      setErro(e.message ?? "Erro ao salvar dados.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-2xl glass-panel border border-borda p-6 space-y-5 max-w-2xl">
      <div>
        <h3 className="font-display text-lg font-bold text-texto">Dados da conta</h3>
        <p className="text-sm text-texto/60 mt-1">
          Nome, CPF e WhatsApp são obrigatórios — o CPF identifica o proprietário do veículo
          monitorado, e o WhatsApp é para onde vão os alertas de multa nova.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClasses}>
            Nome completo <span className="text-vermelhoSinal">*</span>
          </label>
          <input
            className={campoClasses}
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label className={labelClasses}>
            CPF <span className="text-vermelhoSinal">*</span>
          </label>
          <input
            className={`${campoClasses} font-mono`}
            value={form.cpf}
            onChange={(e) => setForm({ ...form, cpf: formatarCpf(e.target.value) })}
            placeholder="Somente números"
            inputMode="numeric"
            maxLength={11}
          />
        </div>

        <div>
          <label className={labelClasses}>
            WhatsApp <span className="text-vermelhoSinal">*</span>
          </label>
          <input
            className={`${campoClasses} font-mono`}
            value={form.whatsAppNumero}
            onChange={(e) => setForm({ ...form, whatsAppNumero: formatarWhatsApp(e.target.value) })}
            placeholder="Ex: 5521999999999 (DDI+DDD+número)"
            inputMode="numeric"
            maxLength={13}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClasses}>E-mail (login)</label>
          <input className={`${campoClasses} opacity-60 cursor-not-allowed`} value={perfil.email} disabled />
          <p className="text-[11px] text-nevoa mt-1.5">
            Fixo — é o e-mail usado para entrar na sua conta e receber as notificações.
          </p>

          {!perfil.emailVerificado && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-ambarSinal/25 bg-ambarSinal/[0.06] px-4 py-3 text-xs text-ambarSinal">
              <MailWarning className="w-4 h-4 shrink-0" />
              <span className="flex-1">
                {verificacaoReenviada
                  ? "E-mail de verificação reenviado — confira sua caixa de entrada."
                  : "E-mail ainda não confirmado. Confirme para garantir o recebimento dos alertas."}
              </span>
              {!verificacaoReenviada && (
                <button
                  type="button"
                  onClick={reenviarVerificacao}
                  disabled={reenviando}
                  className="font-semibold underline disabled:opacity-60"
                >
                  {reenviando ? "Enviando..." : "Reenviar e-mail"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] px-4 py-3 text-sm text-vermelhoSinal flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{erro}</p>
        </div>
      )}

      {sucesso && (
        <div className="rounded-xl border border-verdeSinal/25 bg-verdeSinal/[0.06] px-4 py-3 text-sm text-verdeSinal flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p>Dados salvos.</p>
        </div>
      )}

      <button
        onClick={salvar}
        disabled={salvando}
        className="inline-flex items-center gap-2 rounded-xl bg-verdeSinal px-6 py-3 text-sm font-bold text-black hover:bg-white disabled:opacity-60 transition-all"
      >
        <Save className="w-4 h-4" />
        {salvando ? "Salvando..." : "Salvar dados"}
      </button>

      {/* ── Preferências de notificação ──────────────────────────────────── */}
      <div className="pt-5 border-t border-borda">
        <h3 className="font-display text-base font-bold text-texto mb-1 flex items-center gap-2">
          <Bell className="w-4 h-4 text-nevoa" /> Notificações
        </h3>
        <p className="text-xs text-nevoa mb-4">Escolha por onde você quer receber os alertas de multa nova.</p>

        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-borda bg-fundo/60 px-4 py-3 cursor-pointer">
            <span className="text-sm text-texto">E-mail</span>
            <input
              type="checkbox"
              checked={notificarEmail}
              onChange={(e) => alternarNotificarEmail(e.target.checked)}
              disabled={salvandoPreferencia}
              className="h-4 w-4 rounded border-borda accent-verdeSinal"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-borda bg-fundo/30 px-4 py-3 opacity-60">
            <span className="text-sm text-texto">
              WhatsApp <span className="text-[10px] text-nevoa">(em breve)</span>
            </span>
            <input type="checkbox" checked={false} disabled className="h-4 w-4 rounded border-borda" />
          </div>
        </div>
      </div>

      {/* ── Zona de risco: exclusão de conta ─────────────────────────────── */}
      <div className="pt-5 border-t border-borda">
        <h3 className="font-display text-base font-bold text-vermelhoSinal mb-1 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Excluir conta
        </h3>
        <p className="text-xs text-nevoa mb-4">
          Ao excluir, o monitoramento e as notificações param imediatamente. O histórico de multas e veículos já
          detectado é preservado como registro, conforme a Política de Privacidade.
        </p>

        {!mostrarExclusao ? (
          <button
            type="button"
            onClick={() => setMostrarExclusao(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-vermelhoSinal/30 px-4 py-2.5 text-sm font-semibold text-vermelhoSinal hover:bg-vermelhoSinal/[0.06] transition-all"
          >
            <Trash2 className="w-4 h-4" /> Excluir minha conta
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.04] p-4">
            <label className={labelClasses}>Confirme sua senha para excluir</label>
            <input
              type="password"
              className={campoClasses}
              value={senhaExclusao}
              onChange={(e) => setSenhaExclusao(e.target.value)}
              placeholder="Sua senha atual"
            />
            {erroExclusao && <p className="text-xs text-vermelhoSinal">{erroExclusao}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={excluirConta}
                disabled={excluindo}
                className="rounded-xl bg-vermelhoSinal px-4 py-2.5 text-sm font-bold text-white hover:bg-vermelhoSinal/90 disabled:opacity-60 transition-all"
              >
                {excluindo ? "Excluindo..." : "Confirmar exclusão"}
              </button>
              <button
                type="button"
                onClick={() => { setMostrarExclusao(false); setSenhaExclusao(""); setErroExclusao(""); }}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-nevoa hover:text-texto transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
