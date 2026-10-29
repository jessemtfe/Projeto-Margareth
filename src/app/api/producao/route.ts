import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile, readJsonObject } from "../../../../lib/auth";
import { isValidDateOnly } from "../../../../lib/turno-rules";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (
    !hasProfile(user, "COOPERADO", "BALANCEIRO", "PRESIDENTE") ||
    (user.profile === "COOPERADO" && !user.cooperadoId)
  ) {
    return NextResponse.json({ error: "Acesso restrito aos registros de produção." }, { status: 403 });
  }
  const producoes = await prisma.producao.findMany({
    where: user.profile === "COOPERADO" ? { cooperadoId: user.cooperadoId! } : undefined,
    include: { cooperado: { select: { nome: true } } },
    orderBy: { data: "desc" },
  });
  return NextResponse.json(producoes.map((item) => ({
    ...item,
    cooperadoNome: item.cooperado.nome,
    kg: Number(item.kg),
  })));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  if (!hasProfile(user, "BALANCEIRO")) {
    return NextResponse.json({ error: "Somente o Balanceiro pode registrar produção." }, { status: 403 });
  }
  const body = await readJsonObject(request);
  const cooperadoId = typeof body?.cooperadoId === "number" ? body.cooperadoId : 0;
  const material = typeof body?.material === "string" ? body.material.trim() : "";
  const kg = typeof body?.kg === "number" ? body.kg : Number(body?.kg);
  const dataValue = typeof body?.data === "string" ? body.data : "";
  if (
    !Number.isSafeInteger(cooperadoId) ||
    cooperadoId <= 0 ||
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
  const cooperado = await prisma.cadastroCooperados.findUnique({
    where: { idCooperado: cooperadoId },
    select: { idCooperado: true },
  });
  if (!cooperado) return NextResponse.json({ error: "Cooperado não encontrado." }, { status: 404 });
  const periodo = await prisma.rateioPeriodo.findUnique({
    where: { competencia: dataValue.slice(0, 7) },
    select: { status: true },
  });
  if (periodo?.status === "FECHADO") {
    return NextResponse.json({ error: "Não é possível registrar produção em um período de rateio fechado." }, { status: 409 });
  }
  const data = new Date(`${dataValue}T00:00:00.000Z`);
  const producao = await prisma.producao.create({
    data: { cooperadoId, material, kg, data },
    include: { cooperado: { select: { nome: true } } },
  });
  return NextResponse.json({
    ...producao,
    cooperadoNome: producao.cooperado.nome,
    kg: Number(producao.kg),
  }, { status: 201 });
}
