import type { IslemKaydi, RaporSatiri } from '../types/index';
import { AY_ADLARI } from '../types/index';

export function islemlerdenRaporUret(islemler: IslemKaydi[]): RaporSatiri[] {
  const map = new Map<string, RaporSatiri>();

  for (const i of islemler) {
    const key = `${i.mukellef}||${i.ay}`;
    if (!map.has(key)) {
      map.set(key, {
        mukellef: i.mukellef,
        ay: i.ay,
        alisAdedi: 0,
        satisAdedi: 0,
        alisToplamTutar: 0,
        satisToplamTutar: 0,
        alisToplam: 0,
        satisToplam: 0,
      });
    }
    const satir = map.get(key)!;
    const tutar = i.tutar ?? 0;
    if (i.tip.includes('Alış')) {
      satir.alisAdedi++;
      satir.alisToplamTutar += tutar;
    } else {
      satir.satisAdedi++;
      satir.satisToplamTutar += tutar;
    }
    satir.alisToplam = satir.alisToplamTutar;
    satir.satisToplam = satir.satisToplamTutar;
  }

  return Array.from(map.values()).sort((a, b) => {
    const mukK = a.mukellef.localeCompare(b.mukellef, 'tr');
    if (mukK !== 0) return mukK;
    return a.ay.localeCompare(b.ay);
  });
}

export function raporuCSVEDonustur(satirlar: RaporSatiri[]): string {
  const baslik = 'Mükellef;Ay;Alış Adedi;Satış Adedi;Alış Toplam TL;Satış Toplam TL\n';
  const body = satirlar
    .map(
      (s) =>
        `${s.mukellef};${s.ay};${s.alisAdedi};${s.satisAdedi};${s.alisToplam.toFixed(2)};${s.satisToplam.toFixed(2)}`
    )
    .join('\n');
  return '﻿' + baslik + body; // BOM for Excel UTF-8
}

export function ayAdiniAl(ayNo: number): string {
  return AY_ADLARI[ayNo] ?? `Ay-${ayNo}`;
}
