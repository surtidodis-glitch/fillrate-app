// lib/parseExcel.ts
// Parseo 100% en el navegador. No hay llamada a ningún backend: el File
// que suelta el usuario se lee con ArrayBuffer y se procesa con SheetJS.

import * as XLSX from "xlsx";
import type { FillRateRow, ParseResult, ParseIssue, Clasificacion } from "./types";

const REQUIRED_SHEET = "BASE_MAESTRA";
const IGNORED_SHEET = "SV";

const VALID_CLASIFICACIONES: Clasificacion[] = ["Overfilled", "Completa", "Básico", "Undersized"];

// Encabezado esperado (normalizado) -> campo interno
const COLUMN_MAP: Record<string, keyof FillRateRow> = {
  semana: "semana",
  pais: "pais",
  tienda: "tienda",
  departamento: "departamento",
  categoria: "categoria",
  subcategoria: "subcategoria",
  surtido: "surtido",
  entregado: "entrega",
  entrega: "entrega",
  "fill rate": "fillRate",
  fillrate: "fillRate",
  clasificacion: "clasificacion",
};

const DISPLAY_NAMES: Record<keyof FillRateRow, string> = {
  semana: "Semana",
  pais: "País",
  tienda: "Tienda",
  departamento: "Departamento",
  categoria: "Categoría",
  subcategoria: "Subcategoría",
  surtido: "Surtido",
  entrega: "Entregado",
  fillRate: "Fill Rate",
  clasificacion: "Clasificación",
};

function normalizeHeader(raw: string): string {
  return raw
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[%\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeClasificacion(raw: unknown): { value: string; matched: boolean } {
  const s = String(raw ?? "").trim();
  const found = VALID_CLASIFICACIONES.find((c) => c.toLowerCase() === s.toLowerCase());
  return { value: found ?? s, matched: Boolean(found) };
}

/**
 * Excel guarda los porcentajes como fracción (106.9% se guarda como 1.069) y
 * solo aplica el símbolo "%" como formato visual de la celda. Si leemos el
 * valor crudo sin considerar esto, "106.9%" se convierte en "1.069%" en
 * pantalla — el bug que corrige esta función.
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
function readFillRatePercent(sheet: XLSX.WorkSheet, row: number, col: number): number | null {
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

/**
 * Lee un archivo .xlsx en el navegador y devuelve las filas válidas de BASE_MAESTRA.
 * La hoja SV se ignora por completo. No usa tablas dinámicas: lee la hoja como
 * matriz de celdas y arma los registros manualmente.
 */
export async function parseFillRateWorkbook(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  const sheetName = workbook.SheetNames.find((n) => n === REQUIRED_SHEET);
  if (!sheetName) {
    throw new Error(
      `No se encontró la hoja "${REQUIRED_SHEET}" en el archivo. Hojas disponibles: ${
        workbook.SheetNames.filter((n) => n !== IGNORED_SHEET).join(", ") || "ninguna"
      }.`
    );
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });

  if (matrix.length === 0) {
    throw new Error(`La hoja "${REQUIRED_SHEET}" está vacía.`);
  }

  const headerRow = matrix[0];
  const columnIndex: Partial<Record<keyof FillRateRow, number>> = {};
  headerRow.forEach((rawHeader, idx) => {
    const key = normalizeHeader(String(rawHeader));
    const field = COLUMN_MAP[key];
    if (field && columnIndex[field] === undefined) {
      columnIndex[field] = idx;
    }
  });

  const requiredFields = Object.keys(DISPLAY_NAMES) as (keyof FillRateRow)[];
  const missingColumns = requiredFields
    .filter((f) => columnIndex[f] === undefined)
    .map((f) => DISPLAY_NAMES[f]);

  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [],
      warnings: [],
      totalRowsInSheet: matrix.length - 1,
      missingColumns,
      fileName: file.name,
    };
  }

  const rows: FillRateRow[] = [];
  const errors: ParseIssue[] = [];
  const warnings: ParseIssue[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const excelRowNumber = i + 1;
    const raw = matrix[i];
    const get = (field: keyof FillRateRow) => raw[columnIndex[field]!];

    const semana = String(get("semana") ?? "").trim();
    const pais = String(get("pais") ?? "").trim();
    const tienda = String(get("tienda") ?? "").trim();
    const departamento = String(get("departamento") ?? "").trim();
    const categoria = String(get("categoria") ?? "").trim();
    const subcategoria = String(get("subcategoria") ?? "").trim();

    if (!semana && !tienda && !pais && !departamento) continue;

    const missingText: string[] = [];
    if (!semana) missingText.push("Semana");
    if (!tienda) missingText.push("Tienda");
    if (!pais) missingText.push("País");
    if (!departamento) missingText.push("Departamento");

    const surtido = toNumber(get("surtido"));
    const entrega = toNumber(get("entrega"));
    let fillRate = readFillRatePercent(sheet, i, columnIndex.fillRate!);

    if (surtido === null) missingText.push("Surtido (no numérico)");
    if (entrega === null) missingText.push("Entregado (no numérico)");

    if (missingText.length > 0) {
      errors.push({ row: excelRowNumber, message: `Fila descartada: ${missingText.join(", ")}.` });
      continue;
    }

    if (fillRate === null && surtido! > 0) {
      fillRate = Number(((entrega! / surtido!) * 100).toFixed(2));
      warnings.push({ row: excelRowNumber, message: "Fill Rate calculado automáticamente (venía vacío)." });
    } else if (fillRate === null) {
      fillRate = 0;
      warnings.push({ row: excelRowNumber, message: "Fill Rate no se pudo calcular (Surtido = 0)." });
    } else {
      fillRate = Number(fillRate.toFixed(2));
    }

    const { value: clasificacion, matched } = normalizeClasificacion(get("clasificacion"));
    if (!matched) {
      warnings.push({
        row: excelRowNumber,
        message: `Clasificación "${clasificacion}" no coincide con los valores esperados (Overfilled, Completa, Básico, Undersized).`,
      });
    }

    rows.push({
      semana,
      pais,
      tienda,
      departamento,
      categoria,
      subcategoria,
      surtido: surtido!,
      entrega: entrega!,
      fillRate: fillRate!,
      clasificacion,
    });
  }

  return {
    rows,
    errors,
    warnings,
    totalRowsInSheet: matrix.length - 1,
    missingColumns: [],
    fileName: file.name,
  };
}
