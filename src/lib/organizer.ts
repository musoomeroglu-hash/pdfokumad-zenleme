import fs from 'fs';
import path from 'path';
import type { OrganizeOptions, OrganizeResult, IslemKaydi, HataKaydi, ScanResult } from '../types/index';
import { AY_ADLARI } from '../types/index';
import { zirveKlasoruTara } from './scanner';
import { firmaKlasorunuEslestir } from './mapper';
import { mukellefleriOku, islenmisBilgileriniOku, islenmisBilgileriniYaz } from './config';
import { dosyayiParse } from './parser';
import { siniflandir, faturaTipindenKlasorAdi } from './classifier';
import { logger } from './logger';

function dosyaAdiTemizle(ad: string): string {
  return ad.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'fatura';
}

function benzersizYol(hedef: string): string {
  if (!fs.existsSync(hedef)) return hedef;
  const dir = path.dirname(hedef);
  const ext = path.extname(hedef);
  const base = path.basename(hedef, ext);
  for (let i = 2; i < 9999; i++) {
    const aday = path.join(dir, `${base}_${i}${ext}`);
    if (!fs.existsSync(aday)) return aday;
  }
  return hedef;
}

function hedefYoluOlustur(
  hedefKok: string,
  mukellefAdi: string,
  yil: number,
  ay: number,
  tipKlasor: string
): string {
  const ayStr = String(ay).padStart(2, '0');
  const ayAdi = AY_ADLARI[ay] ?? `Ay-${ayStr}`;
  return path.join(
    hedefKok,
    dosyaAdiTemizle(mukellefAdi),
    `${yil}-${ayStr}-${ayAdi}`,
    tipKlasor
  );
}

export interface OrganizeProgressCallback {
  (islenen: number, toplam: number, dosya: string): void;
}

export async function organize(
  options: OrganizeOptions,
  onProgress?: OrganizeProgressCallback
): Promise<OrganizeResult> {
  const {
    kaynakKlasor, hedefKlasor, yil, ay,
    kopyalama, dosyaFormati, iadeAyriKlasor,
    duplikasyonKontrol = false,
    secilenMukellefler,
  } = options;

  const mukellefler = mukellefleriOku();
  const islenmisLog = duplikasyonKontrol ? islenmisBilgileriniOku() : {};
  const hatalar: HataKaydi[] = [];
  const islemler: IslemKaydi[] = [];
  let atlanan = 0;
  let duplikat = 0;

  let tarama: ScanResult[];
  try {
    tarama = zirveKlasoruTara({ kaynakKlasor });
  } catch (err) {
    throw new Error(`Tarama başarısız: ${String(err)}`);
  }

  // Format filtresi
  const formatFiltre = tarama.filter((s) => {
    if (dosyaFormati === 'hepsi') return true;
    if (dosyaFormati === 'pdf') return s.uzanti === '.pdf';
    if (dosyaFormati === 'html') return s.uzanti === '.html';
    return true;
  });

  // Mükellef filtresi
  const filtrelenmis = secilenMukellefler?.length
    ? formatFiltre.filter((s) => {
        const eslesme = firmaKlasorunuEslestir(s.firmaKlasor, mukellefler);
        return secilenMukellefler.includes(eslesme.mukellefAdi);
      })
    : formatFiltre;

  const toplam = filtrelenmis.length;

  for (let i = 0; i < filtrelenmis.length; i++) {
    const scan = filtrelenmis[i];
    onProgress?.(i + 1, toplam, scan.dosyaAdi);

    // Mükellef eşleştir
    const eslesme = firmaKlasorunuEslestir(scan.firmaKlasor, mukellefler);

    // Metadata parse (Faz 2)
    const meta = dosyayiParse(scan.dosyaYolu);

    // Duplikasyon kontrolü
    if (duplikasyonKontrol && meta?.faturaUUID && islenmisLog[meta.faturaUUID]) {
      duplikat++;
      logger.info(`Duplikat atlandı: ${scan.dosyaAdi} (UUID: ${meta.faturaUUID})`);
      continue;
    }

    // Fatura tipi belirle (Faz 2: VKN doğrulamalı)
    const mukellefVKN = eslesme.mukellef?.vkn ?? '';
    const sinif = siniflandir(scan.tip, meta, mukellefVKN);
    const tipKlasor = faturaTipindenKlasorAdi(sinif.tip, meta?.faturaTipi ?? '', iadeAyriKlasor);

    // Tarih belirleme (Faz 2: fatura tarihinden, fallback: CLI parametresi)
    let hedefYil = yil;
    let hedefAy = ay ?? new Date().getMonth() + 1;
    if (meta?.faturaTarihi) {
      hedefYil = meta.faturaTarihi.getFullYear();
      hedefAy = meta.faturaTarihi.getMonth() + 1;
    }

    // Yıl filtresi
    if (hedefYil !== yil) {
      atlanan++;
      continue;
    }

    // Ay filtresi (ay parametresi verilmişse)
    if (ay && hedefAy !== ay) {
      atlanan++;
      continue;
    }

    // Dosya adı (Faz 2: fatura numarasından)
    const faturaNo = meta?.faturaNo?.trim();
    const hedefDosyaAdi = dosyaAdiTemizle(
      faturaNo ? `${faturaNo}${scan.uzanti}` : scan.dosyaAdi
    );

    const hedefDir = hedefYoluOlustur(hedefKlasor, eslesme.mukellefAdi, hedefYil, hedefAy, tipKlasor);
    const hedefTamYol = benzersizYol(path.join(hedefDir, hedefDosyaAdi));

    try {
      fs.mkdirSync(hedefDir, { recursive: true });

      if (kopyalama === 'kopyala') {
        fs.copyFileSync(scan.dosyaYolu, hedefTamYol);
      } else {
        fs.renameSync(scan.dosyaYolu, hedefTamYol);
      }

      // Duplikasyon logu güncelle
      if (duplikasyonKontrol && meta?.faturaUUID) {
        islenmisLog[meta.faturaUUID] = hedefTamYol;
      }

      const islem: IslemKaydi = {
        kaynakDosya: scan.dosyaYolu,
        hedefDosya: hedefTamYol,
        mukellef: eslesme.mukellefAdi,
        ay: `${hedefYil}-${String(hedefAy).padStart(2, '0')}`,
        tip: tipKlasor,
        faturaNo: faturaNo || undefined,
        tutar: meta?.genelToplam || undefined,
      };
      islemler.push(islem);
      logger.info(`${kopyalama === 'kopyala' ? 'Kopyalandı' : 'Taşındı'}: ${scan.dosyaAdi} → ${hedefTamYol}`);
    } catch (err) {
      const hataStr = String(err);
      hatalar.push({ dosyaYolu: scan.dosyaYolu, hata: hataStr });
      logger.error(`Hata: ${scan.dosyaYolu} — ${hataStr}`);
    }
  }

  // Duplikasyon logunu kaydet
  if (duplikasyonKontrol && Object.keys(islenmisLog).length > 0) {
    islenmisBilgileriniYaz(islenmisLog);
  }

  return { basarili: islemler.length, basarisiz: hatalar.length, atlanan, duplikat, hatalar, islemler };
}
