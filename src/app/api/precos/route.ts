import { NextResponse } from "next/server";

import { getCurrentUser, hasProfile } from "../../../../lib/auth";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const formatarPreco = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor);

type PrecoRecord = {
  idPreco: number;
  material: string;
  precoPorKg: unknown;
  mes: string;
  status: string;
};

const formatPreco = (item: PrecoRecord) => ({
  id: item.idPreco,
  material: item.material,
  preco: formatarPreco(Number(String(item.precoPorKg))),
  mes: item.mes,
  status: item.status,
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "COOPERADO", "BALANCEIRO", "PRESIDENTE")) {
    return NextResponse.json({ error: "Acesso restrito aos preços." }, { status: 403 });
  }

  const precos = await prisma.tabelaPrecos.findMany({
    orderBy: { idPreco: "desc" },
    select: { idPreco: true, material: true, precoPorKg: true, mes: true, status: true },
  });

  if (user.profile === "COOPERADO") {
    const cargas = await prisma.tabelaCargas.findMany({
      select: { material: true },
      orderBy: { idCarga: "desc" },
    });
    const materiais = Array.from(
      new Map(
        [...precos, ...cargas]
          .map((item) => ("material" in item ? item.material : ""))
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => [item.toLowerCase(), item]),
      ).values(),
    );
    return NextResponse.json(materiais);
  }

  return NextResponse.json(precos.map(formatPreco));
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
  const material = String(body.material ?? "").trim();
  const preco = Number(body.preco ?? 0);
  const mes = String(body.mes ?? "Outubro").trim();
  const status = String(body.status ?? "Ativo").trim();

  if (!material || Number.isNaN(preco)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    const periodo = await prisma.rateioPeriodo.findUnique({
      where: { competencia: mes },
      select: { status: true },
    });
    if (periodo?.status === "FECHADO") {
      return NextResponse.json(
        { error: "Os preços do período fechado não podem ser alterados." },
        { status: 409 },
      );
    }
  }

  const registro = await prisma.tabelaPrecos.create({
    data: {
      material,
      precoPorKg: preco,
      mes: mes || "Outubro",
      status: status || "Ativo",
    },
  });

  return NextResponse.json(formatPreco(registro), { status: 201 });
}
