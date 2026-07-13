// lib/format.ts
// Un solo lugar para las reglas de formato visual de números en todo el
// dashboard: porcentajes redondeados sin decimales, y miles separados por
// coma (formato "23,157" en vez de "23.157" o "23157").

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
