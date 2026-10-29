import { NextResponse } from "next/server";

import { getCurrentUser, hasProfile } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";
import {
  completedShiftHours,
  saoPauloDate,
  saoPauloMonthRange,
  weekdayForDate,
} from "../../../../lib/turno-rules";

export const dynamic = "force-dynamic";

type CooperadoRecord = {
  idCooperado: number;
  nome: string;
  horas: unknown;
  domingo: unknown;
  kgTriados: unknown;
  situacao: string;
};

const formatCooperado = (item: CooperadoRecord) => ({
  id: item.idCooperado,
  nome: item.nome,
  horas: Number(String(item.horas)),
  domingo: Number(String(item.domingo)),
  kg: Number(String(item.kgTriados)),
  situacao: item.situacao,
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (user.profile === "BALANCEIRO") {
    const cooperados = await prisma.cadastroCooperados.findMany({
      select: { idCooperado: true, nome: true },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(cooperados.map((item) => ({
      id: item.idCooperado,
      nome: item.nome,
    })));
  }

  const monthParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(monthParts.find((part) => part.type === "year")?.value);
  const month = Number(monthParts.find((part) => part.type === "month")?.value);
  const { start, end } = saoPauloMonthRange(year, month);
  const productionStart = new Date(Date.UTC(year, month - 1, 1));
  const productionEnd = new Date(Date.UTC(year, month, 1));

  const [cooperados, turnos, producoes] = await Promise.all([
    prisma.cadastroCooperados.findMany({
      where:
        user.profile === "COOPERADO"
          ? { idCooperado: user.cooperadoId ?? -1 }
          : { OR: [{ origem: "MANUAL" }, { conta: { isNot: null } }] },
      orderBy: { idCooperado: "desc" },
    }),
    prisma.turno.findMany({
      where: {
        status: "FECHADO",
        inicio: { gte: start, lt: end },
        ...(user.profile === "COOPERADO"
          ? { cooperadoId: user.cooperadoId ?? -1 }
          : {}),
      },
      select: {
        cooperadoId: true,
        inicio: true,
        saida: true,
        tipoDia: true,
      },
    }),
    prisma.producao.findMany({
      where: {
        data: { gte: productionStart, lt: productionEnd },
        ...(user.profile === "COOPERADO"
          ? { cooperadoId: user.cooperadoId ?? -1 }
          : {}),
      },
      select: { cooperadoId: true, kg: true },
    }),
  ]);

  const totalsByCooperado = new Map<
    number,
    { horas: number; domingo: number; kg: number }
  >();
  for (const cooperado of cooperados) {
    totalsByCooperado.set(cooperado.idCooperado, {
      horas: 0,
      domingo: 0,
      kg: 0,
    });
  }
  for (const turno of turnos) {
    const hours = completedShiftHours(turno.inicio, turno.saida);
    if (hours === null) continue;
    const totals = totalsByCooperado.get(turno.cooperadoId);
    if (!totals) continue;
    totals.horas += hours;
    if (
      turno.tipoDia === "DOMINGO" ||
      weekdayForDate(saoPauloDate(turno.inicio)) === 0
    ) {
      totals.domingo += hours;
    }
  }
  for (const producao of producoes) {
    const totals = totalsByCooperado.get(producao.cooperadoId);
    if (totals) totals.kg += Number(producao.kg);
  }

  return NextResponse.json(cooperados.map((item) => ({
    ...formatCooperado(item),
    ...(totalsByCooperado.get(item.idCooperado) ?? {
      horas: 0,
      domingo: 0,
      kg: 0,
    }),
  })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }

  const body = await request.json();
  const nome = String(body.nome ?? "").trim();
  const situacao = String(body.situacao ?? "Ativo").trim();

  if (!nome) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const cooperado = await prisma.cadastroCooperados.create({
    data: {
      nome,
      horas: 0,
      domingo: 0,
      kgTriados: 0,
      situacao: situacao || "Ativo",
      origem: "MANUAL",
    },
  });

  return NextResponse.json(formatCooperado(cooperado), { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }
  const body = await request.json();
  const id = Number(body.id);
  const nome = String(body.nome ?? "").trim();
  const situacao = String(body.situacao ?? "").trim();
  if (!Number.isSafeInteger(id) || id <= 0 || !nome || !situacao) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const cooperado = await prisma.cadastroCooperados.update({
    where: { idCooperado: id },
    data: { nome, situacao },
  });
  return NextResponse.json(formatCooperado(cooperado));
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Cooperado inválido." }, { status: 400 });
  const conta = await prisma.userAccount.findFirst({ where: { cooperadoId: id }, select: { id: true } });
  if (conta) return NextResponse.json({ error: "Desvincule a conta antes de excluir o cadastro." }, { status: 409 });
  await prisma.cadastroCooperados.delete({ where: { idCooperado: id } });
  return NextResponse.json({ ok: true });
}
