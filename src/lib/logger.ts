import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'data', 'logs');
const MAX_LOG_LINES = 5000;

function logDosyasiYolu(): string {
  const tarih = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `${tarih}.log`);
}

function satirYaz(seviye: string, mesaj: string): void {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const zaman = new Date().toISOString();
    const satir = `[${zaman}] [${seviye}] ${mesaj}\n`;
    fs.appendFileSync(logDosyasiYolu(), satir, 'utf-8');
  } catch { /* log hatası kritik değil */ }
}

export const logger = {
  info: (msg: string) => satirYaz('INFO', msg),
  warn: (msg: string) => satirYaz('WARN', msg),
  error: (msg: string) => satirYaz('ERROR', msg),
};

export function sonLoglarıOku(satirSayisi = 100): string[] {
  try {
    const dosya = logDosyasiYolu();
    if (!fs.existsSync(dosya)) return [];
    const icerik = fs.readFileSync(dosya, 'utf-8');
    return icerik.trim().split('\n').slice(-satirSayisi);
  } catch {
    return [];
  }
}
