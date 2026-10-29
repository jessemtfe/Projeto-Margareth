import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import { isValidDateOnly } from "../../../../lib/turno-rules";
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
  const dataValue = typeof body?.data === "string" ? body.data : "";
  if (
    !material ||
    material.length > 50 ||
    !Number.isFinite(kg) ||
    kg <= 0 ||
    kg > 99_999_999.99 ||
    !isValidDateOnly(dataValue)
  ) {
    return NextResponse.json(
      { error: "Informe um material, uma quantidade válida e uma data real no formato AAAA-MM-DD." },
      { status: 400 },
    );
  }
  const periodo = await prisma.rateioPeriodo.findUnique({
    where: { competencia: dataValue.slice(0, 7) },
    select: { status: true },
  });
  if (periodo?.status === "FECHADO") {
    return NextResponse.json({ error: "Não é possível registrar produção em um período de rateio fechado." }, { status: 409 });
  }
  const data = new Date(`${dataValue}T00:00:00.000Z`);
  const producao = await prisma.producao.create({
    data: { cooperadoId: user.cooperadoId, material, kg, data },
  });
  return NextResponse.json({ ...producao, kg: Number(producao.kg) }, { status: 201 });
}
