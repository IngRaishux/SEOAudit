import { toast } from '@seo-optimizer/ui';

export function toastSuccess(message: string, title = 'Éxito') {
  toast({ variant: 'success', title, description: message });
}

export function toastError(message: string, title = 'Error') {
  toast({ variant: 'error', title, description: message });
}

export function toastWarning(message: string, title = 'Advertencia') {
  toast({ variant: 'warning', title, description: message });
}

/** Error con botón para repetir la acción que falló (p. ej. el modelo de IA saturado). */
export function toastErrorWithRetry(message: string, onRetry: () => void, { title = 'Error', label = 'Reintentar' } = {}) {
  toast({ variant: 'error', title, description: message, action: { label, altText: label, onClick: onRetry } });
}
