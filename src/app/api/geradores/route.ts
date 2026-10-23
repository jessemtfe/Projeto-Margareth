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
  cargas?: Array<{
    idCarga: number;
    gerador: string;
    geradorId: number | null;
    rejeito: unknown;
    status: string;
    data: string;
  }>;
};

function formatGerador(item: GeradorRecord) {
  const historico = (item.cargas ?? [])
    .sort((a, b) => b.idCarga - a.idCarga)
    .map((carga) => ({
      id: carga.idCarga,
      rejeito: Number(String(carga.rejeito)),
      status: carga.status,
      data: carga.data,
    }));
  const ultimas = historico.slice(0, 3);
  const alertaAtual =
    ultimas.length === 3 &&
    ultimas.every((carga) => carga.rejeito > 25);

  return {
    id: item.idGerador,
    nome: item.gerador,
    tipo: item.tipo,
    rejeito: null,
    status: alertaAtual ? "Alertado" : "Normal",
    ultimaColeta: item.ultimaColeta ? new Date(item.ultimaColeta).toISOString() : new Date().toISOString(),
    resumo: {
      totalCargas: historico.length,
      ultimaRejeito: historico[0]?.rejeito ?? null,
      sequenciaAtual: alertaAtual ? 3 : ultimas.filter((carga) => carga.rejeito > 25).length,
      alertaAtual,
      historico,
    },
  };
}

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
    include: {
      cargas: {
        select: { idCarga: true, gerador: true, geradorId: true, rejeito: true, status: true, data: true },
        orderBy: { idCarga: "desc" },
      },
    },
  });

  return NextResponse.json(
    geradores.map(formatGerador),
  );
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
  if (!nome) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const gerador = await prisma.cadastroGeradores.create({
    data: {
      gerador: nome,
      tipo,
      rejeito: 0,
      ultimaColeta: new Date(),
      statu: status || "Normal",
    },
  });

  return NextResponse.json(formatGerador(gerador), { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }
  const body = await request.json();
  const id = Number(body.id);
  const nome = String(body.nome ?? "").trim();
  const tipo = String(body.tipo ?? "").trim();
  if (!Number.isSafeInteger(id) || id <= 0 || !nome || !tipo) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  const gerador = await prisma.cadastroGeradores.update({
    where: { idGerador: id },
    data: { gerador: nome, tipo, ultimaColeta: new Date() },
  });
  return NextResponse.json(formatGerador(gerador));
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || !hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Gerador inválido." }, { status: 400 });
  const cargas = await prisma.tabelaCargas.count({ where: { geradorId: id } });
  if (cargas) return NextResponse.json({ error: "Não é possível excluir um gerador com cargas registradas." }, { status: 409 });
  await prisma.cadastroGeradores.delete({ where: { idGerador: id } });
  return NextResponse.json({ ok: true });
}
