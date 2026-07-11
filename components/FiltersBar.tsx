"use client";

// components/FiltersBar.tsx
// Todos los <select> se pueblan dinámicamente a partir de los datos ya
// cargados (no de datos filtrados, para no ir "reduciendo" opciones
// de golpe al combinar filtros — comportamiento simple e intuitivo).

import { Search, RotateCcw } from "lucide-react";
import { useFillRateData } from "@/context/DataContext";
import { uniqueValues } from "@/lib/aggregations";
import type { FillRateRow } from "@/lib/types";
import { CLASIFICACIONES } from "@/lib/types";

const FILTER_CONFIG: { field: keyof FillRateRow; label: string }[] = [
  { field: "semana", label: "Semana" },
  { field: "pais", label: "País" },
  { field: "tienda", label: "Tienda" },
  { field: "categoria", label: "Categoría" },
  { field: "subcategoria", label: "Subcategoría" },
];

export default function FiltersBar() {
  const { rows, filters, setFilter, resetFilters, hasData } = useFillRateData();

  if (!hasData) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-base-border bg-base-surface/40 p-3">
      {FILTER_CONFIG.map(({ field, label }) => (
        <select
          key={field}
          value={filters[field as keyof typeof filters]}
          onChange={(e) => setFilter(field as keyof typeof filters, e.target.value)}
          className="rounded-lg border border-base-border bg-base-surface2 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-accent"
        >
          <option value="Todos">{label}: Todos</option>
          {uniqueValues(rows, field).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ))}

      <select
        value={filters.clasificacion}
        onChange={(e) => setFilter("clasificacion", e.target.value)}
        className="rounded-lg border border-base-border bg-base-surface2 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-accent"
      >
        <option value="Todos">Clasificación: Todas</option>
        {CLASIFICACIONES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="relative ml-auto">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        <input
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Buscar tienda, categoría…"
          className="w-56 rounded-lg border border-base-border bg-base-surface2 py-1.5 pl-8 pr-2.5 text-xs text-slate-300 outline-none focus:border-accent"
        />
      </div>

      <button
        onClick={resetFilters}
        className="flex items-center gap-1.5 rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Limpiar
      </button>
    </div>
  );
}
