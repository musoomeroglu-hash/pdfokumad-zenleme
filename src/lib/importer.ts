import fs from 'fs';
import path from 'path';
import type { Mukellef } from '../types/index';

// CSV'den mükellef listesi oku
// Beklenen sütunlar: VKN, Ad, ZirveKlasorAdi (opsiyonel), Entegrator (opsiyonel)
export function csvdenMukellefleriOku(csvIcerik: string): Mukellef[] {
  const satirlar = csvIcerik.trim().split(/\r?\n/);
  if (satirlar.length < 2) return [];

  const baslikSatiri = satirlar[0].split(/[,;|\t]/).map((h) => h.trim().toLowerCase());
  const vknIdx = baslikSatiri.findIndex((h) => h.includes('vkn') || h.includes('vergi'));
  const adIdx = baslikSatiri.findIndex((h) => h.includes('ad') || h.includes('unvan') || h.includes('isim'));
  const zirveIdx = baslikSatiri.findIndex((h) => h.includes('zirve') || h.includes('klasor'));
  const entIdx = baslikSatiri.findIndex((h) => h.includes('enteg'));

  if (vknIdx === -1 || adIdx === -1) {
    throw new Error('CSV dosyasında VKN ve Ad sütunları bulunamadı');
  }

  const mukellefler: Mukellef[] = [];
  for (let i = 1; i < satirlar.length; i++) {
    const cols = satirlar[i].split(/[,;|\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (!cols[vknIdx] || !cols[adIdx]) continue;

    mukellefler.push({
      vkn: cols[vknIdx].replace(/\D/g, ''),
      ad: cols[adIdx],
      zirveKlasorAdi: zirveIdx >= 0 ? cols[zirveIdx] : undefined,
      entegrator: entIdx >= 0 ? cols[entIdx] : undefined,
      aktif: true,
    });
  }
  return mukellefler;
}

// Excel dosyasından mükellef listesi oku (xlsx kütüphanesi kullanır)
export async function exceldeMukellefleriOku(excelBuffer: Buffer): Promise<Mukellef[]> {
  // xlsx'i dinamik import et (büyük kütüphane, gerektiğinde yüklenir)
  const xlsx = await import('xlsx');
  const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

  return rows
    .map((row) => {
      const vkn = String(
        row['VKN'] ?? row['vkn'] ?? row['Vergi No'] ?? row['VergiNo'] ?? ''
      ).replace(/\D/g, '');
      const ad = String(
        row['Ad'] ?? row['ad'] ?? row['Unvan'] ?? row['unvan'] ?? row['İsim'] ?? ''
      ).trim();
      if (!vkn || !ad) return null;
      return {
        vkn,
        ad,
        zirveKlasorAdi: String(row['ZirveKlasorAdi'] ?? row['Zirve'] ?? '').trim() || undefined,
        entegrator: String(row['Entegrator'] ?? '').trim() || undefined,
        aktif: true,
      } as Mukellef;
    })
    .filter((m): m is Mukellef => m !== null);
}

// Mevcut mükelleflerle birleştir (VKN bazında)
export function mukellefleribirlestir(mevcutlar: Mukellef[], yeniler: Mukellef[]): {
  eklenen: Mukellef[];
  guncellenen: Mukellef[];
  sonuc: Mukellef[];
} {
  const map = new Map(mevcutlar.map((m) => [m.vkn, m]));
  const eklenen: Mukellef[] = [];
  const guncellenen: Mukellef[] = [];

  for (const yeni of yeniler) {
    if (map.has(yeni.vkn)) {
      const eskisi = map.get(yeni.vkn)!;
      map.set(yeni.vkn, { ...eskisi, ...yeni, id: eskisi.id });
      guncellenen.push(yeni);
    } else {
      map.set(yeni.vkn, { ...yeni, id: `${Date.now()}-${yeni.vkn}` });
      eklenen.push(yeni);
    }
  }

  return { eklenen, guncellenen, sonuc: Array.from(map.values()) };
}
