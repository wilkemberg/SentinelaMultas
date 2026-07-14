"use client";

import { useState } from "react";
import { PerfilUsuario, apiUsuarios } from "@/lib/api";
import { Save, Pencil, Loader2 } from "lucide-react";

interface Props {
  perfil: PerfilUsuario;
  onUpdate?: () => void;
}

function isoParaInputDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

const campoClasses =
  "w-full rounded-lg border border-borda bg-fundo/60 px-3 py-2.5 text-sm text-texto placeholder-nevoa focus:border-verdeSinal/50 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all";

const labelClasses = "block text-[11px] font-mono text-nevoa mb-1.5 uppercase tracking-widest";

export default function PerfilCnhForm({ perfil, onUpdate }: Props) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    numeroRegistroCnh: perfil.numeroRegistroCnh ?? "",
    categoriaCnh: perfil.categoriaCnh ?? "",
    dataNascimento: isoParaInputDate(perfil.dataNascimento),
    dataExpedicaoCnh: isoParaInputDate(perfil.dataExpedicaoCnh),
    nomeMae: perfil.nomeMae ?? "",
  });

  const salvar = async () => {
    setSalvando(true);
    try {
      await apiUsuarios.atualizar({
        numeroRegistroCnh: form.numeroRegistroCnh,
        categoriaCnh: form.categoriaCnh,
        dataNascimento: form.dataNascimento || undefined,
        dataExpedicaoCnh: form.dataExpedicaoCnh || undefined,
        nomeMae: form.nomeMae || undefined,
      });
      onUpdate?.();
      setEditando(false);
    } catch (e: any) {
      alert(e.message ?? "Erro ao salvar dados");
    } finally {
      setSalvando(false);
    }
  };

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-borda bg-surface px-5 py-3 text-sm font-semibold text-texto hover:border-verdeSinal/50 hover:text-verdeSinal transition-all"
      >
        <Pencil className="w-4 h-4" />
        {perfil.numeroRegistroCnh ? "Editar dados da CNH" : "Preencher dados da CNH"}
      </button>
    );
  }

  return (
    <div className="rounded-2xl glass-panel border border-borda p-6 space-y-5">
      <h3 className="font-display text-lg font-bold text-texto">Dados da CNH</h3>
      <p className="text-sm text-texto/60 -mt-3">
        Usados só para montar seu cartão de identificação dentro do app e estimar o vencimento da
        CNH. Nada disso é enviado a nenhum órgão. Nome e CPF ficam na aba{" "}
        <span className="font-semibold text-texto">Minha Conta</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Categoria</label>
          <input
            className={campoClasses}
            value={form.categoriaCnh}
            onChange={(e) => setForm({ ...form, categoriaCnh: e.target.value.toUpperCase() })}
            placeholder="Ex: AB"
            maxLength={5}
          />
        </div>
        <div>
          <label className={labelClasses}>Número de registro</label>
          <input
            className={campoClasses}
            value={form.numeroRegistroCnh}
            onChange={(e) => setForm({ ...form, numeroRegistroCnh: e.target.value })}
            placeholder="Nº da CNH"
          />
        </div>
        <div>
          <label className={labelClasses}>Data de nascimento</label>
          <input
            type="date"
            className={campoClasses}
            value={form.dataNascimento}
            onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClasses}>Data de expedição da CNH</label>
          <input
            type="date"
            className={campoClasses}
            value={form.dataExpedicaoCnh}
            onChange={(e) => setForm({ ...form, dataExpedicaoCnh: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClasses}>Nome da mãe</label>
          <input
            className={campoClasses}
            value={form.nomeMae}
            onChange={(e) => setForm({ ...form, nomeMae: e.target.value })}
            placeholder="Como consta na CNH — exigido para validar oficialmente junto ao SENATRAN"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={salvar}
          disabled={salvando}
          className="inline-flex items-center gap-2 rounded-xl bg-verdeSinal px-6 py-3 text-sm font-bold text-black hover:bg-white disabled:opacity-60 transition-all"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
        <button
          onClick={() => setEditando(false)}
          disabled={salvando}
          className="rounded-xl border border-borda px-5 py-3 text-sm text-nevoa hover:text-texto transition-all"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
