"use client";

// components/ClassificationDistribution.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { useFillRateData } from "@/context/DataContext";
import { computeDistribucionClasificacion } from "@/lib/aggregations";
import { getClasificacionColor } from "@/lib/colors";
import ChartCard from "./ChartCard";

export default function ClassificationDistribution() {
  const { filteredRows } = useFillRateData();
  const data = computeDistribucionClasificacion(filteredRows);

  return (
    <ChartCard title="Distribución por Clasificación" subtitle="% de registros en el periodo filtrado">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 16 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="clasificacion" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#1f2937" }} tickLine={false} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number, _n, item) => [`${v}% (${item.payload.registros.toLocaleString("es")} registros)`, "Participación"]}
          />
          <Bar dataKey="porcentaje" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={getClasificacionColor(d.clasificacion)} />
            ))}
            <LabelList dataKey="porcentaje" position="top" formatter={(v: number) => `${v}%`} fill="#94a3b8" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
