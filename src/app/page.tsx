import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Boxes,
  Calculator,
  Clock3,
  FileBarChart,
  Factory,
  Scale,
  ShieldCheck,
  Tags,
  Truck,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { getCurrentUser } from "../../lib/auth";
import { saoPauloMonthRange } from "../../lib/turno-rules";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

function currentCompetence() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { year: Number(value("year")), month: Number(value("month")) };
}

function formatMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof UsersRound;
  tone: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-[#1e2b20]">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

function Shortcut({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Truck;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-32 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-[#9caf91] hover:bg-[#fbfcfa]"
    >
      <Icon aria-hidden="true" className="mb-4 h-5 w-5 text-[#42603c]" />
      <span className="font-semibold text-[#1e2b20]">{title}</span>
      <span className="mt-1 flex-1 text-sm text-slate-500">{description}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#42603c]">
        Abrir
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { year, month } = currentCompetence();
  const competence = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = formatMonth(year, month);
  const { start, end } = saoPauloMonthRange(year, month);
  const dateStart = new Date(Date.UTC(year, month - 1, 1));
  const dateEnd = new Date(Date.UTC(year, month, 1));

  if (user.profile === "COOPERADO") {
    if (!user.cooperadoId) {
      return (
        <main className="min-h-screen px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-bold text-slate-900">Meu Painel</h1>
            <p className="mt-2 text-slate-700">
              Sua conta ainda não está vinculada a um cadastro de cooperado. Peça à Presidente para concluir o vínculo.
            </p>
          </div>
        </main>
      );
    }

    const [turnos, producao, memoria] = await Promise.all([
      prisma.turno.findMany({
        where: {
          cooperadoId: user.cooperadoId,
          status: "FECHADO",
          inicio: { gte: start, lt: end },
        },
        select: { inicio: true, saida: true },
      }),
      prisma.producao.aggregate({
        where: { cooperadoId: user.cooperadoId, data: { gte: dateStart, lt: dateEnd } },
        _sum: { kg: true },
      }),
      prisma.memoriaRateio.findFirst({
        where: {
          cooperadoId: user.cooperadoId,
          periodo: { competencia: competence, status: "FECHADO" },
        },
        select: { valorTotal: true },
      }),
    ]);
    const monthHours = turnos.reduce((sum, turno) => {
      if (!turno.saida) return sum;
      return sum + (turno.saida.getTime() - turno.inicio.getTime()) / 3_600_000;
    }, 0);
    const productionKg = Number(producao._sum.kg ?? 0);
    const rateioStatus = memoria ? "Fechado" : "Aguardando fechamento";

    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#526b4c]">Área pessoal · {user.name}</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1e2b20]">Meu Painel</h1>
            <p className="mt-2 text-slate-600">Resumo dos seus registros em {monthLabel}.</p>
          </header>
          <section aria-label="Resumo pessoal" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Horas trabalhadas" value={`${monthHours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} h`} detail={monthLabel} icon={Clock3} tone="bg-sky-100 text-sky-700" />
            <MetricCard label="Produção registrada" value={`${productionKg.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`} detail={monthLabel} icon={Boxes} tone="bg-[#e8efe3] text-[#42603c]" />
            <MetricCard label="Situação do rateio" value={rateioStatus} detail={competence} icon={Calculator} tone="bg-amber-100 text-amber-700" />
            <MetricCard label="Valor a receber" value={memoria ? formatMoney(Number(memoria.valorTotal)) : "—"} detail={memoria ? "Rateio fechado" : "Disponível após o fechamento"} icon={WalletCards} tone="bg-violet-100 text-violet-700" />
          </section>
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-[#1e2b20]">Meus registros</h2>
            <div className="max-w-xl">
              <Shortcut href="/meus-registros" title="Consultar meus registros" description="Acesse suas horas, produção e memórias de rateio em uma única tela." icon={UsersRound} />
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (user.profile === "BALANCEIRO") {
    const [cargasRecebidas, cargasPendentes, alertas, turnosAbertos] = await Promise.all([
      prisma.tabelaCargas.count(),
      prisma.tabelaCargas.count({ where: { status: "Recebida" } }),
      prisma.alertaRejeito.count({ where: { ativo: true } }),
      prisma.turno.count({ where: { status: "ABERTO" } }),
    ]);

    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#526b4c]">Operação da cooperativa</p>
            <h1 className="mt-2 text-3xl font-bold text-[#1e2b20]">Painel do Balanceiro</h1>
            <p className="mt-2 text-slate-600">Acompanhamento das atividades operacionais.</p>
          </header>
          <section aria-label="Resumo operacional" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Cargas recebidas" value={String(cargasRecebidas)} detail="Total registrado" icon={Truck} tone="bg-sky-100 text-sky-700" />
            <MetricCard label="Pendentes de pesagem" value={String(cargasPendentes)} detail="Aguardando próxima etapa" icon={Scale} tone="bg-amber-100 text-amber-700" />
            <MetricCard label="Alertas de rejeito" value={String(alertas)} detail="Geradores com alerta ativo" icon={Bell} tone="bg-rose-100 text-rose-700" />
            <MetricCard label="Turnos abertos" value={String(turnosAbertos)} detail="Aguardando registro de saída" icon={Clock3} tone="bg-[#e8efe3] text-[#42603c]" />
          </section>
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-[#1e2b20]">Atalhos operacionais</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Shortcut href="/cargas" title="Registrar cargas" description="Registre recebimento, peso e rejeito." icon={Truck} />
              <Shortcut href="/meus-registros" title="Registros dos cooperados" description="Registre turnos e produção dos cooperados na mesma tela." icon={UsersRound} />
            </div>
          </section>
        </div>
      </main>
    );
  }

  const [cooperadosAtivos, totalCargas, producao, periodo, alertas] = await Promise.all([
    prisma.cadastroCooperados.count({
      where: { situacao: "Ativo", OR: [{ origem: "MANUAL" }, { conta: { isNot: null } }] },
    }),
    prisma.tabelaCargas.count(),
    prisma.producao.aggregate({
      where: { data: { gte: dateStart, lt: dateEnd } },
      _sum: { kg: true },
    }),
    prisma.rateioPeriodo.findUnique({
      where: { competencia: competence },
      select: { status: true, totalRateado: true },
    }),
    prisma.alertaRejeito.count({ where: { ativo: true } }),
  ]);
  const productionKg = Number(producao._sum.kg ?? 0);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#526b4c]">EcoCat · visão geral da cooperativa</p>
          <h1 className="mt-2 text-3xl font-bold text-[#1e2b20]">Dashboard</h1>
          <p className="mt-2 text-slate-600">Resumo geral · {monthLabel}</p>
        </header>
        <section aria-label="Resumo da cooperativa" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Cooperados ativos" value={String(cooperadosAtivos)} detail="Cadastros ativos" icon={UsersRound} tone="bg-sky-100 text-sky-700" />
          <MetricCard label="Cargas registradas" value={String(totalCargas)} detail="Total de cargas" icon={Truck} tone="bg-[#e8efe3] text-[#42603c]" />
          <MetricCard label="Produção mensal" value={`${productionKg.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`} detail={monthLabel} icon={Boxes} tone="bg-amber-100 text-amber-700" />
          <MetricCard label="Situação do rateio" value={periodo?.status === "FECHADO" ? "Fechado" : "Em aberto"} detail={periodo ? formatMoney(Number(periodo.totalRateado)) : competence} icon={Calculator} tone="bg-violet-100 text-violet-700" />
          <MetricCard label="Alertas de rejeito elevado" value={String(alertas)} detail="Geradores com alerta ativo" icon={Bell} tone="bg-rose-100 text-rose-700" />
        </section>
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[#1e2b20]">Acessos rápidos</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Shortcut href="/geradores" title="Geradores" description="Consulte cadastros e alertas de rejeito." icon={Factory} />
            <Shortcut href="/cooperados" title="Cooperados" description="Gerencie os cadastros e consulte os totais mensais." icon={UsersRound} />
            <Shortcut href="/precos" title="Tabela de preços" description="Gerencie os preços dos materiais por competência." icon={Tags} />
            <Shortcut href="/cargas" title="Cargas" description="Acompanhe as cargas e suas etapas." icon={Truck} />
            <Shortcut href="/meus-registros" title="Registros dos cooperados" description="Consulte turnos, horas e produção dos cooperados em uma única tela." icon={Boxes} />
            <Shortcut href="/rateio" title="Rateio mensal" description="Confira a prévia e feche o período." icon={Calculator} />
            <Shortcut href="/relatorios" title="Relatórios" description="Consulte indicadores e resumos mensais." icon={FileBarChart} />
            <Shortcut href="/alertas" title="Alertas de rejeito" description="Acompanhe ocorrências ativas dos geradores." icon={Bell} />
            <Shortcut href="/usuarios" title="Gerenciar acessos" description="Administre perfis e contas do sistema." icon={ShieldCheck} />
          </div>
        </section>
      </div>
    </main>
  );
}
