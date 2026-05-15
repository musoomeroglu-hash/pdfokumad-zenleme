import { NextResponse } from 'next/server';
import { ayarlariOku, ayarlariYaz } from '@/lib/config';
import type { Ayarlar } from '@/types';

export async function GET() {
  return NextResponse.json(ayarlariOku());
}

export async function POST(request: Request) {
  const body = await request.json() as Ayarlar;
  ayarlariYaz(body);
  return NextResponse.json({ ok: true });
}
