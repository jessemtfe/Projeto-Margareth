import { NextResponse } from "next/server";

import { getCurrentUser, hasProfile } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

type GeradorRecord = {
  idGerador: number;
  gerador: string;
  tipo: string;
  rejeito: unknown;
  statu: string | null;
  ultimaColeta: Date | null;
};

const formatGerador = (item: GeradorRecord) => ({
  id: item.idGerador,
  nome: item.gerador,
  tipo: item.tipo,
  rejeito: `${Number(String(item.rejeito)).toFixed(2)}%`,
  status: item.statu ?? "Normal",
  ultimaColeta: item.ultimaColeta ? new Date(item.ultimaColeta).toISOString() : new Date().toISOString(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "BALANCEIRO", "PRESIDENTE")) {
    return NextResponse.json({ error: "Acesso restrito aos geradores." }, { status: 403 });
  }

  const geradores = await prisma.cadastroGeradores.findMany({
    orderBy: { idGerador: "desc" },
  });

  return NextResponse.json(geradores.map(formatGerador));
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
  const tipo = String(body.tipo ?? "Residencial").trim();
  const rejeito = Number(body.rejeito ?? 0);
  const status = String(body.status ?? "Normal").trim();

  if (!nome || Number.isNaN(rejeito)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const gerador = await prisma.cadastroGeradores.create({
    data: {
      gerador: nome,
      tipo,
      rejeito,
      ultimaColeta: new Date(),
      statu: status || "Normal",
    },
  });

  return NextResponse.json(formatGerador(gerador), { status: 201 });
}
