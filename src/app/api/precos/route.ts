import { NextResponse } from "next/server";

import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

const formatarPreco = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor);

const formatPreco = (item: any) => ({
  id: item.idPreco,
  material: item.material,
  preco: formatarPreco(Number(String(item.precoPorKg))),
  mes: item.mes,
  status: item.status,
});

export async function GET() {
  const precos = await prisma.tabelaPrecos.findMany({
    orderBy: { idPreco: "desc" },
  });

  return NextResponse.json(precos.map(formatPreco));
}

export async function POST(request: Request) {
  const body = await request.json();
  const material = String(body.material ?? "").trim();
  const preco = Number(body.preco ?? 0);
  const mes = String(body.mes ?? "Outubro").trim();
  const status = String(body.status ?? "Ativo").trim();

  if (!material || Number.isNaN(preco)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
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
