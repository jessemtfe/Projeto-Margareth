import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import { rateioIssuesBlockClosing } from "../../../../lib/rateio-calculation";
import { buildRateioCalculation, isValidCompetence } from "../../../../lib/rateio-service";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO", "PRESIDENTE") || (user.profile === "COOPERADO" && !user.cooperadoId)) {
    return NextResponse.json({ error: "Acesso restrito às memórias de cálculo." }, { status: 403 });
  }
  const competencia = new URL(request.url).searchParams.get("competencia") ?? undefined;
  if (competencia && !isValidCompetence(competencia)) {
    return NextResponse.json({ error: "Competência inválida. Use AAAA-MM." }, { status: 400 });
  }
  const memorias = await prisma.memoriaRateio.findMany({
    where: {
      periodo: competencia ? { competencia } : { status: "FECHADO" },
      ...(user.profile === "COOPERADO" ? { cooperadoId: user.cooperadoId! } : {}),
    },
    include: { periodo: true, cooperado: { select: { nome: true } } },
    orderBy: { periodo: { competencia: "desc" } },
  });
  return NextResponse.json(memorias.map((item) => {
    const details = item.detalhes as { horasReais?: number } | null;
    return {
      id: item.id,
      periodo: item.periodo,
      cooperadoId: item.cooperadoId,
      nomeCooperado: item.nomeCooperado || item.cooperado.nome,
      horasReais: Number(item.horasReais) || Number(details?.horasReais ?? 0),
      horas: Number(item.horas),
      kgTriados: Number(item.kgTriados),
      valorHoras: Number(item.valorHoras),
      valorProducao: Number(item.valorProducao),
      bonus: Number(item.bonus),
      valorTotal: Number(item.valorTotal),
      detalhes: item.detalhes,
    };
  }));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Somente a Presidente pode fechar o rateio." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const competencia = typeof body?.competencia === "string" ? body.competencia : "";
  if (!isValidCompetence(competencia)) {
    return NextResponse.json({ error: "Competência inválida. Use AAAA-MM." }, { status: 400 });
  }

  const { calculation } = await buildRateioCalculation(competencia);
  if (calculation.openShiftCount > 0) {
    return NextResponse.json({
      error: "Não é possível fechar enquanto existir algum turno aberto.",
      issues: calculation.issues,
    }, { status: 409 });
  }
  if (rateioIssuesBlockClosing(calculation.issues)) {
    return NextResponse.json({
      error: "Corrija as inconsistências da prévia antes de fechar o rateio.",
      issues: calculation.issues,
    }, { status: 409 });
  }

  const fechadoEm = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.rateioPeriodo.findUnique({ where: { competencia } });
      if (current?.status === "FECHADO") {
        throw new Error("RATEIO_JA_FECHADO");
      }
      const openShift = await tx.turno.findFirst({ where: { status: "ABERTO" }, select: { id: true } });
      if (openShift) throw new Error("TURNO_ABERTO");
      const periodo = await tx.rateioPeriodo.upsert({
        where: { competencia },
        create: {
          competencia,
          valorDisponivel: calculation.valorDisponivel,
          parcelaHorasDisponivel: calculation.parcelaHorasDisponivel,
          parcelaProducaoDisponivel: calculation.parcelaProducaoDisponivel,
          bonusTotal: calculation.bonusTotal,
          totalRateado: calculation.totalRateado,
        },
        update: {
          status: "FECHADO",
          fechadoEm,
          fechadoPorId: user.id,
          valorDisponivel: calculation.valorDisponivel,
          parcelaHorasDisponivel: calculation.parcelaHorasDisponivel,
          parcelaProducaoDisponivel: calculation.parcelaProducaoDisponivel,
          bonusTotal: calculation.bonusTotal,
          totalRateado: calculation.totalRateado,
        },
      });
      await tx.memoriaRateio.deleteMany({ where: { periodoId: periodo.id } });
      await tx.memoriaRateio.createMany({
        data: calculation.linhas.map((line) => ({
          periodoId: periodo.id,
          cooperadoId: line.cooperadoId,
          nomeCooperado: line.nomeCooperado,
          horasReais: line.horasReais,
          horas: line.horasPonderadas,
          kgTriados: line.kgTriados,
          valorHoras: line.valorHoras,
          valorProducao: line.valorProducao,
          bonus: line.bonus,
          valorTotal: line.valorTotal,
          detalhes: {
            ...line.detalhes,
            valorProduzido: line.valorProduzido,
          },
        })),
      });
      await tx.rateioPeriodo.update({
        where: { id: periodo.id },
        data: { status: "FECHADO", fechadoEm, fechadoPorId: user.id },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RATEIO_JA_FECHADO") {
      return NextResponse.json({ error: "Este período já está fechado." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "TURNO_ABERTO") {
      return NextResponse.json({ error: "Não é possível fechar enquanto existir algum turno aberto." }, { status: 409 });
    }
    throw error;
  }
  return NextResponse.json({
    competencia,
    status: "FECHADO",
    registros: calculation.linhas.length,
    valorDisponivel: calculation.valorDisponivel,
    parcelaHorasDisponivel: calculation.parcelaHorasDisponivel,
    parcelaProducaoDisponivel: calculation.parcelaProducaoDisponivel,
    bonusTotal: calculation.bonusTotal,
    totalRateado: calculation.totalRateado,
  });
}
