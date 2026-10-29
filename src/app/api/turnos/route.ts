import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import {
  completedShiftHours,
  isValidClockTime,
  isValidDateOnly,
  isTurnoTipoDia,
  saoPauloDate,
  saoPauloDateTime,
  weekdayForDate,
} from "../../../../lib/turno-rules";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

function serialize(turno: {
  id: number;
  cooperadoId: number;
  inicio: Date;
  saida: Date | null;
  tipoDia: string;
  status: string;
  cooperado?: { nome: string };
}) {
  return {
    ...turno,
    cooperadoNome: turno.cooperado?.nome,
    inicio: turno.inicio.toISOString(),
    saida: turno.saida?.toISOString() ?? null,
    horasTrabalhadas: completedShiftHours(turno.inicio, turno.saida),
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (
    !hasProfile(user, "COOPERADO", "BALANCEIRO", "PRESIDENTE") ||
    (user.profile === "COOPERADO" && !user.cooperadoId)
  ) {
    return NextResponse.json({ error: "Acesso restrito aos registros de turnos." }, { status: 403 });
  }

  const turnos = await prisma.turno.findMany({
    where: user.profile === "COOPERADO" ? { cooperadoId: user.cooperadoId! } : undefined,
    include: { cooperado: { select: { nome: true } } },
    orderBy: { inicio: "desc" },
  });
  return NextResponse.json(turnos.map(serialize));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "BALANCEIRO")) {
    return NextResponse.json({ error: "Somente o Balanceiro pode registrar turnos." }, { status: 403 });
  }

  const body = await readJsonObject(request);
  const cooperadoId = typeof body?.cooperadoId === "number" ? body.cooperadoId : 0;
  const data = typeof body?.data === "string" ? body.data : "";
  const horaEntrada = typeof body?.horaEntrada === "string" ? body.horaEntrada : "";
  const requestedTipoDia = body?.tipoDia;
  if (
    !Number.isSafeInteger(cooperadoId) ||
    cooperadoId <= 0 ||
    !isValidDateOnly(data) ||
    !isValidClockTime(horaEntrada) ||
    !isTurnoTipoDia(requestedTipoDia)
  ) {
    return NextResponse.json(
      { error: "Informe uma data, um horário de entrada e um tipo de dia válidos." },
      { status: 400 },
    );
  }
  const cooperado = await prisma.cadastroCooperados.findUnique({
    where: { idCooperado: cooperadoId },
    select: { idCooperado: true },
  });
  if (!cooperado) return NextResponse.json({ error: "Cooperado não encontrado." }, { status: 404 });
  const tipoDia = weekdayForDate(data) === 0 ? "DOMINGO" : requestedTipoDia;
  if (weekdayForDate(data) !== 0 && tipoDia === "DOMINGO") {
    return NextResponse.json(
      { error: "O tipo Domingo só pode ser usado em uma data que realmente caia no domingo." },
      { status: 400 },
    );
  }
  const periodo = await prisma.rateioPeriodo.findUnique({
    where: { competencia: data.slice(0, 7) },
    select: { status: true },
  });
  if (periodo?.status === "FECHADO") {
    return NextResponse.json({ error: "Não é possível registrar turnos em um período de rateio fechado." }, { status: 409 });
  }

  const aberto = await prisma.turno.findFirst({ where: { cooperadoId, status: "ABERTO" } });
  if (aberto) return NextResponse.json({ error: "Já existe um turno aberto." }, { status: 409 });

  const turno = await prisma.turno.create({
    data: {
      cooperadoId,
      inicio: saoPauloDateTime(data, horaEntrada),
      tipoDia,
    },
    include: { cooperado: { select: { nome: true } } },
  });
  return NextResponse.json(serialize(turno), { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "BALANCEIRO")) {
    return NextResponse.json({ error: "Somente o Balanceiro pode encerrar turnos." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const id = typeof body?.id === "number" ? body.id : 0;
  const horaSaida = typeof body?.horaSaida === "string" ? body.horaSaida : "";
  if (!Number.isSafeInteger(id) || id <= 0 || !isValidClockTime(horaSaida)) {
    return NextResponse.json(
      { error: "Informe um turno e um horário de saída válidos." },
      { status: 400 },
    );
  }
  const turno = await prisma.turno.findUnique({ where: { id } });
  if (!turno) return NextResponse.json({ error: "Turno não encontrado." }, { status: 404 });
  if (turno.status !== "ABERTO") return NextResponse.json({ error: "Este turno já foi encerrado." }, { status: 409 });

  const dataTurno = saoPauloDate(turno.inicio);
  const saida = saoPauloDateTime(dataTurno, horaSaida);
  if (saida.getTime() <= turno.inicio.getTime()) {
    return NextResponse.json(
      { error: "O horário de saída deve ser posterior ao horário de entrada no mesmo dia." },
      { status: 400 },
    );
  }

  const atualizado = await prisma.turno.updateMany({
    where: { id, status: "ABERTO" },
    data: { saida, status: "FECHADO" },
  });
  if (atualizado.count !== 1) {
    return NextResponse.json({ error: "Este turno já foi encerrado." }, { status: 409 });
  }
  const encerrado = await prisma.turno.findUniqueOrThrow({
    where: { id },
    include: { cooperado: { select: { nome: true } } },
  });
  return NextResponse.json(serialize(encerrado));
}
