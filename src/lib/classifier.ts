import type { FaturaMetadata, FaturaTipi } from '../types/index';

export interface SiniflandirmaSonucu {
  tip: FaturaTipi;
  dogrulanmis: boolean;
  neden: string;
}

function vknEslestir(a: string, b: string): boolean {
  return a.replace(/\D/g, '') === b.replace(/\D/g, '') && a.length > 0;
}

export function siniflandir(
  klasorTipi: FaturaTipi,
  meta: FaturaMetadata | null,
  mukellefVKN: string
): SiniflandirmaSonucu {
  if (!meta || !mukellefVKN) {
    return { tip: klasorTipi, dogrulanmis: false, neden: 'metadata yok' };
  }

  if (vknEslestir(meta.aliciVKN, mukellefVKN)) {
    return { tip: 'Gelen', dogrulanmis: true, neden: 'alıcı VKN eşleşti' };
  }
  if (vknEslestir(meta.saticiVKN, mukellefVKN)) {
    return { tip: 'Giden', dogrulanmis: true, neden: 'satıcı VKN eşleşti' };
  }

  // VKN doğrulaması başarısız → klasör yapısını güven
  return { tip: klasorTipi, dogrulanmis: false, neden: 'VKN doğrulanamadı' };
}

// Fatura tipine göre insan-okunabilir klasör adı
export function faturaTipindenKlasorAdi(
  tip: FaturaTipi,
  faturaTipi: string,
  iadeAyri: boolean
): string {
  const iade = faturaTipi.toUpperCase().includes('IADE') || faturaTipi.toUpperCase().includes('İADE');

  if (tip === 'Gelen') {
    return iade && iadeAyri ? 'Alış İade Faturaları' : 'Alış Faturaları';
  }
  return iade && iadeAyri ? 'Satış İade Faturaları' : 'Satış Faturaları';
}
