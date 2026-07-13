"use client";

// context/DataContext.tsx
// Única fuente de verdad del dashboard: las filas parseadas de BASE_MAESTRA,
// las tablas de DATOS_MEZCLA (opcional) y el estado de los filtros. Todo
// vive en memoria del navegador.

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { FillRateRow, FilterState, FilterField, ParseResult, MezclaParseResult } from "@/lib/types";
import { EMPTY_FILTERS, EMPTY_MEZCLA } from "@/lib/types";

interface DataContextValue {
  rows: FillRateRow[];
  filteredRows: FillRateRow[];
  filters: FilterState;
  setFilter: (field: FilterField | "q", value: string) => void;
  setDepartamentoYCategoria: (departamento: string, categoria: string) => void;
  resetFilters: () => void;
  fileMeta: { fileName: string; totalRowsInSheet: number; warnings: number; errors: number } | null;
  mezcla: MezclaParseResult;
  loadParsedData: (base: ParseResult, mezcla: MezclaParseResult) => void;
  hasData: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<FillRateRow[]>([]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [fileMeta, setFileMeta] = useState<DataContextValue["fileMeta"]>(null);
  const [mezcla, setMezcla] = useState<MezclaParseResult>(EMPTY_MEZCLA);

  const loadParsedData = (base: ParseResult, mezclaResult: MezclaParseResult) => {
    setRows(base.rows);
    setFilters(EMPTY_FILTERS);
    setMezcla(mezclaResult);
    setFileMeta({
      fileName: base.fileName,
      totalRowsInSheet: base.totalRowsInSheet,
      warnings: base.warnings.length,
      errors: base.errors.length,
    });
  };

  const setFilter = (field: FilterField | "q", value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Usado por el sidebar: al elegir una categoría dentro de un departamento,
  // se fijan ambos filtros a la vez (departamento + categoría específica).
  const setDepartamentoYCategoria = (departamento: string, categoria: string) => {
    setFilters((prev) => ({ ...prev, departamento, categoria }));
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
    setDepartamentoYCategoria,
    resetFilters,
    fileMeta,
    mezcla,
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
