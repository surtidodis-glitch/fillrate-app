// lib/mezclaTargets.ts
// El "% Requerido" es una META de negocio (cuánto debería representar cada
// TIPO dentro de la mezcla total), no un dato que venga en el Excel — por
// eso se define aquí como configuración editable, no se calcula del archivo.
//
// EDITA ESTOS NÚMEROS si cambian: solo tienen que sumar 100 dentro de cada
// categoría. Si aparece un TIPO nuevo que no está aquí, se muestra igual
// pero sin "% Requerido" (queda en blanco).

export const MEZCLA_TARGETS: Record<string, Record<string, number>> = {
  "ROPA COLOR": {
    CREDENCIAL: 35,
    RETORNOS: 25,
    SELECCIONADO: 40,
    "MIX RAG": 0,
  },
  CALZADO: {
    CREDENCIAL: 70,
    RETORNO: 30,
  },
};

export function getMezclaTarget(categoria: string, tipo: string): number | undefined {
  return MEZCLA_TARGETS[categoria.toUpperCase()]?.[tipo.toUpperCase()];
}
