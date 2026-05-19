import Link from "next/link";
import { redirect } from "next/navigation";

const mockSite = {
  url: "https://aluminium-astro-hoteldanzadelsol.vercel.app",
  sitemap:
    "https://aluminium-astro-hoteldanzadelsol.vercel.app/sitemap-index.xml",
  crawledAt: "2026-05-07 14:32",
  totalPages: 12,
  score: 73,
};

const mockPages = [
  {
    url: "https://aluminium-astro-hoteldanzadelsol.vercel.app/",
    statusCode: 200,
    title: "Hotel Danza del Sol — Inicio",
    description: "Disfruta de un hotel boutique en el corazón de la ciudad.",
    h1: ["Bienvenidos a Danza del Sol"],
    h2: ["Encuentros inolvidables", "Habitaciones premium", "Gastronomía"],
    wordCount: 842,
    loadTimeMs: 1240,
    score: 88,
  },
  {
    url: "https://aluminium-astro-hoteldanzadelsol.vercel.app/habitaciones",
    statusCode: 200,
    title: "Habitaciones",
    description: null,
    h1: ["Nuestras habitaciones"],
    h2: ["Suite Premium", "Habitación Doble"],
    wordCount: 320,
    loadTimeMs: 980,
    score: 62,
  },
  {
    url: "https://aluminium-astro-hoteldanzadelsol.vercel.app/contacto",
    statusCode: 200,
    title: null,
    description: null,
    h1: [],
    h2: ["Información", "Mapa"],
    wordCount: 145,
    loadTimeMs: 720,
    score: 28,
  },
];

function scoreColor(score: number) {
  if (score >= 75) return "bg-green-200 text-green-900";
  if (score >= 50) return "bg-yellow-200 text-yellow-900";
  return "bg-red-200 text-red-900";
}

export default function SiteDetailPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-8 gap-6 dark:bg-black">
      {/* Header con info del sitio */}
      <div className="border border-zinc-300 rounded-lg p-4 bg-white">
        <h1 className="text-2xl font-bold mb-2">{mockSite.url}</h1>
        <div className="flex gap-6 text-sm text-zinc-600">
          <div>
            Sitemap: <span className="font-mono">{mockSite.sitemap}</span>
          </div>
          <div>Crawled: {mockSite.crawledAt}</div>
          <div>Total páginas: {mockSite.totalPages}</div>
        </div>
      </div>

      {/* Score general
      <div className="flex gap-4">
        <div className={`flex-1 rounded-lg p-6 ${scoreColor(mockSite.score)}`}>
          <div className="text-sm uppercase tracking-wide">Score general</div>
          <div className="text-5xl font-bold mt-2">{mockSite.score}</div>
          <div className="text-xs mt-1">de 100</div>
        </div>
        <div className="flex-1 rounded-lg p-6 bg-white border border-zinc-300">
          <div className="text-sm uppercase tracking-wide text-zinc-600">Críticas</div>
          <div className="text-5xl font-bold mt-2 text-red-600">1</div>
        </div>
        <div className="flex-1 rounded-lg p-6 bg-white border border-zinc-300">
          <div className="text-sm uppercase tracking-wide text-zinc-600">Con warnings</div>
          <div className="text-5xl font-bold mt-2 text-yellow-600">1</div>
        </div>
        <div className="flex-1 rounded-lg p-6 bg-white border border-zinc-300">
          <div className="text-sm uppercase tracking-wide text-zinc-600">OK</div>
          <div className="text-5xl font-bold mt-2 text-green-600">1</div>
        </div>
      </div> */}

      {/* Tabla de páginas */}
      <div className="border border-zinc-300 rounded-lg bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_120px_100px_80px] gap-4 p-3 bg-zinc-100 border-b border-zinc-300 text-xs uppercase font-semibold text-zinc-600">
          <div>URL</div>
          <div className="text-center">Status</div>
          <div className="text-center">Palabras</div>
          <div className="text-center">Load (ms)</div>
          <div className="text-center">IA</div>
          {/*<div className="text-center">Score</div> */}
        </div>

        {mockPages.map((page) => (
          <div
            key={page.url}
            className="grid grid-cols-[1fr_80px_120px_100px_80px] gap-4 p-3 border-b border-zinc-200 hover:bg-zinc-50 text-sm"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="font-mono text-xs text-zinc-500 truncate">
                {page.url}
              </div>
              <div className="font-semibold">
                {page.title ?? (
                  <span className="text-red-600 italic">sin título</span>
                )}
              </div>
              <div className="text-xs text-zinc-600 truncate">
                {page.description ?? (
                  <span className="text-red-600 italic">sin description</span>
                )}
              </div>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                  H1: {page.h1.length}
                </span>
                <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                  H2: {page.h2.length}
                </span>
              </div>
            </div>
            <div className="text-center self-center">{page.statusCode}</div>
            <div className="text-center self-center">{page.wordCount}</div>
            <div className="text-center self-center">{page.loadTimeMs}</div>
            <div className="text-center self-center">
              <button
                className="
                p-2
                bg-blue-300
                rounded-md
                text-white"
              >
                <Link href={`/sugerence`}>Generar SEO</Link>
              </button>
            </div>
            {/* <div className="self-center">
              <span className={`inline-block px-3 py-1 rounded font-bold ${scoreColor(page.score)}`}>
                {page.score}
              </span>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
