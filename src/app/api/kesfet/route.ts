import { NextResponse } from 'next/server';
import { bulunanFirmalariListele } from '@/lib/scanner';
import { firmaKlasorunuEslestir } from '@/lib/mapper';
import { mukellefleriOku, ayarlariOku, expressAktarimYoluAl } from '@/lib/config';

export async function GET() {
  try {
    const ayarlar = ayarlariOku();
    const kaynakKlasor = expressAktarimYoluAl(ayarlar);
    const mukellefler = mukellefleriOku();
    const firmalar = bulunanFirmalariListele(kaynakKlasor);

    const sonuclar = firmalar.map((firma) => {
      const eslesme = firmaKlasorunuEslestir(firma, mukellefler);
      return {
        firmaKlasor: firma,
        eslesmedi: eslesme.eslesmeYontemi === 'bilinmeyen',
        mukellef: eslesme.mukellefAdi,
      };
    });

    return NextResponse.json(sonuclar);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
