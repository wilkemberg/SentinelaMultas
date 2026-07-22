"use client";

import { useState } from "react";
import { apiVeiculos, TipoVeiculo } from "@/lib/api";
import { X, ShieldCheck, PlusCircle, AlertCircle, Loader2, Car, Bike } from "lucide-react";

const UF_ESTADOS = ["RJ", "SP", "MG", "ES", "BA", "RS", "PR", "SC", "GO", "DF"];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const campoClasses =
  "w-full rounded-xl border border-borda bg-fundo px-4 py-3 text-sm text-texto placeholder-nevoaClara focus:border-verdeSinal/60 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all";

export default function AdicionarVeiculoModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState<{ placa: string; renavam: string; uf: string; cpfProprietario: string; tipo: TipoVeiculo }>({
    placa: "",
    renavam: "",
    uf: "RJ",
    cpfProprietario: "",
    tipo: "Carro",
  });
  const [mostrarCpf, setMostrarCpf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [etapa, setEtapa] = useState<"form" | "sucesso">("form");
  const [veiculoCriado, setVeiculoCriado] = useState<{ placa: string } | null>(null);

  const formatarCpf = (v: string) => v.replace(/\D/g, "").slice(0, 11);

  const formatarPlaca = (v: string) => {
    const sem = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (sem.length <= 7) return sem;
    return sem.slice(0, 7);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.placa.length < 7) {
      setErro("Placa inválida. Use o formato AAA9999 ou AAA9A99.");
      return;
    }
    if (form.renavam.replace(/\D/g, "").length < 9) {
      setErro("RENAVAM inválido. Deve ter 9 ou 11 dígitos.");
      return;
    }
    if (form.cpfProprietario && form.cpfProprietario.length !== 11) {
      setErro("CPF do proprietário inválido. Deve ter 11 dígitos, ou deixe em branco.");
      return;
    }
    setLoading(true);
    setErro("");
    try {
      const v = await apiVeiculos.criar(form.placa, form.renavam.replace(/\D/g, ""), form.uf, form.cpfProprietario || undefined, form.tipo);
      setVeiculoCriado({ placa: v.placa });
      setEtapa("sucesso");
    } catch (err: any) {
      setErro(err.message ?? "Erro ao cadastrar veículo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Overlay */}
      <div className="absolute inset-0 drawer-overlay animate-fade-in" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm card !rounded-3xl p-7 shadow-2xl animate-scale-in">
        {etapa === "form" ? (
          <>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-verdeSinal/10 flex items-center justify-center">
                  <PlusCircle className="w-5 h-5 text-verdeSinal" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-texto leading-tight">Adicionar veículo</h2>
                  <p className="text-xs text-nevoa mt-1">Varredura diária às 10:00 (D-1)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-nevoaClara hover:text-vermelhoSinal transition-colors bg-asfalto hover:bg-vermelhoSinal/10 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-nevoa mb-1.5">Tipo de veículo</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Carro", "Moto"] as const).map((t) => {
                    const ativo = form.tipo === t;
                    const Icone = t === "Carro" ? Car : Bike;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm({ ...form, tipo: t })}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          ativo
                            ? "border-verdeSinal/50 bg-verdeSinal/10 text-verdeSinal"
                            : "border-borda text-nevoa hover:text-texto hover:border-bordaGlow"
                        }`}
                      >
                        <Icone className="w-4 h-4" />
                        {t === "Carro" ? "Carro" : "Moto"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-nevoa mb-1.5">Placa do veículo</label>
                <input
                  type="text"
                  value={form.placa}
                  onChange={(e) => setForm({ ...form, placa: formatarPlaca(e.target.value) })}
                  placeholder="AAA0000 ou AAA0A00"
                  maxLength={7}
                  className={`${campoClasses} font-mono tracking-[0.15em] uppercase`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-nevoa mb-1.5">RENAVAM</label>
                <input
                  type="text"
                  value={form.renavam}
                  onChange={(e) => setForm({ ...form, renavam: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                  placeholder="9 ou 11 dígitos"
                  inputMode="numeric"
                  className={`${campoClasses} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-nevoa mb-1.5">Estado de emplacamento</label>
                <select
                  value={form.uf}
                  onChange={(e) => setForm({ ...form, uf: e.target.value })}
                  className={campoClasses}
                >
                  {UF_ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campo opcional: só é necessário quando o veículo NÃO está no
                  nome do dono da conta (financiado, de terceiro, de empresa).
                  Por padrão o Sentinela usa o CPF já cadastrado no seu perfil
                  para identificar o proprietário do veículo. */}
              {!mostrarCpf ? (
                <button
                  type="button"
                  onClick={() => setMostrarCpf(true)}
                  className="text-xs font-medium text-azulMercosul hover:underline"
                >
                  Este veículo não está no meu CPF (opcional)
                </button>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-nevoa mb-1.5">
                    CPF do proprietário do veículo
                  </label>
                  <input
                    type="text"
                    value={form.cpfProprietario}
                    onChange={(e) => setForm({ ...form, cpfProprietario: formatarCpf(e.target.value) })}
                    placeholder="Só os 11 dígitos"
                    inputMode="numeric"
                    className={`${campoClasses} font-mono`}
                  />
                  <p className="text-[11px] text-nevoa mt-1.5 leading-relaxed">
                    Use apenas se o veículo estiver no nome de outra pessoa/empresa. Deixe em
                    branco para usar o CPF do seu perfil.
                  </p>
                </div>
              )}

              {erro && (
                <div className="rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] px-4 py-3 text-sm text-vermelhoSinal flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{erro}</p>
                </div>
              )}

              <div className="bg-azulMercosul/[0.06] border border-azulMercosul/15 rounded-xl px-4 py-3 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-azulMercosul shrink-0 mt-0.5" />
                <p className="text-xs text-nevoa leading-relaxed">
                  Seus dados são usados apenas para consultar as bases oficiais de multas do veículo.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-verdeSinal py-3.5 font-semibold text-white hover:bg-verdeSinal/90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</>
                ) : (
                  <>Iniciar monitoramento</>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-verdeSinal/10 flex items-center justify-center mb-5">
              <ShieldCheck className="w-8 h-8 text-verdeSinal" />
            </div>
            <h2 className="font-display text-xl font-bold text-texto">Veículo cadastrado</h2>
            <p className="mt-1 text-sm text-verdeSinal font-semibold">{veiculoCriado?.placa}</p>
            <div className="mt-6 p-4 rounded-xl bg-asfalto w-full text-left">
              <p className="text-xs text-nevoa leading-relaxed">
                Varredura diária programada para 10:00. Base consultada: SERPRO/RADAR (nacional).
                Você será avisado por WhatsApp/e-mail assim que houver uma nova multa.
              </p>
            </div>
            <button
              onClick={onSuccess}
              className="mt-6 w-full rounded-xl bg-texto py-3 font-semibold text-fundo hover:bg-verdeSinal hover:text-white transition-all"
            >
              Concluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
