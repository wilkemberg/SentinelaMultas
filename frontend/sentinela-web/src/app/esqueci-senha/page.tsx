"use client";

import { useState } from "react";
import Link from "next/link";
import { apiAuth } from "@/lib/api";
import { ShieldCheck, AlertCircle, Loader2, ArrowRight, MailCheck } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      await apiAuth.esqueciSenha(email);
      // Resposta sempre genérica (o backend não revela se o e-mail existe) —
      // por isso não há tratamento de "e-mail não encontrado" aqui.
      setEnviado(true);
    } catch (err: any) {
      setErro(err.message ?? "Ocorreu um erro inesperado.");
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
          <p className="mt-4 text-sm text-nevoa">Recuperar senha</p>
        </div>

        <div className="card rounded-3xl p-8">
          {enviado ? (
            <div className="text-center py-4 animate-fade-in">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-verdeSinal/10">
                <MailCheck className="h-7 w-7 text-verdeSinal" />
              </div>
              <h2 className="font-display text-lg font-bold text-texto mb-2">Verifique seu e-mail</h2>
              <p className="text-sm text-nevoa leading-relaxed">
                Se <strong className="text-texto">{email}</strong> estiver cadastrado, você vai receber um link
                para redefinir sua senha em instantes. O link é válido por 1 hora.
              </p>
              <Link
                href="/entrar"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-verdeSinal hover:text-verdeSinal/80 transition-colors"
              >
                Voltar para o login <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-nevoa leading-relaxed">
                Informe o e-mail da sua conta. Vamos te mandar um link para criar uma senha nova.
              </p>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-nevoa mb-1.5">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
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
                disabled={loading}
                className="w-full rounded-xl bg-verdeSinal py-3.5 font-semibold text-white hover:bg-verdeSinal/90 disabled:opacity-60 transition-all mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                ) : (
                  <>Enviar link de redefinição <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          {!enviado && (
            <div className="mt-6 text-center">
              <Link href="/entrar" className="text-sm text-nevoa hover:text-verdeSinal transition-colors">
                Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
