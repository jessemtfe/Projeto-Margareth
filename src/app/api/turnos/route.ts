import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

function serialize(turno: { id: number; cooperadoId: number; inicio: Date; saida: Date | null; status: string }) {
  return { ...turno, inicio: turno.inicio.toISOString(), saida: turno.saida?.toISOString() ?? null };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO", "PRESIDENTE") || (user.profile === "COOPERADO" && !user.cooperadoId)) {
    return NextResponse.json({ error: "Acesso restrito aos registros de turnos." }, { status: 403 });
  }

  const turnos = await prisma.turno.findMany({
    where: user.profile === "COOPERADO" ? { cooperadoId: user.cooperadoId! } : undefined,
    orderBy: { inicio: "desc" },
  });
  return NextResponse.json(turnos.map(serialize));
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO") || !user.cooperadoId) {
    return NextResponse.json({ error: "Somente um Cooperado vinculado pode iniciar um turno." }, { status: 403 });
  }

  const aberto = await prisma.turno.findFirst({ where: { cooperadoId: user.cooperadoId, status: "ABERTO" } });
  if (aberto) return NextResponse.json({ error: "Já existe um turno aberto." }, { status: 409 });

  const turno = await prisma.turno.create({ data: { cooperadoId: user.cooperadoId, inicio: new Date() } });
  return NextResponse.json(serialize(turno), { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO") || !user.cooperadoId) {
    return NextResponse.json({ error: "Somente o Cooperado pode encerrar seu turno." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const id = typeof body?.id === "number" ? body.id : 0;
  const turno = await prisma.turno.findFirst({ where: { id, cooperadoId: user.cooperadoId } });
  if (!turno) return NextResponse.json({ error: "Turno não encontrado." }, { status: 404 });
  if (turno.status !== "ABERTO") return NextResponse.json({ error: "Este turno já foi encerrado." }, { status: 409 });

  const encerrado = await prisma.turno.update({
    where: { id },
    data: { saida: new Date(), status: "FECHADO" },
  });
  return NextResponse.json(serialize(encerrado));
}
