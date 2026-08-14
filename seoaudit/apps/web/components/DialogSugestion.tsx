'use client';

import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import { Button } from "@/components/Button";
import { Dispatch, SetStateAction, useState } from "react";
import { generateSEOSuggestions } from "@/lib/generateSEOSuggestions";

type DialogSugestionProps = {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSuggestionsGenerated: (accountName: string, suggestions: any) => void;
  pageData: {
    url: string;
    title: string | null;
    description: string | null;
    wordCount: number;
  };
};

const DialogSugestion = ({ setIsOpen, onSuggestionsGenerated, pageData }: DialogSugestionProps) => {
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAndSave = async () => {
    if (!accountName.trim()) {
      setError("Por favor ingresa el nombre de la cuenta");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const suggestions = await generateSEOSuggestions({
        url: pageData.url,
        title: pageData.title,
        description: pageData.description,
        wordCount: pageData.wordCount,
        accountName: accountName,
      });

      onSuggestionsGenerated(accountName, suggestions);
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating suggestions';
      setError(message);
      console.error('Error generating SEO suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Generar Sugerencias SEO</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-6">
          Ingresa el nombre de tu cuenta para generar las sugerencias SEO optimizadas.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="account-name" className="text-sm font-semibold text-zinc-700">
            Nombre de la Cuenta
          </label>
          <input
            id="account-name"
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Ej: Mi Tienda Online"
            className="px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      <DialogFooter className="mt-6">
        <DialogClose asChild>
          <Button
            className="mt-2 w-full sm:mt-0 sm:w-fit"
            variant="secondary"
            disabled={loading}
          >
            Cancelar
          </Button>
        </DialogClose>
        <Button
          className="px-4 py-2 rounded-md bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          onClick={handleGenerateAndSave}
          disabled={loading}
        >
          {loading ? "Generando..." : "Generar Automáticamente"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DialogSugestion;
