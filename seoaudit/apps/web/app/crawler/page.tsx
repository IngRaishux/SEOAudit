"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";

function CrawlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Obtener organizationId actual del query param o de session
  const organizationId = searchParams.get('org') || session?.user?.accountId;

  async function sendInfo(url: string) {
    setError(null);

    if (!url) {
      setError("Ingresa una URL");
      return;
    }

    if (!organizationId) {
      setError("No hay organización seleccionada");
      return;
    }

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, organizationId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error iniciando el crawl");
        return;
      }

      setJobId(data.jobId);
      setSiteId(data.siteId);
      setStatus("running");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
    }
  }

  useEffect(() => {
    if (!jobId || status === "completed" || status === "failed") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/crawl/${jobId}`);
      const data = await res.json();

      setStatus(data.status);
      setProgress({ processed: data.processed, total: data.total });

      if (data.status === "completed") {
        clearInterval(interval);
        setSiteId(data.siteId);
        router.push(`/sites/${data.siteId}`);
      } else if (data.status === "failed") {
        clearInterval(interval);
        setError(data.error || "El crawl falló");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, status, router]);

  const isRunning = status === "running" || status === "queued";

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans border border-amber-700 dark:bg-black">
      <div className="py-10">
        <h1 className="text-2xl font-bold">Ingresa una url</h1>
      </div>

      <main className="w-full max-w-xl h-auto p-1.5 flex flex-row justify-center gap-8 items-center rounded-lg border border-b-blue-600">
        <Input
          className="flex bg-mist-200 grow-2 justify-center"
          placeholder="Ingresa una url"
          onChange={(e) => setUrl(e.target.value)}
          value={url}
          disabled={isRunning}
        />
        <Button
          className="px-9"
          variant="primary"
          onClick={() => sendInfo(url)}
          disabled={isRunning}
        >
          {isRunning ? "Procesando..." : "Buscar"}
        </Button>
      </main>

      {isRunning && (
        <div className="mt-6 text-sm text-zinc-600">
          {progress.total > 0
            ? `Procesando ${progress.processed} / ${progress.total} URLs`
            : "Buscando sitemap..."}
        </div>
      )}

      {error && <div className="mt-6 text-sm text-red-600">{error}</div>}
    </div>
  );
}

export default function CrawlerPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <CrawlerContent />
    </Suspense>
  );
}
