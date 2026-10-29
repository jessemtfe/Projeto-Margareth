"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Clock3, Plus, UserRound, WalletCards } from "lucide-react";

type Cooperado = {
  id?: number;
  nome: string;
  horas: number;
  domingo: number;
  kg: number;
  situacao: string;
};

export default function CooperadosPage() {
  const [cooperados, setCooperados] = useState<Cooperado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    situacao: "Ativo",
  });
  async function removeCooperado(id?: number) {
    if (!id || !window.confirm("Excluir este cadastro?")) return;
    const response = await fetch(`/api/cooperados?id=${id}`, { method: "DELETE" });
    if (response.ok) setCooperados((items) => items.filter((item) => item.id !== id));
  }
  function editCooperado(item: Cooperado) {
    setEditingId(item.id ?? null);
    setFormData({ nome: item.nome, situacao: item.situacao });
    setIsOpen(true);
  }
  useEffect(() => {
    const carregarCooperados = async () => {
      try {
        const response = await fetch(`/api/cooperados?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar cooperados");
        }

        const data = (await response.json()) as Cooperado[];
        setCooperados(data);
      } catch (error) {
        console.error(error);
        setCooperados([]);
      } finally {
        setIsLoading(false);
      }
    };

    carregarCooperados();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = formData.nome.trim();

    if (!nome) {
      return;
    }

    try {
      const response = await fetch("/api/cooperados", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          nome,
          situacao: formData.situacao,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar cooperado");
      }

      const novoCooperado = (await response.json()) as Cooperado;
      setCooperados((atual) =>
        editingId
          ? atual.map((item) =>
              item.id === editingId
                ? {
                    ...novoCooperado,
                    horas: item.horas,
                    domingo: item.domingo,
                    kg: item.kg,
                  }
                : item,
            )
          : [novoCooperado, ...atual],
      );
      setFormData({ nome: "", situacao: "Ativo" });
      setEditingId(null);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Novo cooperado
          </button>
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Cadastro</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Cooperados</h1>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="rounded-2xl bg-[#edf0e5] p-3 text-[#465a3e]">
                <BadgeCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Cooperados ativos</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cooperados.filter((item) => item.situacao === "Ativo").length}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-sky-700">Horas neste mês</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cooperados.reduce((total, item) => total + item.horas, 0)}</p>
            </div>
            <div className="rounded-2xl bg-[#edf0e5] p-4">
              <p className="text-sm text-[#465a3e]">Kg triados</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cooperados.reduce((total, item) => total + item.kg, 0)}</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nome</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Horas</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Horas domingo</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Kg triados</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Situação</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Carregando cooperados...</td>
                  </tr>
                ) : cooperados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Nenhum cooperado cadastrado.</td>
                  </tr>
                ) : (
                  cooperados.map((cooperado) => (
                    <tr key={cooperado.id ?? `${cooperado.nome}-${cooperado.kg}`} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                            <UserRound className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{cooperado.nome}</p>
                            <p className="text-sm text-slate-500">Mês atual</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{cooperado.horas.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{cooperado.domingo.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{cooperado.kg.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            cooperado.situacao === "Parcial"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-[#edf0e5] text-[#465a3e]"
                          }`}
                        >
                          {cooperado.situacao === "Parcial" ? <Clock3 className="h-3.5 w-3.5" /> : <WalletCards className="h-3.5 w-3.5" />}
                          {cooperado.situacao}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button type="button" onClick={() => void editCooperado(cooperado)} className="mr-3 text-sm font-semibold text-[#465a3e] hover:underline">Editar</button>
                        <button type="button" onClick={() => void removeCooperado(cooperado.id)} className="text-sm font-semibold text-rose-700 hover:underline">
                          Excluir
                        </button>
                      </td>
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
                <p className="text-sm uppercase tracking-[0.2em] text-[#4d5f40]">Cadastro</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{editingId ? "Editar cooperado" : "Novo cooperado"}</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Fechar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                <input
                  value={formData.nome}
                  onChange={(event) => setFormData((current) => ({ ...current, nome: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Ex: Maria Souza"
                />
              </div>

              <p className="text-sm text-slate-500">
                Horas e produção são atualizadas automaticamente pelos registros do mês.
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Situação</label>
                <select
                  value={formData.situacao}
                  onChange={(event) => setFormData((current) => ({ ...current, situacao: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Parcial">Parcial</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button>
                <button type="submit" className="rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white">{editingId ? "Salvar alterações" : "Salvar cooperado"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
