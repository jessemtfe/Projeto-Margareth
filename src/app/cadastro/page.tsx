"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import AuthBackground from "../components/auth-background";

type ApiResponse = {
  error?: string;
  message?: string;
  destination?: string;
};

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setError(result.error ?? "Não foi possível iniciar o cadastro.");
        return;
      }
      setDestination(result.destination ?? email);
      setConfirmationSent(true);
    } catch {
      setError("Não foi possível conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok) {
        setError(result.error ?? "Não foi possível confirmar seu e-mail.");
        return;
      }
      router.replace("/login?confirmed=1");
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-[#123d2e] px-4 py-8 sm:px-8">
      <AuthBackground />

      <section className="relative z-20 mx-auto w-full max-w-[1320px]">
        <div className="max-w-md rounded-3xl border border-white/15 bg-[#123d2e]/90 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-md sm:p-9">
          <div className="mb-7 flex items-center gap-3">
            <Image src="/icon.svg" alt="" width={48} height={48} />
            <div>
              <p className="text-lg font-bold tracking-tight">EcoCat</p>
              <p className="text-sm text-white/65">Cooperativa de reciclagem</p>
            </div>
          </div>

          {!confirmationSent ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b7d89b]">
                Primeiro acesso
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Criar conta</h1>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Confirme seu e-mail para acessar o sistema.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                <label className="block text-sm font-medium" htmlFor="name">
                  Nome
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b7d89b] focus:ring-2 focus:ring-[#b7d89b]/40"
                    placeholder="Seu nome"
                  />
                </label>
                <label className="block text-sm font-medium" htmlFor="email">
                  E-mail
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b7d89b] focus:ring-2 focus:ring-[#b7d89b]/40"
                    placeholder="voce@exemplo.com"
                  />
                </label>
                <label className="block text-sm font-medium" htmlFor="password">
                  Senha
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b7d89b] focus:ring-2 focus:ring-[#b7d89b]/40"
                    placeholder="Mínimo de 8 caracteres"
                  />
                </label>
                <p className="text-xs leading-5 text-white/55">
                  A senha deve ter uma letra maiúscula, uma minúscula e um número. Sua conta terá acesso somente leitura até a administração liberar edições.
                </p>
                {error && (
                  <p role="alert" className="rounded-xl bg-rose-950/50 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-xl bg-[#c3e5a7] px-4 text-sm font-bold text-[#153a29] transition hover:bg-[#d4efbd] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting ? "Enviando..." : "Criar conta"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b7d89b]">
                Confirmação de e-mail
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Confira sua caixa de entrada</h1>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Enviamos um código de seis dígitos para <span className="font-semibold text-white">{destination}</span>.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleConfirm}>
                <label className="block text-sm font-medium" htmlFor="code">
                  Código de confirmação
                  <input
                    id="code"
                    name="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-center text-lg tracking-[0.4em] text-slate-900 outline-none transition focus:border-[#b7d89b] focus:ring-2 focus:ring-[#b7d89b]/40"
                    placeholder="000000"
                  />
                </label>
                {error && (
                  <p role="alert" className="rounded-xl bg-rose-950/50 px-4 py-3 text-sm text-rose-100">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-12 w-full rounded-xl bg-[#c3e5a7] px-4 text-sm font-bold text-[#153a29] transition hover:bg-[#d4efbd] disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting ? "Confirmando..." : "Confirmar e-mail"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-white/70">
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-[#c3e5a7] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
