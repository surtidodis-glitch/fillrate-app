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
// Es data fila-por-fila igual que BASE_MAESTRA, pero con una columna TIPO
// adicional (Credencial/Retornos/Seleccionado/etc). Puede venir en uno o
// varios bloques de columnas lado a lado dentro de la misma hoja.

export interface MezclaDetailRow {
  semana: string;
  tienda: string;
  categoria: string; // ej. "ROPA COLOR", "CALZADO"
  tipo: string; // ej. "CREDENCIAL", "RETORNOS", "SELECCIONADO", "MIX RAG", "RETORNO"
  surtido: number;
  entrega: number;
  fillRate: number;
  clasificacion: string;
}

export interface MezclaParseResult {
  found: boolean; // true si se detectó una hoja de mezcla
  rows: MezclaDetailRow[];
  availableSheets?: string[]; // solo si found=false, para depurar el nombre real de la hoja
}

export const EMPTY_MEZCLA: MezclaParseResult = { found: false, rows: [] };
