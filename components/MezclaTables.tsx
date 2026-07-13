"use client";

// components/MezclaTables.tsx
// Muestra las tablas leídas de la hoja opcional DATOS_MEZCLA (ej. "Mezcla
// de Ropa", "Mezcla de Calzado"). Si el archivo no tiene esa hoja, este
// componente no se monta (se controla desde page.tsx).

import { useFillRateData } from "@/context/DataContext";
import { formatPercent, formatNumber } from "@/lib/format";
import ChartCard from "./ChartCard";
import type { MezclaTable } from "@/lib/types";

export default function MezclaTables() {
  const { mezcla } = useFillRateData();

  if (!mezcla.found || mezcla.tables.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {mezcla.tables.map((table) => (
        <MezclaTableCard key={table.titulo} table={table} />
      ))}
    </div>
  );
}

function MezclaTableCard({ table }: { table: MezclaTable }) {
  return (
    <ChartCard title={table.titulo} subtitle="Desde la hoja DATOS_MEZCLA">
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
            {table.rows.map((r, i) => (
              <tr key={i} className="border-b border-base-border/60 text-slate-300">
                <td className="py-2 pr-3">{r.tipo}</td>
                <td className="py-2 pr-3 text-right">{formatPercent(r.porcentajeRequerido)}</td>
                <td className="py-2 pr-3 text-right">{formatPercent(r.porcentajeEntregado)}</td>
                <td className="py-2 pr-3 text-right">{formatNumber(r.surtido)}</td>
                <td className="py-2 pr-3 text-right">{formatNumber(r.entregado)}</td>
              </tr>
            ))}
            {table.total && (
              <tr className="text-slate-100">
                <td className="py-2 pr-3 font-semibold">{table.total.tipo || "TOTAL"}</td>
                <td className="py-2 pr-3 text-right font-semibold">{formatPercent(table.total.porcentajeRequerido)}</td>
                <td className="py-2 pr-3 text-right font-semibold">{formatPercent(table.total.porcentajeEntregado)}</td>
                <td className="py-2 pr-3 text-right font-semibold">{formatNumber(table.total.surtido)}</td>
                <td className="py-2 pr-3 text-right font-semibold">{formatNumber(table.total.entregado)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
