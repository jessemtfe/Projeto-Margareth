import { NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const formatCooperado = (item: any) => ({
  id: item.idCooperado,
  nome: item.nome,
  horas: Number(String(item.horas)),
  domingo: Number(String(item.domingo)),
  kg: Number(String(item.kgTriados)),
  situacao: item.situacao,
});

export async function GET() {
  const cooperados = await prisma.cadastroCooperados.findMany({
    orderBy: { idCooperado: "desc" },
  });

  return NextResponse.json(cooperados.map(formatCooperado));
}

export async function POST(request: Request) {
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
    },
  });

  return NextResponse.json(formatCooperado(cooperado), { status: 201 });
}
