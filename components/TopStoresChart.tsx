"use client";

// components/TopStoresChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useFillRateData } from "@/context/DataContext";
import { computeTopTiendas } from "@/lib/aggregations";
import ChartCard from "./ChartCard";

export default function TopStoresChart() {
  const { filteredRows } = useFillRateData();
  const data = computeTopTiendas(filteredRows, 10);

  return (
    <ChartCard title="Top 10 tiendas" subtitle="Por Fill Rate promedio">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, (max: number) => Math.max(100, Math.ceil((max + 10) / 10) * 10)]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#1f2937" }}
            tickLine={false}
          />
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
            formatter={(v: number) => [`${v}%`, "Fill Rate"]}
          />
          <Bar dataKey="fillRatePromedio" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.fillRatePromedio >= 90 ? "#34d399" : d.fillRatePromedio >= 75 ? "#fbbf24" : "#f87171"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
