"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useFillRateData } from "@/context/DataContext";
import Sidebar from "@/components/Sidebar";
import FiltersBar from "@/components/FiltersBar";
import FileUpload from "@/components/FileUpload";
import KpiCards from "@/components/KpiCards";
import TopEntregaChart from "@/components/TopEntregaChart";
import CategoryChart from "@/components/CategoryChart";
import TopStoresChart from "@/components/TopStoresChart";
import ClassificationDistribution from "@/components/ClassificationDistribution";
import MezclaTables from "@/components/MezclaTables";
import DataTable from "@/components/DataTable";

export default function Home() {
  const { hasData, fileMeta } = useFillRateData();
  const [showUploader, setShowUploader] = useState(false);

  // El título de la pestaña del navegador refleja que hay un archivo cargado,
  // sin mostrar el nombre completo del archivo con su extensión.
  useEffect(() => {
    document.title = fileMeta ? "Fill Rate Analytics · datos cargados" : "Fill Rate Analytics";
  }, [fileMeta]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-base-border bg-base-surface/40 px-6 py-4">
          <div />
          <h1 className="text-center text-2xl font-bold tracking-tight text-slate-100">Fill Rate Analytics</h1>
          <div className="flex justify-end">
            {hasData && (
              <button
                onClick={() => setShowUploader((s) => !s)}
                className="flex items-center gap-1.5 rounded-lg border border-base-border px-3 py-1.5 text-xs text-slate-300 hover:border-accent hover:text-accent-soft"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Cargar otro archivo
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 space-y-4 p-6">
          {!hasData || showUploader ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              {!hasData && (
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-100">Sube tu archivo de Fill Rate</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Se leerá la hoja <span className="font-mono text-slate-400">BASE_MAESTRA</span>. La hoja{" "}
                    <span className="font-mono text-slate-400">SV</span> se ignora automáticamente.
                  </p>
                </div>
              )}
              <FileUpload />
              {hasData && (
                <button onClick={() => setShowUploader(false)} className="text-xs text-slate-500 hover:text-slate-300">
                  Volver al dashboard
                </button>
              )}
            </div>
          ) : (
            <>
              <FiltersBar />
              <KpiCards />

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TopEntregaChart />
                <CategoryChart />
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <TopStoresChart />
                <ClassificationDistribution />
              </div>

              <MezclaTables />

              <DataTable />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
