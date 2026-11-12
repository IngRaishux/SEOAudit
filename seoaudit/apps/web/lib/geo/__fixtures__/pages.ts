import type { GeoPage } from '../pages';
import { brisasOrganization, brisasResort } from './brisas';

const origin = 'https://www.lasbrisashotels.com.mx';

const footerLinks = [
  { url: 'tel:+527444696900', text: '+52 744 469 6900', isExternal: false },
  { url: 'mailto:reservaciones@brisas.com.mx', text: 'reservaciones@brisas.com.mx', isExternal: false },
  { url: 'https://www.instagram.com/lasbrisasacapulco/', text: 'Instagram', isExternal: true },
  { url: 'https://www.facebook.com/LasBrisasAcapulco', text: 'Facebook', isExternal: true },
  { url: 'https://www.facebook.com/sharer/sharer.php?u=x', text: 'Compartir', isExternal: true },
  { url: 'https://www.google.com/maps/place/Las+Brisas/@16.826196,-99.862053,17z', text: 'Cómo llegar', isExternal: true },
];

const block = (parsed: unknown) => ({ raw: JSON.stringify(parsed), parsed, parseError: null });

/** Página del hotel sin JSON-LD: todo sale de las señales. */
export function acapulcoPageWithoutJsonLd(): GeoPage {
  return {
    _id: 'p-aca-es',
    url: `${origin}/acapulco/`,
    statusCode: 200,
    title: 'Las Brisas Acapulco | Hotel frente a la bahía',
    description: 'Hotel icónico en Acapulco.',
    canonical: `${origin}/acapulco/`,
    links: footerLinks,
    images: [{ url: `${origin}/img/logo.svg`, alt: 'Las Brisas Hotels' }],
    metaTags: [{ name: 'og:image', content: 'https://res.cloudinary.com/itermotus/acapulco-og.jpg' }],
    jsonLd: [],
    bodyText: 'Las Brisas Acapulco. Disfruta casitas con alberca privada, spa, gimnasio y La Concha Beach Club.',
    footerText: 'Escénica 5255, Las Brisas, Acapulco de Juárez, Guerrero, C.P. 39867, México +52 744 469 6900',
  };
}

export function acapulcoPageWithJsonLd(): GeoPage {
  return { ...acapulcoPageWithoutJsonLd(), _id: 'p-aca-es-ld', jsonLd: [block(brisasOrganization), block(brisasResort)] };
}

export function chainPages(): GeoPage[] {
  const page = (path: string, title: string, statusCode = 200): GeoPage => ({
    _id: `p${path}`,
    url: `${origin}${path}`,
    statusCode,
    title,
    description: `Descripción de ${title}`,
    canonical: `${origin}${path}`,
    links: [],
    images: [],
    metaTags: [],
    jsonLd: [],
    bodyText: title,
    footerText: '',
  });
  return [
    page('/', 'Las Brisas Hotels'),
    page('/contacto/', 'Contacto'),
    page('/ixtapa/', 'Las Brisas Ixtapa'),
    page('/ixtapa/habitaciones/', 'Habitaciones Ixtapa'),
    page('/acapulco/', 'Las Brisas Acapulco'),
    page('/acapulco/habitaciones/', 'Habitaciones Acapulco'),
    page('/acapulco/spa/', 'Spa Acapulco', 404),
    page('/huatulco/', 'Las Brisas Huatulco'),
    page('/blog/', 'Blog'),
    page('/blog/viajar-a-acapulco/', 'Viajar a Acapulco'),
    page('/en/', 'Las Brisas Hotels'),
    page('/en/acapulco/', 'Las Brisas Acapulco'),
    page('/en/acapulco/rooms/', 'Rooms Acapulco'),
  ];
}
