import { NextResponse } from "next/server";

import { getCurrentUser, hasProfile } from "../../../../lib/auth";
import {
  isCargaStatus,
  isInitialCargaStatus,
  nextCargaStatus,
} from "../../../../lib/carga-status";
import { isWeightOutsideExpectedRange } from "../../../../lib/carga-rules";
import prisma from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

type RequestBody = Record<string, unknown>;

function isRequestBody(value: unknown): value is RequestBody {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readRequestBody(request: Request): Promise<RequestBody | null> {
  let value: unknown;

  try {
    value = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }

  return isRequestBody(value) ? value : null;
}

function formatCarga(carga: {
  idCarga: number;
  geradorId: number | null;
  gerador: string;
  material: string;
  peso: { toString(): string };
  rejeito: { toString(): string };
  pesoSuspeito: boolean;
  status: string;
  data: string;
}) {
  return {
    id: carga.idCarga,
    geradorId: carga.geradorId,
    gerador: carga.gerador,
    material: carga.material,
    peso: Number(carga.peso.toString()),
    rejeito: Number(carga.rejeito.toString()),
    pesoSuspeito: carga.pesoSuspeito,
    status: carga.status,
    data: carga.data,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "BALANCEIRO", "PRESIDENTE")) {
    return NextResponse.json({ error: "Acesso restrito às cargas." }, { status: 403 });
  }

  const cargas = await prisma.tabelaCargas.findMany({
    orderBy: { idCarga: "desc" },
  });

  return NextResponse.json(cargas.map(formatCarga));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "BALANCEIRO", "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }

  const body = await readRequestBody(request);
  const geradorId = body?.geradorId;
  const status = body?.status;
  const material = typeof body?.material === "string" ? body.material.trim() : "";
  const peso = Number(body?.peso);
  const rejeito = Number(body?.rejeito);
  const pesoIncomumConfirmado = body?.pesoIncomumConfirmado === true;
  const data = typeof body?.data === "string" ? body.data.trim() : "";
  const dataValida =
    /^\d{4}-\d{2}-\d{2}$/.test(data) &&
    Number.isFinite(new Date(`${data}T00:00:00.000Z`).getTime()) &&
    new Date(`${data}T00:00:00.000Z`).toISOString().slice(0, 10) === data;

  if (
    typeof geradorId !== "number" ||
    !Number.isSafeInteger(geradorId) ||
    geradorId <= 0 ||
    !isInitialCargaStatus(status) ||
    !material ||
    !dataValida ||
    !Number.isFinite(peso) ||
    peso <= 0 ||
    peso > 99_999_999.99 ||
    !Number.isFinite(rejeito) ||
    rejeito < 0 ||
    rejeito > 100
  ) {
    return NextResponse.json(
      { error: "Informe um gerador, material, data, peso e rejeito válidos." },
      { status: 400 },
    );
  }

  if (isWeightOutsideExpectedRange(peso) && !pesoIncomumConfirmado) {
    return NextResponse.json(
      {
        error:
          "Confira a pesagem: o valor informado está fora do intervalo esperado de 1 kg a 10.000 kg.",
        requiresWeightConfirmation: true,
      },
      { status: 409 },
    );
  }

  const [gerador, precoAtivo] = await Promise.all([
    prisma.cadastroGeradores.findUnique({
      where: { idGerador: geradorId },
      select: { gerador: true },
    }),
    prisma.tabelaPrecos.findFirst({
      where: { material, status: "Ativo" },
      select: { idPreco: true },
    }),
  ]);

  if (!gerador) {
    return NextResponse.json({ error: "Selecione um gerador cadastrado." }, { status: 400 });
  }

  if (!precoAtivo) {
    return NextResponse.json(
      { error: "Selecione um material que tenha preço ativo cadastrado." },
      { status: 400 },
    );
  }

  const carga = await prisma.tabelaCargas.create({
    data: {
      gerador: gerador.gerador,
      cadastroGerador: { connect: { idGerador: geradorId } },
      material,
      peso,
      rejeito,
      status,
      data,
      pesoSuspeito: isWeightOutsideExpectedRange(peso),
    },
  });

  if (geradorId) {
    const recentes = await prisma.tabelaCargas.findMany({
      where: { geradorId },
      orderBy: { idCarga: "desc" },
      take: 3,
      select: { idCarga: true, rejeito: true },
    });
    const idsRecentes = recentes.map((item) => item.idCarga);
    const alertaAtivo = await prisma.alertaRejeito.findFirst({
      where: { geradorId, ativo: true },
      orderBy: { criadoEm: "desc" },
    });
    await prisma.alertaRejeito.updateMany({
      where: { geradorId, ativo: true },
      data: { ativo: false },
    });
    if (
      recentes.length === 3 &&
      recentes.every((item) => Number(item.rejeito) > 25)
    ) {
      const mesmaSequencia =
        alertaAtivo &&
        JSON.stringify(alertaAtivo.cargas) === JSON.stringify(idsRecentes);
      if (!mesmaSequencia) {
        await prisma.alertaRejeito.create({
          data: { geradorId, cargas: idsRecentes, ativo: true },
        });
      }
    }
  }

  return NextResponse.json(formatCarga(carga), { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "BALANCEIRO", "PRESIDENTE")) {
    return NextResponse.json({ error: "Permissão de edição necessária." }, { status: 403 });
  }

  const body = await readRequestBody(request);
  const id = body?.id;
  const requestedStatus = body?.status;

  if (
    typeof id !== "number" ||
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !isCargaStatus(requestedStatus)
  ) {
    return NextResponse.json(
      { error: "Informe uma carga e uma etapa válidas." },
      { status: 400 },
    );
  }

  const currentCarga = await prisma.tabelaCargas.findUnique({
    where: { idCarga: id },
  });

  if (!currentCarga) {
    return NextResponse.json({ error: "Carga não encontrada." }, { status: 404 });
  }

  if (nextCargaStatus(currentCarga.status) !== requestedStatus) {
    return NextResponse.json(
      { error: "A carga só pode avançar para a próxima etapa do fluxo." },
      { status: 409 },
    );
  }

  const updated = await prisma.tabelaCargas.updateMany({
    where: { idCarga: id, status: currentCarga.status },
    data: { status: requestedStatus },
  });

  if (updated.count !== 1) {
    return NextResponse.json(
      { error: "A etapa da carga foi alterada. Atualize a lista e tente novamente." },
      { status: 409 },
    );
  }

  const carga = await prisma.tabelaCargas.findUniqueOrThrow({
    where: { idCarga: id },
  });

  return NextResponse.json(formatCarga(carga));
}
