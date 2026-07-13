import Link from "next/link";
import { jobStore } from "@/lib/jobStore";
import { notFound } from "next/navigation";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const job = jobStore.get(siteId);

  if (!job || !job.result) {
    notFound();
  }

  const { siteUrl, sitemapUrl, pages } = job.result;
  console.log(pages);
  
  const crawledAt = new Date(job.finishedAt ?? job.startedAt).toLocaleString();

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-8 gap-6 dark:bg-black">
      <div className="border border-zinc-300 rounded-lg p-4 bg-white">
        <h1 className="text-2xl font-bold mb-2">{siteUrl}</h1>
        <div className="flex gap-6 text-sm text-zinc-600 flex-wrap">
          <div>
            Sitemap: <span className="font-mono break-all">{sitemapUrl}</span>
          </div>
          <div>Crawled: {crawledAt}</div>
          <div>Total páginas: {pages.length}</div>
        </div>
      </div>

      <div className="border border-zinc-300 rounded-lg bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_120px_100px_120px] gap-4 p-3 bg-zinc-100 border-b border-zinc-300 text-xs uppercase font-semibold text-zinc-600">
          <div>URL</div>
          <div className="text-center">Status</div>
          <div className="text-center">Palabras</div>
          <div className="text-center">Load (ms)</div>
          <div className="text-center">IA</div>
        </div>

        {pages.map((page) => (
          <div
            key={page.url}
            className="grid grid-cols-[1fr_80px_120px_100px_120px] gap-4 p-3 border-b border-zinc-200 hover:bg-zinc-50 text-sm"
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
              <Link
                href={`/sugerence?url=${encodeURIComponent(page.url)}`}
                className="inline-block p-2 bg-blue-500 rounded-md text-white text-xs hover:bg-blue-600"
              >
                Generar SEO
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
