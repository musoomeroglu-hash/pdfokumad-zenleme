import type { RaporSatiri } from '@/types';
import { raporuCSVEDonustur } from '@/lib/rapor';

export async function POST(request: Request) {
  const { satirlar } = await request.json() as { satirlar: RaporSatiri[] };
  const csv = raporuCSVEDonustur(satirlar);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rapor.csv"',
    },
  });
}
