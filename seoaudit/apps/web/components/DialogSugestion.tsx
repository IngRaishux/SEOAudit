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
import { useSession } from "next-auth/react";
import { generateSEOSuggestions } from "@/lib/generateSEOSuggestions";

type DialogSugestionProps = {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSuggestionsGenerated: (suggestions: any) => void;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  pageData: {
    url: string;
    title: string | null;
    description: string | null;
    wordCount: number;
  };
};

const DialogSugestion = ({ setIsOpen, onSuggestionsGenerated, pageData, setIsLoading }: DialogSugestionProps) => {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAndSave = async () => {
    if (!session?.user?.organizations || session.user.organizations.length === 0) {
      setError("No se pudo obtener la información de tu organización");
      return;
    }

    setIsOpen(false);
    setIsLoading(true);
    setError(null);

    try {
      const suggestions = await generateSEOSuggestions({
        url: pageData.url,
        title: pageData.title,
        description: pageData.description,
        wordCount: pageData.wordCount,
        accountName: session.user.organizations[0].name,
      });

      onSuggestionsGenerated(suggestions);
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generating suggestions';
      setError(message);
      console.error('Error generating SEO suggestions:', err);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Generar Sugerencias SEO</DialogTitle>
        <DialogDescription className="mt-1 text-sm leading-6">
          Se generarán sugerencias SEO optimizadas para <span className="font-semibold">{session?.user?.organizations?.[0]?.name}</span>.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
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
            variant="destructive"
          >
            Cancelar
          </Button>
        </DialogClose>
        <Button
          className="px-4 py-2 rounded-md hover:primary-content disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          onClick={handleGenerateAndSave}
        >
          Generar Automáticamente
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DialogSugestion;
