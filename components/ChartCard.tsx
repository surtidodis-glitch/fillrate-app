// components/ChartCard.tsx
// Envoltorio visual compartido por todos los gráficos del dashboard.

import type { ReactNode } from "react";
import { Lightbulb } from "lucide-react";

export default function ChartCard({
  title,
  subtitle,
  actions,
  insight,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  insight?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
      {insight && (
        <div className="mt-3 flex items-start gap-2 border-t border-base-border pt-3 text-xs text-slate-400">
          <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-400/80" />
          <p>{insight}</p>
        </div>
      )}
    </div>
  );
}
