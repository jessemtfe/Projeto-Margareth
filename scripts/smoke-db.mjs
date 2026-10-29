import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("Set DATABASE_URL in the environment before running the database smoke test.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  await prisma.$queryRaw`SELECT 1`;
  const [
    geradores,
    cooperados,
    precos,
    cargas,
    turnos,
    turnosAbertos,
    turnosFechadosSemSaida,
    producoes,
    periodos,
  ] =
    await Promise.all([
      prisma.cadastroGeradores.count(),
      prisma.cadastroCooperados.count(),
      prisma.tabelaPrecos.count(),
      prisma.tabelaCargas.count(),
      prisma.turno.count(),
      prisma.turno.count({ where: { status: "ABERTO" } }),
      prisma.turno.count({ where: { status: "FECHADO", saida: null } }),
      prisma.producao.count(),
      prisma.rateioPeriodo.count(),
    ]);

  console.log(JSON.stringify({
    database: "connected",
    counts: {
      geradores,
      cooperados,
      precos,
      cargas,
      turnos,
      turnosAbertos,
      turnosFechadosSemSaida,
      producoes,
      periodos,
    },
  }));
} catch {
  console.error("Database smoke test failed. Check the connection, network access, and schema readiness.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
