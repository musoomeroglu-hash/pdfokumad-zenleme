import { NextResponse } from 'next/server';
import { mukellefleriOku, mukellefleriYaz } from '@/lib/config';
import type { Mukellef } from '@/types';

export async function GET() {
  return NextResponse.json(mukellefleriOku());
}

export async function POST(request: Request) {
  const body = await request.json() as Mukellef;
  if (!body.vkn || !body.ad) {
    return NextResponse.json({ error: 'VKN ve Ad zorunlu' }, { status: 400 });
  }

  const mukellefler = mukellefleriOku();
  if (mukellefler.find((m) => m.vkn === body.vkn)) {
    return NextResponse.json({ error: 'Bu VKN zaten kayıtlı' }, { status: 409 });
  }

  const yeni: Mukellef = {
    ...body,
    id: `${Date.now()}-${body.vkn}`,
    aktif: body.aktif ?? true,
  };
  mukellefleriYaz([...mukellefler, yeni]);
  return NextResponse.json(yeni, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json() as Mukellef;
  const mukellefler = mukellefleriOku();
  const idx = mukellefler.findIndex((m) => m.vkn === body.vkn);
  if (idx === -1) return NextResponse.json({ error: 'Mükellef bulunamadı' }, { status: 404 });

  mukellefler[idx] = { ...mukellefler[idx], ...body };
  mukellefleriYaz(mukellefler);
  return NextResponse.json(mukellefler[idx]);
}

export async function DELETE(request: Request) {
  const { vkn } = await request.json() as { vkn: string };
  const mukellefler = mukellefleriOku().filter((m) => m.vkn !== vkn);
  mukellefleriYaz(mukellefler);
  return NextResponse.json({ ok: true });
}
