"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CircleAlert } from "lucide-react";

type Alerta = {
  id: number;
  gerador: string;
  cargas: unknown;
  ativo: boolean;
  lido: boolean;
  criadoEm: string;
};

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  useEffect(() => {
    void fetch("/api/alertas", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: Alerta[]) => setAlertas(data))
      .catch(() => setAlertas([]));
  }, []);

  async function marcarComoLido(alerta: Alerta) {
    const response = await fetch("/api/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alerta.id, lido: true }),
    });
    if (response.ok) setAlertas((items) => items.map((item) => item.id === alerta.id ? { ...item, lido: true } : item));
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"><ArrowLeft className="h-4 w-4" />Voltar</Link>
        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3"><Bell className="h-6 w-6 text-amber-600" /><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Operação</p><h1 className="mt-1 text-4xl font-black text-slate-900">Alertas de rejeito</h1></div></div>
          <div className="mt-8 space-y-3">
            {alertas.length === 0 ? <p className="text-sm text-slate-500">Nenhum alerta registrado.</p> : alertas.map((alerta) => (
              <article key={alerta.id} className={`rounded-2xl border p-4 ${alerta.ativo ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 font-semibold text-slate-900"><CircleAlert className="h-4 w-4 text-amber-600" />{alerta.gerador}</p><p className="mt-1 text-sm text-slate-600">Três cargas consecutivas acima de 25% · {new Date(alerta.criadoEm).toLocaleString("pt-BR")}</p><p className="mt-1 text-xs font-semibold text-slate-500">{alerta.ativo ? "Alerta atual" : "Histórico"}</p></div>{!alerta.lido && <button type="button" onClick={() => void marcarComoLido(alerta)} className="rounded-full bg-[#465a3e] px-3 py-1.5 text-xs font-semibold text-white">Marcar como lido</button>}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
