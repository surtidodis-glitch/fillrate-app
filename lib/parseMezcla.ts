// lib/parseMezcla.ts
// Lee la hoja opcional de mezcla (ej. DATOS_MEZCLA). Es data fila-por-fila,
// igual que BASE_MAESTRA, pero con una columna TIPO adicional. Puede venir
// en uno o varios bloques de columnas lado a lado en la misma hoja (cada
// bloque con su propio encabezado SEMANA/TIENDA/CATEGORÍA/TIPO/SURTIDO/
// ENTREGA/FILL RATE/CLASIFICACIÓN) — los bloques pueden tener distinta
// cantidad de filas entre sí.

import * as XLSX from "xlsx";
import type { MezclaParseResult, MezclaDetailRow } from "./types";
import { normalizeHeader, toNumber, readPercentCell } from "./excelUtils";

const SHEET_NAME = "DATOS_MEZCLA";

function normalizeSheetName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}

function findMezclaSheetName(workbook: XLSX.WorkBook): string | undefined {
  const exact = workbook.SheetNames.find((n) => normalizeSheetName(n) === normalizeSheetName(SHEET_NAME));
  if (exact) return exact;
  return workbook.SheetNames.find((n) => normalizeSheetName(n).includes("mezcla"));
}

interface BlockColumns {
  startCol: number;
  endCol: number;
  semana: number;
  tienda: number;
  categoria: number;
  tipo: number;
  surtido: number;
  entrega: number;
  fillRate?: number;
  clasificacion?: number;
}

const FIELD_MAP: Record<string, keyof Omit<BlockColumns, "startCol" | "endCol">> = {
  semana: "semana",
  tienda: "tienda",
  categoria: "categoria",
  tipo: "tipo",
  surtido: "surtido",
  entrega: "entrega",
  entregado: "entrega",
  "fill rate": "fillRate",
  fillrate: "fillRate",
  clasificacion: "clasificacion",
};

/** Encuentra todos los bloques de columnas (cada uno con su propio SEMANA/TIENDA/...) en una fila de encabezado. */
function findBlocks(headerRow: unknown[]): BlockColumns[] {
  const semanaColumns: number[] = [];
  headerRow.forEach((cell, idx) => {
    if (normalizeHeader(String(cell ?? "")) === "semana") semanaColumns.push(idx);
  });

  return semanaColumns.map((startCol, i) => {
    const endCol = i + 1 < semanaColumns.length ? semanaColumns[i + 1] - 1 : headerRow.length - 1;
    const block: Partial<BlockColumns> = { startCol, endCol };
    for (let c = startCol; c <= endCol; c++) {
      const norm = normalizeHeader(String(headerRow[c] ?? ""));
      const field = FIELD_MAP[norm];
      if (field) block[field] = c;
    }
    return block as BlockColumns;
  });
}

export function parseMezclaSheet(workbook: XLSX.WorkBook): MezclaParseResult {
  const sheetName = findMezclaSheetName(workbook);
  if (!sheetName) return { found: false, rows: [], availableSheets: workbook.SheetNames };

  const sheet = workbook.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: "" });

  // Busca la primera fila que tenga al menos una columna "SEMANA" — esa es la fila de encabezado(s)
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    if (matrix[i].some((c) => normalizeHeader(String(c ?? "")) === "semana")) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) return { found: false, rows: [], availableSheets: workbook.SheetNames };

  const blocks = findBlocks(matrix[headerRowIdx]).filter(
    (b) => b.tienda !== undefined && b.categoria !== undefined && b.tipo !== undefined && b.surtido !== undefined && b.entrega !== undefined
  );
  if (blocks.length === 0) return { found: false, rows: [], availableSheets: workbook.SheetNames };

  const rows: MezclaDetailRow[] = [];

  for (const block of blocks) {
    for (let r = headerRowIdx + 1; r < matrix.length; r++) {
      const raw = matrix[r];
      const semana = String(raw[block.semana] ?? "").trim();
      const tienda = String(raw[block.tienda] ?? "").trim();
      const categoria = String(raw[block.categoria] ?? "").trim();
      const tipo = String(raw[block.tipo] ?? "").trim();

      if (!semana && !tienda && !categoria && !tipo) continue; // fila vacía para este bloque específico

      const surtido = toNumber(raw[block.surtido]) ?? 0;
      const entrega = toNumber(raw[block.entrega]) ?? 0;
      const fillRate = block.fillRate !== undefined ? readPercentCell(sheet, r, block.fillRate) ?? 0 : entrega && surtido ? Number(((entrega / surtido) * 100).toFixed(2)) : 0;
      const clasificacion = block.clasificacion !== undefined ? String(raw[block.clasificacion] ?? "").trim() : "";

      rows.push({ semana, tienda, categoria, tipo, surtido, entrega, fillRate, clasificacion });
    }
  }

  return { found: rows.length > 0, rows };
}
