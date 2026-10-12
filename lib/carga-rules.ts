export const MIN_EXPECTED_CARGA_WEIGHT_KG = 1;
export const MAX_EXPECTED_CARGA_WEIGHT_KG = 10_000;
export const REJECTION_ALERT_THRESHOLD_PERCENT = 25;
export const REJECTION_ALERT_CONSECUTIVE_LOADS = 3;

export type CargaRuleRecord = {
  id: number;
  gerador: string;
  geradorId: number | null;
  rejeito: number;
  status: string;
};

export type RejectionAlert = {
  generatorId: number | null;
  gerador: string;
  cargas: Array<{ id: number; rejeito: number }>;
};

export function isWeightOutsideExpectedRange(weightKg: number) {
  return (
    weightKg < MIN_EXPECTED_CARGA_WEIGHT_KG ||
    weightKg > MAX_EXPECTED_CARGA_WEIGHT_KG
  );
}

export function getRejectionAlerts(cargas: CargaRuleRecord[]): RejectionAlert[] {
  const groupedCargas = new Map<string, CargaRuleRecord[]>();

  for (const carga of cargas) {
    const key =
      carga.geradorId === null
        ? `legacy:${carga.gerador.trim().toLocaleLowerCase("pt-BR")}`
        : `generator:${carga.geradorId}`;
    const group = groupedCargas.get(key) ?? [];
    group.push(carga);
    groupedCargas.set(key, group);
  }

  const alerts: RejectionAlert[] = [];

  for (const group of groupedCargas.values()) {
    const latestCargas = group
      .sort((a, b) => b.id - a.id)
      .slice(0, REJECTION_ALERT_CONSECUTIVE_LOADS);

    if (
      latestCargas.length === REJECTION_ALERT_CONSECUTIVE_LOADS &&
      latestCargas.every(
        (carga) => carga.rejeito > REJECTION_ALERT_THRESHOLD_PERCENT,
      )
    ) {
      alerts.push({
        generatorId: latestCargas[0].geradorId,
        gerador: latestCargas[0].gerador,
        cargas: latestCargas.map(({ id, rejeito }) => ({ id, rejeito })),
      });
    }
  }

  return alerts.sort((a, b) => a.gerador.localeCompare(b.gerador, "pt-BR"));
}
