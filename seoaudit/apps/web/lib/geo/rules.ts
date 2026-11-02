export const LODGING_TYPES = ['Hotel', 'Resort', 'BedAndBreakfast', 'Hostel', 'Motel', 'VacationRental'] as const;

export const SUPPORTED_TYPES = ['Organization', 'LocalBusiness', 'LodgingBusiness', ...LODGING_TYPES] as const;

export type SupportedType = (typeof SUPPORTED_TYPES)[number];

export type Family = 'Organization' | 'LocalBusiness' | 'LodgingBusiness';

const PARENT: Record<string, string> = {
  LocalBusiness: 'Organization',
  LodgingBusiness: 'LocalBusiness',
  ...Object.fromEntries(LODGING_TYPES.map((t) => [t, 'LodgingBusiness'])),
};

export interface TypeRules {
  req: string[];
  rec: string[];
  extra: string[];
}

// Derivadas de los schemas que se hacen a mano para hoteles; EXTRA no cuenta para el estado
export const RULES: Record<Family, TypeRules> = {
  Organization: {
    req: ['@id', 'name', 'url', 'logo'],
    rec: ['alternateName', 'description', 'email', 'telephone', 'address', 'contactPoint', 'sameAs', 'parentOrganization'],
    extra: [],
  },
  LocalBusiness: {
    req: ['@id', 'name', 'url', 'address', 'telephone'],
    rec: ['alternateName', 'description', 'image', 'geo', 'openingHours', 'sameAs', 'parentOrganization'],
    extra: ['priceRange'],
  },
  LodgingBusiness: {
    req: ['@id', 'name', 'url', 'address', 'telephone'],
    rec: ['alternateName', 'description', 'image', 'geo', 'amenityFeature', 'sameAs', 'parentOrganization'],
    extra: ['checkinTime', 'checkoutTime', 'priceRange', 'starRating', 'numberOfRooms', 'petsAllowed'],
  },
};

export function isSupportedType(type: string): type is SupportedType {
  return (SUPPORTED_TYPES as readonly string[]).includes(type);
}

/** Cadena de ancestros incluyendo el propio tipo: Resort -> LodgingBusiness -> LocalBusiness -> Organization. */
export function ancestry(type: string): string[] {
  const chain = [type];
  let current = type;
  while (PARENT[current]) {
    current = PARENT[current];
    chain.push(current);
  }
  return chain;
}

/** `actual` satisface a `expected` si es el mismo tipo o un subtipo suyo. */
export function isCompatibleType(actual: string, expected: string): boolean {
  return ancestry(actual).includes(expected);
}

export function familyOf(type: string): Family | null {
  const chain = ancestry(type);
  if (chain.includes('LodgingBusiness')) return 'LodgingBusiness';
  if (chain.includes('LocalBusiness')) return 'LocalBusiness';
  if (chain.includes('Organization')) return 'Organization';
  return null;
}

export function rulesFor(type: string): TypeRules | null {
  const family = familyOf(type);
  return family ? RULES[family] : null;
}
