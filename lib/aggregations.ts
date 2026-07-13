// lib/aggregations.ts
// Todo lo que antes hacía prisma.aggregate()/groupBy() en el servidor,
// aquí se calcula en memoria sobre el array ya filtrado en el navegador.
// Con miles de filas esto sigue siendo instantáneo; con cientos de miles,
// ver la nota de rendimiento en el README.

import type { FillRateRow, Clasificacion } from "./types";
import { CLASIFICACIONES } from "./types";

export interface Kpis {
  surtido: number;
  entrega: number;
  fillRatePromedio: number; // promedio simple de la columna fillRate
  cumplimiento: number; // entrega/surtido ponderado, más representativo a nivel agregado
  tiendas: number;
  paises: number;
  registros: number;
}

export function computeKpis(rows: FillRateRow[]): Kpis {
  if (rows.length === 0) {
    return { surtido: 0, entrega: 0, fillRatePromedio: 0, cumplimiento: 0, tiendas: 0, paises: 0, registros: 0 };
  }
  let surtido = 0;
  let entrega = 0;
  let fillRateSum = 0;
  const tiendas = new Set<string>();
  const paises = new Set<string>();

  for (const r of rows) {
    surtido += r.surtido;
    entrega += r.entrega;
    fillRateSum += r.fillRate;
    tiendas.add(r.tienda);
    paises.add(r.pais);
  }

  return {
    surtido,
    entrega,
    fillRatePromedio: Number((fillRateSum / rows.length).toFixed(2)),
    cumplimiento: surtido > 0 ? Number(((entrega / surtido) * 100).toFixed(2)) : 0,
    tiendas: tiendas.size,
    paises: paises.size,
    registros: rows.length,
  };
}

export interface CategoriaPoint {
  categoria: string;
  entrega: number;
}

/** Entregado por categoría, top N + agrupación de "Otras" */
export function computeEntregaPorCategoria(rows: FillRateRow[], topN = 8): CategoriaPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.categoria, (map.get(r.categoria) ?? 0) + r.entrega);
  }
  const sorted = Array.from(map.entries())
    .map(([categoria, entrega]) => ({ categoria, entrega }))
    .sort((a, b) => b.entrega - a.entrega);

  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const otras = sorted.slice(topN).reduce((acc, cur) => acc + cur.entrega, 0);
  return [...top, { categoria: "Otras", entrega: otras }];
}

export interface TiendaEntregaPoint {
  tienda: string;
  entrega: number;
  fillRatePromedio: number;
}

/**
 * Top/bottom N tiendas por unidades entregadas.
 * order "desc" = las que más recibieron entrega; "asc" = las que menos.
 */
export function computeTiendasPorEntrega(rows: FillRateRow[], topN = 10, order: "desc" | "asc" = "desc"): TiendaEntregaPoint[] {
  const map = new Map<string, { entrega: number; fillRateSum: number; count: number }>();
  for (const r of rows) {
    const cur = map.get(r.tienda) ?? { entrega: 0, fillRateSum: 0, count: 0 };
    cur.entrega += r.entrega;
    cur.fillRateSum += r.fillRate;
    cur.count += 1;
    map.set(r.tienda, cur);
  }
  const list = Array.from(map.entries()).map(([tienda, v]) => ({
    tienda,
    entrega: v.entrega,
    fillRatePromedio: Number((v.fillRateSum / v.count).toFixed(2)),
  }));
  list.sort((a, b) => (order === "desc" ? b.entrega - a.entrega : a.entrega - b.entrega));
  return list.slice(0, topN);
}

export interface ClasificacionCount {
  clasificacion: string;
  registros: number;
  porcentaje: number;
}

export function computeDistribucionClasificacion(rows: FillRateRow[]): ClasificacionCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.clasificacion, (map.get(r.clasificacion) ?? 0) + 1);
  }
  const total = rows.length || 1;
  // Ordena primero los 4 valores esperados, en un orden lógico, y al final cualquier valor no reconocido
  const known = CLASIFICACIONES.filter((c) => map.has(c));
  const unknown = Array.from(map.keys()).filter((k) => !CLASIFICACIONES.includes(k as Clasificacion));
  return [...known, ...unknown].map((clasificacion) => ({
    clasificacion,
    registros: map.get(clasificacion) ?? 0,
    porcentaje: Number((((map.get(clasificacion) ?? 0) / total) * 100).toFixed(1)),
  }));
}

/** Extrae los valores únicos de un campo, para poblar los <select> de filtros */
export function uniqueValues(rows: FillRateRow[], field: keyof FillRateRow): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = r[field];
    if (v !== undefined && v !== null && v !== "") set.add(String(v));
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}
