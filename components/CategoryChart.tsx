"use client";

// components/CategoryChart.tsx
// Antes era "Entregado por Subcategoría" (SubcategoryChart.tsx). Ahora
// agrupa por Categoría, con texto más grande para mejor legibilidad.

import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFillRateData } from "@/context/DataContext";
import { computeEntregaPorCategoria } from "@/lib/aggregations";
import { insightCategoria } from "@/lib/insights";
import { SERIES_PALETTE } from "@/lib/colors";
import { formatNumber } from "@/lib/format";
import ChartCard from "./ChartCard";

export default function CategoryChart() {
  const { filteredRows } = useFillRateData();
  const data = computeEntregaPorCategoria(filteredRows);
  const [view, setView] = useState<"donut" | "bar">("donut");

  const toggle = (
    <div className="flex overflow-hidden rounded-lg border border-base-border text-[11px]">
      {(["donut", "bar"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setView(v)}
          className={`px-2.5 py-1 ${view === v ? "bg-accent/20 text-accent-soft" : "text-slate-500 hover:text-slate-300"}`}
        >
          {v === "donut" ? "Donut" : "Barras"}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard title="Entregado por Categoría" subtitle="Top 8 + Otras" actions={toggle} insight={insightCategoria(data)}>
      <ResponsiveContainer width="100%" height={280}>
        {view === "donut" ? (
          <PieChart>
            <Pie
              data={data}
              dataKey="entrega"
              nameKey="categoria"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              label={({ categoria, percent }) => `${categoria} ${Math.round((percent ?? 0) * 100)}%`}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} stroke="#0a0e17" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 13 }}
            itemStyle={{ color: "#e5e7eb" }}
            labelStyle={{ color: "#94a3b8" }}
              formatter={(v: number, n: string) => [formatNumber(v), n]}
            />
          </PieChart>
        ) : (
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 13 }} axisLine={{ stroke: "#1f2937" }} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
            <YAxis
              type="category"
              dataKey="categoria"
              width={130}
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 13 }}
            itemStyle={{ color: "#e5e7eb" }}
            labelStyle={{ color: "#94a3b8" }}
              formatter={(v: number) => [formatNumber(v), "Entregado"]}
            />
            <Bar dataKey="entrega" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  );
}
