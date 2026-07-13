// lib/types.ts
// Todo el estado de la app vive en el navegador (Context + useReducer).
// No hay modelos de base de datos: esto es la única fuente de verdad de tipos.

export type Clasificacion = "Overfilled" | "Completa" | "Básico" | "Undersized";

export const CLASIFICACIONES: Clasificacion[] = ["Overfilled", "Completa", "Básico", "Undersized"];

export interface FillRateRow {
  semana: string;
  pais: string;
  tienda: string;
  departamento: string;
  categoria: string;
  subcategoria: string;
  surtido: number;
  entrega: number;
  fillRate: number; // porcentaje, ej. 87.5
  clasificacion: Clasificacion | string; // string si no matchea el enum
}

export interface ParseIssue {
  row: number;
  message: string;
}

export interface ParseResult {
  rows: FillRateRow[];
  errors: ParseIssue[];
  warnings: ParseIssue[];
  totalRowsInSheet: number;
  missingColumns: string[];
  fileName: string;
}

export const FILTER_FIELDS = [
  "semana",
  "pais",
  "tienda",
  "departamento",
  "categoria",
  "subcategoria",
  "clasificacion",
] as const;

export type FilterField = (typeof FILTER_FIELDS)[number];

// "Todos" = sin filtro para ese campo
export type FilterState = Record<FilterField, string> & { q: string };

export const EMPTY_FILTERS: FilterState = {
  semana: "Todos",
  pais: "Todos",
  tienda: "Todos",
  departamento: "Todos",
  categoria: "Todos",
  subcategoria: "Todos",
  clasificacion: "Todos",
  q: "",
};

// ---- DATOS_MEZCLA (hoja opcional) ----

export interface MezclaRow {
  tipo: string;
  porcentajeRequerido: number;
  porcentajeEntregado: number;
  surtido: number;
  entregado: number;
}

export interface MezclaTable {
  titulo: string; // ej. "Mezcla de Ropa"
  rows: MezclaRow[];
  total: MezclaRow | null;
}

export interface MezclaParseResult {
  found: boolean; // true si la hoja DATOS_MEZCLA existe en el archivo
  tables: MezclaTable[];
}

export const EMPTY_MEZCLA: MezclaParseResult = { found: false, tables: [] };
