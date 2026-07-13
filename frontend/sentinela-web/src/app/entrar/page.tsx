"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiAuth, auth } from "@/lib/api";
import { ShieldCheck, LogIn, UserPlus, AlertCircle, Loader2, ArrowRight } from "lucide-react";

const InputBase = ({ label, id, type = "text", value, onChange, placeholder }: any) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-nevoa mb-1.5">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="w-full rounded-xl border border-borda bg-fundo px-4 py-3.5 text-sm text-texto placeholder-nevoaClara focus:border-verdeSinal/60 focus:outline-none focus:ring-1 focus:ring-verdeSinal/40 transition-all"
    />
  </div>
);

export default function EntrarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const resp =
        modo === "login"
          ? await apiAuth.entrar(form.email, form.senha)
          : await apiAuth.registrar(form.nome, form.email, form.senha);

      auth.salvarSessao(resp);
      router.push("/dashboard");
    } catch (err: any) {
      setErro(err.message ?? "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-fundo flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verdeSinal/10">
              <ShieldCheck className="h-6 w-6 text-verdeSinal" />
            </div>
            <span className="font-display text-3xl font-bold tracking-tight text-texto">
              Sentinela<span className="text-verdeSinal">.AI</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-nevoa">
            {modo === "login" ? "Acesse sua conta" : "Crie sua conta gratuita"}
          </p>
        </div>

        {/* Card */}
        <div className="card rounded-3xl p-8">
          {/* Abas login / cadastro */}
          <div className="flex rounded-xl bg-asfalto p-1.5 mb-8">
            {(["login", "registro"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setModo(m); setErro(""); }}
                className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  modo === m ? "bg-grafite text-texto shadow-sm" : "text-nevoa hover:text-texto"
                }`}
              >
                {m === "login" ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {m === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {modo === "registro" && (
              <div className="animate-fade-in">
                <InputBase
                  label="Nome completo"
                  id="nome"
                  value={form.nome}
                  onChange={(e: any) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
            )}
            <InputBase
              label="E-mail"
              id="email"
              type="email"
              value={form.email}
              onChange={(e: any) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
            />
            <InputBase
              label="Senha"
              id="senha"
              type="password"
              value={form.senha}
              onChange={(e: any) => setForm({ ...form, senha: e.target.value })}
              placeholder={modo === "registro" ? "Mínimo 8 caracteres" : "••••••••"}
            />

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
                <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
              ) : modo === "login" ? (
                <>Entrar <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Criar conta <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {modo === "login" && (
            <div className="mt-6 text-center">
              <button onClick={() => setModo("registro")} className="text-sm text-nevoa hover:text-verdeSinal transition-colors">
                Ainda não possui acesso? Registre-se
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-nevoaClara">
          Conexão segura · seus dados são protegidos
        </p>
      </div>
    </main>
  );
}
