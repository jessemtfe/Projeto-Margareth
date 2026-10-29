import { NextResponse } from "next/server";
import { getCurrentUser, hasProfile } from "../../../../../lib/auth";
import { buildRateioCalculation, isValidCompetence } from "../../../../../lib/rateio-service";
import prisma from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }
  if (!hasProfile(user, "PRESIDENTE")) {
    return NextResponse.json({ error: "Acesso restrito ao fechamento do rateio." }, { status: 403 });
  }
  const competencia = new URL(request.url).searchParams.get("competencia") ?? "";
  if (!isValidCompetence(competencia)) {
    return NextResponse.json({ error: "Competência inválida. Use AAAA-MM." }, { status: 400 });
  }

  const { calculation, periodo } = await buildRateioCalculation(competencia);
  const periodosFechados = await prisma.rateioPeriodo.findMany({
    where: { status: "FECHADO" },
    select: { competencia: true, totalRateado: true, fechadoEm: true },
    orderBy: { competencia: "desc" },
  });
  if (periodo?.status === "FECHADO" && periodo.id) {
    const memorias = await prisma.memoriaRateio.findMany({
      where: { periodoId: periodo.id },
      include: { cooperado: { select: { nome: true } } },
      orderBy: { nomeCooperado: "asc" },
    });
    const linhas = memorias.map((item) => {
      const details = item.detalhes as {
        horasReais?: number;
        participaProducao?: boolean;
        valorProduzido?: number;
        materiais?: Array<{ material: string; kg: number; precoPorKg: number; valorProduzido: number }>;
      } | null;
      return {
        cooperadoId: item.cooperadoId,
        nomeCooperado: item.nomeCooperado || item.cooperado.nome,
        horasReais: Number(item.horasReais) || Number(details?.horasReais ?? 0),
        horasPonderadas: Number(item.horas),
        kgTriados: Number(item.kgTriados),
        valorProduzido: Number(details?.valorProduzido ?? 0),
        valorHoras: Number(item.valorHoras),
        valorProducao: Number(item.valorProducao),
        bonus: Number(item.bonus),
        valorTotal: Number(item.valorTotal),
        participaProducao: details?.participaProducao ?? false,
        detalhes: {
          regra: "Valores registrados e preservados no fechamento mensal.",
          participaProducao: details?.participaProducao ?? false,
          bonusElegivel: Number(item.bonus) > 0,
          materiais: details?.materiais ?? [],
        },
      };
    });
    const productionByMaterial = new Map<string, { material: string; kg: number; precoPorKg: number; valorProduzido: number }>();
    for (const line of linhas) {
      for (const item of line.detalhes.materiais) {
        const existing = productionByMaterial.get(item.material) ?? {
          material: item.material,
          kg: 0,
          precoPorKg: item.precoPorKg,
          valorProduzido: 0,
        };
        existing.kg += item.kg;
        existing.valorProduzido += item.valorProduzido;
        productionByMaterial.set(item.material, existing);
      }
    }
    return NextResponse.json({
      competencia,
      status: periodo.status,
      fechadoEm: periodo.fechadoEm?.toISOString() ?? null,
      valorDisponivel: Number(periodo.valorDisponivel),
      parcelaHorasDisponivel: Number(periodo.parcelaHorasDisponivel),
      parcelaProducaoDisponivel: Number(periodo.parcelaProducaoDisponivel),
      bonusTotal: Number(periodo.bonusTotal),
      totalRateado: Number(periodo.totalRateado),
      periodosFechados: periodosFechados.map((item) => ({
        competencia: item.competencia,
        totalRateado: Number(item.totalRateado),
        fechadoEm: item.fechadoEm?.toISOString() ?? null,
      })),
      issues: [],
      openShiftCount: 0,
      linhas,
      producaoPorMaterial: Array.from(productionByMaterial.values()),
    });
  }
  return NextResponse.json({
    ...calculation,
    periodosFechados: periodosFechados.map((item) => ({
      competencia: item.competencia,
      totalRateado: Number(item.totalRateado),
      fechadoEm: item.fechadoEm?.toISOString() ?? null,
    })),
  });
}
