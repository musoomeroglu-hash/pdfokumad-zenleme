export type DosyaUzantisi = '.pdf' | '.html' | '.xml';
export type FaturaTipi = 'Gelen' | 'Giden';
export type KopyalamaYontemi = 'kopyala' | 'tasi';
export type DosyaFormati = 'pdf' | 'html' | 'hepsi';

export const AY_ADLARI: Record<number, string> = {
  1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
  5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
  9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık',
};

export interface ScanResult {
  firmaKlasor: string;
  tip: FaturaTipi;
  dosyaYolu: string;
  dosyaAdi: string;
  uzanti: DosyaUzantisi;
}

export interface FaturaMetadata {
  faturaNo: string;
  faturaUUID: string;
  faturaTarihi: Date | null;
  faturaTipi: string;
  profilID: string;
  saticiVKN: string;
  saticiUnvan: string;
  aliciVKN: string;
  aliciUnvan: string;
  paraBirimi: string;
  matrah: number;
  kdvToplam: number;
  genelToplam: number;
  kdvOranlari: number[];
}

export interface Mukellef {
  id?: string;
  vkn: string;
  ad: string;
  zirveKlasorAdi?: string;
  entegrator?: string;
  aktif: boolean;
}

export interface Ayarlar {
  zirvenetYolu: string;
  expressAktarimAltKlasor: string;
  varsayilanHedefKlasor: string;
  dosyaFormati: DosyaFormati;
  kopyalamaYontemi: KopyalamaYontemi;
  iadeAyriKlasor: boolean;
  klasorSablonu: string;
  dosyaSablonu: string;
  duplikasyonKontrol?: boolean;
}

export interface OrganizeOptions {
  kaynakKlasor: string;
  hedefKlasor: string;
  yil: number;
  ay?: number;
  kopyalama: KopyalamaYontemi;
  dosyaFormati: DosyaFormati;
  iadeAyriKlasor: boolean;
  duplikasyonKontrol?: boolean;
  secilenMukellefler?: string[];
}

export interface OrganizeResult {
  basarili: number;
  basarisiz: number;
  atlanan: number;
  duplikat: number;
  hatalar: HataKaydi[];
  islemler: IslemKaydi[];
}

export interface HataKaydi {
  dosyaYolu: string;
  hata: string;
}

export interface IslemKaydi {
  kaynakDosya: string;
  hedefDosya: string;
  mukellef: string;
  ay: string;
  tip: string;
  faturaNo?: string;
  tutar?: number;
}

export interface RaporSatiri {
  mukellef: string;
  ay: string;
  alisAdedi: number;
  satisAdedi: number;
  alisToplamTutar: number;
  satisToplamTutar: number;
  alisToplam: number;
  satisToplam: number;
}
