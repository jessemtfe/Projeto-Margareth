"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(result.error ?? "Não foi possível entrar. Tente novamente.");
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/";
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center overflow-hidden bg-[#123d2e] px-4 py-8 sm:px-8">
      <Image
        src="/login-recycling.webp"
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-[#0b3025]/55 via-[#0b3025]/10 to-transparent" />

      <section className="relative z-10 mx-auto w-full max-w-[1320px]">
        <div className="max-w-md rounded-3xl border border-white/15 bg-[#123d2e]/90 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-md sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <Image src="/icon.svg" alt="" width={48} height={48} />
            <div>
              <p className="text-lg font-bold tracking-tight">EcoCat</p>
              <p className="text-sm text-white/65">Cooperativa de reciclagem</p>
            </div>
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b7d89b]">
            Acesso ao sistema
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Entre para acompanhar e apoiar a operação da EcoCat.
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#b7d89b] focus:ring-2 focus:ring-[#b7d89b]/40"
                placeholder="Sua senha"
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
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/70">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-[#c3e5a7] hover:underline">
              Criar conta
            </Link>
          </p>
          <p className="mt-5 text-center text-xs leading-5 text-white/50">
            Novas contas começam com acesso somente leitura. A administradora pode liberar edições.
          </p>
        </div>
      </section>
    </main>
  );
}
