const SAO_PAULO_OFFSET = "-03:00";

export type TurnoTipoDia = "NORMAL" | "DOMINGO" | "FERIADO";

export function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isValidClockTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function weekdayForDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`).getUTCDay();
}

export function saoPauloDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00${SAO_PAULO_OFFSET}`);
}

export function saoPauloDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function roundedHours(start: Date, end: Date) {
  const minutes = (end.getTime() - start.getTime()) / 60_000;
  return Math.round((minutes / 60) * 100) / 100;
}

export function completedShiftHours(start: Date, end: Date | null) {
  if (!end || end.getTime() <= start.getTime()) return null;
  return roundedHours(start, end);
}

export function calculatePonderedHours(
  actualHours: number,
  tipoDia: TurnoTipoDia,
  isSunday: boolean,
) {
  return actualHours * (isSunday || tipoDia === "DOMINGO" || tipoDia === "FERIADO" ? 2 : 1);
}

export function participatesInProduction(actualHours: number) {
  return actualHours >= 60;
}

export function saoPauloMonthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 3)),
    end: new Date(Date.UTC(year, month, 1, 3)),
  };
}

export function isTurnoTipoDia(value: unknown): value is TurnoTipoDia {
  return value === "NORMAL" || value === "DOMINGO" || value === "FERIADO";
}

export function isSundayDate(value: string) {
  return isValidDateOnly(value) && weekdayForDate(value) === 0;
}
