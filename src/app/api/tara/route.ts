import { NextResponse } from 'next/server';
import { zirveKlasoruTara, bulunanFirmalariListele } from '@/lib/scanner';
import { firmaKlasorunuEslestir } from '@/lib/mapper';
import { mukellefleriOku } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { kaynakKlasor } = await request.json() as { kaynakKlasor: string };
    if (!kaynakKlasor) {
      return NextResponse.json({ error: 'kaynakKlasor gerekli' }, { status: 400 });
    }

    const mukellefler = mukellefleriOku();
    const firmalar = bulunanFirmalariListele(kaynakKlasor);

    const sonuclar = firmalar.map((firma) => {
      const eslesme = firmaKlasorunuEslestir(firma, mukellefler);

      let dosyaSayisi = 0;
      try {
        const tarama = zirveKlasoruTara({ kaynakKlasor });
        dosyaSayisi = tarama.filter((s) => s.firmaKlasor === firma).length;
      } catch { /* devam */ }

      return {
        firma,
        mukellef: eslesme.mukellefAdi,
        eslesti: eslesme.eslesmeYontemi !== 'bilinmeyen',
        eslesmeYontemi: eslesme.eslesmeYontemi,
        dosyaSayisi,
      };
    });

    return NextResponse.json(sonuclar);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
