'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BackButton, Dialog, DialogTrigger } from '@seo-optimizer/ui';
import DialogSugestion from '@/components/DialogSugestion';
import { SERPPreview } from '@/components/SERPPreview';
import { generateSEOSuggestions } from "@/lib/generateSEOSuggestions";
import { useSession } from 'next-auth/react';

type SugerenciaTabType = 'form' | 'serp' | 'meta';

const sugerenciaTabs = [
  { id: 'form', label: 'Sugerencia', icon: '📝' },
  { id: 'serp', label: 'Vista previa SERP', icon: '🔍' },
  { id: 'meta', label: 'Etiquetas meta', icon: '🏷️' },
] as const;


const mockSuggested = {
  slug: { S: '' },
  account: { S: 'default' },
  canonicalUrl: { S: '' },
  description: { S: '' },
  keywords: { SS: [] as string[] },
  alternateLanguages: {
    M: {
      'en-US': { S: '' },
      'es-MX': { S: '' },
      'x-default': { S: '' },
    },
  },
  title: { S: '' },
};

interface Page {
  _id: string;
  siteId: string;
  url: string;
  title?: string;
  description?: string;
  statusCode?: number;
  canonical?: string;
  headings: string[];
  metaTags?: Array<{ name: string; content: string }>;
}

interface Site {
  _id: string;
  url: string;
  organizationId: string;
  title?: string;
  pageCount: number;
}

interface PageData {
    url: string;
    title: string | null;
    description: string | null;
    wordCount: number;
  };

function SugerenciaContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const targetUrl = searchParams.get('url');
  const pageId = searchParams.get('pageId');
  const siteId = searchParams.get('siteId');

  const [mockPage, setMockPage] = useState<Page | null>(null);
  const [organizationName, setOrganizationName] = useState('default');
  const [loadingPage, setLoadingPage] = useState(true);


  useEffect(() => {
    if (!pageId || !siteId) {
      setLoadingPage(false);
      return;
    }

    // Fetch page and site data from MongoDB
    const fetchData = async () => {
      try {
        const [pageRes, siteRes] = await Promise.all([
          fetch(`/api/pages/${pageId}`),
          fetch(`/api/sites/${siteId}`),
        ]);

        if (pageRes.ok) {
          const pageData = await pageRes.json();
          setMockPage(pageData.page);
        }

        if (siteRes.ok) {
          const siteData = await siteRes.json();
          const site = siteData.site;

          // Get organization name from site data
          if (site.organizationName) {
            setOrganizationName(site.organizationName);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingPage(false);
      }
    };

    fetchData();
  }, [pageId, siteId]);

  const [form, setForm] = useState(mockSuggested);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<SugerenciaTabType>('form');

  const handleSuggestionsGenerated = async (suggestions: any) => {
    setForm(suggestions);
    setError(null);

    // Persistir sugerencias en MongoDB si tenemos pageId y siteId
    if (pageId && siteId) {
      try {
        const res = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            siteId,
            type: 'seo',
            severity: 'medium',
            content: suggestions,
          }),
        });

        if (res.ok) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000); // Mostrar confirmación por 3s
        } else {
          const data = await res.json();
          console.error('Error saving suggestion:', data.error);
        }
      } catch (err) {
        console.error('Error persisting suggestion:', err);
      }
    }
  };

  if (loadingPage) {
    return (
      <div className="p-8 text-base-content/70">
        <span className="loading loading-spinner loading-md text-primary mr-2"></span>
        Cargando información de la página...
      </div>
    );
  }

  if (!targetUrl) {
    return (
      <div className="alert alert-warning p-8">
        <span>Falta el parámetro <code>url</code>.</span>
      </div>
    );
  }

  if (!mockPage) {
    return (
      <div className="alert alert-error p-8">
        <span>
          No se encontró información para{" "}
          <span className="font-mono">{targetUrl}</span>. Vuelve al listado del
          sitio para regenerar.
        </span>
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
      account: { S: organizationName },
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

  const handleGenerateAndExport = async () => {
    if (!mockPage) {
      setError("No se ha cargado la información de la página");
      return;
    }

    if (!session?.user?.organizations || session.user.organizations.length === 0) {
      setError("No se pudo obtener la información de tu organización");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pageDataToGenerate: PageData = {
        url: mockPage.url,
        title: mockPage.title || null,
        description: mockPage.description || null,
        wordCount: 0,
      };

      const suggestions = await generateSEOSuggestions({
        url: pageDataToGenerate.url,
        title: pageDataToGenerate.title,
        description: pageDataToGenerate.description,
        wordCount: pageDataToGenerate.wordCount,
        accountName: session.user.organizations[0].name,
      });

      // Actualizar el form con las sugerencias
      setForm(suggestions);

      // Persistir las sugerencias en MongoDB
      if (pageId && siteId) {
        await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId,
            siteId,
            type: 'seo',
            severity: 'medium',
            content: suggestions,
          }),
        });
      }

      // Exportar el JSON directamente (sin esperar actualización de estado)
      const exported = {
        ...suggestions,
        account: { S: organizationName },
      };

      const blob = new Blob([JSON.stringify(exported, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `seo-${suggestions.slug?.S || new URL(mockPage.url).hostname}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      // Mostrar confirmación
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating suggestions';
      setError(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

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
          <span>Status: {mockPage.statusCode || '—'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap border-b border-zinc-200 dark:border-zinc-800">
          {sugerenciaTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SugerenciaTabType)}
              className={`flex-1 md:flex-none px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Sugerencia Tab */}
          {activeTab === 'form' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Columna izquierda: valor original */}
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">
                  Original (del crawl)
                </h2>

                <Field label="Title" value={mockPage.title || null} />
                <Field label="Description" value={mockPage.description || null} multiline />
                <Field label="Canonical" value={mockPage.canonical || null} />
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
          )}

          {/* SERP Preview Tab */}
          {activeTab === 'serp' && (
            <SERPPreview
              title={form.title.S || mockPage.title || 'Sin título'}
              description={form.description.S || mockPage.description || 'Sin descripción'}
              url={mockPage.url}
            />
          )}

          {/* Meta Tags Tab */}
          {activeTab === 'meta' && (
            <div>
              {mockPage.metaTags && mockPage.metaTags.length > 0 ? (
                <div className="space-y-3">
                  {mockPage.metaTags.map((tag, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                      <div className="text-sm">
                        <span className="font-mono font-medium text-zinc-900 dark:text-white">{tag.name}</span>
                        <span className="text-zinc-600 dark:text-zinc-400 ml-2">
                          {tag.content}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Sin etiquetas meta disponibles para esta página.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m2-2l2 2m0 0l2-2m-2 2l-2 2" />
            </svg>
            <span>Error: {error}</span>
          </div>
        )}
        {saved && (
          <div className="alert alert-success text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>✓ Sugerencia guardada correctamente</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button
                disabled={loading}
                className="btn btn-warning btn-sm"
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
                title: mockPage.title || null,
                description: mockPage.description || null,
                wordCount: 0,
              }}
            />
          </Dialog>
          <button
            onClick={handleExport}
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            Exportar JSON
          </button>
          <button
            onClick={handleGenerateAndExport}
            className="btn btn-success btn-sm"
            disabled={loading}
          >
            Generar y Exportar JSON
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
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-base-content">{label}</label>
      <div
        className={`p-3 rounded-lg border text-sm ${
          empty
            ? "text-error italic border-error/50 bg-error/5"
            : "border-base-300 bg-base-100"
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
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold text-base-content">{label}</label>
        {hint && <span className="text-xs text-base-content/70">{hint}</span>}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="textarea textarea-bordered w-full text-sm min-h-[64px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input input-bordered w-full text-sm"
        />
      )}
    </div>
  );
}

export default function SugerenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-base-100 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/70">Cargando...</p>
          </div>
        </div>
      }
    >
      <SugerenciaContent />
    </Suspense>
  );
}
