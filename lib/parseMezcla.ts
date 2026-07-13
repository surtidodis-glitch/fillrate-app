// lib/parseMezcla.ts
// Lee la hoja opcional DATOS_MEZCLA, que contiene una o más tablas tipo
// "MEZCLA DE ROPA" / "MEZCLA DE CALZADO" con columnas TIPO, % REQUERIDO,
// % ENTREGADO, SURTIDO, ENTREGADO y una fila TOTAL al final.
//
// El layout no es un solo encabezado en la fila 1 como BASE_MAESTRA: son
// varias tablas apiladas o lado a lado, cada una con su propio título y
// encabezado. Por eso el parseo es "buscar patrones" en vez de columnas fijas.

import * as XLSX from "xlsx";
import type { MezclaParseResult, MezclaTable, MezclaRow } from "./types";
import { normalizeHeader, toNumber, readPercentCell, readCellText } from "./excelUtils";

const SHEET_NAME = "DATOS_MEZCLA";

function normalizeSheetName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

interface ColumnMap {
  tipo?: number;
  pctRequerido?: number;
  pctEntregado?: number;
  surtido?: number;
  entregado?: number;
}

function findHeaderColumns(row: unknown[]): ColumnMap | null {
  const map: ColumnMap = {};
  row.forEach((cell, idx) => {
    const norm = normalizeHeader(String(cell ?? ""));
    if (!norm) return;
    if (norm === "tipo") map.tipo = idx;
    else if (norm.includes("%") && norm.includes("requerido")) map.pctRequerido = idx;
    else if (norm.includes("%") && norm.includes("entregado")) map.pctEntregado = idx;
    else if (norm === "surtido") map.surtido = idx;
    else if (norm === "entregado") map.entregado = idx;
  });
  // Se considera válida una tabla de mezcla si al menos tiene TIPO + algo más
  if (map.tipo === undefined) return null;
  return map;
}

function parseRow(sheet: XLSX.WorkSheet, matrixRow: unknown[], rowIdx: number, cols: ColumnMap): MezclaRow | null {
  const tipo = String(matrixRow[cols.tipo!] ?? "").trim();
  if (!tipo) return null;

  const porcentajeRequerido = cols.pctRequerido !== undefined ? readPercentCell(sheet, rowIdx, cols.pctRequerido) ?? 0 : 0;
  const porcentajeEntregado = cols.pctEntregado !== undefined ? readPercentCell(sheet, rowIdx, cols.pctEntregado) ?? 0 : 0;
  const surtido = cols.surtido !== undefined ? toNumber(matrixRow[cols.surtido]) ?? 0 : 0;
  const entregado = cols.entregado !== undefined ? toNumber(matrixRow[cols.entregado]) ?? 0 : 0;

  return { tipo, porcentajeRequerido, porcentajeEntregado, surtido, entregado };
}

export function parseMezclaSheet(workbook: XLSX.WorkBook): MezclaParseResult {
  const sheetName = workbook.SheetNames.find((n) => normalizeSheetName(n) === normalizeSheetName(SHEET_NAME));
  if (!sheetName) return { found: false, tables: [] };

  const sheet = workbook.Sheets[sheetName];
  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: "" });

  const tables: MezclaTable[] = [];
  let i = 0;

  while (i < matrix.length) {
    const row = matrix[i];
    const firstCellText = String(row.find((c) => String(c ?? "").trim() !== "") ?? "").trim();
    const match = /mezcla\s+de\s+(.+)/i.exec(firstCellText);

    if (match) {
      const titulo = `Mezcla de ${titleCase(match[1].trim())}`;

      // Busca la fila de encabezado (con "TIPO") en las próximas filas
      let headerRowIdx = -1;
      let cols: ColumnMap | null = null;
      for (let j = i + 1; j < Math.min(i + 5, matrix.length); j++) {
        const found = findHeaderColumns(matrix[j]);
        if (found) {
          headerRowIdx = j;
          cols = found;
          break;
        }
      }

      if (cols && headerRowIdx !== -1) {
        const rows: MezclaRow[] = [];
        let total: MezclaRow | null = null;
        let k = headerRowIdx + 1;

        for (; k < matrix.length; k++) {
          const dataRow = matrix[k];
          const tipoCell = normalizeHeader(readCellText(sheet, k, cols.tipo!));
          const isEmpty = dataRow.every((c) => String(c ?? "").trim() === "");
          if (isEmpty) break; // fila en blanco = fin de la tabla

          const parsed = parseRow(sheet, dataRow, k, cols);
          if (!parsed) continue;

          if (tipoCell.startsWith("total")) {
            total = parsed;
            k++; // consume la fila TOTAL y termina la tabla
            break;
          }
          rows.push(parsed);
        }

        tables.push({ titulo, rows, total });
        i = k;
        continue;
      }
    }

    i++;
  }

  return { found: tables.length > 0, tables };
}
