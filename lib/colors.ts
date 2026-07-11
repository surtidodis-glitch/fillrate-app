// lib/colors.ts
// Un solo lugar para los colores semánticos de clasificación, así todos
// los gráficos (donut, barras, heatmap) quedan consistentes entre sí.

export const CLASIFICACION_COLORS: Record<string, string> = {
  Overfilled: "#38bdf8", // azul — exceso de inventario
  Completa: "#34d399", // verde — objetivo cumplido
  Básico: "#fbbf24", // ámbar — cobertura mínima
  Undersized: "#f87171", // rojo — desabasto
};

export const DEFAULT_UNKNOWN_COLOR = "#64748b"; // gris, para clasificaciones no reconocidas

export function getClasificacionColor(clasificacion: string): string {
  return CLASIFICACION_COLORS[clasificacion] ?? DEFAULT_UNKNOWN_COLOR;
}

// Paleta secuencial para series sin significado semántico propio (ej. subcategorías)
export const SERIES_PALETTE = [
  "#6366f1",
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#38bdf8",
  "#f87171",
  "#94a3b8",
];
