"use client";

// components/TrendChart.tsx

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFillRateData } from "@/context/DataContext";
import { computeTrend } from "@/lib/aggregations";
import ChartCard from "./ChartCard";

export default function TrendChart() {
  const { filteredRows } = useFillRateData();
  const data = computeTrend(filteredRows);

  return (
    <ChartCard title="Tendencia de Fill Rate" subtitle="Promedio por semana">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="fillRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="semana" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#1f2937" }} tickLine={false} />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ background: "#0f1420", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(v: number) => [`${v}%`, "Fill Rate"]}
          />
          <Area type="monotone" dataKey="fillRatePromedio" stroke="#818cf8" strokeWidth={2} fill="url(#fillRateGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
