import type { Language } from '@/lib/i18n/ui';

// Datos ficticios para las maquetas de la landing: nunca se piden a la API.
// Se usa example.com (dominio reservado) para no apuntar a sitios reales.
// El title y la description "después" miden 60 y 155 caracteres: el rango óptimo de SERPPreview.

export const EXAMPLE_URL = 'https://www.example.com/acapulco/';

interface LandingExamples {
  serp: { title: string; description: string };
  titleBefore: string;
  organizations: { name: string; sites: number; role: string }[];
}

export const LANDING_EXAMPLES: Record<Language, LandingExamples> = {
  es: {
    serp: {
      title: 'Hotel Brisa Marina en Acapulco | Frente al mar en la Costera',
      description:
        'Habitaciones con vista a la bahía, alberca infinita y desayuno incluido a pasos de la playa. Reserva directo en Hotel Brisa Marina y obtén la mejor tarifa.',
    },
    titleBefore: 'Inicio',
    organizations: [
      { name: 'Grupo Hotelero Brisa', sites: 4, role: 'Propietario' },
      { name: 'Clínica Dental Sonrisa', sites: 2, role: 'Administrador' },
      { name: 'Tienda Café de Altura', sites: 2, role: 'Miembro' },
    ],
  },
  en: {
    serp: {
      title: 'Hotel Brisa Marina in Acapulco | Beachfront Hotel on the Bay',
      description:
        'Bay-view rooms, an infinity pool, and free breakfast just steps from the beach. Book direct with Hotel Brisa Marina Acapulco and get our best rates online.',
    },
    titleBefore: 'Home',
    organizations: [
      { name: 'Brisa Hotel Group', sites: 4, role: 'Owner' },
      { name: 'Bright Smile Dental', sites: 2, role: 'Admin' },
      { name: 'Highland Coffee Shop', sites: 2, role: 'Member' },
    ],
  },
};

// Código de ejemplo: es igual en ambos idiomas salvo la descripción
export function exampleJsonLd(lang: Language): string {
  const description =
    lang === 'es'
      ? 'Hotel frente al mar en la bahía de Acapulco.'
      : 'Beachfront hotel on Acapulco Bay.';
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      '@id': 'https://www.example.com/#hotel-acapulco',
      name: 'Hotel Brisa Marina Acapulco',
      description,
      telephone: '+52 744 000 0000',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Costera Miguel Alemán 100',
        addressLocality: 'Acapulco',
        addressCountry: 'MX',
      },
      parentOrganization: { '@id': 'https://www.example.com/#org' },
    },
    null,
    2
  );
}

export function exampleLlmsTxt(lang: Language): string {
  return lang === 'es'
    ? [
        '# Hotel Brisa Marina',
        '',
        '> Hotel frente al mar en Acapulco con alberca infinita y desayuno incluido.',
        '',
        '## Páginas principales',
        '- [Habitaciones](https://www.example.com/acapulco/habitaciones/)',
        '- [Restaurante](https://www.example.com/acapulco/restaurante/)',
        '- [Contacto](https://www.example.com/acapulco/contacto/)',
      ].join('\n')
    : [
        '# Hotel Brisa Marina',
        '',
        '> Beachfront hotel in Acapulco with an infinity pool and breakfast included.',
        '',
        '## Main pages',
        '- [Rooms](https://www.example.com/en/acapulco/rooms/)',
        '- [Restaurant](https://www.example.com/en/acapulco/restaurant/)',
        '- [Contact](https://www.example.com/en/acapulco/contact/)',
      ].join('\n');
}
