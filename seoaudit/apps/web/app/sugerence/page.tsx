"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCrawl } from "@/lib/CrawlContext";
import { BackButton } from "@/components/BackButton";
import { generateSEOSuggestions } from "@/lib/generateSEOSuggestions";
import DialogSugestion from "@/components/DialogSugestion";
import { Dialog, DialogTrigger } from "@/components/Dialog";

const mockSuggested = {
  slug: { S: "" },
  account: { S: "default" },
  canonicalUrl: { S: "" },
  description: { S: "" },
  keywords: { SS: [] as string[] },
  alternateLanguages: {
    M: {
      "en-US": { S: "" },
      "es-MX": { S: "" },
      "x-default": { S: "" },
    },
  },
  title: { S: "" },
};

function SugerenciaContent() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url");
  const { getPageByUrl } = useCrawl();

  const mockPage = (targetUrl && getPageByUrl(targetUrl)) || null;

  const [form, setForm] = useState(mockSuggested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);


  const handleSuggestionsGenerated = (
    accountName: string,
    suggestions: any,
  ) => {
    setForm(suggestions);
    setError(null);
  };

  if (!targetUrl) {
    return (
      <div className="p-8 text-zinc-700">
        Falta el parámetro <code>url</code>.
      </div>
    );
  }

  if (!mockPage) {
    return (
      <div className="p-8 text-zinc-700">
        No se encontró información para{" "}
        <span className="font-mono">{targetUrl}</span>. Vuelve al listado del
        sitio para regenerar.
      </div>
    );
  }

  function updateSimpleField(key: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: { S: value },
    }));
  }

  function updateKeywords(keywords: string[]) {
    setForm((prev) => ({
      ...prev,
      keywords: { SS: keywords },
    }));
  }

  function updateAltLanguage(lang: string, value: string) {
    setForm((prev) => ({
      ...prev,
      alternateLanguages: {
        M: {
          ...prev.alternateLanguages.M,
          [lang]: { S: value },
        },
      },
    }));
  }

  function handleExport() {
    if (!mockPage) return;

    const exported = {
      ...form,
      account: form.account,
    };

    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `seo-${form.slug.S || new URL(mockPage.url).hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  // Extraer slug incluyendo patrones de idioma como /en/, /es-MX/, etc
  const urlParts = mockPage.url.split("/").filter(Boolean);
  let slug = "/home/";

  if (urlParts.length > 0) {
    // Buscar si hay un segmento que sea un idioma (en, es, es-MX, etc)
    const languagePattern = /^[a-z]{2}(-[a-zA-Z]{2})?$/;
    const languageIndex = urlParts.findIndex((part) =>
      languagePattern.test(part),
    );

    if (languageIndex !== -1 && languageIndex < urlParts.length - 1) {
      // Si hay un patrón de idioma y hay más segmentos después, incluir idioma + resto
      slug = "/" + urlParts.slice(languageIndex).join("/") + "/";
    } else {
      // Si no hay patrón de idioma, solo tomar el último segmento
      slug = "/" + urlParts[urlParts.length - 1] + "/";
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-8 gap-6 dark:bg-black">
      {/* Overlay de loading */}
    {loading && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 dark:bg-zinc-900">
          <span className="loading loading-spinner loading-xl text-neutral"></span>
          <span className="skeleton skeleton-text">Generando sugerencias...</span>
        </div>
      </div>
    )}
      <BackButton />
      {/* Content */}
      <div className="border border-zinc-300 rounded-lg p-4 bg-white">
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          Generando SEO para
        </div>
        <h1 className="text-xl font-bold mt-1 font-mono break-all">
          {mockPage.url}
        </h1>
        <div className="flex gap-4 text-sm text-zinc-600 mt-2">
          <span>Status: {mockPage.statusCode}</span>
          <span>Palabras: {mockPage.wordCount}</span>
          <span>Load: {mockPage.loadTimeMs}ms</span>
        </div>
      </div>

      {/* Comparativa: original vs editable */}
      <div className="grid grid-cols-2 gap-4">
        {/* Columna izquierda: valor original */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
            Original (del crawl)
          </h2>

          <Field label="Title" value={mockPage.title} />
          <Field label="Description" value={mockPage.description} multiline />
          <Field label="Canonical" value={mockPage.canonical} />
          <Field label="Slug" value={slug || "home"} />
        </div>

        {/* Columna derecha: sugerencia editable */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Sugerencia (editable)
          </h2>

          <EditableField
            label="Slug"
            value={form.slug.S}
            onChange={(v) => updateSimpleField("slug", v)}
          />
          <EditableField
            label="Title"
            value={form.title.S}
            onChange={(v) => updateSimpleField("title", v)}
            hint={`${form.title.S.length} chars (ideal 50-60)`}
          />
          <EditableField
            label="Description"
            value={form.description.S}
            onChange={(v) => updateSimpleField("description", v)}
            hint={`${form.description.S.length} chars (ideal 150-160)`}
            multiline
          />
          <EditableField
            label="Canonical URL"
            value={form.canonicalUrl.S}
            onChange={(v) => updateSimpleField("canonicalUrl", v)}
          />
          <EditableField
            label="Keywords (separados por coma)"
            value={form.keywords.SS.join(", ")}
            onChange={(v) =>
              updateKeywords(
                v
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean),
              )
            }
            hint={`${form.keywords.SS.length} keywords`}
          />
          <div className="border border-blue-300 rounded p-3">
            <h3 className="text-xs font-semibold text-blue-600 mb-2">
              Lenguajes Alternos
            </h3>
            <EditableField
              label="en-US"
              value={form.alternateLanguages.M["en-US"].S}
              onChange={(v) => updateAltLanguage("en-US", v)}
            />
            <EditableField
              label="es-MX"
              value={form.alternateLanguages.M["es-MX"].S}
              onChange={(v) => updateAltLanguage("es-MX", v)}
            />
            <EditableField
              label="x-default"
              value={form.alternateLanguages.M["x-default"].S}
              onChange={(v) => updateAltLanguage("x-default", v)}
            />
          </div>
        </div>
      </div>

      {/* Errores */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {/* Acciones */}
      <div className="flex justify-end gap-3 mt-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button
              disabled={loading}
              className="px-4 py-2 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Generando..." : "Generar Sugerencias"}
            </button>
          </DialogTrigger>
          <DialogSugestion
            setIsOpen={setIsOpen}
            setIsLoading={setLoading}
            onSuggestionsGenerated={handleSuggestionsGenerated}

            pageData={{
              url: mockPage.url,
              title: mockPage.title,
              description: mockPage.description,
              wordCount: mockPage.wordCount,
            }}
          />
        </Dialog>
        {/* <button className="px-4 py-2 rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100">
          Descartar y regenerar
        </button> */}
        <button
          onClick={handleExport}
          className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          Exportar JSON
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  const empty = !value;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-zinc-600">{label}</label>
      <div
        className={`p-2 rounded border bg-zinc-50 text-sm ${
          empty ? "text-red-600 italic border-red-200" : "border-zinc-300"
        } ${multiline ? "min-h-[64px]" : ""}`}
      >
        {value || "(vacío)"}
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  onChange,
  hint,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold text-zinc-600">{label}</label>
        {hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="p-2 rounded border border-blue-300 bg-white text-sm min-h-[64px] focus:outline-none focus:border-blue-500"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="p-2 rounded border border-blue-300 bg-white text-sm focus:outline-none focus:border-blue-500"
        />
      )}
    </div>
  );
}

export default function SugerenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-8 gap-6 dark:bg-black">
          <div className="p-8 text-zinc-700">Cargando...</div>
        </div>
      }
    >
      <SugerenciaContent />
    </Suspense>
  );
}
