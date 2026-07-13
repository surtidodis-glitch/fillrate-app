"use client";

// components/Sidebar.tsx
// Navegación jerárquica: "Todos" + un ítem por cada departamento presente
// en los datos, cada uno expandible en sus categorías. El ícono cambia
// según el departamento (Ropa vs Otros vs uno futuro no listado).

import { useState } from "react";
import { LayoutGrid, Shirt, Package, Boxes, ChevronDown, ChevronRight } from "lucide-react";
import { useFillRateData } from "@/context/DataContext";
import { uniqueValues } from "@/lib/aggregations";
import { getDepartmentIcon, orderCategorias, type DepartmentIconKey } from "@/lib/departments";

const ICONS: Record<DepartmentIconKey, typeof Shirt> = {
  ropa: Shirt,
  otros: Package,
  default: Boxes,
};

export default function Sidebar() {
  const { rows, filters, setFilter, setDepartamentoYCategoria, hasData } = useFillRateData();
  const departamentos = uniqueValues(rows, "departamento");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (dep: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(dep) ? next.delete(dep) : next.add(dep);
      return next;
    });
  };

  return (
    <aside className="hidden w-64 flex-none border-r border-base-border bg-base-surface/40 p-4 lg:block">
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
          icon={LayoutGrid}
          label="Todos"
          active={filters.departamento === "Todos"}
          onClick={() => setFilter("departamento", "Todos")}
          disabled={!hasData}
        />

        {departamentos.map((dep) => {
          const Icon = ICONS[getDepartmentIcon(dep)];
          const categoriasEnDatos = uniqueValues(
            rows.filter((r) => r.departamento === dep),
            "categoria"
          );
          const categorias = orderCategorias(dep, categoriasEnDatos);
          const isExpanded = expanded.has(dep);
          const isActive = filters.departamento === dep && filters.categoria === "Todos";

          return (
            <div key={dep}>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setFilter("departamento", dep);
                    setFilter("categoria", "Todos");
                  }}
                  disabled={!hasData}
                  className={[
                    "flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    isActive ? "bg-accent/15 text-accent-soft font-medium" : "text-slate-300 hover:bg-white/5 hover:text-slate-100",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 flex-none opacity-80" />
                  <span className="truncate">{dep}</span>
                </button>
                {categorias.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(dep)}
                    disabled={!hasData}
                    className="rounded-md p-1.5 text-slate-500 hover:text-slate-300 disabled:opacity-40"
                    aria-label={isExpanded ? "Contraer" : "Expandir"}
                  >
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-base-border pl-3">
                  {categorias.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setDepartamentoYCategoria(dep, cat)}
                      className={[
                        "block w-full truncate rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                        filters.departamento === dep && filters.categoria === cat
                          ? "bg-accent/15 text-accent-soft font-medium"
                          : "text-slate-500 hover:bg-white/5 hover:text-slate-300",
                      ].join(" ")}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {hasData && departamentos.length === 0 && (
          <p className="px-3 py-2 text-xs text-slate-600">Sin departamentos en los datos</p>
        )}
        {!hasData && <p className="px-3 py-2 text-xs text-slate-600">Sube un archivo para ver departamentos</p>}
      </nav>
    </aside>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: typeof Shirt;
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
      <Icon className="h-3.5 w-3.5 flex-none opacity-70" />
      <span className="truncate">{label}</span>
    </button>
  );
}
