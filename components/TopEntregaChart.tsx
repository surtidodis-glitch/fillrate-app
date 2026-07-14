"use client";

// components/TopEntregaChart.tsx
// Reemplaza la antigua "Tendencia de Fill Rate por semana": ahora muestra
// las 10 tiendas a las que más unidades se les entregó, de mayor a menor.

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFillRateData } from "@/context/DataContext";
import { computeTiendasPorEntrega } from "@/lib/aggregations";
import { insightTopEntrega } from "@/lib/insights";
import { formatNumber } from "@/lib/format";
import ChartCard from "./ChartCard";

export default function TopEntregaChart() {
  const { filteredRows } = useFillRateData();
  const data = computeTiendasPorEntrega(filteredRows, 10, "desc");

  return (
    <ChartCard title="Top 10 tiendas con mayor entrega" subtitle="Unidades entregadas, de mayor a menor" insight={insightTopEntrega(data)}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1f2937" }} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
          <YAxis
            type="category"
            dataKey="tienda"
            width={120}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color: "#e5e7eb" }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(v: number) => [formatNumber(v), "Entregado"]}
          />
          <Bar dataKey="entrega" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#818cf8" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
