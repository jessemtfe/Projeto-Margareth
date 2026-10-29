"use client";

import { useCallback, useEffect, useState } from "react";
import { Calculator, CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";

type RateioLine = {
  cooperadoId: number;
  nomeCooperado: string;
  horasReais: number;
  horasPonderadas: number;
  kgTriados: number;
  valorProduzido: number;
  valorHoras: number;
  valorProducao: number;
  bonus: number;
  valorTotal: number;
  participaProducao: boolean;
  detalhes: {
    regra: string;
    participaProducao: boolean;
    bonusElegivel: boolean;
    materiais: Array<{ material: string; kg: number; precoPorKg: number; valorProduzido: number }>;
  };
};

type Preview = {
  competencia: string;
  status: "PREVIA" | "FECHADO";
  fechadoEm?: string | null;
  valorDisponivel: number;
  parcelaHorasDisponivel: number;
  parcelaProducaoDisponivel: number;
  bonusTotal: number;
  totalRateado: number;
  issues: Array<{ type: string; message: string }>;
  openShiftCount: number;
  linhas: RateioLine[];
  producaoPorMaterial: Array<{ material: string; kg: number; precoPorKg: number; valorProduzido: number }>;
  periodosFechados?: Array<{ competencia: string; totalRateado: number; fechadoEm: string | null }>;
};

function currentCompetence() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}`;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function RateioPage() {
  const [competencia, setCompetencia] = useState(currentCompetence);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/rateio/preview?competencia=${encodeURIComponent(competencia)}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar a prévia.");
      setPreview(result as Preview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar a prévia.");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [competencia]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPreview(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPreview]);

  async function closeRateio() {
    if (!preview || preview.status === "FECHADO" || preview.issues.length > 0) return;
    if (!window.confirm(`Confirmar o fechamento do rateio de ${competencia}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setClosing(true);
    setError("");
    try {
      const response = await fetch("/api/rateio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competencia }),
      });
      const result = (await response.json()) as { error?: string; issues?: Preview["issues"] };
      if (!response.ok) {
        const issueText = result.issues?.map((issue) => issue.message).join(" ");
        throw new Error([result.error, issueText].filter(Boolean).join(" "));
      }
      await loadPreview();
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "Não foi possível fechar o rateio.");
    } finally {
      setClosing(false);
    }
  }

  const formattedCloseDate = preview?.fechadoEm
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(preview.fechadoEm))
    : null;

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#526b4c]">Conferência financeira</p>
            <h1 className="mt-2 flex items-center gap-3 text-4xl font-black tracking-tight text-slate-900">
              <Calculator className="h-9 w-9 text-[#526b4c]" />
              Rateio mensal
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Confira horas, produção avaliada, memória de cálculo e inconsistências antes do fechamento.
            </p>
          </div>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Competência
            <input
              type="month"
              value={competencia}
              onChange={(event) => setCompetencia(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
            />
          </label>
        </header>

        {error && <p role="alert" className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl bg-white p-6 text-slate-600">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Calculando a prévia...
          </div>
        ) : preview ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              {[
                ["Fundo avaliado", preview.valorDisponivel],
                ["Parcela de horas (50%)", preview.parcelaHorasDisponivel],
                ["Parcela de produção (50%)", preview.parcelaProducaoDisponivel],
                ["Bônus adicional", preview.bonusTotal],
                ["Total a receber", preview.totalRateado],
              ].map(([label, amount]) => (
                <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{money(Number(amount))}</p>
                </article>
              ))}
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Situação</p>
                <p className="mt-2 flex items-center gap-2 text-base font-bold text-slate-900">
                  {preview.status === "FECHADO" ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <Calculator className="h-5 w-5 text-amber-600" />}
                  {preview.status === "FECHADO" ? "Fechado" : "Prévia"}
                </p>
                {formattedCloseDate && <p className="mt-1 text-xs text-slate-500">Fechado em {formattedCloseDate}</p>}
              </article>
            </section>

            {preview.issues.length > 0 && (
              <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <h2 className="flex items-center gap-2 font-bold text-amber-950">
                  <CircleAlert className="h-5 w-5" /> Inconsistências ({preview.issues.length})
                </h2>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-amber-900">
                  {preview.issues.map((issue, index) => <li key={`${issue.type}-${index}`}>{issue.message}</li>)}
                </ul>
              </section>
            )}

            {preview.openShiftCount > 0 && (
              <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Há {preview.openShiftCount} turno(s) aberto(s). O fechamento está bloqueado até que todos sejam encerrados.
              </p>
            )}

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Produção por material</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-sm">
                  <thead className="border-b text-slate-500"><tr><th className="py-2">Material</th><th className="py-2">Quantidade</th><th className="py-2">Preço/kg</th><th className="py-2">Valor avaliado</th></tr></thead>
                  <tbody>
                    {preview.producaoPorMaterial.map((item) => (
                      <tr key={item.material} className="border-b last:border-0">
                        <td className="py-3 font-medium text-slate-900">{item.material}</td>
                        <td className="py-3">{item.kg.toFixed(2)} kg</td>
                        <td className="py-3">{money(item.precoPorKg)}</td>
                        <td className="py-3">{money(item.valorProduzido)}</td>
                      </tr>
                    ))}
                    {preview.producaoPorMaterial.length === 0 && <tr><td className="py-4 text-slate-500" colSpan={4}>Nenhuma produção avaliada nesta competência.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Memória de cálculo por cooperado</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="border-b text-slate-500">
                    <tr>
                      <th className="py-2 pr-3">Cooperado</th><th className="py-2 pr-3">Horas reais</th>
                      <th className="py-2 pr-3">Horas ponderadas</th><th className="py-2 pr-3">Produção</th>
                      <th className="py-2 pr-3">Valor produzido</th><th className="py-2 pr-3">Parcela horas</th>
                      <th className="py-2 pr-3">Parcela produção</th><th className="py-2 pr-3">Bônus</th>
                      <th className="py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.linhas.map((line) => (
                      <tr key={line.cooperadoId} className="border-b align-top last:border-0">
                        <td className="py-3 pr-3 font-semibold text-slate-900">
                          {line.nomeCooperado}
                          <div className="mt-1 space-y-1 text-xs font-normal text-slate-500">
                            <p>{line.participaProducao ? "Elegível à parcela de produção (≥ 60 h)" : "Somente parcela de horas (< 60 h)"}</p>
                            {line.detalhes.materiais.map((item) => (
                              <p key={item.material}>{item.material}: {item.kg.toFixed(2)} kg × {money(item.precoPorKg)}/kg = {money(item.valorProduzido)}</p>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-3">{line.horasReais.toFixed(2)} h</td>
                        <td className="py-3 pr-3">{line.horasPonderadas.toFixed(2)} h</td>
                        <td className="py-3 pr-3">{line.kgTriados.toFixed(2)} kg</td>
                        <td className="py-3 pr-3">{money(line.valorProduzido)}</td>
                        <td className="py-3 pr-3">{money(line.valorHoras)}</td>
                        <td className="py-3 pr-3">{money(line.valorProducao)}</td>
                        <td className="py-3 pr-3">{money(line.bonus)}</td>
                        <td className="py-3 font-bold">{money(line.valorTotal)}</td>
                      </tr>
                    ))}
                    {preview.linhas.length === 0 && <tr><td className="py-4 text-slate-500" colSpan={9}>Nenhum cooperado cadastrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            {preview.periodosFechados && preview.periodosFechados.length > 0 && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Histórico de rateios fechados</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preview.periodosFechados.map((period) => (
                    <button
                      key={period.competencia}
                      type="button"
                      onClick={() => setCompetencia(period.competencia)}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        period.competencia === competencia
                          ? "border-[#234531] bg-[#dce8d7] text-[#234531]"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {period.competencia} · {money(period.totalRateado)}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="max-w-3xl text-sm text-slate-600">
                O fundo é calculado pela produção avaliada a preço ativo. O bônus de 10% para mais de 180 horas é adicional e pode elevar o total pago acima do fundo original.
              </p>
              <button
                type="button"
                onClick={() => void closeRateio()}
                disabled={closing || preview.status === "FECHADO" || preview.issues.length > 0}
                className="rounded-lg bg-[#234531] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#183b2b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closing ? "Fechando..." : preview.status === "FECHADO" ? "Rateio fechado" : "Confirmar fechamento"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
