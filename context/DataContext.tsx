"use client";

// context/DataContext.tsx
// Única fuente de verdad del dashboard: las filas parseadas del Excel
// y el estado de los filtros. Todo vive en memoria del navegador.

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { FillRateRow, FilterState, FilterField, ParseResult } from "@/lib/types";
import { EMPTY_FILTERS } from "@/lib/types";

interface DataContextValue {
  rows: FillRateRow[];
  filteredRows: FillRateRow[];
  filters: FilterState;
  setFilter: (field: FilterField | "q", value: string) => void;
  resetFilters: () => void;
  fileMeta: { fileName: string; totalRowsInSheet: number; warnings: number; errors: number } | null;
  loadParsedData: (result: ParseResult) => void;
  hasData: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<FillRateRow[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [fileMeta, setFileMeta] = useState<DataContextValue["fileMeta"]>(null);

  const loadParsedData = (result: ParseResult) => {
    setRows(result.rows);
    setFilters(EMPTY_FILTERS);
    setFileMeta({
      fileName: result.fileName,
      totalRowsInSheet: result.totalRowsInSheet,
      warnings: result.warnings.length,
      errors: result.errors.length,
    });
  };

  const setFilter = (field: FilterField | "q", value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.semana !== "Todos" && r.semana !== filters.semana) return false;
      if (filters.pais !== "Todos" && r.pais !== filters.pais) return false;
      if (filters.tienda !== "Todos" && r.tienda !== filters.tienda) return false;
      if (filters.departamento !== "Todos" && r.departamento !== filters.departamento) return false;
      if (filters.categoria !== "Todos" && r.categoria !== filters.categoria) return false;
      if (filters.subcategoria !== "Todos" && r.subcategoria !== filters.subcategoria) return false;
      if (filters.clasificacion !== "Todos" && r.clasificacion !== filters.clasificacion) return false;
      if (q) {
        const haystack = `${r.tienda} ${r.categoria} ${r.subcategoria}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const value: DataContextValue = {
    rows,
    filteredRows,
    filters,
    setFilter,
    resetFilters,
    fileMeta,
    loadParsedData,
    hasData: rows.length > 0,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useFillRateData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useFillRateData debe usarse dentro de <DataProvider>");
  return ctx;
}
