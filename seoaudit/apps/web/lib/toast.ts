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
