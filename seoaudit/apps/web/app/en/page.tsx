import { Landing } from '@/components/landing/Landing';
import { landingMetadata } from '@/lib/landingMetadata';

export function generateMetadata() {
  return landingMetadata('en');
}

export default function HomeEn() {
  return <Landing lang="en" />;
}
