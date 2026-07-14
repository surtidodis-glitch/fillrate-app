"use client";

// components/MezclaTables.tsx
// Muestra la mezcla de producto (Credencial/Retornos/Seleccionado/etc) leída
// de la hoja de mezcla. Se cruza con los filtros activos:
//  - Si hay una Semana elegida, solo se cuentan esas filas de mezcla.
//  - Si hay una Tienda elegida, se muestra SOLO la mezcla de esa tienda.
//  - El departamento del sidebar decide qué tarjeta(s) mostrar: "ROPA" -> solo
//    Ropa Color, "OTROS" -> solo Calzado, "Todos" -> ambas.
//  - Sin filtros, se muestra la mezcla total del archivo completo.

import { useFillRateData } from "@/context/DataContext";
import { computeMezclaSummary, type MezclaSummary } from "@/lib/aggregations";
import { formatPercent, formatNumber } from "@/lib/format";
import { insightMezcla } from "@/lib/insights";
import ChartCard from "./ChartCard";
import type { MezclaDetailRow } from "@/lib/types";

// La hoja de mezcla solo trae dos categorías de negocio: Ropa (color) y
// Calzado (general) — así lo confirmó el usuario. Mapeamos el departamento
// del sidebar a la categoría de mezcla correspondiente.
const CATEGORIA_LABELS: Record<string, string> = {
  "ROPA COLOR": "Mezcla de Ropa (Color)",
  CALZADO: "Mezcla de Calzado",
};

function departamentoPermiteCategoria(departamento: string, categoriaMezcla: string): boolean {
  if (departamento === "Todos") return true;
  const dep = departamento.toUpperCase();
  if (dep === "ROPA") return categoriaMezcla === "ROPA COLOR";
  if (dep === "OTROS") return categoriaMezcla === "CALZADO";
  return true; // departamento desconocido: no se filtra
}

export default function MezclaTables() {
  const { mezcla, filters } = useFillRateData();

  if (!mezcla.found || mezcla.rows.length === 0) return null;

  const filteredMezclaRows: MezclaDetailRow[] = mezcla.rows.filter((r) => {
    if (filters.semana !== "Todos" && r.semana !== filters.semana) return false;
    if (filters.tienda !== "Todos" && r.tienda !== filters.tienda) return false;
    return true;
  });

  const summaries = computeMezclaSummary(filteredMezclaRows).filter((s) => departamentoPermiteCategoria(filters.departamento, s.categoria));

  if (summaries.length === 0) return null;

  const subtitle =
    filters.tienda !== "Todos"
      ? `Solo tienda ${filters.tienda}${filters.semana !== "Todos" ? ` · ${filters.semana}` : ""}`
      : filters.semana !== "Todos"
      ? `Semana ${filters.semana}`
      : "Total del archivo";

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {summaries.map((summary) => (
        <MezclaCard key={summary.categoria} summary={summary} subtitle={subtitle} />
      ))}
    </div>
  );
}

function MezclaCard({ summary, subtitle }: { summary: MezclaSummary; subtitle: string }) {
  const titulo = CATEGORIA_LABELS[summary.categoria] ?? `Mezcla de ${summary.categoria}`;

  return (
    <ChartCard title={titulo} subtitle={subtitle} insight={insightMezcla(summary)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-base-border text-[11px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3 font-medium">Tipo</th>
              <th className="py-2 pr-3 text-right font-medium">% Requerido</th>
              <th className="py-2 pr-3 text-right font-medium">% Entregado</th>
              <th className="py-2 pr-3 text-right font-medium">Surtido</th>
              <th className="py-2 pr-3 text-right font-medium">Entregado</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows
              .sort((a, b) => b.entrega - a.entrega)
              .map((r) => (
                <tr key={r.tipo} className="border-b border-base-border/60 text-slate-300">
                  <td className="py-2 pr-3">{r.tipo}</td>
                  <td className="py-2 pr-3 text-right">{r.porcentajeRequerido !== undefined ? formatPercent(r.porcentajeRequerido) : "—"}</td>
                  <td className="py-2 pr-3 text-right">{formatPercent(r.porcentajeEntregado)}</td>
                  <td className="py-2 pr-3 text-right">{formatNumber(r.surtido)}</td>
                  <td className="py-2 pr-3 text-right">{formatNumber(r.entrega)}</td>
                </tr>
              ))}
            <tr className="text-slate-100">
              <td className="py-2 pr-3 font-semibold">TOTAL</td>
              <td className="py-2 pr-3 text-right font-semibold">100%</td>
              <td className="py-2 pr-3 text-right font-semibold">100%</td>
              <td className="py-2 pr-3 text-right font-semibold">{formatNumber(summary.totalSurtido)}</td>
              <td className="py-2 pr-3 text-right font-semibold">{formatNumber(summary.totalEntrega)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
