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
  cooperadoId: number;
  cooperadoNome?: string;
  inicio: string;
  saida: string | null;
  tipoDia: "NORMAL" | "DOMINGO" | "FERIADO";
  horasTrabalhadas: number | null;
  status: "ABERTO" | "FECHADO";
};

type Producao = {
  id: number;
  cooperadoId: number;
  cooperadoNome?: string;
  material: string;
  kg: number;
  data: string;
};

type Profile = "COOPERADO" | "BALANCEIRO" | "PRESIDENTE";
type CooperadoOption = { id: number; nome: string };

type Memoria = {
  id: number;
  periodo: { competencia: string; status: string };
  horasReais: number;
  horas: number;
  kgTriados: number;
  valorHoras: number;
  valorProducao: number;
  bonus: number;
  valorTotal: number;
  detalhes: {
    participaProducao?: boolean;
    materiais?: Array<{ material: string; kg: number; precoPorKg: number; valorProduzido: number }>;
  } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatProductionDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function dateInSaoPaulo(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00.000Z`));
}

function currentSaoPauloDateTime() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
  };
}

function isSunday(date: string) {
  return Boolean(date) && new Date(`${date}T12:00:00.000Z`).getUTCDay() === 0;
}

function dayTypeLabel(tipoDia: Turno["tipoDia"]) {
  return tipoDia === "DOMINGO" ? "Domingo (horas em dobro)" : tipoDia === "FERIADO" ? "Feriado (horas em dobro)" : "Normal";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function MeusRegistrosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [producoes, setProducoes] = useState<Producao[]>([]);
  const [memorias, setMemorias] = useState<Memoria[]>([]);
  const [cooperados, setCooperados] = useState<CooperadoOption[]>([]);
  const [selectedCooperadoId, setSelectedCooperadoId] = useState("");
  const [materiais, setMateriais] = useState<string[]>([]);
  const [material, setMaterial] = useState("");
  const [kg, setKg] = useState("");
  const [productionDate, setProductionDate] = useState(() => currentSaoPauloDateTime().date);
  const [turnoDate, setTurnoDate] = useState(() => currentSaoPauloDateTime().date);
  const [horaEntrada, setHoraEntrada] = useState(() => currentSaoPauloDateTime().time);
  const [horaSaida, setHoraSaida] = useState(() => currentSaoPauloDateTime().time);
  const [turnoTipoDia, setTurnoTipoDia] = useState<"NORMAL" | "FERIADO">("NORMAL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      const accountResponse = await fetch("/api/auth/me", { cache: "no-store" });
      if (!accountResponse.ok) throw new Error("Não foi possível identificar seu perfil.");
      const account = (await accountResponse.json()) as { profile: Profile };
      setProfile(account.profile);
      const responses = await Promise.all([
        fetch("/api/turnos", { cache: "no-store" }),
        fetch("/api/producao", { cache: "no-store" }),
        account.profile === "BALANCEIRO"
          ? Promise.resolve(null)
          : fetch("/api/rateio", { cache: "no-store" }),
        fetch("/api/precos", { cache: "no-store" }),
        account.profile === "BALANCEIRO"
          ? fetch("/api/cooperados", { cache: "no-store" })
          : Promise.resolve(null),
      ]);
      const [turnosResponse, producaoResponse, memoriaResponse, materialsResponse, cooperadosResponse] = responses;
      if (
        !turnosResponse.ok ||
        !producaoResponse.ok ||
        (memoriaResponse && !memoriaResponse.ok) ||
        (account.profile === "BALANCEIRO" &&
          (!materialsResponse.ok || !cooperadosResponse?.ok))
      ) {
        throw new Error("Não foi possível carregar seus registros.");
      }
      const turnosData = await turnosResponse.json();
      const producaoData = await producaoResponse.json();
      const memoriaData = memoriaResponse ? await memoriaResponse.json() : [];
      const materialsData = materialsResponse.ok ? await materialsResponse.json() : [];
      const cooperadosData = cooperadosResponse?.ok ? await cooperadosResponse.json() : [];
      setTurnos(turnosData as Turno[]);
      setProducoes(producaoData as Producao[]);
      setMemorias(memoriaData as Memoria[]);
      if (Array.isArray(materialsData)) {
        setMateriais(materialsData as string[]);
      }
      if (Array.isArray(cooperadosData)) {
        setCooperados(cooperadosData as CooperadoOption[]);
        setSelectedCooperadoId((current) =>
          cooperadosData.some((item: CooperadoOption) => String(item.id) === current)
            ? current
            : cooperadosData[0]
              ? String(cooperadosData[0].id)
              : "",
        );
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          turno
            ? { id: turno.id, horaSaida }
            : {
                ...(profile === "BALANCEIRO" ? { cooperadoId: Number(selectedCooperadoId) } : {}),
                data: turnoDate,
                horaEntrada,
                tipoDia: isSunday(turnoDate) ? "DOMINGO" : turnoTipoDia,
              },
        ),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível atualizar o turno.");
      await loadRecords();
      if (!turno) {
        const now = currentSaoPauloDateTime();
        setTurnoDate(now.date);
        setHoraEntrada(now.time);
        setHoraSaida(now.time);
        setTurnoTipoDia("NORMAL");
      }
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
        body: JSON.stringify({
          ...(profile === "BALANCEIRO" ? { cooperadoId: Number(selectedCooperadoId) } : {}),
          material,
          kg: Number(kg),
          data: productionDate,
        }),
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

  const openShift = turnos.find(
    (turno) =>
      turno.status === "ABERTO" &&
      (profile !== "BALANCEIRO" || String(turno.cooperadoId) === selectedCooperadoId),
  );
  const totalKg = producoes.reduce((total, item) => total + item.kg, 0);
  const currentMonth = currentSaoPauloDateTime().date.slice(0, 7);
  const currentMonthTurnos = turnos.filter((turno) =>
    dateInSaoPaulo(turno.inicio).startsWith(currentMonth),
  );
  const monthHours = currentMonthTurnos.reduce(
    (totals, turno) => {
      if (turno.status !== "FECHADO" || !turno.saida || turno.horasTrabalhadas === null) {
        return totals;
      }
      const actual = turno.horasTrabalhadas;
      const weighted =
        turno.tipoDia === "DOMINGO" || turno.tipoDia === "FERIADO" ? actual * 2 : actual;
      return {
        actual: totals.actual + actual,
        weighted: totals.weighted + weighted,
      };
    },
    { actual: 0, weighted: 0 },
  );

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#526b4c]">
            {profile === "BALANCEIRO" ? "Operação da cooperativa" : "Área do cooperado"}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">
            {profile === "BALANCEIRO" ? "Registros dos cooperados" : "Meus registros"}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {profile === "BALANCEIRO"
              ? "Registre turnos e produção para os cooperados."
              : "Consulte seus turnos, produção e memória de cálculo."}
          </p>
        </header>

        {error && <p role="alert" className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Clock3 className="h-5 w-5 text-sky-700" />
            <p className="mt-4 text-sm text-slate-500">Turno atual</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{openShift ? "Em andamento" : "Encerrado"}</p>
          </div>
          {profile !== "BALANCEIRO" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Scale className="h-5 w-5 text-[#526b4c]" />
              <p className="mt-4 text-sm text-slate-500">Produção registrada</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalKg.toFixed(2)} kg</p>
            </div>
          )}
          {profile !== "BALANCEIRO" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <WalletCards className="h-5 w-5 text-amber-600" />
              <p className="mt-4 text-sm text-slate-500">Memórias disponíveis</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{memorias.length}</p>
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {profile === "BALANCEIRO" ? "Registrar turno" : "Meus turnos"}
              </h2>
              <CalendarClock className="h-5 w-5 text-slate-500" />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {profile === "BALANCEIRO"
                ? "Selecione o cooperado e registre entrada e saída."
                : "Consulte suas horas registradas e consideradas no rateio."}
            </p>
            {profile === "COOPERADO" && (
              <p className="mt-2 rounded-lg bg-[#f4f7f2] px-3 py-2 text-sm font-medium text-[#234531]">
                Total de {formatMonth(currentMonth)}: {monthHours.actual.toFixed(2)} h reais ·{" "}
                {monthHours.weighted.toFixed(2)} h consideradas no rateio
              </p>
            )}
            {profile === "BALANCEIRO" && (
              <label className="mt-4 block text-xs font-medium text-slate-600">
                Cooperado
                <select
                  required
                  value={selectedCooperadoId}
                  onChange={(event) => setSelectedCooperadoId(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {cooperados.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                </select>
              </label>
            )}
            {!openShift ? (
              profile === "BALANCEIRO" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-600">
                  Data do turno
                  <input
                    type="date"
                    required
                    value={turnoDate}
                    onChange={(event) => setTurnoDate(event.target.value)}
                    className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600">
                  Horário de entrada
                  <input
                    type="time"
                    required
                    value={horaEntrada}
                    onChange={(event) => setHoraEntrada(event.target.value)}
                    className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </label>
                <label className="text-xs font-medium text-slate-600 sm:col-span-2">
                  Tipo de dia
                  <select
                    value={isSunday(turnoDate) ? "DOMINGO" : turnoTipoDia}
                    disabled={isSunday(turnoDate)}
                    onChange={(event) => setTurnoTipoDia(event.target.value as "NORMAL" | "FERIADO")}
                    className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="DOMINGO">Domingo (horas em dobro)</option>
                    <option value="FERIADO">Feriado (horas em dobro)</option>
                  </select>
                  <span className="mt-1 block font-normal">
                    Domingos são identificados automaticamente. Selecione Feriado para feriados locais ou móveis.
                  </span>
                </label>
              </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">O Balanceiro registra e encerra os turnos.</p>
              )
            ) : (
              profile === "BALANCEIRO" ? (
                <label className="mt-5 block text-xs font-medium text-slate-600">
                  Horário de saída
                  <input
                    type="time"
                    required
                    value={horaSaida}
                    onChange={(event) => setHoraSaida(event.target.value)}
                    className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </label>
              ) : (
                <p className="mt-5 text-sm text-amber-700">Há um turno em andamento. O Balanceiro deve registrar a saída.</p>
              )
            )}
            {profile === "BALANCEIRO" && (
              <button
                type="button"
                disabled={saving || !selectedCooperadoId}
                onClick={() => void updateTurno(openShift)}
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#234531] px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {openShift ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {openShift ? "Registrar saída" : "Registrar entrada"}
              </button>
            )}
            <div className="mt-5 space-y-2">
              {currentMonthTurnos.map((turno) => (
                <div key={turno.id} className="grid gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="grid gap-1 sm:grid-cols-2 sm:gap-4">
                    {profile === "BALANCEIRO" && <span className="font-semibold">{turno.cooperadoNome}</span>}
                    <span><span className="font-medium text-slate-700">Entrada:</span> {formatDate(turno.inicio)}</span>
                    <span>
                      <span className="font-medium text-slate-700">Saída:</span>{" "}
                      {turno.saida
                        ? formatDate(turno.saida)
                        : turno.status === "ABERTO"
                          ? "Aguardando encerramento"
                          : "Não registrada"}
                    </span>
                  </div>
                  <span
                    className={
                      turno.status === "ABERTO" || !turno.saida
                        ? "font-semibold text-amber-700"
                        : "text-slate-500"
                    }
                  >
                    {turno.status === "ABERTO"
                      ? `Em andamento · ${dayTypeLabel(turno.tipoDia)}`
                      : turno.saida
                        ? `${turno.horasTrabalhadas?.toFixed(2) ?? "0.00"} h · ${dayTypeLabel(turno.tipoDia)}`
                        : `Fechado sem horário de saída · ${dayTypeLabel(turno.tipoDia)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {profile === "BALANCEIRO" ? "Registrar produção" : "Minha produção"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {profile === "BALANCEIRO"
                ? "Registre a quantidade produzida por cooperado e material."
                : "Consulte suas quantidades produzidas por material."}
            </p>
            {profile === "BALANCEIRO" && <label className="mt-4 block text-xs font-medium text-slate-600">
              Cooperado
              <select
                required
                value={selectedCooperadoId}
                onChange={(event) => setSelectedCooperadoId(event.target.value)}
                className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {cooperados.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </label>}
            {profile === "BALANCEIRO" && <form onSubmit={(event) => void registerProduction(event)} className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">
                Data da produção
                <input
                  type="date"
                  required
                  value={productionDate}
                  onChange={(event) => setProductionDate(event.target.value)}
                  className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                />
              </label>
              <select value={material} onChange={(event) => setMaterial(event.target.value)} required className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm">
                <option value="">Selecione o material</option>
                {materiais.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={kg} onChange={(event) => setKg(event.target.value)} required min="0.01" step="0.01" type="number" placeholder="Kg" className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm" />
              <button disabled={saving} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#526b4c] px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">
                <Plus className="h-4 w-4" /> Adicionar produção
              </button>
            </form>}
            <div className="mt-5 space-y-2">
              {producoes.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    {profile === "BALANCEIRO" && <span className="mb-1 block font-semibold">{item.cooperadoNome}</span>}
                    <span>{item.material}</span>
                    <span className="mt-1 block text-xs text-slate-500">Data: {formatProductionDate(item.data)}</span>
                  </div>
                  <span className="shrink-0 font-semibold">{item.kg.toFixed(2)} kg</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {profile !== "BALANCEIRO" && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Archive className="h-5 w-5 text-[#526b4c]" />
            <div><h2 className="text-lg font-bold text-slate-900">Minha memória de cálculo</h2><p className="text-sm text-slate-500">Valores dos períodos de rateio já fechados.</p></div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead><tr className="border-b text-xs uppercase tracking-wider text-slate-500"><th className="px-3 py-3">Competência</th><th className="px-3 py-3">Horas reais / rateadas</th><th className="px-3 py-3">Produção</th><th className="px-3 py-3">Parcela horas</th><th className="px-3 py-3">Parcela produção</th><th className="px-3 py-3">Bônus</th><th className="px-3 py-3">Total</th></tr></thead>
              <tbody>
                {memorias.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-3 py-3">{item.periodo.competencia}</td>
                    <td className="px-3 py-3">{item.horasReais.toFixed(2)} h / {item.horas.toFixed(2)} h</td>
                    <td className="px-3 py-3">
                      {item.kgTriados.toFixed(2)} kg
                      <div className="mt-1 text-xs text-slate-500">
                        {item.detalhes?.materiais?.map((materialItem) => (
                          <p key={materialItem.material}>{materialItem.material}: {materialItem.kg.toFixed(2)} kg × {formatMoney(materialItem.precoPorKg)}/kg = {formatMoney(materialItem.valorProduzido)}</p>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">{formatMoney(item.valorHoras)}</td>
                    <td className="px-3 py-3">{formatMoney(item.valorProducao)}</td>
                    <td className="px-3 py-3">{formatMoney(item.bonus)}</td>
                    <td className="px-3 py-3 font-semibold">{formatMoney(item.valorTotal)}</td>
                  </tr>
                ))}
                {!loading && memorias.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">Ainda não há memória de cálculo fechada.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>}
      </div>
    </main>
  );
}
