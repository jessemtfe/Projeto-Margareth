import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePonderedHours,
  completedShiftHours,
  isValidClockTime,
  isValidDateOnly,
  participatesInProduction,
  roundedHours,
  saoPauloDateTime,
  weekdayForDate,
} from "../lib/turno-rules.ts";

test("validates calendar dates and shift times", () => {
  assert.equal(isValidDateOnly("2026-10-29"), true);
  assert.equal(isValidDateOnly("2026-02-30"), false);
  assert.equal(isValidClockTime("08:05"), true);
  assert.equal(isValidClockTime("24:00"), false);
});

test("calculates a valid same-day shift duration", () => {
  const entrada = saoPauloDateTime("2026-10-28", "08:00");
  const saida = saoPauloDateTime("2026-10-28", "16:30");
  assert.equal(roundedHours(entrada, saida), 8.5);
  assert.equal(completedShiftHours(entrada, saida), 8.5);
  assert.ok(saida > entrada);
});

test("open shifts have no computed hours", () => {
  assert.equal(completedShiftHours(saoPauloDateTime("2026-10-28", "08:00"), null), null);
});

test("rejects an exit time before or equal to entry", () => {
  const entrada = saoPauloDateTime("2026-10-28", "08:00");
  assert.ok(saoPauloDateTime("2026-10-28", "07:59") <= entrada);
  assert.ok(saoPauloDateTime("2026-10-28", "08:00") <= entrada);
});

test("identifies Sunday using the shift date", () => {
  assert.equal(weekdayForDate("2026-10-25"), 0);
  assert.equal(weekdayForDate("2026-10-26"), 1);
});

test("doubles Sunday and holiday hours but not normal hours", () => {
  assert.equal(calculatePonderedHours(8, "NORMAL", false), 8);
  assert.equal(calculatePonderedHours(8, "DOMINGO", true), 16);
  assert.equal(calculatePonderedHours(8, "FERIADO", false), 16);
});

test("production participation starts at exactly 60 actual hours", () => {
  assert.equal(participatesInProduction(59.99), false);
  assert.equal(participatesInProduction(60), true);
  assert.equal(participatesInProduction(60.01), true);
});
