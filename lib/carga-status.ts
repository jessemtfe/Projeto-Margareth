export const cargaStatuses = [
  "Recebida",
  "Pesada",
  "Em triagem",
  "Triada",
  "Vendida",
] as const;

export const rejectedAtIntakeStatus = "Rejeitada na entrada" as const;

export type CargaStatus = (typeof cargaStatuses)[number];

export function nextCargaStatus(status: string): CargaStatus | null {
  const index = cargaStatuses.indexOf(status as CargaStatus);
  return index >= 0 ? cargaStatuses[index + 1] ?? null : null;
}

export function isCargaStatus(value: unknown): value is CargaStatus {
  return typeof value === "string" && cargaStatuses.includes(value as CargaStatus);
}

export function isInitialCargaStatus(
  value: unknown,
): value is "Recebida" | typeof rejectedAtIntakeStatus {
  return value === "Recebida" || value === rejectedAtIntakeStatus;
}
