// lib/insights.ts
// Frases cortas de análisis para mostrar debajo de cada tarjeta. Se derivan
// de los mismos arreglos que ya calculó lib/aggregations.ts — no hay
// cálculos nuevos aquí, solo redacción de lo que ya se muestra en el gráfico.

import type { TiendaEntregaPoint, CategoriaPoint, ClasificacionCount } from "./aggregations";
import type { MezclaTable } from "./types";
import { formatNumber, formatPercent } from "./format";

export function insightTopEntrega(data: TiendaEntregaPoint[]): string | undefined {
  if (data.length === 0) return undefined;
  const [first] = data;
  const total = data.reduce((acc, d) => acc + d.entrega, 0);
  const share = total > 0 ? Math.round((first.entrega / total) * 100) : 0;
  return `${first.tienda} lidera con ${formatNumber(first.entrega)} unidades entregadas (${share}% del total de este Top 10), con un Fill Rate promedio de ${formatPercent(first.fillRatePromedio)}.`;
}

export function insightBottomEntrega(data: TiendaEntregaPoint[]): string | undefined {
  if (data.length === 0) return undefined;
  const [first] = data;
  return `${first.tienda} es la tienda con menor entrega (${formatNumber(first.entrega)} unidades) — vale la pena revisar si es por baja demanda o un problema de abastecimiento.`;
}

export function insightCategoria(data: CategoriaPoint[]): string | undefined {
  if (data.length === 0) return undefined;
  const total = data.reduce((acc, d) => acc + d.entrega, 0);
  const [first] = data;
  const share = total > 0 ? Math.round((first.entrega / total) * 100) : 0;
  return `${first.categoria} concentra el ${share}% de lo entregado en el periodo filtrado (${formatNumber(first.entrega)} unidades).`;
}

export function insightClasificacion(data: ClasificacionCount[]): string | undefined {
  if (data.length === 0) return undefined;
  const sorted = [...data].sort((a, b) => b.registros - a.registros);
  const [first] = sorted;
  const overfilled = data.find((d) => d.clasificacion === "Overfilled");
  const undersized = data.find((d) => d.clasificacion === "Undersized");
  let extra = "";
  if (overfilled && overfilled.porcentaje >= 20) extra = ` Overfilled ya es el ${formatPercent(overfilled.porcentaje)} — hay sobre-inventario a revisar.`;
  else if (undersized && undersized.porcentaje >= 20) extra = ` Undersized llega al ${formatPercent(undersized.porcentaje)} — riesgo de desabasto.`;
  return `${formatPercent(first.porcentaje)} de los registros están en "${first.clasificacion}".${extra}`;
}

export function insightMezcla(table: MezclaTable): string | undefined {
  if (table.rows.length === 0) return undefined;
  let maxGapRow = table.rows[0];
  let maxGap = Math.abs(maxGapRow.porcentajeEntregado - maxGapRow.porcentajeRequerido);
  for (const r of table.rows) {
    const gap = Math.abs(r.porcentajeEntregado - r.porcentajeRequerido);
    if (gap > maxGap) {
      maxGap = gap;
      maxGapRow = r;
    }
  }
  if (maxGap < 1) return `La mezcla entregada está alineada con lo requerido en todos los tipos.`;
  const direction = maxGapRow.porcentajeEntregado > maxGapRow.porcentajeRequerido ? "por encima" : "por debajo";
  return `El mayor desvío es "${maxGapRow.tipo}": se requería ${formatPercent(maxGapRow.porcentajeRequerido)} y se entregó ${formatPercent(
    maxGapRow.porcentajeEntregado
  )} (${direction} de lo requerido).`;
}
