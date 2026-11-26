import { Landing } from '@/components/landing/Landing';
import { landingMetadata } from '@/lib/landingMetadata';

export function generateMetadata() {
  return landingMetadata('es');
}

export default function Home() {
  return <Landing lang="es" />;
}
