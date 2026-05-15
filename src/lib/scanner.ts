import fs from 'fs';
import path from 'path';
import type { ScanResult, FaturaTipi, DosyaUzantisi } from '../types/index';

// Zirve klasör varyasyonları için kabul edilen alt-klasör isimleri
const GELEN_VARYASYONLAR = ['gelen', 'alis', 'alış', 'aliş'];
const GIDEN_VARYASYONLAR = ['giden', 'satis', 'satış', 'satiş'];

const DESTEKLENEN_UZANTILAR: DosyaUzantisi[] = ['.pdf', '.html', '.xml'];

function tipBelirle(klasorAdi: string): FaturaTipi | null {
  const kucuk = klasorAdi.toLowerCase().trim();
  if (GELEN_VARYASYONLAR.includes(kucuk)) return 'Gelen';
  if (GIDEN_VARYASYONLAR.includes(kucuk)) return 'Giden';
  return null;
}

function desteklenenUzanti(dosyaAdi: string): DosyaUzantisi | null {
  const ext = path.extname(dosyaAdi).toLowerCase();
  if (DESTEKLENEN_UZANTILAR.includes(ext as DosyaUzantisi)) {
    return ext as DosyaUzantisi;
  }
  return null;
}

function klasorTara(
  firmaDizini: string,
  firmaKlasor: string,
  tipDizini: string,
  tip: FaturaTipi,
  sonuclar: ScanResult[]
): void {
  let dosyalar: string[];
  try {
    dosyalar = fs.readdirSync(tipDizini);
  } catch {
    return;
  }

  for (const dosyaAdi of dosyalar) {
    const uzanti = desteklenenUzanti(dosyaAdi);
    if (!uzanti) continue;

    const dosyaYolu = path.join(tipDizini, dosyaAdi);
    try {
      const stat = fs.statSync(dosyaYolu);
      if (!stat.isFile()) continue;
    } catch {
      continue;
    }

    sonuclar.push({
      firmaKlasor,
      tip,
      dosyaYolu,
      dosyaAdi,
      uzanti,
    });
  }
}

export interface ScanOptions {
  kaynakKlasor: string;
}

export function zirveKlasoruTara(options: ScanOptions): ScanResult[] {
  const { kaynakKlasor } = options;
  const sonuclar: ScanResult[] = [];

  if (!fs.existsSync(kaynakKlasor)) {
    throw new Error(`Kaynak klasör bulunamadı: ${kaynakKlasor}`);
  }

  let firmalar: string[];
  try {
    firmalar = fs.readdirSync(kaynakKlasor);
  } catch (err) {
    throw new Error(`Kaynak klasör okunamadı: ${kaynakKlasor} — ${String(err)}`);
  }

  for (const firmaKlasor of firmalar) {
    const firmaDizini = path.join(kaynakKlasor, firmaKlasor);

    let stat: fs.Stats;
    try {
      stat = fs.statSync(firmaDizini);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    // Alt klasörleri tara: Gelen/Giden varyasyonları
    let altKlasorler: string[];
    try {
      altKlasorler = fs.readdirSync(firmaDizini);
    } catch {
      continue;
    }

    let altKlasorBulundu = false;

    for (const altKlasor of altKlasorler) {
      const tip = tipBelirle(altKlasor);
      if (!tip) continue;

      altKlasorBulundu = true;
      const tipDizini = path.join(firmaDizini, altKlasor);

      let tipStat: fs.Stats;
      try {
        tipStat = fs.statSync(tipDizini);
      } catch {
        continue;
      }
      if (!tipStat.isDirectory()) continue;

      klasorTara(firmaDizini, firmaKlasor, tipDizini, tip, sonuclar);
    }

    // Varyasyon 5: Alt-klasör yok, dosyalar doğrudan firma klasöründe
    // Bu durumda tip belirlenemez, Gelen olarak varsayıyoruz
    if (!altKlasorBulundu) {
      klasorTara(firmaDizini, firmaKlasor, firmaDizini, 'Gelen', sonuclar);
    }
  }

  return sonuclar;
}

export function bulunanFirmalariListele(kaynakKlasor: string): string[] {
  if (!fs.existsSync(kaynakKlasor)) return [];

  try {
    return fs
      .readdirSync(kaynakKlasor)
      .filter((ad) => {
        try {
          return fs.statSync(path.join(kaynakKlasor, ad)).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
}
