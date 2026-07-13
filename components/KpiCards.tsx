"use client";

// components/KpiCards.tsx

import { Package, Truck, Percent, Target, Store, Globe2 } from "lucide-react";
import { useFillRateData } from "@/context/DataContext";
import { computeKpis } from "@/lib/aggregations";
import { formatPercent, formatNumber } from "@/lib/format";

export default function KpiCards() {
  const { filteredRows } = useFillRateData();
  const kpis = computeKpis(filteredRows);

  const cards = [
    { label: "Surtido", value: formatNumber(kpis.surtido), icon: Package, accent: "text-accent-soft" },
    { label: "Entregado", value: formatNumber(kpis.entrega), icon: Truck, accent: "text-cyan-400" },
    { label: "Fill Rate promedio", value: formatPercent(kpis.fillRatePromedio), icon: Percent, accent: "text-emerald-400" },
    { label: "Cumplimiento", value: formatPercent(kpis.cumplimiento), icon: Target, accent: "text-amber-400" },
    { label: "Tiendas", value: formatNumber(kpis.tiendas), icon: Store, accent: "text-violet-400" },
    { label: "Países", value: formatNumber(kpis.paises), icon: Globe2, accent: "text-sky-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <div key={label} className="rounded-xl border border-base-border bg-base-surface/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
            <Icon className={`h-4 w-4 ${accent}`} />
          </div>
          <p className="text-2xl font-semibold text-slate-100">{value}</p>
        </div>
      ))}
    </div>
  );
}
