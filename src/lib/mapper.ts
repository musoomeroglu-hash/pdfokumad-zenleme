import type { Mukellef } from '../types/index';

// VKN: 10 hane rakam, TCKN: 11 hane rakam
function vknMi(deger: string): boolean {
  return /^\d{10,11}$/.test(deger.trim());
}

// Türkçe karakterleri normalize eder (arama için)
function normalize(metin: string): string {
  return metin
    .toUpperCase()
    .replace(/Ç/g, 'C')
    .replace(/Ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/I/g, 'I')
    .replace(/İ/g, 'I')
    .trim();
}

export interface MapperSonuc {
  mukellef: Mukellef | null;
  mukellefAdi: string;
  eslesmeYontemi: 'vkn' | 'zirveKlasorAdi' | 'isimBenzerlik' | 'bilinmeyen';
}

export function firmaKlasorunuEslestir(
  firmaKlasor: string,
  mukellefler: Mukellef[]
): MapperSonuc {
  const aktifMukellefler = mukellefler.filter((m) => m.aktif);

  // 1. VKN ile direkt eşleşme
  if (vknMi(firmaKlasor)) {
    const eslesen = aktifMukellefler.find((m) => m.vkn === firmaKlasor.trim());
    if (eslesen) {
      return {
        mukellef: eslesen,
        mukellefAdi: eslesen.ad,
        eslesmeYontemi: 'vkn',
      };
    }
  }

  // 2. zirveKlasorAdi ile eşleşme (hem VKN hem isim varyasyonu olabilir)
  const eslesen2 = aktifMukellefler.find(
    (m) =>
      m.zirveKlasorAdi &&
      normalize(m.zirveKlasorAdi) === normalize(firmaKlasor)
  );
  if (eslesen2) {
    return {
      mukellef: eslesen2,
      mukellefAdi: eslesen2.ad,
      eslesmeYontemi: 'zirveKlasorAdi',
    };
  }

  // 3. Mükellef adı ile normalize edilmiş eşleşme
  const eslesen3 = aktifMukellefler.find(
    (m) => normalize(m.ad) === normalize(firmaKlasor)
  );
  if (eslesen3) {
    return {
      mukellef: eslesen3,
      mukellefAdi: eslesen3.ad,
      eslesmeYontemi: 'isimBenzerlik',
    };
  }

  // 4. Eşleşme bulunamadı
  const gosterilenAd = vknMi(firmaKlasor)
    ? `Bilinmeyen_${firmaKlasor}`
    : firmaKlasor;

  return {
    mukellef: null,
    mukellefAdi: gosterilenAd,
    eslesmeYontemi: 'bilinmeyen',
  };
}

export function eslesemeyenleriListele(
  firmaKlasorleri: string[],
  mukellefler: Mukellef[]
): string[] {
  return firmaKlasorleri.filter((k) => {
    const sonuc = firmaKlasorunuEslestir(k, mukellefler);
    return sonuc.eslesmeYontemi === 'bilinmeyen';
  });
}
