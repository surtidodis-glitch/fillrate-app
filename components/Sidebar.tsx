"use client";

// components/Sidebar.tsx
// Navegación lateral: "Todos" + un ítem por cada departamento presente
// en los datos cargados. Al hacer clic, actualiza el filtro global.

import { LayoutGrid, Shirt } from "lucide-react";
import { useFillRateData } from "@/context/DataContext";
import { uniqueValues } from "@/lib/aggregations";

export default function Sidebar() {
  const { rows, filters, setFilter, hasData } = useFillRateData();
  const departamentos = uniqueValues(rows, "departamento");

  return (
    <aside className="hidden w-60 flex-none border-r border-base-border bg-base-surface/40 p-4 lg:block">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 text-accent-soft">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Fill Rate</p>
          <p className="text-[11px] text-slate-500">Analytics</p>
        </div>
      </div>

      <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">Departamentos</p>

      <nav className="space-y-1">
        <NavItem
          label="Todos"
          active={filters.departamento === "Todos"}
          onClick={() => setFilter("departamento", "Todos")}
          disabled={!hasData}
        />
        {departamentos.map((dep) => (
          <NavItem
            key={dep}
            label={dep}
            active={filters.departamento === dep}
            onClick={() => setFilter("departamento", dep)}
            disabled={!hasData}
          />
        ))}
        {hasData && departamentos.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-600">Sin departamentos en los datos</p>
        )}
        {!hasData && <p className="px-3 py-2 text-xs text-slate-600">Sube un archivo para ver departamentos</p>}
      </nav>
    </aside>
  );
}

function NavItem({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-accent/15 text-accent-soft font-medium" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      ].join(" ")}
    >
      <Shirt className="h-3.5 w-3.5 flex-none opacity-70" />
      <span className="truncate">{label}</span>
    </button>
  );
}
