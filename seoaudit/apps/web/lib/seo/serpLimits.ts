/** Rangos de longitud (caracteres) de title y description en los resultados de Google. */
export const SERP_LIMITS = {
  desktop: { titleMin: 30, titleIdeal: 60, titleMax: 70, descMin: 120, descIdeal: 155, descMax: 170 },
  mobile: { titleMin: 30, titleIdeal: 55, titleMax: 60, descMin: 100, descIdeal: 120, descMax: 130 },
} as const;
