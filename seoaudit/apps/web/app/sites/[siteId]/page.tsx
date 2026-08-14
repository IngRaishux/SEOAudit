import Link from "next/link";
import { jobStore } from "@/lib/jobStore";
import { notFound } from "next/navigation";
import { HydrateCrawl } from "@/components/HydrateCrawl";
import { BackButton } from "@/components/BackButton";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const job = jobStore.get(siteId);
  console.log(job);
  

  if (!job || !job.result) {
    notFound();
  }

  const { siteUrl, sitemapUrl, pages } = job.result;
  
  const crawledAt = new Date(job.finishedAt ?? job.startedAt).toLocaleString();

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-8 gap-6 dark:bg-black">
      <BackButton />
      <HydrateCrawl data={job.result} />
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
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[120px_80px_120px_100px_120px] md:grid-cols-[1fr_80px_120px_100px_120px] gap-4 p-3 bg-zinc-100 border-b border-zinc-300 text-xs uppercase font-semibold text-zinc-600 w-full md:w-auto min-w-[700px] md:min-w-full">
            <div>URL</div>
            <div className="text-center">Status</div>
            <div className="text-center">Palabras</div>
            <div className="text-center">Load (ms)</div>
            <div className="text-center">IA</div>
          </div>

          {pages.map((page) => (
            <div
              key={page.url}
              className="grid grid-cols-[120px_80px_120px_100px_120px] md:grid-cols-[1fr_80px_120px_100px_120px] gap-4 p-3 border-b border-zinc-200 hover:bg-zinc-50 text-sm w-full md:w-auto min-w-[700px] md:min-w-full"
            >
            <div className="flex flex-col gap-1 min-w-0 max-w-[120px] md:max-w-none overflow-hidden">
              <div className="font-mono text-xs text-zinc-500 md:overflow-x-visible overflow-x-auto break-words whitespace-normal max-h-12 md:max-h-none">
                {page.url}
              </div>
              <div className="font-semibold line-clamp-1">
                {page.title ?? (
                  <span className="text-red-600 italic">sin título</span>
                )}
              </div>
              <div className="text-xs text-zinc-600 line-clamp-1">
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
            <div className="text-center self-start pt-1 min-w-[80px]">{page.statusCode}</div>
            <div className="text-center self-start pt-1 min-w-[120px]">{page.wordCount}</div>
            <div className="text-center self-start pt-1 min-w-[100px]">{page.loadTimeMs}</div>
            <div className="text-center self-start pt-1 min-w-[120px]">
              <Link
                href={`/sugerence?url=${encodeURIComponent(page.url)}`}
                className="inline-block p-2 bg-blue-500 rounded-md text-white text-xs hover:bg-blue-600 whitespace-nowrap"
              >
                Generar SEO
              </Link>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
