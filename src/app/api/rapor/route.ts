import { NextResponse } from 'next/server';
import { zirveKlasoruTara } from '@/lib/scanner';
import { firmaKlasorunuEslestir } from '@/lib/mapper';
import { mukellefleriOku } from '@/lib/config';
import { dosyayiParse } from '@/lib/parser';
import { siniflandir } from '@/lib/classifier';
import { islemlerdenRaporUret } from '@/lib/rapor';
import type { IslemKaydi } from '@/types';

export async function POST(request: Request) {
  try {
    const { kaynakKlasor, yil, ay } = await request.json() as {
      kaynakKlasor: string;
      yil: number;
      ay?: number;
    };

    const mukellefler = mukellefleriOku();
    const tarama = zirveKlasoruTara({ kaynakKlasor });

    const islemler: IslemKaydi[] = [];

    for (const scan of tarama) {
      if (scan.uzanti === '.html') continue; // PDF ile eşli olduğu için atla

      const eslesme = firmaKlasorunuEslestir(scan.firmaKlasor, mukellefler);
      const meta = dosyayiParse(scan.dosyaYolu);

      const hedefYil = meta?.faturaTarihi?.getFullYear() ?? yil;
      const hedefAy = meta?.faturaTarihi ? meta.faturaTarihi.getMonth() + 1 : (ay ?? 0);

      if (hedefYil !== yil) continue;
      if (ay && hedefAy !== ay) continue;

      const sinif = siniflandir(scan.tip, meta, eslesme.mukellef?.vkn ?? '');
      const tipKlasor = sinif.tip === 'Gelen' ? 'Alış Faturaları' : 'Satış Faturaları';

      islemler.push({
        kaynakDosya: scan.dosyaYolu,
        hedefDosya: '',
        mukellef: eslesme.mukellefAdi,
        ay: `${hedefYil}-${String(hedefAy).padStart(2, '0')}`,
        tip: tipKlasor,
        faturaNo: meta?.faturaNo,
        tutar: meta?.genelToplam,
      });
    }

    const rapor = islemlerdenRaporUret(islemler);
    return NextResponse.json(rapor);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
