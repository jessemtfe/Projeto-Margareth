import Link from "next/link";
import {
  ArrowUpRight,
  Factory,
  FileText,
  Recycle,
  Scale,
  Tags,
  UsersRound,
} from "lucide-react";
import prisma from "../../lib/prisma";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    title: "Cadastro de geradores",
    description: "Acompanhe os geradores e os materiais recebidos.",
    href: "/geradores",
    icon: Factory,
    iconClass: "bg-[#e8efe3] text-[#42603c]",
  },
  {
    title: "Cadastro de cooperados",
    description: "Consulte cadastros, horas e produção informada.",
    href: "/cooperados",
    icon: UsersRound,
    iconClass: "bg-sky-100 text-sky-700",
  },
  {
    title: "Tabela de preços",
    description: "Veja materiais e valores registrados para cada mês.",
    href: "/precos",
    icon: Tags,
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    title: "Entrada de carga",
    description: "Registre gerador, material, pesagem e rejeito e acompanhe as etapas até a venda.",
    href: "/cargas",
    icon: Scale,
    iconClass: "bg-sky-100 text-sky-700",
  },
];

export default async function HomePage() {
  let databaseAvailable = true;
  let totalCooperados = 0;
  let cooperadosAtivos = 0;
  let totalGeradores = 0;
  let geradoresNormais = 0;
  let totalKgTriados = 0;
  let totalCargas = 0;
  let cargasEmAndamento = 0;
  let ultimoCooperado: { idCooperado: number; nome: string } | null = null;
  let ultimoGerador: { idGerador: number; gerador: string } | null = null;
  let ultimoPreco: { idPreco: number; material: string; mes: string } | null = null;

  try {
    const cooperadoVisibility = {
      OR: [{ origem: "MANUAL" }, { conta: { isNot: null } }],
    };
    const [
      cooperadosCount,
      cooperadosAtivosCount,
      geradoresCount,
      geradoresNormaisCount,
      producao,
      cargasCount,
      cargasEmAndamentoCount,
      cooperadoRecente,
      geradorRecente,
      precoRecente,
    ] = await Promise.all([
      prisma.cadastroCooperados.count({ where: cooperadoVisibility }),
      prisma.cadastroCooperados.count({
        where: { ...cooperadoVisibility, situacao: "Ativo" },
      }),
      prisma.cadastroGeradores.count(),
      prisma.cadastroGeradores.count({ where: { statu: "Normal" } }),
      prisma.cadastroCooperados.aggregate({
        where: cooperadoVisibility,
        _sum: { kgTriados: true },
      }),
      prisma.tabelaCargas.count(),
      prisma.tabelaCargas.count({
        where: { status: { notIn: ["Vendida", "Rejeitada na entrada"] } },
      }),
      prisma.cadastroCooperados.findFirst({
        orderBy: { idCooperado: "desc" },
        select: { idCooperado: true, nome: true },
      }),
      prisma.cadastroGeradores.findFirst({
        orderBy: { idGerador: "desc" },
        select: { idGerador: true, gerador: true },
      }),
      prisma.tabelaPrecos.findFirst({
        orderBy: { idPreco: "desc" },
        select: { idPreco: true, material: true, mes: true },
      }),
    ]);

    totalCooperados = cooperadosCount;
    cooperadosAtivos = cooperadosAtivosCount;
    totalGeradores = geradoresCount;
    geradoresNormais = geradoresNormaisCount;
    totalKgTriados = Number(producao._sum.kgTriados ?? 0);
    totalCargas = cargasCount;
    cargasEmAndamento = cargasEmAndamentoCount;
    ultimoCooperado = cooperadoRecente;
    ultimoGerador = geradorRecente;
    ultimoPreco = precoRecente;
  } catch {
    databaseAvailable = false;
  }

  const toneladasTriadas = totalKgTriados / 1000;
  const producaoFormatada = `${toneladasTriadas.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} t`;

  const metrics = [
    {
      label: "Cooperados cadastrados",
      value: databaseAvailable ? String(cooperadosAtivos) : "—",
      detail: databaseAvailable ? `de ${totalCooperados} cadastrados` : "Banco indisponível",
      icon: UsersRound,
      iconClass: "bg-sky-100 text-sky-700",
    },
    {
      label: "Geradores cadastrados",
      value: databaseAvailable ? String(totalGeradores) : "—",
      detail: databaseAvailable ? `${geradoresNormais} em situação normal` : "Banco indisponível",
      icon: Factory,
      iconClass: "bg-[#e8efe3] text-[#42603c]",
    },
    {
      label: "Material triado",
      value: databaseAvailable ? producaoFormatada : "—",
      detail: databaseAvailable ? "Soma dos kg informados nos cadastros" : "Banco indisponível",
      icon: Recycle,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Cargas em andamento",
      value: databaseAvailable ? String(cargasEmAndamento) : "—",
      detail: databaseAvailable ? `${totalCargas} cargas registradas no total` : "Banco indisponível",
      icon: Scale,
      iconClass: "bg-sky-100 text-sky-700",
    },
  ];

  const activities = [
    ...(ultimoGerador
      ? [
          {
            id: `gerador-${ultimoGerador.idGerador}`,
            title: "Registro mais recente de gerador",
            detail: ultimoGerador.gerador,
            category: "Geradores",
            icon: Factory,
            tone: "bg-[#e8efe3] text-[#42603c]",
          },
        ]
      : []),
    ...(ultimoCooperado
      ? [
          {
            id: `cooperado-${ultimoCooperado.idCooperado}`,
            title: "Registro mais recente de cooperado",
            detail: ultimoCooperado.nome,
            category: "Cooperados",
            icon: UsersRound,
            tone: "bg-sky-100 text-sky-700",
          },
        ]
      : []),
    ...(ultimoPreco
      ? [
          {
            id: `preco-${ultimoPreco.idPreco}`,
            title: "Preço mais recente cadastrado",
            detail: `${ultimoPreco.material} · ${ultimoPreco.mes}`,
            category: "Preços",
            icon: Tags,
            tone: "bg-amber-100 text-amber-700",
          },
        ]
      : []),
  ];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#526b4c]">
              EcoCat · operação da cooperativa
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#1e2b20]">Visão geral</h1>
          </div>
          <p className="text-sm text-slate-500">Resumo dos dados cadastrados</p>
        </header>

        <section aria-label="Indicadores da cooperativa" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ label, value, detail, icon: Icon, iconClass }) => (
            <article key={label} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-600">{label}</p>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-[#1e2b20]">{value}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{detail}</p>
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${iconClass}`}>
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <section aria-labelledby="quick-links-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="quick-links-title" className="text-base font-semibold text-[#1e2b20]">Acessos rápidos</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {quickLinks.map(({ title, description, href, icon: Icon, iconClass }) => (
                <Link
                  key={title}
                  href={href}
                  className="group flex min-h-40 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#9caf91] hover:bg-[#fbfcfa]"
                >
                  <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-md ${iconClass}`}>
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <h3 className="text-sm font-semibold text-[#1e2b20]">{title}</h3>
                  <p className="mt-1 flex-1 text-xs leading-5 text-slate-500">{description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#42603c]">
                    Abrir tela
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section id="relatorios" aria-labelledby="recent-activity-title" className="scroll-mt-20 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h2 id="recent-activity-title" className="text-base font-semibold text-[#1e2b20]">Atividades recentes</h2>
                <p className="mt-1 text-xs text-slate-500">Últimos registros por módulo</p>
              </div>
              <FileText aria-hidden="true" className="h-4 w-4 text-slate-400" />
            </div>

            {!databaseAvailable ? (
              <p className="py-8 text-center text-sm text-slate-500">Não foi possível consultar o banco de dados.</p>
            ) : activities.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {activities.map(({ id, title, detail, category, icon: Icon, tone }) => (
                  <li key={id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${tone}`}>
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-700">{title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{detail}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{category}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Ainda não há registros para exibir.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
