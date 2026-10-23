import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO", "PRESIDENTE") || (user.profile === "COOPERADO" && !user.cooperadoId)) {
    return NextResponse.json({ error: "Acesso restrito aos registros de produção." }, { status: 403 });
  }
  const producoes = await prisma.producao.findMany({
    where: user.profile === "COOPERADO" ? { cooperadoId: user.cooperadoId! } : undefined,
    orderBy: { data: "desc" },
  });
  return NextResponse.json(producoes.map((item) => ({ ...item, kg: Number(item.kg) })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "COOPERADO") || !user.cooperadoId) {
    return NextResponse.json({ error: "Somente o Cooperado pode registrar sua produção." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const material = typeof body?.material === "string" ? body.material.trim() : "";
  const kg = typeof body?.kg === "number" ? body.kg : Number(body?.kg);
  const data = typeof body?.data === "string" ? new Date(body.data) : new Date();
  if (!material || !Number.isFinite(kg) || kg <= 0 || Number.isNaN(data.getTime())) {
    return NextResponse.json({ error: "Informe material, peso válido e data." }, { status: 400 });
  }
  const producao = await prisma.producao.create({
    data: { cooperadoId: user.cooperadoId, material, kg, data },
  });
  return NextResponse.json({ ...producao, kg: Number(producao.kg) }, { status: 201 });
}
