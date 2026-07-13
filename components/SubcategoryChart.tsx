"use client";

// components/SubcategoryChart.tsx
// Un solo componente con toggle donut/barras: son la misma serie de
// datos (Entregado por Subcategoría), solo cambia la representación.

import { useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFillRateData } from "@/context/DataContext";
import { computeEntregaPorSubcategoria } from "@/lib/aggregations";
import { SERIES_PALETTE } from "@/lib/colors";
import { formatNumber } from "@/lib/format";
import ChartCard from "./ChartCard";

export default function SubcategoryChart() {
  const { filteredRows } = useFillRateData();
  const data = computeEntregaPorSubcategoria(filteredRows);
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
    <ChartCard title="Entregado por Subcategoría" subtitle="Top 8 + Otras" actions={toggle}>
      <ResponsiveContainer width="100%" height={260}>
        {view === "donut" ? (
          <PieChart>
            <Pie data={data} dataKey="entrega" nameKey="subcategoria" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} stroke="#0a0e17" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, n: string) => [formatNumber(v), n]}
            />
          </PieChart>
        ) : (
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1f2937" }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="subcategoria"
              width={110}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
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
