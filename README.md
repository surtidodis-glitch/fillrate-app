# Fill Rate Analytics

Dashboard de Fill Rate **100% cliente**: no hay backend ni base de datos. El
usuario sube un `.xlsx`, se procesa en el navegador con [SheetJS](https://sheetjs.com/)
y todo (KPIs, gráficos, tabla) se calcula en memoria a partir de ese archivo.

## Requisitos del Excel

- Debe existir una hoja llamada **`BASE_MAESTRA`** con todos los registros.
- La hoja **`SV`**, si existe, se ignora por completo.
- No se usan tablas dinámicas: se lee la hoja como datos planos.
- Columnas requeridas (el orden no importa, los nombres se detectan sin
  distinguir mayúsculas/acentos):

  | Columna       | Notas                                                  |
  | ------------- | ------------------------------------------------------- |
  | Semana        |                                                           |
  | País          |                                                           |
  | Tienda        |                                                           |
  | Departamento  |                                                           |
  | Categoría     |                                                           |
  | Subcategoría  |                                                           |
  | Surtido       | numérico                                                 |
  | Entregado     | numérico                                                 |
  | Fill Rate     | opcional — si viene vacío se calcula como Entregado/Surtido |
  | Clasificación | Overfilled / Completa / Básico / Undersized              |

Si falta alguna columna obligatoria, la app avisa exactamente cuál antes de
cargar nada. Las filas con datos inválidos se descartan y quedan listadas en
el panel de advertencias/errores debajo del uploader.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Build de producción (estático)

```bash
npm run build
```

Esto genera la carpeta `out/` con HTML/JS/CSS estático — sin servidor Node
necesario, se puede servir desde cualquier hosting estático.

## Desplegar en Vercel

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com), "Add New Project" → importa el repo.
3. No requiere variables de entorno. Vercel detecta Next.js automáticamente.

## Desplegar en GitHub Pages

Ya incluye un workflow en `.github/workflows/deploy.yml` que compila y publica
automáticamente en cada push a `main`.

1. **Antes de subir**, edita `next.config.js` y cambia `REPO_NAME` por el
   nombre real de tu repositorio (ej. si tu repo es
   `github.com/tuempresa/fillrate-app`, deja `"fillrate-app"`).
2. En GitHub: **Settings → Pages → Source → GitHub Actions**.
3. Haz push a `main`. La Action compila con `DEPLOY_TARGET=github-pages`
   (activa el `basePath` correcto) y publica el contenido de `out/`.
4. Tu app quedará en `https://tu-usuario.github.io/nombre-repo/`.

## Estructura

```
app/                  # rutas de Next.js (App Router)
  layout.tsx           # envuelve todo en <DataProvider>
  page.tsx              # arma sidebar + filtros + KPIs + gráficos + tabla
components/
  FileUpload.tsx         # drag & drop, escribe en el contexto al parsear OK
  Sidebar.tsx             # navegación por departamento
  FiltersBar.tsx           # selects + búsqueda, todos ligados al contexto
  KpiCards.tsx              # Surtido, Entregado, Fill Rate, Cumplimiento, Tiendas, Países
  TrendChart.tsx             # Fill Rate por semana
  SubcategoryChart.tsx        # Entregado por Subcategoría (donut/barras)
  TopStoresChart.tsx           # Top 10 tiendas
  ClassificationDistribution.tsx # % de registros por Clasificación
  ClassificationHeatmap.tsx       # grid Clasificación x Semana
  DataTable.tsx                    # paginación + export Excel/PDF
  ChartCard.tsx                     # wrapper visual compartido
context/
  DataContext.tsx        # estado global: filas cargadas, filtros, filas filtradas
lib/
  types.ts                # tipos compartidos
  parseExcel.ts             # parseo con SheetJS
  aggregations.ts             # KPIs y series de gráficos, calculados en memoria
  exportUtils.ts                # export a Excel (SheetJS) y PDF (jsPDF)
  colors.ts                       # paleta semántica de Clasificación
```

## Nota de rendimiento

Todo el cálculo (filtros, KPIs, agregaciones, paginación) ocurre en memoria
del navegador con `Array.filter`/`reduce`, sin librerías de virtualización.
Esto es instantáneo hasta decenas de miles de filas. Si tu archivo real
supera ese rango y notas lag en los filtros, los puntos a optimizar primero
son: memoizar `filteredRows` de forma más granular, o virtualizar las filas
de `DataTable` (ej. con `react-window`) ya que hoy solo pagina, no virtualiza
el DOM completo — la paginación en sí evita renderizar miles de `<tr>` a la vez.
