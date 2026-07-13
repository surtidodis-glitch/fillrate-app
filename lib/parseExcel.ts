// lib/parseExcel.ts
// Parseo 100% en el navegador. No hay llamada a ningún backend: el File
// que suelta el usuario se lee con ArrayBuffer y se procesa con SheetJS.
//
// parseWorkbookFile() es el punto de entrada: lee el archivo UNA sola vez
// y de ahí extrae tanto BASE_MAESTRA (obligatoria) como DATOS_MEZCLA
// (opcional, hoja aparte con las tablas de mezcla de producto).

import * as XLSX from "xlsx";
import type { FillRateRow, ParseResult, ParseIssue, Clasificacion, MezclaParseResult } from "./types";
import { normalizeHeader, toNumber, readPercentCell } from "./excelUtils";
import { parseMezclaSheet } from "./parseMezcla";

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

function normalizeClasificacion(raw: unknown): { value: string; matched: boolean } {
  const s = String(raw ?? "").trim();
  const found = VALID_CLASIFICACIONES.find((c) => c.toLowerCase() === s.toLowerCase());
  return { value: found ?? s, matched: Boolean(found) };
}

function parseBaseMaestra(workbook: XLSX.WorkBook, fileName: string): ParseResult {
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
      fileName,
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
    if (!pais) missingText.push("País");
    if (!tienda) missingText.push("Tienda");
    if (!departamento) missingText.push("Departamento");

    const surtido = toNumber(get("surtido"));
    const entrega = toNumber(get("entrega"));
    let fillRate = readPercentCell(sheet, i, columnIndex.fillRate!);

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
    fileName,
  };
}

/**
 * Lee un archivo .xlsx en el navegador y devuelve tanto las filas de
 * BASE_MAESTRA (obligatoria) como las tablas de DATOS_MEZCLA (opcional).
 * Se lee el workbook una sola vez y se reparte a ambos parsers.
 */
export async function parseWorkbookFile(file: File): Promise<{ base: ParseResult; mezcla: MezclaParseResult }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  const base = parseBaseMaestra(workbook, file.name);
  const mezcla = parseMezclaSheet(workbook);

  return { base, mezcla };
}
