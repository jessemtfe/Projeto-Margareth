"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CircleAlert, Plus, Search } from "lucide-react";

type Gerador = {
  id?: number;
  nome: string;
  tipo: string;
  rejeito: string;
  status: string;
  ultimaColeta: number | string;
};

function formatCollectionDate(value: number | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function GeradoresPage() {
  const [geradores, setGeradores] = useState<Gerador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "Residencial",
    rejeito: "",
    status: "Normal",
  });
  const [isPresident, setIsPresident] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((account: { profile?: string }) => setIsPresident(account.profile === "PRESIDENTE"))
      .catch(() => setIsPresident(false));

    const carregarGeradores = async () => {
      try {
        const response = await fetch(`/api/geradores?t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar geradores");
        }

        const data = (await response.json()) as Gerador[];
        setGeradores(data);
      } catch (error) {
        console.error(error);
        setGeradores([]);
      } finally {
        setIsLoading(false);
      }
    };

    carregarGeradores();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = formData.nome.trim();
    const rejeito = formData.rejeito.trim();

    if (!nome || !rejeito) {
      return;
    }

    try {
      const response = await fetch("/api/geradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          tipo: formData.tipo,
          rejeito: Number(rejeito),
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar gerador");
      }

      const novoGerador = (await response.json()) as Gerador;
      setGeradores((atual) => [novoGerador, ...atual]);
      setFormData({ nome: "", tipo: "Residencial", rejeito: "", status: "Normal" });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
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

          {isPresident && <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Novo gerador
          </button>}
        </header>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4d5f40]">Cadastro</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Geradores</h1>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 md:w-[320px]">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                placeholder="Buscar gerador"
                className="w-full border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl bg-[#f3fbf5] p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{geradores.length}</p>
            </div>
            <div className="rounded-2xl bg-[#edf6ff] p-4">
              <p className="text-sm text-slate-500">Residenciais</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{geradores.filter((item) => item.tipo === "Residencial").length}</p>
            </div>
            <div className="rounded-2xl bg-[#fff7ea] p-4">
              <p className="text-sm text-slate-500">Comerciais</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{geradores.filter((item) => item.tipo === "Comercial").length}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="text-sm text-slate-500">Institucionais</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{geradores.filter((item) => item.tipo === "Institucional").length}</p>
            </div>
            <div className="rounded-2xl bg-[#fff1f2] p-4">
              <p className="text-sm text-slate-500">Alertas</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{geradores.filter((item) => item.status === "Alertado").length}</p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gerador</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Rejeito</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Carregando geradores...</td>
                  </tr>
                ) : geradores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">Nenhum gerador cadastrado.</td>
                  </tr>
                ) : (
                  geradores.map((gerador) => (
                    <tr key={gerador.id ?? `${gerador.nome}-${gerador.rejeito}`} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf0e5] text-[#465a3e]">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{gerador.nome}</p>
                            <p className="text-sm text-slate-500">Última coleta: {formatCollectionDate(gerador.ultimaColeta)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">{gerador.tipo}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{gerador.rejeito}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            gerador.status === "Alertado"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-[#edf0e5] text-[#465a3e]"
                          }`}
                        >
                          {gerador.status === "Alertado" && <CircleAlert className="mr-1 h-3.5 w-3.5" />}
                          {gerador.status}
                        </span>
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
                <h2 className="mt-1 text-2xl font-black text-slate-900">Novo gerador</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600">Fechar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                <input
                  value={formData.nome}
                  onChange={(event) => setFormData((current) => ({ ...current, nome: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400"
                  placeholder="Ex: Condomínio Liberdade"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                  <select
                    value={formData.tipo}
                    onChange={(event) => setFormData((current) => ({ ...current, tipo: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none"
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Institucional">Institucional</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Rejeito (%)</label>
                  <input
                    value={formData.rejeito}
                    onChange={(event) => setFormData((current) => ({ ...current, rejeito: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    placeholder="Ex: 18"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="Alertado">Alertado</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancelar</button>
                <button type="submit" className="rounded-full bg-[#465a3e] px-4 py-2 text-sm font-semibold text-white">Salvar gerador</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
