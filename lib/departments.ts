// lib/departments.ts
// Config de negocio: qué categorías pertenecen a cada departamento y en qué
// orden mostrarlas, más qué ícono usa cada departamento en el sidebar.
// Si en los datos aparece un departamento o categoría que no está listado
// aquí, igual se muestra (al final, en orden alfabético) — esto es solo
// para dar orden y un ícono a los casos conocidos, no una lista cerrada.

export type DepartmentIconKey = "ropa" | "otros" | "default";

export interface DepartmentConfig {
  departamento: string;
  icon: DepartmentIconKey;
  categorias: string[];
}

export const DEPARTMENT_CONFIG: DepartmentConfig[] = [
  {
    departamento: "ROPA",
    icon: "ropa",
    categorias: ["ROPA COLOR", "ROPA PREMIUM", "CAMA", "INV", "TRAJE DE BAÑO", "PLUS SIZE"],
  },
  {
    departamento: "OTROS",
    icon: "otros",
    categorias: [
      "CALZADO GENERAL",
      "CALZADO PREMIUM",
      "CARTERA GENERAL",
      "CARTERA PREMIUM",
      "ACCESORIO",
      "JUGUETE",
      "HOGAR GENERAL",
      "BISUTERÍA",
      "BICICLETA",
    ],
  },
];

export function getDepartmentIcon(departamento: string): DepartmentIconKey {
  const found = DEPARTMENT_CONFIG.find((d) => d.departamento.toLowerCase() === departamento.toLowerCase());
  return found?.icon ?? "default";
}

/** Ordena las categorías de un departamento según el orden de negocio conocido; el resto va al final, alfabético. */
export function orderCategorias(departamento: string, categoriasEnDatos: string[]): string[] {
  const config = DEPARTMENT_CONFIG.find((d) => d.departamento.toLowerCase() === departamento.toLowerCase());
  if (!config) return [...categoriasEnDatos].sort((a, b) => a.localeCompare(b, "es"));

  const known = config.categorias.filter((c) => categoriasEnDatos.some((x) => x.toLowerCase() === c.toLowerCase()));
  const knownLower = new Set(known.map((c) => c.toLowerCase()));
  const unknown = categoriasEnDatos.filter((c) => !knownLower.has(c.toLowerCase())).sort((a, b) => a.localeCompare(b, "es"));
  return [...known, ...unknown];
}
