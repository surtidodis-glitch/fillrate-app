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

export interface TrendPoint {
  semana: string;
  fillRatePromedio: number;
}

/** Tendencia de Fill Rate por semana, ordenada (asume formato tipo "W27" o similar, orden alfabético) */
export function computeTrend(rows: FillRateRow[]): TrendPoint[] {
  const bySemana = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = bySemana.get(r.semana) ?? { sum: 0, count: 0 };
    cur.sum += r.fillRate;
    cur.count += 1;
    bySemana.set(r.semana, cur);
  }
  return Array.from(bySemana.entries())
    .map(([semana, { sum, count }]) => ({ semana, fillRatePromedio: Number((sum / count).toFixed(2)) }))
    .sort((a, b) => a.semana.localeCompare(b.semana, "es", { numeric: true }));
}

export interface SubcategoriaPoint {
  subcategoria: string;
  entrega: number;
}

/** Entregado por subcategoría, top N + agrupación de "Otras" */
export function computeEntregaPorSubcategoria(rows: FillRateRow[], topN = 8): SubcategoriaPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.subcategoria, (map.get(r.subcategoria) ?? 0) + r.entrega);
  }
  const sorted = Array.from(map.entries())
    .map(([subcategoria, entrega]) => ({ subcategoria, entrega }))
    .sort((a, b) => b.entrega - a.entrega);

  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const otras = sorted.slice(topN).reduce((acc, cur) => acc + cur.entrega, 0);
  return [...top, { subcategoria: "Otras", entrega: otras }];
}

export interface TiendaPoint {
  tienda: string;
  fillRatePromedio: number;
}

/** Top N tiendas por Fill Rate promedio (requiere volumen mínimo para evitar outliers de 1 registro) */
export function computeTopTiendas(rows: FillRateRow[], topN = 10, minRegistros = 1): TiendaPoint[] {
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = map.get(r.tienda) ?? { sum: 0, count: 0 };
    cur.sum += r.fillRate;
    cur.count += 1;
    map.set(r.tienda, cur);
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.count >= minRegistros)
    .map(([tienda, { sum, count }]) => ({ tienda, fillRatePromedio: Number((sum / count).toFixed(2)) }))
    .sort((a, b) => b.fillRatePromedio - a.fillRatePromedio)
    .slice(0, topN);
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

export interface HeatmapCell {
  semana: string;
  clasificacion: string;
  porcentaje: number; // % de registros de esa semana que caen en esa clasificación
  registros: number;
}

/** Matriz semana x clasificación para el mapa de calor */
export function computeHeatmap(rows: FillRateRow[]): { semanas: string[]; cells: HeatmapCell[] } {
  const bySemana = new Map<string, Map<string, number>>();
  const totalPorSemana = new Map<string, number>();

  for (const r of rows) {
    if (!bySemana.has(r.semana)) bySemana.set(r.semana, new Map());
    const inner = bySemana.get(r.semana)!;
    inner.set(r.clasificacion, (inner.get(r.clasificacion) ?? 0) + 1);
    totalPorSemana.set(r.semana, (totalPorSemana.get(r.semana) ?? 0) + 1);
  }

  const semanas = Array.from(bySemana.keys()).sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const cells: HeatmapCell[] = [];

  for (const semana of semanas) {
    const inner = bySemana.get(semana)!;
    const total = totalPorSemana.get(semana) ?? 1;
    for (const clasificacion of CLASIFICACIONES) {
      const registros = inner.get(clasificacion) ?? 0;
      cells.push({ semana, clasificacion, registros, porcentaje: Number(((registros / total) * 100).toFixed(1)) });
    }
  }

  return { semanas, cells };
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
