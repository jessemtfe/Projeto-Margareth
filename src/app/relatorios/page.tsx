import Link from "next/link";
import { ArrowUpRight, Boxes, Calculator, Clock3, Truck, UsersRound } from "lucide-react";
import { getCurrentUser } from "../../../lib/auth";
import { saoPauloMonthRange } from "../../../lib/turno-rules";
import prisma from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  const user = await getCurrentUser();
  if (!user || user.profile !== "PRESIDENTE") return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const year = Number(value("year"));
  const month = Number(value("month"));
  const competence = `${year}-${String(month).padStart(2, "0")}`;
  const { start, end } = saoPauloMonthRange(year, month);
  const dateStart = new Date(Date.UTC(year, month - 1, 1));
  const dateEnd = new Date(Date.UTC(year, month, 1));
  const [cooperados, cargas, producao, turnos, periodo] = await Promise.all([
    prisma.cadastroCooperados.count({
      where: { situacao: "Ativo", OR: [{ origem: "MANUAL" }, { conta: { isNot: null } }] },
    }),
    prisma.tabelaCargas.count(),
    prisma.producao.aggregate({
      where: { data: { gte: dateStart, lt: dateEnd } },
      _sum: { kg: true },
    }),
    prisma.turno.aggregate({
      where: { status: "FECHADO", inicio: { gte: start, lt: end } },
      _count: { _all: true },
    }),
    prisma.rateioPeriodo.findUnique({
      where: { competencia: competence },
      select: { status: true, totalRateado: true },
    }),
  ]);
  const productionKg = Number(producao._sum.kg ?? 0);
  const rateio = periodo?.status === "FECHADO"
    ? `Fechado · ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(periodo.totalRateado))}`
    : "Em aberto";
  const reports = [
    { title: "Cooperados ativos", value: String(cooperados), icon: UsersRound, href: "/cooperados" },
    { title: "Cargas registradas", value: String(cargas), icon: Truck, href: "/cargas" },
    { title: "Produção no mês", value: `${productionKg.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`, icon: Boxes, href: "/registro-cooperados#producao" },
    { title: "Turnos encerrados no mês", value: String(turnos._count._all), icon: Clock3, href: "/registro-cooperados#turnos" },
    { title: "Situação do rateio", value: rateio, icon: Calculator, href: "/rateio" },
  ];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#526b4c]">Gestão da cooperativa</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1e2b20]">Relatórios</h1>
          <p className="mt-2 text-slate-600">Resumo operacional de {competence}.</p>
        </header>
        <section aria-label="Relatório mensal" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map(({ title, value: reportValue, icon: Icon, href }) => (
            <Link key={title} href={href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-[#9caf91]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">{title}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{reportValue}</p>
                </div>
                <Icon aria-hidden="true" className="h-5 w-5 text-[#526b4c]" />
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#42603c]">
                Abrir detalhes <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
