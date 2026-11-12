import type { ProfileInput } from '../profile';

const origin = 'https://www.lasbrisashotels.com.mx';

export const brisasProfile: ProfileInput = {
  defaultLanguage: 'es',
  languages: ['en', 'es'],
  businessKind: 'hotel-chain',
  entities: [
    {
      key: 'grupo',
      kind: 'external',
      type: 'Organization',
      id: 'https://www.brisas.com.mx/#organization',
      scope: null,
      parentKey: null,
      facts: {
        name: { value: 'Grupo Brisas', source: 'user' },
        url: { value: 'https://www.brisas.com.mx/', source: 'user' },
      },
      texts: {},
    },
    {
      key: 'org',
      kind: 'internal',
      type: 'Organization',
      id: `${origin}/#organization`,
      scope: '/',
      parentKey: 'grupo',
      facts: {
        name: { value: 'Las Brisas Hotels', source: 'user' },
        url: { value: `${origin}/`, source: 'user' },
        logo: { value: 'https://res.cloudinary.com/itermotus/f_png,h_200/assets/brisas/logo-las-brisas-horizontal.svg', source: 'user' },
        email: { value: 'info@brisas.com.mx', source: 'user' },
        telephone: { value: '+52 55 5339 1010', source: 'user' },
      },
      texts: {
        description: { es: { value: 'Colección mexicana de resorts y hoteles.', source: 'user' } },
      },
    },
    {
      key: 'acapulco',
      kind: 'internal',
      type: 'Resort',
      id: `${origin}/acapulco/#hotel`,
      scope: '/acapulco/',
      parentKey: 'org',
      facts: {
        name: { value: 'Las Brisas Acapulco', source: 'user' },
        url: { value: `${origin}/acapulco/`, source: 'user' },
        telephone: { value: '+52 744 469 6900', source: 'user' },
        address: {
          value: {
            streetAddress: 'Escénica 5255, Las Brisas',
            addressLocality: 'Acapulco de Juárez',
            addressRegion: 'Guerrero',
            postalCode: '39867',
            addressCountry: 'MX',
          },
          source: 'user',
        },
        geo: { value: { latitude: 16.826196, longitude: -99.862053 }, source: 'user' },
        image: { value: 'https://res.cloudinary.com/itermotus/acapulco_galeria-01.jpg', source: 'user' },
        sameAs: { value: ['https://www.instagram.com/lasbrisasacapulco/'], source: 'user' },
        priceRange: { value: '$$$', source: 'user' },
      },
      texts: {
        description: {
          es: { value: 'Hotel icónico con vistas a la bahía.', source: 'user' },
          en: { value: 'Iconic hotel overlooking the bay.', source: 'user' },
        },
        amenities: {
          es: { value: ['Spa', 'Gimnasio'], source: 'user' },
          en: { value: ['Spa', 'Gym'], source: 'user' },
        },
        alternateName: { es: { value: ['Hotel Las Brisas Acapulco'], source: 'user' } },
      },
    },
  ],
};
