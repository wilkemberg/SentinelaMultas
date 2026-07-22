"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiAuth, auth } from "@/lib/api";
import { ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

function VerificarEmailConteudo() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [estado, setEstado] = useState<"verificando" | "sucesso" | "erro">("verificando");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("erro");
      setMensagem("Link sem token. Verifique se copiou o link completo do e-mail.");
      return;
    }
    apiAuth
      .verificarEmail(token)
      .then((res) => {
        setEstado("sucesso");
        setMensagem(res.mensagem);
      })
      .catch((err) => {
        setEstado("erro");
        setMensagem(err.message ?? "Não foi possível confirmar o e-mail.");
      });
  }, [token]);

  const destino = auth.isLogado() ? "/dashboard" : "/entrar";

  return (
    <main className="min-h-screen bg-fundo flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdeSinal/10">
              <ShieldCheck className="h-6 w-6 text-verdeSinal" />
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-texto">
              Sentinela<span className="text-verdeSinal">.AI</span>
            </span>
          </Link>
        </div>

        <div className="card rounded-3xl p-8 text-center">
          {estado === "verificando" && (
            <div className="py-4">
              <Loader2 className="mx-auto h-8 w-8 text-nevoa animate-spin mb-4" />
              <p className="text-sm text-nevoa">Confirmando seu e-mail...</p>
            </div>
          )}

          {estado === "sucesso" && (
            <div className="py-4 animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-verdeSinal/10">
                <CheckCircle2 className="h-7 w-7 text-verdeSinal" />
              </div>
              <h2 className="font-display text-lg font-bold text-texto mb-2">E-mail confirmado!</h2>
              <p className="text-sm text-nevoa mb-6">{mensagem}</p>
              <Link
                href={destino}
                className="inline-flex items-center gap-2 rounded-xl bg-verdeSinal px-5 py-3 text-sm font-semibold text-white hover:bg-verdeSinal/90 transition-all"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {estado === "erro" && (
            <div className="py-4 animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vermelhoSinal/10">
                <XCircle className="h-7 w-7 text-vermelhoSinal" />
              </div>
              <h2 className="font-display text-lg font-bold text-texto mb-2">Não foi possível confirmar</h2>
              <p className="text-sm text-nevoa mb-6">{mensagem}</p>
              <Link href={destino} className="text-sm font-medium text-verdeSinal hover:text-verdeSinal/80 transition-colors">
                Ir para {auth.isLogado() ? "o painel" : "o login"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerificarEmailConteudo />
    </Suspense>
  );
}
