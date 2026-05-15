import { NextResponse } from 'next/server';
import { mukellefleriOku, mukellefleriYaz } from '@/lib/config';
import { csvdenMukellefleriOku, exceldeMukellefleriOku, mukellefleribirlestir } from '@/lib/importer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const dosya = formData.get('dosya') as File | null;
    if (!dosya) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });

    const ad = dosya.name.toLowerCase();
    const mevcutlar = mukellefleriOku();
    let yeniler;

    if (ad.endsWith('.csv')) {
      const icerik = await dosya.text();
      yeniler = csvdenMukellefleriOku(icerik);
    } else if (ad.endsWith('.xlsx') || ad.endsWith('.xls')) {
      const buffer = Buffer.from(await dosya.arrayBuffer());
      yeniler = await exceldeMukellefleriOku(buffer);
    } else {
      return NextResponse.json({ error: 'Sadece CSV, XLSX, XLS desteklenir' }, { status: 400 });
    }

    const { eklenen, guncellenen, sonuc } = mukellefleribirlestir(mevcutlar, yeniler);
    mukellefleriYaz(sonuc);

    return NextResponse.json({
      eklenen: eklenen.length,
      guncellenen: guncellenen.length,
      toplam: sonuc.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
