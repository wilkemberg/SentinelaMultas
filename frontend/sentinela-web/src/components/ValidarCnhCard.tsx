"use client";

import { useState } from "react";
import { PerfilUsuario, apiUsuarios } from "@/lib/api";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  perfil: PerfilUsuario;
  onUpdate?: () => void;
}

const campoClasses =
  "w-full rounded-lg border border-borda bg-fundo/60 px-3 py-2.5 text-sm text-texto placeholder-nevoa focus:border-verdeSinal/50 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all";

export default function ValidarCnhCard({ perfil, onUpdate }: Props) {
  const [codigo, setCodigo] = useState("");
  const [validando, setValidando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[] | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const dadosCompletos = !!(perfil.cpf && perfil.numeroRegistroCnh && perfil.nome && perfil.nomeMae);

  const validar = async () => {
    if (!codigo.trim()) return;
    setValidando(true);
    setErro(null);
    setAvisos(null);
    setSucesso(false);
    try {
      const resultado = await apiUsuarios.validarCnh(codigo.trim());
      setSucesso(true);
      setAvisos(resultado.avisos ?? []);
      setCodigo("");
      onUpdate?.();
    } catch (e: any) {
      setErro(e.message ?? "Não foi possível validar a CNH agora.");
    } finally {
      setValidando(false);
    }
  };

  return (
    <div className="rounded-2xl glass-panel border border-borda p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-verdeSinal" />
        <h3 className="font-display text-lg font-bold text-texto">Validar CNH oficialmente</h3>
      </div>
      <p className="text-sm text-texto/60">
        Confirma seus dados direto na base do SENATRAN (RENACH), usando o código de segurança
        impresso no espelho/QR da sua CNH digital. Não pedimos sua senha do gov.br nem certificado
        digital — só esse código, que você mesmo digita a cada verificação.
      </p>

      {!dadosCompletos && (
        <div className="rounded-lg bg-ambarSinal/10 border border-ambarSinal/30 px-3 py-2.5 text-xs text-ambarSinal flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Preencha CPF, número de registro, nome completo e nome da mãe no formulário acima antes
            de validar.
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className={campoClasses}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Código de segurança da CNH"
          disabled={!dadosCompletos || validando}
        />
        <button
          onClick={validar}
          disabled={!dadosCompletos || !codigo.trim() || validando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-verdeSinal px-6 py-3 text-sm font-bold text-black hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
        >
          {validando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Validar
        </button>
      </div>

      {erro && (
        <div className="rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/30 px-3 py-2.5 text-xs text-[#ff3355]">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-lg bg-verdeSinal/10 border border-verdeSinal/30 px-3 py-2.5 text-xs text-verdeSinal flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>CNH validada com sucesso junto ao SENATRAN.</span>
        </div>
      )}

      {avisos && avisos.length > 0 && (
        <div className="rounded-lg bg-ambarSinal/10 border border-ambarSinal/30 px-3 py-2.5 text-xs text-ambarSinal space-y-1">
          {avisos.map((a, i) => (
            <p key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {a}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
