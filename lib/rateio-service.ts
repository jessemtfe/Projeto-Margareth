import prisma from "./prisma";
import { calculateRateio } from "./rateio-calculation";
import { saoPauloMonthRange } from "./turno-rules";

export const isValidCompetence = (value: string) =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export async function buildRateioCalculation(competencia: string) {
  if (!isValidCompetence(competencia)) {
    throw new Error("Competência inválida. Use AAAA-MM.");
  }
  const [year, month] = competencia.split("-").map(Number);
  const { start, end } = saoPauloMonthRange(year, month);
  const dateStart = new Date(Date.UTC(year, month - 1, 1));
  const dateEnd = new Date(Date.UTC(year, month, 1));
  const [cooperados, turnos, producoes, precos, periodo] = await Promise.all([
    prisma.cadastroCooperados.findMany({
      select: { idCooperado: true, nome: true },
    }),
    prisma.turno.findMany({
      where: {
        OR: [
          { status: "ABERTO" },
          { inicio: { gte: start, lt: end } },
        ],
      },
      select: {
        id: true,
        cooperadoId: true,
        inicio: true,
        saida: true,
        tipoDia: true,
        status: true,
      },
    }),
    prisma.producao.findMany({
      where: { data: { gte: dateStart, lt: dateEnd } },
      select: { id: true, cooperadoId: true, material: true, kg: true, data: true },
    }),
    prisma.tabelaPrecos.findMany({
      where: { mes: competencia },
      select: { material: true, precoPorKg: true, status: true, mes: true },
    }),
    prisma.rateioPeriodo.findUnique({
      where: { competencia },
      select: {
        id: true,
        status: true,
        fechadoEm: true,
        valorDisponivel: true,
        parcelaHorasDisponivel: true,
        parcelaProducaoDisponivel: true,
        bonusTotal: true,
        totalRateado: true,
      },
    }),
  ]);
  const calculation = calculateRateio(
    competencia,
    cooperados.map((item) => ({ id: item.idCooperado, nome: item.nome })),
    turnos,
    producoes,
    precos,
  );
  return { calculation, periodo };
}
