import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTL(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(tutar);
}

export function formatTarih(tarih: Date | string | null | undefined): string {
  if (!tarih) return '-';
  const d = typeof tarih === 'string' ? new Date(tarih) : tarih;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR');
}
