// lib/excelUtils.ts
// Helpers de bajo nivel compartidos por lib/parseExcel.ts (hoja BASE_MAESTRA)
// y lib/parseMezcla.ts (hoja DATOS_MEZCLA), para no duplicar la lógica de
// lectura de celdas de Excel entre ambos parsers.

import * as XLSX from "xlsx";

export function normalizeHeader(raw: string): string {
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[%\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Excel guarda los porcentajes como fracción (106.9% se guarda como 1.069) y
 * solo aplica el símbolo "%" como formato visual de la celda. Si se lee el
 * valor crudo sin considerar esto, "106.9%" se convierte en "1.069%" en
 * pantalla.
 *
 * Estrategia:
 * 1. Si la celda tiene texto formateado con "%" (ej. "106.90%"), se usa ese
 *    número directamente: ya viene en escala de porcentaje.
 * 2. Si el formato numérico de la celda (z) es de tipo porcentaje, el valor
 *    crudo es una fracción → se multiplica por 100.
 * 3. Si no hay info de formato pero el número es muy pequeño (<= 5), es casi
 *    seguro una fracción escrita a mano (ej. 0.95) → se multiplica por 100.
 * 4. En cualquier otro caso, el número ya está en escala de porcentaje.
 */
export function readPercentCell(sheet: XLSX.WorkSheet, row: number, col: number): number | null {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[addr];
  if (!cell || cell.v === undefined || cell.v === "") return null;

  if (typeof cell.w === "string" && cell.w.includes("%")) {
    const n = Number(cell.w.replace("%", "").replace(",", ".").trim());
    if (Number.isFinite(n)) return n;
  }

  const raw = typeof cell.v === "number" ? cell.v : toNumber(cell.v);
  if (raw === null) return null;

  const isPercentFormat = typeof cell.z === "string" && cell.z.includes("%");
  if (isPercentFormat) return raw * 100;
  if (Math.abs(raw) <= 5) return raw * 100;
  return raw;
}

/** Lee el valor crudo de una celda por fila/columna (0-indexed), como texto. */
export function readCellText(sheet: XLSX.WorkSheet, row: number, col: number): string {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = sheet[addr];
  if (!cell || cell.v === undefined) return "";
  return String(cell.v).trim();
}
