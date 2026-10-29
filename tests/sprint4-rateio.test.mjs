import assert from "node:assert/strict";
import test from "node:test";
import { calculateRateio, rateioIssuesBlockClosing } from "../lib/rateio-calculation.ts";

function shift(cooperadoId, id, date, hours, tipoDia = "NORMAL") {
  const start = new Date(`${date}T08:00:00-03:00`);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  return { id, cooperadoId, inicio: start, saida: end, tipoDia, status: "FECHADO" };
}

function shiftsForHours(cooperadoId, totalHours, idStart) {
  const shifts = [];
  let remaining = totalHours;
  while (remaining > 0) {
    const hours = Math.min(8, remaining);
    shifts.push(shift(cooperadoId, idStart + shifts.length, "2026-10-26", hours));
    remaining -= hours;
  }
  return shifts;
}

test("splits the monthly fund 50/50 and applies the 60/180 hour thresholds", () => {
  const cooperados = [
    { id: 1, nome: "Abaixo de 60" },
    { id: 2, nome: "Exatamente 60" },
    { id: 3, nome: "Exatamente 180" },
    { id: 4, nome: "Acima de 180" },
  ];
  const turnos = [
    ...shiftsForHours(1, 59, 100),
    ...shiftsForHours(2, 60, 200),
    ...shiftsForHours(3, 180, 300),
    ...shiftsForHours(4, 181, 400),
  ];
  const producoes = [
    { id: 1, cooperadoId: 1, material: "Papelão", kg: 5, data: new Date("2026-10-20T00:00:00Z") },
    { id: 2, cooperadoId: 2, material: "Papelão", kg: 5, data: new Date("2026-10-20T00:00:00Z") },
    { id: 3, cooperadoId: 2, material: "Plástico PET", kg: 2.5, data: new Date("2026-10-20T00:00:00Z") },
    { id: 4, cooperadoId: 3, material: "Alumínio", kg: 5, data: new Date("2026-10-20T00:00:00Z") },
    { id: 5, cooperadoId: 4, material: "Papelão", kg: 4, data: new Date("2026-10-20T00:00:00Z") },
    { id: 6, cooperadoId: 4, material: "Plástico PET", kg: 3, data: new Date("2026-10-20T00:00:00Z") },
  ];
  const result = calculateRateio("2026-10", cooperados, turnos, producoes, [
    { material: "Papelão", precoPorKg: 10, status: "Ativo", mes: "2026-10" },
    { material: "Plástico PET", precoPorKg: 20, status: "Ativo", mes: "2026-10" },
    { material: "Alumínio", precoPorKg: 20, status: "Ativo", mes: "2026-10" },
  ]);
  const [under, at60, at180, over180] = result.linhas;

  assert.equal(result.valorDisponivel, 350);
  assert.equal(result.parcelaHorasDisponivel, 175);
  assert.equal(result.parcelaProducaoDisponivel, 175);
  assert.equal(under.participaProducao, false);
  assert.equal(under.valorProducao, 0);
  assert.equal(at60.participaProducao, true);
  assert.equal(at180.bonus, 0);
  assert.equal(over180.bonus, 5.83);
  assert.equal(result.bonusTotal, 5.83);
  assert.equal(result.totalRateado, 355.83);
  const pricesByMaterial = new Map(result.producaoPorMaterial.map((item) => [item.material, item.precoPorKg]));
  assert.equal(pricesByMaterial.get("Papelão"), 10);
  assert.equal(pricesByMaterial.get("Plástico PET"), 20);
  assert.equal(pricesByMaterial.get("Alumínio"), 20);
  assert.equal(at60.detalhes.materiais.length, 2);
  assert.deepEqual(result.issues, []);
});

test("doubles Sunday and holiday hours for the hours allocation", () => {
  const result = calculateRateio("2026-10", [
    { id: 1, nome: "Domingo" },
    { id: 2, nome: "Feriado" },
  ], [
    shift(1, 1, "2026-10-25", 8),
    shift(2, 2, "2026-10-26", 8, "FERIADO"),
  ], [], []);

  assert.equal(result.linhas[0].horasReais, 8);
  assert.equal(result.linhas[0].horasPonderadas, 16);
  assert.equal(result.linhas[1].horasReais, 8);
  assert.equal(result.linhas[1].horasPonderadas, 16);
  assert.deepEqual(result.issues, []);
});

test("reports open shifts and production without a unique active price", () => {
  const result = calculateRateio("2026-10", [{ id: 1, nome: "Cooperado" }], [
    { id: 1, cooperadoId: 1, inicio: new Date("2026-10-26T11:00:00Z"), saida: null, tipoDia: "NORMAL", status: "ABERTO" },
  ], [
    { id: 1, cooperadoId: 1, material: "Vidro", kg: 4, data: new Date("2026-10-20T00:00:00Z") },
  ], []);

  assert.equal(result.openShiftCount, 1);
  assert.ok(result.issues.some((issue) => issue.type === "turno_aberto"));
  assert.ok(result.issues.some((issue) => issue.type === "preco_ausente"));
  assert.equal(rateioIssuesBlockClosing(result.issues), true);
});

test("blocks invalid same-day shift records from monthly calculation", () => {
  const result = calculateRateio("2026-10", [{ id: 1, nome: "Cooperado" }], [
    {
      id: 1,
      cooperadoId: 1,
      inicio: new Date("2026-10-26T11:00:00Z"),
      saida: new Date("2026-10-27T11:00:00Z"),
      tipoDia: "NORMAL",
      status: "FECHADO",
    },
  ], [], []);

  assert.ok(result.issues.some((issue) => issue.type === "turno_invalido"));
  assert.equal(result.linhas[0].horasReais, 0);
});

test("rejects duplicated active prices instead of choosing one arbitrarily", () => {
  const result = calculateRateio("2026-10", [{ id: 1, nome: "Cooperado" }], [], [
    { id: 1, cooperadoId: 1, material: "Papelão", kg: 4, data: new Date("2026-10-20T00:00:00Z") },
  ], [
    { material: "Papelão", precoPorKg: 1, status: "Ativo", mes: "2026-10" },
    { material: " papelão ", precoPorKg: 2, status: "Ativo", mes: "2026-10" },
  ]);

  assert.ok(result.issues.some((issue) => issue.type === "preco_duplicado"));
  assert.equal(result.valorDisponivel, 0);
});

test("allocates every cent deterministically", () => {
  const result = calculateRateio("2026-10", [
    { id: 3, nome: "C" },
    { id: 2, nome: "B" },
    { id: 1, nome: "A" },
  ], [
    shift(1, 1, "2026-10-26", 1),
    shift(2, 2, "2026-10-26", 1),
    shift(3, 3, "2026-10-26", 1),
  ], [
    { id: 1, cooperadoId: 1, material: "Papel", kg: 0.01, data: new Date("2026-10-20T00:00:00Z") },
    { id: 2, cooperadoId: 2, material: "Papel", kg: 0.01, data: new Date("2026-10-20T00:00:00Z") },
    { id: 3, cooperadoId: 3, material: "Papel", kg: 0.01, data: new Date("2026-10-20T00:00:00Z") },
  ], [{ material: "Papel", precoPorKg: 1, status: "Ativo", mes: "2026-10" }]);
  const amounts = new Map(result.linhas.map((line) => [line.cooperadoId, line.valorHoras]));
  assert.equal(result.valorDisponivel, 0.03);
  assert.equal(result.parcelaHorasDisponivel, 0.01);
  assert.equal(amounts.get(1), 0.01);
  assert.equal(amounts.get(2), 0);
  assert.equal(amounts.get(3), 0);
});
