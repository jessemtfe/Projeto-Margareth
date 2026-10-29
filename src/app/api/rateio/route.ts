import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import {
  calculatePonderedHours,
  isTurnoTipoDia,
  participatesInProduction,
  roundedHours,
  saoPauloDate,
  saoPauloMonthRange,
  weekdayForDate,
} from "../../../../lib/turno-rules";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const competence = (value: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO", "PRESIDENTE") || (user.profile === "COOPERADO" && !user.cooperadoId)) {
    return NextResponse.json({ error: "Acesso restrito às memórias de cálculo." }, { status: 403 });
  }
  const period = new URL(request.url).searchParams.get("competencia") ?? undefined;
  const memorias = await prisma.memoriaRateio.findMany({
    where: {
      periodo: period ? { competencia: period } : undefined,
      ...(user.profile === "COOPERADO" ? { cooperadoId: user.cooperadoId! } : {}),
    },
    include: { periodo: true },
    orderBy: { periodo: { competencia: "desc" } },
  });
  return NextResponse.json(memorias.map((item) => ({
    ...item,
    horas: Number(item.horas),
    kgTriados: Number(item.kgTriados),
    valorHoras: Number(item.valorHoras),
    valorProducao: Number(item.valorProducao),
    valorTotal: Number(item.valorTotal),
  })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Somente a Presidente pode fechar o rateio." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const competencia = typeof body?.competencia === "string" ? body.competencia : "";
  if (!competence(competencia)) return NextResponse.json({ error: "Competência inválida. Use AAAA-MM." }, { status: 400 });

  const [year, month] = competencia.split("-").map(Number);
  const { start: inicio, end: fim } = saoPauloMonthRange(year, month);
  const inicioData = new Date(Date.UTC(year, month - 1, 1));
  const fimData = new Date(Date.UTC(year, month, 1));
  const turnoAberto = await prisma.turno.findFirst({
    where: { status: "ABERTO", inicio: { gte: inicio, lt: fim } },
  });
  if (turnoAberto) return NextResponse.json({ error: "Não é possível fechar enquanto houver turno aberto." }, { status: 409 });

  const periodo = await prisma.rateioPeriodo.upsert({
    where: { competencia },
    create: { competencia },
    update: {},
  });
  if (periodo.status === "FECHADO") return NextResponse.json({ error: "Este período já está fechado." }, { status: 409 });

  const [cooperados, precos] = await Promise.all([
    prisma.cadastroCooperados.findMany({ select: { idCooperado: true } }),
    prisma.tabelaPrecos.findMany({ where: { status: "Ativo", mes: competencia } }),
  ]);
  const precoPorMaterial = new Map(precos.map((preco) => [preco.material.toLowerCase(), Number(preco.precoPorKg)]));
  const producoes = await prisma.producao.findMany({
    where: { data: { gte: inicioData, lt: fimData } },
  });
  const turnos = await prisma.turno.findMany({
    where: { inicio: { gte: inicio, lt: fim }, status: "FECHADO", saida: { not: null } },
  });
  const memoriaData = cooperados.map((cooperado) => {
    const turnosCooperado = turnos.filter((turno) => turno.cooperadoId === cooperado.idCooperado);
    const horasReais = turnosCooperado.reduce(
      (total, turno) => total + roundedHours(turno.inicio, turno.saida!),
      0,
    );
    const horasPonderadas = turnosCooperado.reduce((total, turno) => {
      const domingo = weekdayForDate(saoPauloDate(turno.inicio)) === 0;
      const tipoDia = domingo
        ? "DOMINGO"
        : isTurnoTipoDia(turno.tipoDia)
          ? turno.tipoDia
          : "NORMAL";
      const duracao = roundedHours(turno.inicio, turno.saida!);
      return total + calculatePonderedHours(duracao, tipoDia, domingo);
    }, 0);
    const horas = Math.round(horasPonderadas * 100) / 100;
    const registros = producoes.filter((item) => item.cooperadoId === cooperado.idCooperado);
    const kgTriados = registros.reduce((total, item) => total + Number(item.kg), 0);
    const participaProducao = participatesInProduction(horasReais);
    const valorProducao = participaProducao
      ? registros.reduce(
          (total, item) =>
            total + Number(item.kg) * (precoPorMaterial.get(item.material.toLowerCase()) ?? 0),
          0,
        )
      : 0;
    return {
      periodoId: periodo.id,
      cooperadoId: cooperado.idCooperado,
      horas,
      kgTriados,
      valorHoras: 0,
      valorProducao,
      valorTotal: valorProducao,
      detalhes: {
        regra: "Horas de domingos e feriados ponderadas em dobro. Produção incluída somente com 60 horas reais ou mais. Fórmula monetária da parcela por horas ainda não definida.",
        horasReais: Math.round(horasReais * 100) / 100,
        horasPonderadas: horas,
        participaProducao,
      },
    };
  });
  await prisma.$transaction([
    prisma.memoriaRateio.deleteMany({ where: { periodoId: periodo.id } }),
    ...memoriaData.map((data) => prisma.memoriaRateio.create({ data })),
    prisma.rateioPeriodo.update({ where: { id: periodo.id }, data: { status: "FECHADO", fechadoEm: new Date(), fechadoPorId: user.id } }),
  ]);
  return NextResponse.json({ competencia, status: "FECHADO", registros: memoriaData.length });
}
