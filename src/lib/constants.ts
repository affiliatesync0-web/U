
export const NICA_BANKS = [
  "Banpro",
  "BAC Credomatic",
  "Ficohsa",
  "Banco LAFISE BANCENTRO",
  "Banco Avanz",
  "Banco de Finanzas (BDF)",
] as const;

export type NicaBank = typeof NICA_BANKS[number];

export const PRODUCT_CATEGORIES = [
  "Digital Product",
  "Service",
  "Infoproduct",
  "Course",
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
