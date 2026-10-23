"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  Scale,
  WalletCards,
} from "lucide-react";

type Turno = {
  id: number;
  inicio: string;
  saida: string | null;
  status: "ABERTO" | "FECHADO";
};

type Producao = {
  id: number;
  material: string;
  kg: number;
  data: string;
};

type Memoria = {
  id: number;
  periodo: { competencia: string; status: string };
  horas: number;
  kgTriados: number;
  valorTotal: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function MeusRegistrosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [materiais, setMateriais] = useState<string[]>([]);
  const [material, setMaterial] = useState("");
  const [kg, setKg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch("/api/turnos", { cache: "no-store" }),
        fetch("/api/producao", { cache: "no-store" }),
        fetch("/api/rateio", { cache: "no-store" }),
        fetch("/api/precos", { cache: "no-store" }),
      ]);
      if (responses.slice(0, 3).some((response) => !response.ok)) {
        throw new Error("Não foi possível carregar seus registros.");
      }
      const [turnosData, producaoData, memoriaData, materiaisData] = await Promise.all(
        responses.map((response) => response.json()),
      );
      setTurnos(turnosData as Turno[]);
      setProducoes(producaoData as Producao[]);
      setMemorias(memoriaData as Memoria[]);
      if (responses[3].ok && Array.isArray(materiaisData)) {
        setMateriais(materiaisData as string[]);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar seus registros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function updateTurno(turno?: Turno) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/turnos", {
        method: turno ? "PATCH" : "POST",
        headers: turno ? { "Content-Type": "application/json" } : undefined,
        body: turno ? JSON.stringify({ id: turno.id }) : undefined,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar o turno.");
      await loadRecords();
    } catch (turnoError) {
      setError(turnoError instanceof Error ? turnoError.message : "Não foi possível atualizar o turno.");
    } finally {
      setSaving(false);
    }
  }

  async function registerProduction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/producao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, kg: Number(kg), data: new Date().toISOString().slice(0, 10) }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível registrar a produção.");
      setMaterial("");
      setKg("");
      await loadRecords();
    } catch (productionError) {
      setError(productionError instanceof Error ? productionError.message : "Não foi possível registrar a produção.");
    } finally {
      setSaving(false);
    }
  }

  const openShift = turnos.find((turno) => turno.status === "ABERTO");
  const totalKg = producoes.reduce((total, item) => total + item.kg, 0);

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#526b4c]">Área do cooperado</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Meus registros</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Acompanhe seus turnos, registre sua produção e consulte sua memória de cálculo.
          </p>
        </header>

        {error && <p role="alert" className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Clock3 className="h-5 w-5 text-sky-700" />
            <p className="mt-4 text-sm text-slate-500">Turno atual</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{openShift ? "Em andamento" : "Encerrado"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Scale className="h-5 w-5 text-[#526b4c]" />
            <p className="mt-4 text-sm text-slate-500">Produção registrada</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{totalKg.toFixed(2)} kg</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <WalletCards className="h-5 w-5 text-amber-600" />
            <p className="mt-4 text-sm text-slate-500">Memórias disponíveis</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{memorias.length}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Meu turno</h2>
              <CalendarClock className="h-5 w-5 text-slate-500" />
            </div>
            <p className="mt-2 text-sm text-slate-500">Registre sua entrada e saída para compor suas horas.</p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void updateTurno(openShift)}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#234531] px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {openShift ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {openShift ? "Encerrar turno" : "Iniciar turno"}
            </button>
            <div className="mt-5 space-y-2">
              {turnos.slice(0, 5).map((turno) => (
                <div key={turno.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span>{formatDate(turno.inicio)}</span>
                  <span className={turno.status === "ABERTO" ? "font-semibold text-amber-700" : "text-slate-500"}>
                    {turno.status === "ABERTO" ? "Aberto" : "Fechado"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Registrar produção</h2>
            <p className="mt-2 text-sm text-slate-500">Informe o material e os quilogramas separados.</p>
            <form onSubmit={(event) => void registerProduction(event)} className="mt-5 grid gap-3 sm:grid-cols-2">
              <select value={material} onChange={(event) => setMaterial(event.target.value)} required className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Selecione o material</option>
                {materiais.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={kg} onChange={(event) => setKg(event.target.value)} required min="0.01" step="0.01" type="number" placeholder="Kg" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" />
              <button disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#526b4c] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">
                <Plus className="h-4 w-4" /> Adicionar produção
              </button>
            </form>
            <div className="mt-5 space-y-2">
              {producoes.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span>{item.material}</span><span className="font-semibold">{item.kg.toFixed(2)} kg</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-[#526b4c]" />
            <div><h2 className="text-lg font-bold text-slate-900">Minha memória de cálculo</h2><p className="text-sm text-slate-500">Valores dos períodos de rateio já fechados.</p></div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b text-xs uppercase tracking-wider text-slate-500"><th className="px-3 py-3">Competência</th><th className="px-3 py-3">Horas</th><th className="px-3 py-3">Kg</th><th className="px-3 py-3">Total</th></tr></thead>
              <tbody>
                {memorias.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-3">{item.periodo.competencia}</td><td className="px-3 py-3">{item.horas.toFixed(2)}</td><td className="px-3 py-3">{item.kgTriados.toFixed(2)}</td><td className="px-3 py-3 font-semibold">{formatMoney(item.valorTotal)}</td></tr>)}
                {!loading && memorias.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Ainda não há memória de cálculo fechada.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
