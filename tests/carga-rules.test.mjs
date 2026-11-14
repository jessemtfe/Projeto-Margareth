import assert from "node:assert/strict";
import test from "node:test";
import {
  getRejectionAlerts,
  isCargaWeightSuspect,
  isWeightOutsideExpectedRange,
  summarizeRejectionPercentages,
} from "../lib/carga-rules.ts";
import {
  cargaStatuses,
  nextCargaStatus,
  rejectedAtIntakeStatus,
} from "../lib/carga-status.ts";

function carga(id, geradorId, rejeito, gerador = `Gerador ${geradorId}`) {
  return { id, gerador, geradorId, rejeito, status: "Recebida" };
}

test("alerts only after the three most recent loads exceed 25 percent", () => {
  const alerts = getRejectionAlerts([
    carga(1, 10, 28),
    carga(2, 10, 32),
    carga(3, 10, 27),
  ]);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].generatorId, 10);
  assert.deepEqual(alerts[0].cargas, [
    { id: 3, rejeito: 27 },
    { id: 2, rejeito: 32 },
    { id: 1, rejeito: 28 },
  ]);
});

test("exactly 25 percent and a clean latest load reset the alert sequence", () => {
  assert.deepEqual(getRejectionAlerts([
    carga(1, 10, 28),
    carga(2, 10, 32),
    carga(3, 10, 25),
  ]), []);
  assert.deepEqual(getRejectionAlerts([
    carga(1, 10, 28),
    carga(2, 10, 32),
    carga(3, 10, 20),
    carga(4, 10, 27),
  ]), []);
});

test("loads from separate generators cannot satisfy the same alert sequence", () => {
  assert.deepEqual(getRejectionAlerts([
    carga(1, 10, 28),
    carga(2, 11, 32),
    carga(3, 10, 27),
  ]), []);
});

test("legacy loads are grouped by normalized generator name", () => {
  const alerts = getRejectionAlerts([
    carga(1, null, 27, "Gerador antigo"),
    carga(2, null, 28, " GERADOR ANTIGO "),
    carga(3, null, 30, "Gerador Antigo"),
  ]);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].generatorId, null);
});

test("flags a likely kilogram-versus-tonne weighing error for confirmation", () => {
  assert.equal(isWeightOutsideExpectedRange(2.5), true);
  assert.equal(isWeightOutsideExpectedRange(10), false);
  assert.equal(isWeightOutsideExpectedRange(2_500), false);
  assert.equal(isCargaWeightSuspect(2.5, false), true);
  assert.equal(isCargaWeightSuspect(2_500, true), true);
});

test("summarizes monthly rejection percentages per generator", () => {
  assert.deepEqual(summarizeRejectionPercentages([
    { geradorId: 10, gerador: "Gerador A", rejeito: 20 },
    { geradorId: 10, gerador: "Gerador A", rejeito: "30.00" },
    { geradorId: 11, gerador: "Gerador B", rejeito: 15 },
  ]), [
    { generatorId: 10, gerador: "Gerador A", cargas: 2, rejeitoMedio: 25 },
    { generatorId: 11, gerador: "Gerador B", cargas: 1, rejeitoMedio: 15 },
  ]);
});

test("charge progression permits only the next step and has no step after sold", () => {
  assert.equal(nextCargaStatus("Recebida"), "Pesada");
  assert.equal(nextCargaStatus("Pesada"), "Em triagem");
  assert.equal(nextCargaStatus("Em triagem"), "Triada");
  assert.equal(nextCargaStatus("Triada"), "Vendida");
  assert.equal(nextCargaStatus("Vendida"), null);
  assert.equal(nextCargaStatus(rejectedAtIntakeStatus), null);
  assert.equal(cargaStatuses.length, 5);
});
