import { NextResponse } from "next/server";

import { getCurrentUser, hasProfile } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

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
    return NextResponse.json({ error: "Acesso restrito aos dados dos cooperados." }, { status: 403 });
  }

  const cooperados = await prisma.cadastroCooperados.findMany({
    where:
      user.profile === "COOPERADO"
        ? { idCooperado: user.cooperadoId ?? -1 }
        : { OR: [{ origem: "MANUAL" }, { conta: { isNot: null } }] },
    orderBy: { idCooperado: "desc" },
  });

  return NextResponse.json(cooperados.map(formatCooperado));
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
  const horas = Number(body.horas ?? 0);
  const domingo = Number(body.domingo ?? 0);
  const kgTriados = Number(body.kg ?? 0);
  const situacao = String(body.situacao ?? "Ativo").trim();

  if (!nome || Number.isNaN(horas) || Number.isNaN(domingo) || Number.isNaN(kgTriados)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const cooperado = await prisma.cadastroCooperados.create({
    data: {
      nome,
      horas,
      domingo,
      kgTriados,
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
  const horas = Number(body.horas);
  const domingo = Number(body.domingo);
  const kgTriados = Number(body.kg);
  const situacao = String(body.situacao ?? "").trim();
  if (!Number.isSafeInteger(id) || id <= 0 || !nome || ![horas, domingo, kgTriados].every(Number.isFinite) || !situacao) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const cooperado = await prisma.cadastroCooperados.update({
    where: { idCooperado: id },
    data: { nome, horas, domingo, kgTriados, situacao },
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
