"use client";

// components/ClassificationHeatmap.tsx
// Grid HTML propio (no un chart de librería): cada celda es
// semana x clasificación, con opacidad proporcional al % que
// representa esa clasificación dentro de esa semana.

import { useFillRateData } from "@/context/DataContext";
import { computeHeatmap } from "@/lib/aggregations";
import { CLASIFICACIONES } from "@/lib/types";
import { getClasificacionColor } from "@/lib/colors";
import ChartCard from "./ChartCard";

export default function ClassificationHeatmap() {
  const { filteredRows } = useFillRateData();
  const { semanas, cells } = computeHeatmap(filteredRows);

  const cellFor = (semana: string, clasificacion: string) =>
    cells.find((c) => c.semana === semana && c.clasificacion === clasificacion);

  if (semanas.length === 0) {
    return (
      <ChartCard title="Mapa de calor: Clasificación por Semana">
        <p className="py-8 text-center text-xs text-slate-600">Sin datos para el filtro actual</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Mapa de calor: Clasificación por Semana" subtitle="Intensidad = % de registros de la semana">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="w-24 text-left font-medium text-slate-500"></th>
              {semanas.map((s) => (
                <th key={s} className="min-w-[52px] pb-1 text-center font-medium text-slate-500">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CLASIFICACIONES.map((clasificacion) => (
              <tr key={clasificacion}>
                <td className="pr-2 text-right font-medium text-slate-400">{clasificacion}</td>
                {semanas.map((semana) => {
                  const cell = cellFor(semana, clasificacion);
                  const pct = cell?.porcentaje ?? 0;
                  const color = getClasificacionColor(clasificacion);
                  return (
                    <td key={semana} className="p-0">
                      <div
                        title={`${clasificacion} · ${semana}: ${pct}% (${cell?.registros ?? 0} registros)`}
                        className="flex h-9 items-center justify-center rounded-md text-[10px] font-medium text-slate-950"
                        style={{
                          backgroundColor: color,
                          opacity: pct === 0 ? 0.06 : 0.25 + (pct / 100) * 0.75,
                          color: pct > 35 ? "#0a0e17" : "#e5e7eb",
                        }}
                      >
                        {pct > 0 ? `${pct}%` : ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
