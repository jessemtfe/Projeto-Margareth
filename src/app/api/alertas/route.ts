import { NextResponse } from "next/server";

import { getCurrentUser, hasProfile } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !hasProfile(user, "PRESIDENTE", "BALANCEIRO")) {
    return NextResponse.json({ error: "Acesso restrito aos alertas." }, { status: 403 });
  }
  const alertas = await prisma.alertaRejeito.findMany({
    orderBy: { criadoEm: "desc" },
    include: { gerador: { select: { gerador: true, tipo: true } } },
  });
  return NextResponse.json(alertas.map((alerta) => ({
    id: alerta.id,
    geradorId: alerta.geradorId,
    gerador: alerta.gerador.gerador,
    tipo: alerta.gerador.tipo,
    cargas: alerta.cargas,
    ativo: alerta.ativo,
    lido: alerta.lido,
    criadoEm: alerta.criadoEm.toISOString(),
  })));
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasProfile(user, "PRESIDENTE", "BALANCEIRO")) {
    return NextResponse.json({ error: "Acesso restrito aos alertas." }, { status: 403 });
  }
  const body = await request.json() as { id?: unknown; lido?: unknown };
  const id = Number(body.id);
  if (!Number.isSafeInteger(id) || typeof body.lido !== "boolean") {
    return NextResponse.json({ error: "Alerta inválido." }, { status: 400 });
  }
  const alerta = await prisma.alertaRejeito.update({
    where: { id },
    data: { lido: body.lido },
    include: { gerador: { select: { gerador: true, tipo: true } } },
  });
  return NextResponse.json({ id: alerta.id, gerador: alerta.gerador.gerador, ativo: alerta.ativo, lido: alerta.lido });
}
