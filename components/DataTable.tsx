"use client";

// components/DataTable.tsx
// Paginación 100% en memoria (slice del array ya filtrado). Con miles
// de filas esto es instantáneo; el export toma TODAS las filas filtradas,
// no solo la página visible en pantalla.

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileDown, FileSpreadsheet } from "lucide-react";
import { useFillRateData } from "@/context/DataContext";
import { exportToExcel, exportToPdf } from "@/lib/exportUtils";
import { getClasificacionColor } from "@/lib/colors";
import { formatPercent, formatNumber } from "@/lib/format";
import ChartCard from "./ChartCard";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export default function DataTable() {
  const { filteredRows } = useFillRateData();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleExportExcel = () => {
    setExporting("xlsx");
    try {
      exportToExcel(filteredRows);
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    setExporting("pdf");
    try {
      await exportToPdf(filteredRows);
    } finally {
      setExporting(null);
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportExcel}
        disabled={exporting !== null || filteredRows.length === 0}
        className="flex items-center gap-1.5 rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-slate-300 hover:border-emerald-600 hover:text-emerald-300 disabled:opacity-40"
      >
        <FileSpreadsheet className="h-3.5 w-3.5" />
        Excel
      </button>
      <button
        onClick={handleExportPdf}
        disabled={exporting !== null || filteredRows.length === 0}
        className="flex items-center gap-1.5 rounded-lg border border-base-border px-2.5 py-1.5 text-xs text-slate-300 hover:border-rose-600 hover:text-rose-300 disabled:opacity-40"
      >
        <FileDown className="h-3.5 w-3.5" />
        {exporting === "pdf" ? "Generando…" : "PDF"}
      </button>
    </div>
  );

  return (
    <ChartCard title="Detalle" subtitle={`${formatNumber(filteredRows.length)} registros con el filtro actual`} actions={actions}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-base-border text-[11px] uppercase tracking-wide text-slate-500">
              <Th>Semana</Th>
              <Th>País</Th>
              <Th>Tienda</Th>
              <Th>Departamento</Th>
              <Th>Categoría</Th>
              <Th>Subcategoría</Th>
              <Th align="right">Surtido</Th>
              <Th align="right">Entregado</Th>
              <Th align="right">Fill Rate</Th>
              <Th>Clasificación</Th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, i) => (
              <tr key={i} className="border-b border-base-border/60 text-slate-300 hover:bg-white/5">
                <Td>{r.semana}</Td>
                <Td>{r.pais}</Td>
                <Td className="max-w-[160px] truncate">{r.tienda}</Td>
                <Td>{r.departamento}</Td>
                <Td>{r.categoria}</Td>
                <Td>{r.subcategoria}</Td>
                <Td align="right">{formatNumber(r.surtido)}</Td>
                <Td align="right">{formatNumber(r.entrega)}</Td>
                <Td align="right">{formatPercent(r.fillRate)}</Td>
                <Td>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${getClasificacionColor(r.clasificacion)}26`, color: getClasificacionColor(r.clasificacion) }}
                  >
                    {r.clasificacion}
                  </span>
                </Td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-600">
                  Sin registros para el filtro actual
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Filas por página</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-base-border bg-base-surface2 px-2 py-1 text-slate-300 outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span>
            Página {currentPage} de {pageCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-md border border-base-border p-1 disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
              className="rounded-md border border-base-border p-1 disabled:opacity-30"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return <th className={`py-2 pr-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}

function Td({ children, align = "left", className = "" }: { children: React.ReactNode; align?: "left" | "right"; className?: string }) {
  return <td className={`py-2 pr-3 ${align === "right" ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}
