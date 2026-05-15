import fs from 'fs';
import path from 'path';
import type { Ayarlar, Mukellef } from '../types/index';

const DATA_DIR = path.join(process.cwd(), 'data');
const AYARLAR_PATH = path.join(DATA_DIR, 'ayarlar.json');
const MUKELLEFLER_PATH = path.join(DATA_DIR, 'mukellefler.json');
const ISLENMIS_PATH = path.join(DATA_DIR, 'islenmis.json');

function ensureDataDir(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function ayarlariOku(): Ayarlar {
  ensureDataDir();
  if (!fs.existsSync(AYARLAR_PATH)) {
    const varsayilan: Ayarlar = {
      zirvenetYolu: 'D:\\Zirvenet',
      expressAktarimAltKlasor: 'Express Aktarım',
      varsayilanHedefKlasor: 'D:\\Faturalar',
      dosyaFormati: 'pdf',
      kopyalamaYontemi: 'kopyala',
      iadeAyriKlasor: false,
      klasorSablonu: '{mukellefAdi}/{yil}-{ay}-{ayAdi}/{faturaTipi}',
      dosyaSablonu: '{faturaNo}.{uzanti}',
    };
    fs.writeFileSync(AYARLAR_PATH, JSON.stringify(varsayilan, null, 2), 'utf-8');
    return varsayilan;
  }
  return JSON.parse(fs.readFileSync(AYARLAR_PATH, 'utf-8')) as Ayarlar;
}

export function ayarlariYaz(ayarlar: Ayarlar): void {
  ensureDataDir();
  fs.writeFileSync(AYARLAR_PATH, JSON.stringify(ayarlar, null, 2), 'utf-8');
}

export function mukellefleriOku(): Mukellef[] {
  ensureDataDir();
  if (!fs.existsSync(MUKELLEFLER_PATH)) {
    fs.writeFileSync(MUKELLEFLER_PATH, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(MUKELLEFLER_PATH, 'utf-8')) as Mukellef[];
}

export function mukellefleriYaz(mukellefler: Mukellef[]): void {
  ensureDataDir();
  fs.writeFileSync(MUKELLEFLER_PATH, JSON.stringify(mukellefler, null, 2), 'utf-8');
}

export function islenmisBilgileriniOku(): Record<string, string> {
  ensureDataDir();
  if (!fs.existsSync(ISLENMIS_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(ISLENMIS_PATH, 'utf-8')) as Record<string, string>;
  } catch { return {}; }
}

export function islenmisBilgileriniYaz(data: Record<string, string>): void {
  ensureDataDir();
  fs.writeFileSync(ISLENMIS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function expressAktarimYoluAl(ayarlar: Ayarlar): string {
  return path.join(ayarlar.zirvenetYolu, ayarlar.expressAktarimAltKlasor);
}
