"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Coins, LockKeyhole, Plus, TrendingUp } from "lucide-react";

type Preco = {
  id?: number;
  material: string;
  preco: string;
  mes: string;
  status: string;
};

const parsePreco = (valor: string) => {
  const numero = Number(String(valor).replace(/[R$\s.]/g, "").replace(",", "."));
  return Number.isFinite(numero) ? numero : -Infinity;
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

function formatCompetence(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00.000Z`));
}

export default function PrecosPage() {
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentCompetence);
  const [periodStatus, setPeriodStatus] = useState<"ABERTO" | "FECHADO" | null>(null);
  const [checkedCompetence, setCheckedCompetence] = useState("");
  const [periodError, setPeriodError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const isCheckingPeriod = checkedCompetence !== selectedMonth;
  const canEditSelectedPeriod = !isCheckingPeriod && periodStatus === "ABERTO";
  const [formData, setFormData] = useState({
    material: "",
    preco: "",
    mes: selectedMonth,
    status: "Ativo",
  });

  async function removePreco(id?: number) {
    if (!id || !canEditSelectedPeriod || !window.confirm("Excluir este preço?")) return;
    setError("");
    setDeletingId(id);
    try {
      const response = await fetch(`/api/precos?id=${id}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível excluir o preço.");
      setPrecos((items) => items.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir o preço.");
    } finally {
      setDeletingId(null);
    }
  }

  function editPreco(item: Preco) {
    if (!canEditSelectedPeriod) return;
    setEditingId(item.id ?? null);
    setFormData({ material: item.material, preco: item.preco.replace(/[^\d,.-]/g, "").replace(",", "."), mes: item.mes, status: item.status });
    setError("");
    setIsOpen(true);
  }

  function openNewPrice() {
    if (!canEditSelectedPeriod) return;
    setEditingId(null);
    setFormData({ material: "", preco: "", mes: selectedMonth, status: "Ativo" });
    setError("");
    setIsOpen(true);
  }

  const [isPresident, setIsPresident] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((account: { profile?: string }) => setIsPresident(account.profile === "PRESIDENTE"))
      .catch(() => {
        setIsPresident(false);
        setError("Não foi possível verificar as permissões da sua conta.");
      });

    const carregarPrecos = async () => {
      try {
        const response = await fetch("/api/precos", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar preços");
        }
        const data = (await response.json()) as Preco[];
        setPrecos(data);
      } catch {
        setError("Não foi possível carregar os preços. Verifique a conexão e tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    carregarPrecos();
  }, []);

  useEffect(() => {
    let active = true;

    async function checkPeriod() {
      try {
        const response = await fetch(
          `/api/rateio/preview?competencia=${encodeURIComponent(selectedMonth)}`,
          { cache: "no-store" },
        );
        const result = (await response.json()) as { error?: string; status?: "PREVIA" | "FECHADO" };
        if (!response.ok) throw new Error(result.error ?? "Não foi possível verificar a competência.");
        if (result.status !== "PREVIA" && result.status !== "FECHADO") {
          throw new Error("A resposta do sistema não informou o status da competência.");
        }
        if (active) {
          setPeriodStatus(result.status === "FECHADO" ? "FECHADO" : "ABERTO");
          setPeriodError("");
          setCheckedCompetence(selectedMonth);
        }
      } catch (periodError) {
        if (active) {
          setPeriodStatus(null);
          setPeriodError(periodError instanceof Error ? periodError.message : "Não foi possível verificar a competência.");
          setCheckedCompetence(selectedMonth);
        }
      }
    }

    void checkPeriod();
    return () => {
      active = false;
    };
  }, [selectedMonth]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const material = formData.material.trim();
    const preco = formData.preco.trim();

    if (!material || !preco) {
      setError("Informe o material e o preço por quilograma.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/precos", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          material,
          preco: Number(preco.replace(",", ".")),
          mes: formData.mes,
          status: formData.status,
        }),
      });

      const result = (await response.json()) as Preco & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar o preço.");

      setPrecos((atual) => editingId ? atual.map((item) => item.id === editingId ? result : item) : [result, ...atual]);
      setFormData({ material: "", preco: "", mes: selectedMonth, status: "Ativo" });
      setEditingId(null);
      setIsOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o preço.");
    } finally {
      setIsSaving(false);
    }
  }

  const precosDaCompetencia = precos.filter((item) => item.mes === selectedMonth);
  const precosOrdenados = [...precosDaCompetencia].sort((a, b) => parsePreco(b.preco) - parsePreco(a.preco));
  const precosAtivos = precosOrdenados.filter((item) => item.status === "Ativo");
  const materialPrincipal = precosAtivos[0]?.material ?? "-";
  const maiorValor = precosAtivos[0]?.preco ?? "R$ 0,00";
  const totalAtivos = precosAtivos.length;
  const isPeriodClosed = periodStatus === "FECHADO";

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Configuração</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Tabela de preços</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Consulte e organize os preços por competência. A operação utiliza os materiais ativos do mês atual.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Competência</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    setSelectedMonth(event.target.value);
                    setIsOpen(false);
                    setEditingId(null);
                    setError("");
                  }}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3"
                />
              </label>
              {isPresident && (
                <button
                  type="button"
                  onClick={openNewPrice}
                  disabled={!canEditSelectedPeriod}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isPeriodClosed ? <LockKeyhole className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  Novo preço
                </button>
              )}
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {isCheckingPeriod ? (
            <p role="status" className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Verificando o status da competência...</p>
          ) : periodError ? (
            <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Não foi possível confirmar se esta competência está aberta. Edição bloqueada por segurança. {periodError}
            </p>
          ) : isPeriodClosed ? (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
              A competência {selectedMonth} está fechada. Os preços são exibidos apenas para consulta e não podem ser criados, editados ou excluídos.
            </p>
          ) : (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#edf0e5] px-4 py-3 text-sm text-[#465a3e]">
              <TrendingUp className="h-4 w-4 shrink-0" />
              {selectedMonth === currentCompetence()
                ? `Materiais ativos da competência atual (${formatCompetence(selectedMonth)}).`
                : `Consulta histórica da competência ${formatCompetence(selectedMonth)}; os preços não alteram a tabela do mês atual.`}
            </p>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Material principal</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{materialPrincipal}</p>
            </div>
            <div className="rounded-2xl bg-[#edf0e5] p-4">
              <p className="text-sm text-[#465a3e]">Maior valor</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{maiorValor}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Preços ativos nesta competência</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalAtivos} ativos</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Material</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preço por kg</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mês</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  {isPresident && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={isPresident ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-500">Carregando preços...</td>
                  </tr>
                ) : precosDaCompetencia.length === 0 ? (
                  <tr>
                    <td colSpan={isPresident ? 5 : 4} className="px-4 py-8 text-center text-sm text-slate-500">Nenhum preço cadastrado para {selectedMonth}.</td>
                  </tr>
                ) : (
                  precosOrdenados.map((item) => (
                    <tr key={item.id ?? `${item.material}-${item.preco}`} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <Coins className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{item.material}</p>
                            <p className="text-sm text-slate-500">Tipo reciclável</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-lg font-bold text-slate-900">{item.preco}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{item.mes}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === "Em revisão"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-[#edf0e5] text-[#465a3e]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      {isPresident && <td className="px-4 py-4">
                        <button type="button" disabled={!canEditSelectedPeriod} onClick={() => void editPreco(item)} className="mr-3 text-sm font-semibold text-[#465a3e] hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">Editar</button>
                        <button type="button" disabled={!canEditSelectedPeriod || deletingId === item.id} onClick={() => void removePreco(item.id)} className="text-sm font-semibold text-rose-700 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline">
                          Excluir
                        </button>
                      </td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#4d5f40]">Configuração</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{editingId ? "Editar preço" : "Novo preço"} · {formatCompetence(formData.mes)}</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Fechar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Material</label>
                <input
                  value={formData.material}
                  onChange={(event) => setFormData((current) => ({ ...current, material: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Ex: Papelão"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Preço por kg</label>
                  <input
                    value={formData.preco}
                    onChange={(event) => setFormData((current) => ({ ...current, preco: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="Ex: 0,85"
                  />
                </div>

                <div className="flex items-end rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  Este preço será registrado somente para {formData.mes}.
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Em revisão">Em revisão</option>
                </select>
              </div>

              {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsOpen(false); setError(""); }} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button>
                <button type="submit" disabled={isSaving || !canEditSelectedPeriod} className="rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400">{isSaving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar preço"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
