"use client";

import { useState } from "react";
import { PerfilUsuario, apiUsuarios } from "@/lib/api";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  perfil: PerfilUsuario;
  onUpdate?: () => void;
}

const campoClasses =
  "w-full rounded-lg border border-borda bg-fundo/60 px-3 py-2.5 text-sm text-texto placeholder-nevoa focus:border-verdeSinal/50 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all";

const labelClasses = "block text-[11px] font-mono text-nevoa mb-1.5 uppercase tracking-widest";

const formatarWhatsApp = (v: string) => v.replace(/\D/g, "").slice(0, 13);
const formatarCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11);

/// Nome, CPF e WhatsApp são obrigatórios: sem eles, a consulta ao DETRAN-RJ
/// (que exige CPF do proprietário) fica sempre desativada silenciosamente, e
/// não há como notificar por WhatsApp. E-mail não é editável aqui — é o mesmo
/// usado para login, definido no cadastro da conta.
export default function MinhaContaForm({ perfil, onUpdate }: Props) {
  const [form, setForm] = useState({
    nome: perfil.nome ?? "",
    cpf: perfil.cpf ?? "",
    whatsAppNumero: perfil.whatsAppNumero ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

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
          Nome, CPF e WhatsApp são obrigatórios — o CPF é usado nas consultas ao DETRAN-RJ (que exigem
          CPF + RENAVAM do proprietário), e o WhatsApp é para onde vão os alertas de multa nova.
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
    </div>
  );
}
