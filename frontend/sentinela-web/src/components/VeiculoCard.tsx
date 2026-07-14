"use client";

import { useState } from "react";
import { Veiculo, apiVeiculos } from "@/lib/api";
import Spotlight from "@/components/Spotlight";
import { Trash2, ScanSearch, Pause, Play, Car, Bike, ShieldAlert, CheckCircle2 } from "lucide-react";

interface Props {
  veiculo: Veiculo;
  onUpdate?: () => void;
}

export default function VeiculoCard({ veiculo, onUpdate }: Props) {
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] = useState<{ multasNovas: number } | null>(null);
  const [toggling, setToggling] = useState(false);

  const verificarAgora = async () => {
    setVerificando(true);
    setResultado(null);
    try {
      const res: any = await apiVeiculos.verificarAgora(veiculo.id);
      setResultado({ multasNovas: res.multasNovas });
      onUpdate?.();
    } catch (e: any) {
      alert(e.message ?? "Erro ao verificar");
    } finally {
      setVerificando(false);
    }
  };

  const toggleMonitoramento = async () => {
    setToggling(true);
    try {
      await apiVeiculos.alternarMonitoramento(veiculo.id, !veiculo.monitoramentoAtivo);
      onUpdate?.();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setToggling(false);
    }
  };

  const remover = async () => {
    if (!confirm(`Remover ${veiculo.placa} do monitoramento?`)) return;
    await apiVeiculos.remover(veiculo.id);
    onUpdate?.();
  };

  const formatData = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

  return (
    <Spotlight
      className="card card-hover p-5"
      style={{ ["--glow-color" as any]: veiculo.monitoramentoAtivo ? "rgba(22,163,74,0.3)" : "rgba(100,116,139,0.25)" }}
    >
      {/* Header do card (status) */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {veiculo.monitoramentoAtivo && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verdeSinal opacity-60" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${veiculo.monitoramentoAtivo ? "bg-verdeSinal" : "bg-nevoaClara"}`} />
          </span>
          <span className={`text-xs font-medium ${veiculo.monitoramentoAtivo ? "text-verdeSinal" : "text-nevoaClara"}`}>
            {veiculo.monitoramentoAtivo ? "Monitoramento ativo" : "Monitoramento pausado"}
          </span>
        </div>
        <button onClick={remover} className="text-nevoaClara hover:text-vermelhoSinal transition-colors" title="Remover veículo">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Placa estilo Mercosul realista */}
      <div className="flex justify-center mb-6">
        <div className="w-56 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-300">
          <div className="bg-[#003399] h-6 w-full flex items-center justify-between px-2">
            <div className="flex items-center">
              <div className="w-4 h-3 bg-green-600 flex items-center justify-center">
                <div className="w-2.5 h-1.5 bg-yellow-400 rotate-45 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-800" />
                </div>
              </div>
            </div>
            <span className="text-white text-[10px] font-bold tracking-widest uppercase ml-1">Brasil</span>
            <div className="w-4 h-3 flex items-center justify-center">
              <div className="w-2 h-2 border-t border-r border-white transform rotate-45" />
            </div>
          </div>
          <div className="flex items-center justify-center h-14">
            <p className="font-mono text-3xl font-bold tracking-widest text-black">
              {veiculo.placa.substring(0, 3)} {veiculo.placa.substring(3)}
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-xs text-nevoa flex items-center justify-center gap-1.5">
          {veiculo.tipo === "Moto" ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
          {veiculo.uf} · RENAVAM {veiculo.renavam}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: "Total", valor: veiculo.totalMultas, alert: false },
          { label: "Abertas", valor: veiculo.multasAbertas, alert: veiculo.multasAbertas > 0 },
          { label: "Último scan", valor: formatData(veiculo.ultimaVerificacaoEm), alert: false },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl bg-asfalto px-2 py-2.5 text-center ${s.alert ? "bg-ambarSinal/[0.08]" : ""}`}>
            <p className="text-[11px] text-nevoa mb-1">{s.label}</p>
            <p className={`font-display text-base font-bold ${s.alert ? "text-ambarSinal" : "text-texto"}`}>{s.valor}</p>
          </div>
        ))}
      </div>

      {/* Notificação de scanner */}
      {resultado && (
        <div
          className={`rounded-lg mb-4 px-3 py-2 text-xs text-center font-medium flex items-center justify-center gap-2 ${
            resultado.multasNovas === 0 ? "bg-verdeSinal/10 text-verdeSinal" : "bg-vermelhoSinal/10 text-vermelhoSinal"
          }`}
        >
          {resultado.multasNovas === 0 ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Varredura limpa</>
          ) : (
            <><ShieldAlert className="w-3.5 h-3.5" /> {resultado.multasNovas} nova{resultado.multasNovas !== 1 ? "s" : ""} infração{resultado.multasNovas !== 1 ? "ões" : ""}</>
          )}
        </div>
      )}

      {/* Controles */}
      <div className="flex gap-2">
        <button
          onClick={verificarAgora}
          disabled={verificando || !veiculo.monitoramentoAtivo}
          className="flex-1 rounded-xl bg-asfalto py-2.5 text-sm font-medium text-texto hover:bg-verdeSinal/10 hover:text-verdeSinal disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <ScanSearch className={`w-4 h-4 ${verificando ? "animate-spin" : ""}`} />
          {verificando ? "Verificando..." : "Verificar agora"}
        </button>

        <button
          onClick={toggleMonitoramento}
          disabled={toggling}
          className={`w-12 flex items-center justify-center rounded-xl transition-all disabled:opacity-50 ${
            veiculo.monitoramentoAtivo
              ? "bg-asfalto text-texto hover:bg-ambarSinal/10 hover:text-ambarSinal"
              : "bg-verdeSinal text-white hover:bg-verdeSinal/90"
          }`}
          title={veiculo.monitoramentoAtivo ? "Pausar monitoramento" : "Retomar monitoramento"}
        >
          {veiculo.monitoramentoAtivo ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
        </button>
      </div>
    </Spotlight>
  );
}
