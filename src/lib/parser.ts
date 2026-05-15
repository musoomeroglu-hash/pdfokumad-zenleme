import { XMLParser } from 'fast-xml-parser';
import { load as cheerioLoad } from 'cheerio';
import fs from 'fs';
import path from 'path';
import type { FaturaMetadata } from '../types/index';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseAttributeValue: false,
  parseTagValue: true,
  trimValues: true,
  isArray: (tagName) =>
    ['InvoiceLine', 'TaxSubtotal', 'TaxTotal', 'PartyIdentification', 'PartyTaxScheme'].includes(tagName),
});

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    return safeStr(obj['#text'] ?? obj['_text']);
  }
  return String(val).trim();
}

function safeNum(val: unknown): number {
  const s = safeStr(val);
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseDate(val: unknown): Date | null {
  const s = safeStr(val);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function extractParty(party: unknown): { vkn: string; unvan: string } {
  if (!party || typeof party !== 'object') return { vkn: '', unvan: '' };
  const p = party as Record<string, unknown>;

  let vkn = '';
  const ids = Array.isArray(p['PartyIdentification'])
    ? p['PartyIdentification']
    : p['PartyIdentification']
    ? [p['PartyIdentification']]
    : [];

  for (const id of ids as Record<string, unknown>[]) {
    const idObj = id['ID'] as Record<string, unknown> | string | undefined;
    const schemeID =
      (idObj as Record<string, unknown>)?.['@_schemeID'] ??
      (id['@_schemeID'] as string) ?? '';
    const value = safeStr(idObj);
    if (['VKN', 'TCKN'].includes(String(schemeID)) && value) {
      vkn = value;
      break;
    }
    if (value && !vkn) vkn = value;
  }

  // Fallback: PartyTaxScheme
  if (!vkn) {
    const schemes = Array.isArray(p['PartyTaxScheme'])
      ? p['PartyTaxScheme']
      : p['PartyTaxScheme']
      ? [p['PartyTaxScheme']]
      : [];
    for (const s of schemes as Record<string, unknown>[]) {
      const compID = safeStr((s as Record<string, unknown>)['CompanyID']);
      if (compID) { vkn = compID; break; }
    }
  }

  const unvan = safeStr(
    (p['PartyName'] as Record<string, unknown>)?.['Name']
  );

  return { vkn, unvan };
}

export function xmlParse(icerik: string): FaturaMetadata | null {
  try {
    const parsed = xmlParser.parse(icerik) as Record<string, unknown>;
    const inv = (parsed['Invoice'] ?? parsed['CreditNote']) as Record<string, unknown> | undefined;
    if (!inv) return null;

    const supplier = (inv['AccountingSupplierParty'] as Record<string, unknown>)?.['Party'];
    const customer = (inv['AccountingCustomerParty'] as Record<string, unknown>)?.['Party'];
    const satici = extractParty(supplier);
    const alici = extractParty(customer);

    const taxTotals = Array.isArray(inv['TaxTotal'])
      ? (inv['TaxTotal'] as Record<string, unknown>[])
      : inv['TaxTotal']
      ? [inv['TaxTotal'] as Record<string, unknown>]
      : [];

    let kdvToplam = 0;
    const kdvOranlari: number[] = [];
    for (const tt of taxTotals) {
      kdvToplam += safeNum(tt['TaxAmount']);
      const subs = Array.isArray(tt['TaxSubtotal'])
        ? (tt['TaxSubtotal'] as Record<string, unknown>[])
        : tt['TaxSubtotal']
        ? [tt['TaxSubtotal'] as Record<string, unknown>]
        : [];
      for (const sub of subs) {
        const oran = safeNum((sub['TaxCategory'] as Record<string, unknown>)?.['Percent']);
        if (!kdvOranlari.includes(oran)) kdvOranlari.push(oran);
      }
    }

    const lmt = inv['LegalMonetaryTotal'] as Record<string, unknown> | undefined;
    const matrah = safeNum(lmt?.['TaxExclusiveAmount']);
    const genelToplam = safeNum(lmt?.['PayableAmount']);

    return {
      faturaNo: safeStr(inv['ID']),
      faturaUUID: safeStr(inv['UUID']),
      faturaTarihi: parseDate(inv['IssueDate']),
      faturaTipi: safeStr(inv['InvoiceTypeCode'] ?? inv['CreditNoteTypeCode'] ?? 'SATIS'),
      profilID: safeStr(inv['ProfileID']),
      saticiVKN: satici.vkn,
      saticiUnvan: satici.unvan,
      aliciVKN: alici.vkn,
      aliciUnvan: alici.unvan,
      paraBirimi: safeStr(inv['DocumentCurrencyCode']) || 'TRY',
      matrah,
      kdvToplam,
      genelToplam,
      kdvOranlari,
    };
  } catch {
    return null;
  }
}

export function htmlParse(icerik: string): Partial<FaturaMetadata> {
  try {
    const $ = cheerioLoad(icerik);
    const metin = $('body').text();
    const sonuc: Partial<FaturaMetadata> = {};

    // UUID
    const uuidM = metin.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    if (uuidM) sonuc.faturaUUID = uuidM[1];

    // Fatura No (e.g. ABC2026000000001)
    const noM = metin.match(/\b([A-Z]{2,4}(?:2\d{3})\d{9,13})\b/);
    if (noM) sonuc.faturaNo = noM[1];

    // Tarih
    const tarihM = metin.match(/(\d{4}-\d{2}-\d{2})/) ?? metin.match(/(\d{2})[./](\d{2})[./](\d{4})/);
    if (tarihM) {
      const str = tarihM[0].includes('-')
        ? tarihM[0]
        : `${tarihM[3]}-${tarihM[2]}-${tarihM[1]}`;
      const d = new Date(str);
      if (!isNaN(d.getTime())) sonuc.faturaTarihi = d;
    }

    // VKN'ler (10 hane)
    const vknAll: string[] = [];
    let vknM: RegExpExecArray | null;
    const vknRe = /\b(\d{10})\b/g;
    while ((vknM = vknRe.exec(metin)) !== null) vknAll.push(vknM[1]);
    if (vknAll[0]) sonuc.saticiVKN = vknAll[0];
    if (vknAll[1]) sonuc.aliciVKN = vknAll[1];

    return sonuc;
  } catch {
    return {};
  }
}

// Bir dosyadan metadata çıkarır; eşli XML/HTML dosyasını da dener
export function dosyayiParse(dosyaYolu: string): FaturaMetadata | null {
  const ext = path.extname(dosyaYolu).toLowerCase();
  const dir = path.dirname(dosyaYolu);
  const base = path.basename(dosyaYolu, ext);

  // XML dosyasını önce dene
  const xmlYolu = path.join(dir, `${base}.xml`);
  if (fs.existsSync(xmlYolu)) {
    try {
      const meta = xmlParse(fs.readFileSync(xmlYolu, 'utf-8'));
      if (meta) return meta;
    } catch { /* devam */ }
  }

  if (ext === '.xml') {
    try {
      return xmlParse(fs.readFileSync(dosyaYolu, 'utf-8'));
    } catch { return null; }
  }

  if (ext === '.html') {
    try {
      const icerik = fs.readFileSync(dosyaYolu, 'utf-8');
      // HTML içinde gömülü Invoice XML var mı?
      const xmlM = icerik.match(/<(?:\w+:)?Invoice[^>]*>[\s\S]*?<\/(?:\w+:)?Invoice>/i);
      if (xmlM) {
        const meta = xmlParse(xmlM[0]);
        if (meta) return meta;
      }
      // Saf HTML parse
      const partial = htmlParse(icerik);
      return {
        faturaNo: partial.faturaNo ?? '',
        faturaUUID: partial.faturaUUID ?? '',
        faturaTarihi: partial.faturaTarihi ?? null,
        faturaTipi: partial.faturaTipi ?? '',
        profilID: partial.profilID ?? '',
        saticiVKN: partial.saticiVKN ?? '',
        saticiUnvan: partial.saticiUnvan ?? '',
        aliciVKN: partial.aliciVKN ?? '',
        aliciUnvan: partial.aliciUnvan ?? '',
        paraBirimi: 'TRY',
        matrah: 0,
        kdvToplam: 0,
        genelToplam: 0,
        kdvOranlari: [],
      };
    } catch { return null; }
  }

  // PDF veya bilinmeyen — eşli HTML dene
  const htmlYolu = path.join(dir, `${base}.html`);
  if (fs.existsSync(htmlYolu)) {
    return dosyayiParse(htmlYolu);
  }

  return null;
}
