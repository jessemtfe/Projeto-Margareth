import {
  calculatePonderedHours,
  isTurnoTipoDia,
  participatesInProduction,
  roundedHours,
  saoPauloDate,
  saoPauloMonthRange,
  weekdayForDate,
} from "./turno-rules.ts";

type DecimalValue = number | string | { toString(): string };

export type RateioCooperado = { id: number; nome: string };
export type RateioTurno = {
  id: number;
  cooperadoId: number;
  inicio: Date;
  saida: Date | null;
  tipoDia: string;
  status: string;
};
export type RateioProducao = {
  id: number;
  cooperadoId: number;
  material: string;
  kg: DecimalValue;
  data: Date;
};
export type RateioPreco = {
  material: string;
  precoPorKg: DecimalValue;
  status: string;
  mes: string;
};

export type RateioIssue = {
  type:
    | "turno_aberto"
    | "turno_invalido"
    | "preco_ausente"
    | "preco_duplicado"
    | "sem_horas_ponderadas"
    | "sem_producao_elegivel";
  message: string;
  cooperadoId?: number;
  cooperado?: string;
  turnoId?: number;
  producaoId?: number;
  material?: string;
};

export type RateioLine = {
  cooperadoId: number;
  nomeCooperado: string;
  horasReais: number;
  horasPonderadas: number;
  kgTriados: number;
  valorProduzido: number;
  valorHoras: number;
  valorProducao: number;
  bonus: number;
  valorTotal: number;
  participaProducao: boolean;
  detalhes: {
    regra: string;
    participaProducao: boolean;
    bonusElegivel: boolean;
    materiais: Array<{ material: string; kg: number; precoPorKg: number; valorProduzido: number }>;
  };
};

export type RateioCalculation = {
  competencia: string;
  status: "PREVIA";
  valorDisponivel: number;
  parcelaHorasDisponivel: number;
  parcelaProducaoDisponivel: number;
  bonusTotal: number;
  totalRateado: number;
  issues: RateioIssue[];
  openShiftCount: number;
  linhas: RateioLine[];
  producaoPorMaterial: Array<{ material: string; kg: number; precoPorKg: number; valorProduzido: number }>;
};

const asNumber = (value: DecimalValue) => Number(value.toString());
const materialKey = (value: string) => value.trim().toLocaleLowerCase("pt-BR");
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const money = (value: number) => cents(value) / 100;

function allocateCents(totalCents: number, weights: Array<{ id: number; weight: number }>) {
  const positive = weights.filter((item) => Number.isFinite(item.weight) && item.weight > 0);
  const result = new Map<number, number>();
  for (const item of weights) result.set(item.id, 0);
  const totalWeight = positive.reduce((sum, item) => sum + item.weight, 0);
  if (totalCents <= 0 || totalWeight <= 0) return result;

  const fractions = positive.map((item) => {
    const exact = totalCents * item.weight / totalWeight;
    const allocated = Math.floor(exact);
    result.set(item.id, allocated);
    return { id: item.id, fraction: exact - allocated };
  });
  const remainder = totalCents - Array.from(result.values()).reduce((sum, amount) => sum + amount, 0);
  fractions.sort((a, b) => b.fraction - a.fraction || a.id - b.id);
  for (let index = 0; index < remainder; index += 1) {
    const item = fractions[index % fractions.length];
    result.set(item.id, (result.get(item.id) ?? 0) + 1);
  }
  return result;
}

export function calculateRateio(
  competencia: string,
  cooperados: RateioCooperado[],
  turnos: RateioTurno[],
  producoes: RateioProducao[],
  precos: RateioPreco[],
): RateioCalculation {
  const [year, month] = competencia.split("-").map(Number);
  const { start, end } = saoPauloMonthRange(year, month);
  const dateStart = new Date(Date.UTC(year, month - 1, 1));
  const dateEnd = new Date(Date.UTC(year, month, 1));
  const issues: RateioIssue[] = [];
  const names = new Map(cooperados.map((item) => [item.id, item.nome]));
  const monthlyShifts = turnos.filter((item) => item.inicio >= start && item.inicio < end);
  const openShifts = turnos.filter((item) => item.status === "ABERTO");
  for (const shift of openShifts) {
    issues.push({
      type: "turno_aberto",
      message: `Turno ${shift.id} de ${names.get(shift.cooperadoId) ?? "cooperado desconhecido"} continua aberto; nenhum fechamento pode ocorrer enquanto houver turno aberto.`,
      cooperadoId: shift.cooperadoId,
      cooperado: names.get(shift.cooperadoId),
      turnoId: shift.id,
    });
  }

  const validShifts: RateioTurno[] = [];
  for (const shift of monthlyShifts) {
    if (shift.status === "ABERTO") continue;
    const isSunday = weekdayForDate(saoPauloDate(shift.inicio)) === 0;
    if (
      !shift.saida ||
      shift.saida.getTime() <= shift.inicio.getTime() ||
      saoPauloDate(shift.saida) !== saoPauloDate(shift.inicio) ||
      !isTurnoTipoDia(shift.tipoDia) ||
      (shift.tipoDia === "DOMINGO" && !isSunday)
    ) {
      issues.push({
        type: "turno_invalido",
        message: `Turno ${shift.id} de ${names.get(shift.cooperadoId) ?? "cooperado desconhecido"} tem horários inválidos e não pode compor o rateio.`,
        cooperadoId: shift.cooperadoId,
        cooperado: names.get(shift.cooperadoId),
        turnoId: shift.id,
      });
      continue;
    }
    validShifts.push(shift);
  }

  const activePrices = new Map<string, RateioPreco[]>();
  for (const price of precos.filter((item) => item.mes === competencia && item.status === "Ativo")) {
    const key = materialKey(price.material);
    activePrices.set(key, [...(activePrices.get(key) ?? []), price]);
  }
  for (const [key, items] of activePrices) {
    if (items.length > 1) {
      issues.push({
        type: "preco_duplicado",
        message: `Há mais de um preço ativo para ${items[0].material} em ${competencia}.`,
        material: key,
      });
    }
  }

  const monthlyProductions = producoes.filter((item) => item.data >= dateStart && item.data < dateEnd);
  const pricedProduction = new Map<number, number>();
  const kgByCooperado = new Map<number, number>();
  const materialSummary = new Map<string, { material: string; kg: number; precoPorKg: number; valorProduzido: number }>();
  const materialDetails = new Map<number, Map<string, { material: string; kg: number; precoPorKg: number; valorProduzido: number }>>();
  for (const item of monthlyProductions) {
    const kg = asNumber(item.kg);
    kgByCooperado.set(item.cooperadoId, (kgByCooperado.get(item.cooperadoId) ?? 0) + kg);
    const key = materialKey(item.material);
    const matches = activePrices.get(key) ?? [];
    if (matches.length !== 1) {
      if (matches.length === 0) {
        issues.push({
          type: "preco_ausente",
          message: `Produção ${item.id} (${item.material}) de ${names.get(item.cooperadoId) ?? "cooperado desconhecido"} não tem preço ativo em ${competencia}.`,
          cooperadoId: item.cooperadoId,
          cooperado: names.get(item.cooperadoId),
          producaoId: item.id,
          material: item.material,
        });
      }
      continue;
    }
    const precoPorKg = asNumber(matches[0].precoPorKg);
    const amount = kg * precoPorKg;
    pricedProduction.set(item.cooperadoId, (pricedProduction.get(item.cooperadoId) ?? 0) + amount);
    const summary = materialSummary.get(key) ?? { material: item.material, kg: 0, precoPorKg, valorProduzido: 0 };
    summary.kg += kg;
    summary.valorProduzido += amount;
    materialSummary.set(key, summary);
    const coopDetails = materialDetails.get(item.cooperadoId) ?? new Map();
    const detail = coopDetails.get(key) ?? { material: item.material, kg: 0, precoPorKg, valorProduzido: 0 };
    detail.kg += kg;
    detail.valorProduzido += amount;
    coopDetails.set(key, detail);
    materialDetails.set(item.cooperadoId, coopDetails);
  }

  const hoursActual = new Map<number, number>();
  const hoursWeighted = new Map<number, number>();
  for (const shift of validShifts) {
    const actual = roundedHours(shift.inicio, shift.saida!);
    const isSunday = weekdayForDate(saoPauloDate(shift.inicio)) === 0;
    const dayType = isSunday
      ? "DOMINGO"
      : isTurnoTipoDia(shift.tipoDia)
        ? shift.tipoDia
        : "NORMAL";
    hoursActual.set(shift.cooperadoId, (hoursActual.get(shift.cooperadoId) ?? 0) + actual);
    hoursWeighted.set(
      shift.cooperadoId,
      (hoursWeighted.get(shift.cooperadoId) ?? 0) + calculatePonderedHours(actual, dayType, isSunday),
    );
  }

  const linesBase = cooperados.map((cooperado) => {
    const actual = money(hoursActual.get(cooperado.id) ?? 0);
    const weighted = money(hoursWeighted.get(cooperado.id) ?? 0);
    const eligible = participatesInProduction(actual);
    const producedValue = money(pricedProduction.get(cooperado.id) ?? 0);
    const details = Array.from(materialDetails.get(cooperado.id)?.values() ?? []);
    return {
      cooperadoId: cooperado.id,
      nomeCooperado: cooperado.nome,
      horasReais: actual,
      horasPonderadas: weighted,
      kgTriados: money(kgByCooperado.get(cooperado.id) ?? 0),
      valorProduzido: producedValue,
      participates: eligible,
      bonusElegivel: actual > 180,
      materials: details.map((item) => ({
        ...item,
        kg: money(item.kg),
        precoPorKg: money(item.precoPorKg),
        valorProduzido: money(item.valorProduzido),
      })),
    };
  });

  const totalAvailableCents = cents(
    Array.from(pricedProduction.values()).reduce((sum, value) => sum + value, 0),
  );
  const hoursPoolCents = Math.floor(totalAvailableCents / 2);
  const productionPoolCents = totalAvailableCents - hoursPoolCents;
  const totalWeightedHours = linesBase.reduce((sum, line) => sum + line.horasPonderadas, 0);
  const eligibleProductionValue = linesBase.reduce(
    (sum, line) => sum + (line.participates ? line.valorProduzido : 0),
    0,
  );
  if (hoursPoolCents > 0 && totalWeightedHours <= 0) {
    issues.push({
      type: "sem_horas_ponderadas",
      message: "Há valor disponível para a parcela de horas, mas não existem horas válidas para distribuí-la.",
    });
  }
  if (productionPoolCents > 0 && eligibleProductionValue <= 0) {
    issues.push({
      type: "sem_producao_elegivel",
      message: "Há valor disponível para a parcela de produção, mas não existe produção com preço para cooperados elegíveis (60 horas reais ou mais).",
    });
  }
  const hoursAllocation = allocateCents(
    hoursPoolCents,
    linesBase.map((line) => ({ id: line.cooperadoId, weight: line.horasPonderadas })),
  );
  const productionAllocation = allocateCents(
    productionPoolCents,
    linesBase
      .filter((line) => line.participates)
      .map((line) => ({ id: line.cooperadoId, weight: line.valorProduzido })),
  );

  const linhas: RateioLine[] = linesBase.map((line) => {
    const valorHoras = (hoursAllocation.get(line.cooperadoId) ?? 0) / 100;
    const valorProducao = (productionAllocation.get(line.cooperadoId) ?? 0) / 100;
    const bonus = line.bonusElegivel ? money(valorProducao * 0.1) : 0;
    const valorTotal = money(valorHoras + valorProducao + bonus);
    return {
      cooperadoId: line.cooperadoId,
      nomeCooperado: line.nomeCooperado,
      horasReais: line.horasReais,
      horasPonderadas: line.horasPonderadas,
      kgTriados: line.kgTriados,
      valorProduzido: line.valorProduzido,
      valorHoras,
      valorProducao,
      bonus,
      valorTotal,
      participaProducao: line.participates,
      detalhes: {
        regra: "Fundo mensal pela produção avaliada aos preços ativos do mês; 50% horas e 50% produção. Domingo/feriado dobra apenas horas de rateio. Bônus de 10% da parcela individual de produção para mais de 180 horas reais, adicional ao fundo.",
        participaProducao: line.participates,
        bonusElegivel: line.bonusElegivel,
        materiais: line.materials,
      },
    };
  });

  return {
    competencia,
    status: "PREVIA",
    valorDisponivel: totalAvailableCents / 100,
    parcelaHorasDisponivel: hoursPoolCents / 100,
    parcelaProducaoDisponivel: productionPoolCents / 100,
    bonusTotal: money(linhas.reduce((total, item) => total + item.bonus, 0)),
    totalRateado: money(linhas.reduce((total, item) => total + item.valorTotal, 0)),
    issues,
    openShiftCount: openShifts.length,
    linhas,
    producaoPorMaterial: Array.from(materialSummary.values())
      .map((item) => ({
        material: item.material,
        kg: money(item.kg),
        precoPorKg: money(item.precoPorKg),
        valorProduzido: money(item.valorProduzido),
      }))
      .sort((a, b) => a.material.localeCompare(b.material, "pt-BR")),
  };
}

export function rateioIssuesBlockClosing(issues: RateioIssue[]) {
  return issues.length > 0;
}
