"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Coins, Plus, TrendingUp } from "lucide-react";

const STORAGE_KEY = "margareth-precos";

type Preco = {
  material: string;
  preco: string;
  mes: string;
  status: string;
};

const initialPrecos: Preco[] = [
  { material: "Papelão", preco: "R$ 0,62", mes: "Outubro", status: "Ativo" },
  { material: "PET", preco: "R$ 2,10", mes: "Outubro", status: "Ativo" },
  { material: "Alumínio", preco: "R$ 6,80", mes: "Outubro", status: "Ativo" },
  { material: "Vidro", preco: "R$ 0,85", mes: "Outubro", status: "Em revisão" },
];

export default function PrecosPage() {
  const [precos, setPrecos] = useState<Preco[]>(initialPrecos);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    material: "",
    preco: "",
    mes: "Outubro",
    status: "Ativo",
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrecos(JSON.parse(stored) as Preco[]);
      }
    } catch {
      // ignore invalid storage data
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(precos));
  }, [precos, isHydrated]);

  const safePrecos = isHydrated ? precos : initialPrecos;
  const parsePreco = (valor: string) => {
    const numero = Number(String(valor).replace(/[R$\s.]/g, "").replace(",", "."));
    return Number.isFinite(numero) ? numero : -Infinity;
  };

  const precosOrdenados = [...safePrecos].sort(
    (a, b) => parsePreco(b.preco) - parsePreco(a.preco),
  );

  const materialPrincipal = precosOrdenados[0]?.material ?? "-";
  const maiorValor = precosOrdenados[0]?.preco ?? "R$ 0,00";
  const totalAtivos = safePrecos.filter((item) => item.status === "Ativo").length;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const material = formData.material.trim();
    const preco = formData.preco.trim();

    if (!material || !preco) {
      return;
    }

    const precoFormatado = preco.startsWith("R$") ? preco : `R$ ${preco}`;

    setPrecos((atual) => [
      {
        material,
        preco: precoFormatado,
        mes: formData.mes,
        status: formData.status,
      },
      ...atual,
    ]);

    setFormData({ material: "", preco: "", mes: "Outubro", status: "Ativo" });
    setIsOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Novo preço
          </button>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Configuração</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Tabela de preços</h1>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              <TrendingUp className="h-4 w-4" />
              Mês: Outubro
            </div>
          </div>

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
              <p className="text-sm text-slate-500">Tabela ativa</p>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {precosOrdenados.map((item) => (
                  <tr key={`${item.material}-${item.preco}`} className="hover:bg-slate-50">
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
                  </tr>
                ))}
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
                <h2 className="mt-1 text-2xl font-black text-slate-900">Novo preço</h2>
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

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mês</label>
                  <select
                    value={formData.mes}
                    onChange={(event) => setFormData((current) => ({ ...current, mes: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none"
                  >
                    <option value="Outubro">Outubro</option>
                    <option value="Novembro">Novembro</option>
                    <option value="Dezembro">Dezembro</option>
                  </select>
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

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button>
                <button type="submit" className="rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white">Salvar preço</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
