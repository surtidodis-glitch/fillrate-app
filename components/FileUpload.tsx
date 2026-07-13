"use client";

// components/FileUpload.tsx
// Carga de Excel 100% en cliente. Al parsear correctamente, escribe
// el resultado directamente en el DataContext para que todo el
// dashboard (KPIs, gráficos, tabla) se actualice de una sola vez.

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { parseWorkbookFile } from "@/lib/parseExcel";
import type { ParseResult, MezclaParseResult } from "@/lib/types";
import { useFillRateData } from "@/context/DataContext";

type Status = "idle" | "dragging" | "parsing" | "success" | "error";

export default function FileUpload() {
  const { loadParsedData } = useFillRateData();
  const [status, setStatus] = useState<Status>("idle");
  const [lastResult, setLastResult] = useState<ParseResult | null>(null);
  const [lastMezcla, setLastMezcla] = useState<MezclaParseResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!/\.xlsx$/i.test(file.name)) {
        setStatus("error");
        setErrorMessage("El archivo debe tener extensión .xlsx");
        return;
      }

      setStatus("parsing");
      setErrorMessage(null);

      try {
        const { base: result, mezcla } = await parseWorkbookFile(file);

        if (result.missingColumns.length > 0) {
          setStatus("error");
          setErrorMessage(`Faltan columnas obligatorias en BASE_MAESTRA: ${result.missingColumns.join(", ")}.`);
          setLastResult(result);
          return;
        }

        if (result.rows.length === 0) {
          setStatus("error");
          setErrorMessage("No se encontraron filas válidas para cargar.");
          setLastResult(result);
          return;
        }

        setLastResult(result);
        setLastMezcla(mezcla);
        setStatus("success");
        loadParsedData(result, mezcla);
      } catch (err) {
        setStatus("error");
        setErrorMessage((err as Error).message);
      }
    },
    [loadParsedData]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setStatus("idle");
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const isBusy = status === "parsing";

  return (
    <div className="w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setStatus("dragging");
        }}
        onDragLeave={() => setStatus((s) => (s === "dragging" ? "idle" : s))}
        onDrop={onDrop}
        onClick={() => !isBusy && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer outline-none",
          "bg-base-surface/60 backdrop-blur",
          status === "dragging" ? "border-accent bg-accent/10" : "border-base-border hover:border-slate-500",
          isBusy ? "cursor-wait opacity-80" : "",
        ].join(" ")}
      >
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={onInputChange} disabled={isBusy} />

        {isBusy ? (
          <Loader2 className="h-10 w-10 animate-spin text-accent-soft" />
        ) : (
          <UploadCloud className="h-10 w-10 text-slate-400" />
        )}

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-200">
            {isBusy ? "Procesando archivo…" : "Arrastra tu archivo .xlsx aquí"}
          </p>
          <p className="text-xs text-slate-500">
            {isBusy
              ? "Leyendo BASE_MAESTRA, esto puede tardar unos segundos"
              : "o haz clic para seleccionarlo — solo se procesa la hoja BASE_MAESTRA"}
          </p>
        </div>
      </div>

      {status === "success" && lastResult && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-400" />
          <div className="text-sm text-emerald-200">
            <p className="font-medium">
              {lastResult.fileName}: {lastResult.rows.length.toLocaleString("es")} filas cargadas
              {lastResult.totalRowsInSheet !== lastResult.rows.length && (
                <span className="text-emerald-400/80">
                  {" "}
                  (de {lastResult.totalRowsInSheet.toLocaleString("es")} en la hoja)
                </span>
              )}
            </p>
            {lastResult.warnings.length > 0 && (
              <p className="mt-1 text-emerald-400/80">{lastResult.warnings.length} advertencia(s) — ver detalle abajo.</p>
            )}
            {lastMezcla && (
              <p className="mt-1 text-emerald-400/70">
                {lastMezcla.found
                  ? `Hoja DATOS_MEZCLA detectada: ${lastMezcla.tables.length} tabla(s) de mezcla.`
                  : "No se encontró la hoja DATOS_MEZCLA (opcional) — se omite esa sección."}
              </p>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-4 py-3">
          <XCircle className="mt-0.5 h-5 w-5 flex-none text-rose-400" />
          <p className="text-sm text-rose-200">{errorMessage}</p>
        </div>
      )}

      {lastResult && (lastResult.warnings.length > 0 || lastResult.errors.length > 0) && (
        <details className="mt-3 rounded-lg border border-base-border bg-base-surface/60">
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-medium text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            {lastResult.errors.length} fila(s) descartada(s) · {lastResult.warnings.length} advertencia(s)
          </summary>
          <div className="max-h-48 overflow-y-auto border-t border-base-border px-4 py-2 text-xs text-slate-400">
            {[...lastResult.errors, ...lastResult.warnings]
              .sort((a, b) => a.row - b.row)
              .map((issue, i) => (
                <div key={i} className="py-0.5">
                  <span className="text-slate-500">Fila {issue.row}:</span> {issue.message}
                </div>
              ))}
          </div>
        </details>
      )}

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
        <FileSpreadsheet className="h-3.5 w-3.5" />
        <span>Se ignora la hoja &quot;SV&quot;. No se usan tablas dinámicas.</span>
      </div>
    </div>
  );
}
