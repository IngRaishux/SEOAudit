"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCrawl } from "@/lib/CrawlContext";
import { BackButton } from "@/components/BackButton";

const mockSuggested = {
  title: "Habitaciones de Lujo en Hotel Danza del Sol | Reserva Online",
  description:
    "Descubre nuestras habitaciones premium con vista al mar. Suites y habitaciones dobles con servicio personalizado. Reserva al mejor precio.",
  canonical: "https://aluminium-astro-hoteldanzadelsol.vercel.app/habitaciones",
  ogTitle: "Habitaciones Premium — Hotel Danza del Sol",
  ogDescription:
    "Confort y elegancia en cada estancia. Conoce nuestras suites con amenidades exclusivas.",
  ogImage: "https://aluminium-astro-hoteldanzadelsol.vercel.app/og-rooms.jpg",
  robots: "index, follow",
};

export default function SugerenciaPage() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url");
  const { getPageByUrl } = useCrawl();

  const mockPage = (targetUrl && getPageByUrl(targetUrl)) || null;

  const [form, setForm] = useState(mockSuggested);

  if (!targetUrl) {
    return (
      <div className="p-8 text-zinc-700">Falta el parámetro <code>url</code>.</div>
    );
  }

  if (!mockPage) {
    return (
      <div className="p-8 text-zinc-700">
        No se encontró información para <span className="font-mono">{targetUrl}</span>.
        Vuelve al listado del sitio para regenerar.
      </div>
    );
  }

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleExport() {
    const exported = {
      url: mockPage.url,
      original: {
        title: mockPage.title,
        description: mockPage.description,
        canonical: mockPage.canonical,
        ogTitle: mockPage.ogTitle,
        ogDescription: mockPage.ogDescription,
        ogImage: mockPage.ogImage,
        robots: mockPage.robots,
      },
      suggested: form,
      approvedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exported, null, 2)], {
      type: "application/json",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `seo-${new URL(mockPage.url).hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans p-8 gap-6 dark:bg-black">
      <BackButton />
      {/* Header */}
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
          <Field label="OG Title" value={mockPage.ogTitle} />
          <Field label="OG Description" value={mockPage.ogDescription} multiline />
          <Field label="OG Image" value={mockPage.ogImage} />
          <Field label="Robots" value={mockPage.robots} />
        </div>

        {/* Columna derecha: sugerencia editable */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-blue-600">
            Sugerencia (editable)
          </h2>

          <EditableField
            label="Title"
            value={form.title}
            onChange={(v) => update("title", v)}
            hint={`${form.title.length} chars (ideal 50-60)`}
          />
          <EditableField
            label="Description"
            value={form.description}
            onChange={(v) => update("description", v)}
            hint={`${form.description.length} chars (ideal 150-160)`}
            multiline
          />
          <EditableField
            label="Canonical"
            value={form.canonical}
            onChange={(v) => update("canonical", v)}
          />
          <EditableField
            label="OG Title"
            value={form.ogTitle}
            onChange={(v) => update("ogTitle", v)}
          />
          <EditableField
            label="OG Description"
            value={form.ogDescription}
            onChange={(v) => update("ogDescription", v)}
            multiline
          />
          <EditableField
            label="OG Image"
            value={form.ogImage}
            onChange={(v) => update("ogImage", v)}
          />
          <EditableField
            label="Robots"
            value={form.robots}
            onChange={(v) => update("robots", v)}
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100">
          Descartar y regenerar
        </button>
        <button
          onClick={handleExport}
          className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700"
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
