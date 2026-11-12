// Ejemplos reales de JSON-LD hechos a mano para Las Brisas; sirven como referencia de "completo".

export const brisasResort = {
  '@context': 'https://schema.org',
  '@type': 'Resort',
  '@id': 'https://www.lasbrisashotels.com.mx/es/acapulco/#hotel',
  name: 'Las Brisas Acapulco',
  alternateName: ['Hotel Las Brisas Acapulco'],
  description:
    'Vive Acapulco desde un hotel icónico con vistas espectaculares a la bahía, espacios para desconectar y un servicio pensado para consentirte en cada momento.',
  url: 'https://www.lasbrisashotels.com.mx/es/acapulco/',
  image:
    'https://res.cloudinary.com/itermotus/f_auto,q_auto,w_1400,h_900,c_fill/assets/lasbrisashotels/acapulco/galeria/acapulco_galeria-01.jpg',
  telephone: '+52 744 469 6900',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Escénica 5255, Las Brisas',
    addressLocality: 'Acapulco de Juárez',
    addressRegion: 'Guerrero',
    postalCode: '39867',
    addressCountry: 'MX',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 16.826196, longitude: -99.862053 },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Casitas con alberca privada', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Casitas con alberca semiprivada', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'La Concha Beach Club', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Área solo adultos (Brisas Beach Club)', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Spa', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Gimnasio', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Renta de jeeps', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurantes con vista a la bahía', value: true },
  ],
  sameAs: [
    'https://www.instagram.com/lasbrisasacapulco/',
    'https://mx.linkedin.com/company/grupobrisas',
    'https://www.tiktok.com/@hotelesgrupobrisas',
    'https://www.facebook.com/LasBrisasAcapulco',
    'https://twitter.com/brisasacapulco',
  ],
  parentOrganization: { '@id': 'https://www.lasbrisashotels.com.mx/#organization' },
};

export const brisasOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.lasbrisashotels.com.mx/#organization',
  name: 'Las Brisas Hotels',
  alternateName: ['Hoteles Las Brisas'],
  url: 'https://www.lasbrisashotels.com.mx/',
  logo: 'https://res.cloudinary.com/itermotus/f_png,h_200/assets/brisas/logo-las-brisas-horizontal.svg',
  image: 'https://res.cloudinary.com/itermotus/f_png,h_200/assets/brisas/logo-las-brisas-horizontal.svg',
  email: 'info@brisas.com.mx',
  telephone: '+52 55 5339 1010',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Universidad No. 1571, piso 3, col. Florida',
    addressLocality: 'Álvaro Obregón',
    addressRegion: 'Ciudad de México',
    postalCode: '01030',
    addressCountry: 'MX',
  },
  parentOrganization: {
    '@type': 'Organization',
    '@id': 'https://www.brisas.com.mx/#organization',
    name: 'Grupo Brisas',
    url: 'https://www.brisas.com.mx/',
  },
  sameAs: [
    'https://www.facebook.com/GpoBrisas/',
    'https://www.instagram.com/grupobrisashoteles/',
    'https://www.youtube.com/@GrupoBrisasMexico',
    'https://mx.linkedin.com/company/grupobrisas',
    'https://www.tiktok.com/@hotelesgrupobrisas',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+52 55 5339 1010',
    contactType: 'Atención al Cliente',
    email: 'info@brisas.com.mx',
  },
  description:
    'Colección mexicana de resorts y hoteles: Las Brisas Acapulco, Las Brisas Ixtapa, Las Brisas Huatulco y Las Hadas by Brisas (Manzanillo) frente al mar; Hacienda Jurica by Brisas (Querétaro) y Las Brisas Mérida en ciudad; y Sunrock Hotel & Suites en Los Cabos.',
};

export const acapulcoPageUrl = 'https://www.lasbrisashotels.com.mx/es/acapulco/';

// Página de muestra con footer de contacto, redes y JSON-LD en <head> y <body>
export const acapulcoPageHtml = `<!doctype html>
<html lang="es">
<head>
  <title>Las Brisas Acapulco | Hotel frente a la bahía</title>
  <meta name="description" content="Hotel icónico en Acapulco con casitas y alberca privada.">
  <meta property="og:image" content="https://res.cloudinary.com/itermotus/acapulco-og.jpg">
  <script type="application/ld+json">${JSON.stringify(brisasOrganization)}</script>
</head>
<body>
  <header><img src="/img/logo.svg" alt="Las Brisas Hotels"></header>
  <main>
    <h1>Las Brisas Acapulco</h1>
    <p>Disfruta casitas con alberca privada, spa, gimnasio y La Concha Beach Club.</p>
    <img src="https://res.cloudinary.com/itermotus/acapulco_galeria-01.jpg" alt="Vista a la bahía">
    <a href="/es/acapulco/habitaciones/">Habitaciones</a>
  </main>
  <footer>
    <p>Escénica 5255, Las Brisas, Acapulco de Juárez, Guerrero, C.P. 39867, México</p>
    <a href="tel:+527444696900">+52 744 469 6900</a>
    <a href="mailto:reservaciones@brisas.com.mx">reservaciones@brisas.com.mx</a>
    <a href="https://www.instagram.com/lasbrisasacapulco/">Instagram</a>
    <a href="https://www.facebook.com/LasBrisasAcapulco">Facebook</a>
    <a href="https://www.google.com/maps/place/Las+Brisas/@16.826196,-99.862053,17z">Cómo llegar</a>
  </footer>
  <script type="application/ld+json">${JSON.stringify(brisasResort)}</script>
</body>
</html>`;
