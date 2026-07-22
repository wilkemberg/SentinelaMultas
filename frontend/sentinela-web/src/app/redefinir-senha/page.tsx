"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiAuth } from "@/lib/api";
import { ShieldCheck, AlertCircle, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!token) {
      setErro("Link inválido — solicite um novo link de redefinição.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await apiAuth.redefinirSenha(token, novaSenha);
      setSucesso(true);
      setTimeout(() => router.push("/entrar"), 2500);
    } catch (err: any) {
      setErro(err.message ?? "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

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
          <p className="mt-4 text-sm text-nevoa">Redefinir senha</p>
        </div>

        <div className="card rounded-3xl p-8">
          {sucesso ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-verdeSinal/10">
                <CheckCircle2 className="h-7 w-7 text-verdeSinal" />
              </div>
              <h2 className="font-display text-lg font-bold text-texto mb-2">Senha redefinida!</h2>
              <p className="text-sm text-nevoa">Redirecionando para o login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!token && (
                <div className="flex items-start gap-3 rounded-xl border border-ambarSinal/25 bg-ambarSinal/[0.06] px-4 py-3 text-sm text-ambarSinal">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Link sem token válido. <Link href="/esqueci-senha" className="underline font-medium">Solicite um novo link</Link>.
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="novaSenha" className="block text-xs font-medium text-nevoa mb-1.5">
                  Nova senha
                </label>
                <input
                  id="novaSenha"
                  type="password"
                  required
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-borda bg-fundo px-4 py-3.5 text-sm text-texto placeholder-nevoaClara focus:border-verdeSinal/60 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all"
                />
              </div>
              <div>
                <label htmlFor="confirmar" className="block text-xs font-medium text-nevoa mb-1.5">
                  Confirmar nova senha
                </label>
                <input
                  id="confirmar"
                  type="password"
                  required
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-borda bg-fundo px-4 py-3.5 text-sm text-texto placeholder-nevoaClara focus:border-verdeSinal/60 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all"
                />
              </div>

              {erro && (
                <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-vermelhoSinal/25 bg-vermelhoSinal/[0.06] px-4 py-3 text-sm text-vermelhoSinal">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-xl bg-verdeSinal py-3.5 font-semibold text-white hover:bg-verdeSinal/90 disabled:opacity-60 transition-all mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
                ) : (
                  <>Redefinir senha <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
