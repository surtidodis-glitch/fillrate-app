// lib/exportUtils.ts
// Exporta las filas actualmente filtradas (no solo la página visible)
// a Excel o PDF. Todo corre en el navegador, sin backend.

import * as XLSX from "xlsx";
import type { FillRateRow } from "./types";

const COLUMNS: { key: keyof FillRateRow; header: string }[] = [
  { key: "semana", header: "Semana" },
  { key: "pais", header: "País" },
  { key: "tienda", header: "Tienda" },
  { key: "departamento", header: "Departamento" },
  { key: "categoria", header: "Categoría" },
  { key: "subcategoria", header: "Subcategoría" },
  { key: "surtido", header: "Surtido" },
  { key: "entrega", header: "Entregado" },
  { key: "fillRate", header: "Fill Rate" },
  { key: "clasificacion", header: "Clasificación" },
];

function timestamp(): string {
  const d = new Date();
  return d.toISOString().slice(0, 16).replace(/[:T]/g, "-");
}

export function exportToExcel(rows: FillRateRow[], fileName = `fillrate-export-${timestamp()}.xlsx`) {
  const data = rows.map((r) => Object.fromEntries(COLUMNS.map((c) => [c.header, r[c.key]])));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "FillRate");
  XLSX.writeFile(workbook, fileName);
}

export async function exportToPdf(rows: FillRateRow[], fileName = `fillrate-export-${timestamp()}.pdf`) {
  // Import dinámico: jsPDF es pesado y solo se necesita cuando el usuario
  // realmente exporta, así no infla el bundle inicial del dashboard.
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(12);
  doc.text("Reporte de Fill Rate", 14, 12);
  doc.setFontSize(8);
  doc.text(`Generado: ${new Date().toLocaleString("es")} · ${rows.length.toLocaleString("es")} registros`, 14, 17);

  autoTable(doc, {
    startY: 22,
    head: [COLUMNS.map((c) => c.header)],
    body: rows.map((r) => COLUMNS.map((c) => String(r[c.key]))),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [15, 20, 32] },
    theme: "grid",
  });

  doc.save(fileName);
}
