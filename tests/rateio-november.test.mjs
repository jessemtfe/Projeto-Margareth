import assert from "node:assert/strict";
import test from "node:test";
import { calculateRateio } from "../lib/rateio-calculation.ts";

function shift(cooperadoId, id, date, hours, tipoDia = "NORMAL") {
  const start = new Date(`${date}T08:00:00-03:00`);
  const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
  return { id, cooperadoId, inicio: start, saida: end, tipoDia, status: "FECHADO" };
}

function normalShifts(cooperadoId, firstId) {
  return ["03", "04", "05", "06", "07", "09", "10", "11"].map(
    (day, index) =>
      shift(cooperadoId, firstId + index, `2026-11-${day}`, 8),
  );
}

test("specifies the monetary impact of Sunday and holiday weighting in November", () => {
  const cooperados = [
    { id: 1, nome: "Trabalhou domingo" },
    { id: 2, nome: "Trabalhou feriado" },
    { id: 3, nome: "Dias normais" },
  ];
  const turnos = [
    ...normalShifts(1, 100),
    shift(1, 200, "2026-11-15", 8),
    ...normalShifts(2, 300),
    shift(2, 400, "2026-11-20", 8, "FERIADO"),
    ...normalShifts(3, 500),
  ];
  const producoes = cooperados.map((cooperado, index) => ({
    id: index + 1,
    cooperadoId: cooperado.id,
    material: "Papelão",
    kg: 8,
    data: new Date("2026-11-20T00:00:00Z"),
  }));
  const result = calculateRateio("2026-11", cooperados, turnos, producoes, [
    { material: "Papelão", precoPorKg: 10, status: "Ativo", mes: "2026-11" },
  ]);
  const [sunday, holiday, normal] = result.linhas;

  assert.equal(sunday.horasReais, 72);
  assert.equal(sunday.horasPonderadas, 80);
  assert.equal(sunday.horasDobras, 8);
  assert.equal(sunday.impactoDobraHoras, 1.32);
  assert.equal(holiday.horasReais, 72);
  assert.equal(holiday.horasPonderadas, 80);
  assert.equal(holiday.horasDobras, 8);
  assert.equal(holiday.impactoDobraHoras, 1.32);
  assert.equal(normal.horasReais, 64);
  assert.equal(normal.horasPonderadas, 64);
  assert.equal(normal.horasDobras, 0);
  assert.equal(normal.impactoDobraHoras, -2.64);
  assert.equal(
    result.linhas.reduce((total, line) => total + line.impactoDobraHoras, 0),
    0,
  );
  assert.deepEqual(result.issues, []);
});
