"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Plus, Recycle, Scale, X } from "lucide-react";
import Link from "next/link";
import {
  nextCargaStatus,
  rejectedAtIntakeStatus,
} from "../../../lib/carga-status";
import {
  getRejectionAlerts,
  isWeightOutsideExpectedRange,
} from "../../../lib/carga-rules";

type Carga = {
  id: number;
  geradorId: number | null;
  gerador: string;
  material: string;
  peso: number;
  rejeito: number;
  status: string;
  data: string;
};

type Gerador = {
  id: number;
  nome: string;
};

type Preco = {
  material: string;
  status: string;
};

type FormData = {
  gerador: string;
  material: string;
  peso: string;
  rejeito: string;
  data: string;
  status: "Recebida" | typeof rejectedAtIntakeStatus;
};

function localDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyForm(): FormData {
  return {
    gerador: "",
    material: "",
    peso: "",
    rejeito: "0",
    data: localDateValue(),
    status: "Recebida",
  };
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits }).format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [materiais, setMateriais] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingCargaId, setUpdatingCargaId] = useState<number | null>(null);
  const [pesoIncomumConfirmado, setPesoIncomumConfirmado] = useState(false);
  const [formData, setFormData] = useState<FormData>(createEmptyForm);

  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        const [cargasResponse, geradoresResponse, precosResponse] = await Promise.all([
          fetch("/api/cargas", { cache: "no-store" }),
          fetch("/api/geradores", { cache: "no-store" }),
          fetch("/api/precos", { cache: "no-store" }),
        ]);

        if (!cargasResponse.ok || !geradoresResponse.ok || !precosResponse.ok) {
          throw new Error("Não foi possível carregar as informações da carga.");
        }

        const [cargasData, geradoresData, precosData] = await Promise.all([
          cargasResponse.json() as Promise<Carga[]>,
          geradoresResponse.json() as Promise<Gerador[]>,
          precosResponse.json() as Promise<Preco[]>,
        ]);

        if (isCurrent) {
          setCargas(cargasData);
          setGeradores(geradoresData);
          setMateriais([
            ...new Set(
              precosData
                .filter((preco) => preco.status === "Ativo")
                .map((preco) => preco.material),
            ),
          ]);
          setLoadError("");
          setFormData((current) => ({
            ...current,
            material: current.material || precosData.find((preco) => preco.status === "Ativo")?.material || "",
          }));
        }
      } catch {
        if (isCurrent) {
          setLoadError("Não foi possível carregar os dados. Verifique a conexão e tente novamente.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isCurrent = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    try {
      const response = await fetch("/api/cargas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geradorId: Number(formData.gerador),
          material: formData.material,
          peso: Number(formData.peso),
          rejeito: Number(formData.rejeito),
          data: formData.data,
          status: formData.status,
          pesoIncomumConfirmado,
        }),
      });

      const result = (await response.json()) as Carga | { error?: string };

      if (!response.ok) {
        throw new Error("error" in result ? result.error : "Não foi possível salvar a carga.");
      }

      if (!("id" in result)) {
        throw new Error("O servidor retornou uma carga inválida.");
      }

      setCargas((current) => [result, ...current]);
      setFormData(createEmptyForm());
      setPesoIncomumConfirmado(false);
      setIsOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível salvar a carga.");
    }
  }

  async function advanceCarga(carga: Carga) {
    const nextStatus = nextCargaStatus(carga.status);

    if (!nextStatus) {
      return;
    }

    setActionError("");
    setUpdatingCargaId(carga.id);

    try {
      const response = await fetch("/api/cargas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: carga.id, status: nextStatus }),
      });
      const result = (await response.json()) as Carga | { error?: string };

      if (!response.ok) {
        throw new Error("error" in result ? result.error : "Não foi possível avançar a carga.");
      }

      if (!("id" in result)) {
        throw new Error("O servidor retornou uma carga inválida.");
      }

      setCargas((current) => current.map((item) => (item.id === result.id ? result : item)));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Não foi possível avançar a carga.");
    } finally {
      setUpdatingCargaId(null);
    }
  }

  const totalWeight = cargas
    .filter((carga) => carga.status !== rejectedAtIntakeStatus)
    .reduce((total, carga) => total + carga.peso, 0);
  const pendingLoads = cargas.filter(
    (carga) => carga.status !== "Vendida" && carga.status !== rejectedAtIntakeStatus,
  ).length;
  const averageRejection = cargas.length
    ? cargas.reduce((total, carga) => total + carga.rejeito, 0) / cargas.length
    : 0;
  const weightKg = Number(formData.peso);
  const weightNeedsConfirmation =
    formData.peso !== "" &&
    Number.isFinite(weightKg) &&
    weightKg > 0 &&
    isWeightOutsideExpectedRange(weightKg);
  const rejectionAlerts = getRejectionAlerts(cargas);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526b4c]">Balanceiro · recebimento</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#1e2b20]">Entrada de carga</h1>
            <p className="mt-1 text-sm text-slate-500">Registro de pesagem, material e rejeito.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitError("");
              setPesoIncomumConfirmado(false);
              setIsOpen(true);
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#244b34] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#183b2b]"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Registrar carga
          </button>
        </header>

        {rejectionAlerts.length > 0 && (
          <section
            aria-label="Alertas de rejeito por gerador"
            className="mb-6 space-y-3"
          >
            {rejectionAlerts.map((alert) => (
              <article
                key={alert.generatorId ?? alert.gerador}
                role="alert"
                className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                <p className="font-semibold">
                  RN-02: rejeito acima de 25% nas três cargas consecutivas de{" "}
                  {alert.gerador}.
                </p>
                <p className="mt-1">
                  {alert.cargas
                    .map(
                      (carga) =>
                        `Carga #${carga.id}: ${formatNumber(carga.rejeito)}%`,
                    )
                    .join(" · ")}
                </p>
              </article>
            ))}
          </section>
        )}

        <section aria-label="Resumo das cargas" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Cargas registradas</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-[#1e2b20]">{cargas.length}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#e8efe3] text-[#42603c]">
                <ClipboardList aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Peso recebido</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-[#1e2b20]">{formatNumber(totalWeight)} kg</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-100 text-sky-700">
                <Scale aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Rejeito médio</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-[#1e2b20]">{formatNumber(averageRejection)}%</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-100 text-amber-700">
                <Recycle aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Cargas em andamento</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-[#1e2b20]">{pendingLoads}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                <ClipboardList aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </article>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-[#1e2b20]">Cargas recebidas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Data</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Gerador</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Material</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Peso</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Rejeito</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Situação</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Próxima etapa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Carregando cargas...</td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-rose-700">{loadError}</td>
                  </tr>
                ) : cargas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma carga registrada.</td>
                  </tr>
                ) : (
                  cargas.map((carga) => (
                    <tr key={carga.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-600">#{carga.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDate(carga.data)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{carga.gerador}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{carga.material}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-700">{formatNumber(carga.peso)} kg</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-700">{formatNumber(carga.rejeito)}%</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-[#e8efe3] px-2.5 py-1 text-xs font-medium text-[#42603c]">{carga.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {nextCargaStatus(carga.status) ? (
                          <button
                            type="button"
                            disabled={updatingCargaId === carga.id}
                            onClick={() => void advanceCarga(carga)}
                            className="min-h-9 rounded-md border border-[#42603c] px-3 text-xs font-semibold text-[#42603c] transition-colors hover:bg-[#e8efe3] disabled:cursor-wait disabled:opacity-50"
                          >
                            {updatingCargaId === carga.id ? "Salvando..." : `Avançar para ${nextCargaStatus(carga.status)}`}
                          </button>
                        ) : carga.status === "Vendida" ? (
                          <span className="text-xs font-medium text-slate-500">Fluxo concluído</span>
                        ) : carga.status === rejectedAtIntakeStatus ? (
                          <span className="text-xs font-medium text-rose-700">Recusada no recebimento</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700">Etapa a regularizar</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        {actionError && <p role="alert" className="mt-3 text-sm text-rose-700">{actionError}</p>}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="cargo-dialog-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl sm:p-6">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#526b4c]">Novo registro</p>
                <h2 id="cargo-dialog-title" className="mt-1 text-xl font-semibold text-[#1e2b20]">Registrar entrada de carga</h2>
              </div>
              <button type="button" aria-label="Fechar formulário" onClick={() => setIsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="carga-gerador" className="mb-1.5 block text-sm font-medium text-slate-700">Gerador</label>
                <select
                  id="carga-gerador"
                  required
                  value={formData.gerador}
                  onChange={(event) => setFormData((current) => ({ ...current, gerador: event.target.value }))}
                  className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#66805e] focus:ring-2 focus:ring-[#66805e]/20"
                >
                  <option value="">Selecione um gerador</option>
                  {geradores.map((gerador) => (
                    <option key={gerador.id} value={gerador.id}>{gerador.nome}</option>
                  ))}
                </select>
                {geradores.length === 0 && (
                  <Link href="/geradores" className="mt-1.5 inline-block text-xs font-medium text-[#42603c] underline">
                    Cadastre um gerador antes de registrar a carga
                  </Link>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="carga-material" className="mb-1.5 block text-sm font-medium text-slate-700">Material</label>
                  <select
                    id="carga-material"
                    required
                    value={formData.material}
                    onChange={(event) => setFormData((current) => ({ ...current, material: event.target.value }))}
                    className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#66805e] focus:ring-2 focus:ring-[#66805e]/20"
                  >
                    <option value="">Selecione um material</option>
                    {materiais.map((material) => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="carga-data" className="mb-1.5 block text-sm font-medium text-slate-700">Data de entrada</label>
                  <input
                    id="carga-data"
                    type="date"
                    required
                    value={formData.data}
                    onChange={(event) => setFormData((current) => ({ ...current, data: event.target.value }))}
                    className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#66805e] focus:ring-2 focus:ring-[#66805e]/20"
                  />
                </div>
                {materiais.length === 0 && (
                  <p className="text-xs text-amber-700">
                    Cadastre um preço ativo na <Link href="/precos" className="font-semibold underline">tabela de preços</Link> antes de registrar uma carga.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="carga-peso" className="mb-1.5 block text-sm font-medium text-slate-700">Peso recebido (kg)</label>
                  <input
                    id="carga-peso"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={formData.peso}
                    onChange={(event) => {
                      setFormData((current) => ({ ...current, peso: event.target.value }));
                      setPesoIncomumConfirmado(false);
                    }}
                    placeholder="Ex.: 250,00"
                    className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#66805e] focus:ring-2 focus:ring-[#66805e]/20"
                  />
                </div>
                <div>
                  <label htmlFor="carga-rejeito" className="mb-1.5 block text-sm font-medium text-slate-700">Rejeito (%)</label>
                  <input
                    id="carga-rejeito"
                    type="number"
                    step="0.01"
                    required
                    value={formData.rejeito}
                    onChange={(event) => setFormData((current) => ({ ...current, rejeito: event.target.value }))}
                    placeholder="Ex.: 12"
                    className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#66805e] focus:ring-2 focus:ring-[#66805e]/20"
                  />
                </div>
              </div>

              {weightNeedsConfirmation && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
                  <p>
                    O peso informado está fora do intervalo de 1 kg a 10.000 kg.
                    Confira a unidade e o valor antes de confirmar.
                  </p>
                  <label className="mt-2 flex items-start gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={pesoIncomumConfirmado}
                      onChange={(event) =>
                        setPesoIncomumConfirmado(event.target.checked)
                      }
                      className="mt-0.5"
                    />
                    Conferi a pesagem e desejo continuar.
                  </label>
                </div>
              )}

              <div>
                <label htmlFor="carga-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Situação no recebimento
                </label>
                <select
                  id="carga-status"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      status:
                        event.target.value === rejectedAtIntakeStatus
                          ? rejectedAtIntakeStatus
                          : "Recebida",
                    }))
                  }
                  className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#66805e] focus:ring-2 focus:ring-[#66805e]/20"
                >
                  <option value="Recebida">Recebida</option>
                  <option value={rejectedAtIntakeStatus}>{rejectedAtIntakeStatus}</option>
                </select>
                {formData.status === rejectedAtIntakeStatus && (
                  <p className="mt-1.5 text-xs text-rose-700">
                    A carga recusada fica registrada para consulta e não poderá avançar no fluxo.
                  </p>
                )}
              </div>

              {submitError && <p role="alert" className="text-sm text-rose-700">{submitError}</p>}

              <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsOpen(false)} className="min-h-10 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button
                  type="submit"
                  disabled={
                    geradores.length === 0 ||
                    materiais.length === 0 ||
                    (weightNeedsConfirmation && !pesoIncomumConfirmado)
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#244b34] px-4 text-sm font-semibold text-white hover:bg-[#183b2b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Salvar carga
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}