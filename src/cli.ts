#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { ayarlariOku, expressAktarimYoluAl, mukellefleriOku } from './lib/config';
import { zirveKlasoruTara, bulunanFirmalariListele } from './lib/scanner';
import { firmaKlasorunuEslestir, eslesemeyenleriListele } from './lib/mapper';
import { organize } from './lib/organizer';
import type { OrganizeOptions } from './types/index';

const program = new Command();

program
  .name('antigravity')
  .description('Zirve Express Aktarım fatura klasörleme otomasyon aracı')
  .version('2.0.0');

// ── Klasörle komutu ──────────────────────────────────────────────────────────
program
  .command('klasorle')
  .description('Faturaları Zirve klasöründen hedef klasöre taşı/kopyala')
  .option('-k, --kaynak <yol>', 'Kaynak klasör (Zirve Express Aktarım yolu)')
  .option('-h, --hedef <yol>', 'Hedef klasör')
  .option('-a, --ay <YYYY-MM>', 'İşlenecek ay (örn: 2026-01). Belirtilmezse tüm dosyalar işlenir')
  .option('-f, --format <tip>', 'Dosya formatı: pdf | html | hepsi', 'pdf')
  .option('-y, --yontem <tip>', 'Kopyalama yöntemi: kopyala | tasi', 'kopyala')
  .option('--iade-ayri', 'İade faturalarını ayrı klasöre koy', false)
  .action(async (opts) => {
    let ayarlar;
    try {
      ayarlar = ayarlariOku();
    } catch {
      console.error(chalk.red('Hata: ayarlar.json okunamadı. Proje dizininde src/data/ayarlar.json dosyasının mevcut olduğundan emin olun.'));
      process.exit(1);
    }

    const kaynakKlasor = opts.kaynak ?? expressAktarimYoluAl(ayarlar);
    const hedefKlasor = opts.hedef ?? ayarlar.varsayilanHedefKlasor;
    const format = opts.format ?? ayarlar.dosyaFormati;
    const yontem = opts.yontem ?? ayarlar.kopyalamaYontemi;

    // Ay parse
    let yil: number;
    let ay: number | undefined;
    if (opts.ay) {
      const parcalar = (opts.ay as string).split('-');
      if (parcalar.length < 1 || isNaN(parseInt(parcalar[0], 10))) {
        console.error(chalk.red('Hata: Ay formatı geçersiz. Örnek: 2026-01'));
        process.exit(1);
      }
      yil = parseInt(parcalar[0], 10);
      ay = parcalar[1] ? parseInt(parcalar[1], 10) : undefined;
    } else {
      yil = new Date().getFullYear();
    }

    console.log(chalk.bold('\n🗂  Antigravity v2 — Fatura Klasörleme'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Kaynak : ${chalk.cyan(kaynakKlasor)}`);
    console.log(`Hedef  : ${chalk.cyan(hedefKlasor)}`);
    console.log(`Dönem  : ${chalk.cyan(opts.ay ?? `${yil} (tüm yıl)`)}`);
    console.log(`Format : ${chalk.cyan(format)}`);
    console.log(`Yöntem : ${chalk.cyan(yontem)}`);
    console.log(chalk.gray('─'.repeat(50)));

    const options: OrganizeOptions = {
      kaynakKlasor,
      hedefKlasor,
      yil,
      ay,
      kopyalama: yontem as 'kopyala' | 'tasi',
      dosyaFormati: format as 'pdf' | 'html' | 'hepsi',
      iadeAyriKlasor: opts.iadeAyri as boolean,
    };

    let son = 0;
    try {
      const sonuc = await organize(options, (islenen, toplam, dosya) => {
        const yuzde = Math.round((islenen / toplam) * 100);
        if (yuzde !== son) {
          son = yuzde;
          process.stdout.write(`\r  İşleniyor: [${yuzde.toString().padStart(3)}%] ${dosya.substring(0, 40).padEnd(40)}`);
        }
      });

      process.stdout.write('\n');
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.green(`✓ Başarılı : ${sonuc.basarili} dosya`));
      if (sonuc.atlanan > 0) {
        console.log(chalk.yellow(`~ Atlanan  : ${sonuc.atlanan} dosya`));
      }
      if (sonuc.basarisiz > 0) {
        console.log(chalk.red(`✗ Başarısız: ${sonuc.basarisiz} dosya`));
        console.log(chalk.red('\nHata detayları:'));
        sonuc.hatalar.forEach((h) => {
          console.log(chalk.red(`  • ${path.basename(h.dosyaYolu)}: ${h.hata}`));
        });
      }
      console.log(chalk.gray('─'.repeat(50)));
    } catch (err) {
      console.error(chalk.red(`\nKritik hata: ${String(err)}`));
      process.exit(1);
    }
  });

// ── Tara komutu ──────────────────────────────────────────────────────────────
program
  .command('tara')
  .description('Zirve klasörünü tara ve bulunan firmaları listele')
  .option('-k, --kaynak <yol>', 'Kaynak klasör (Zirve Express Aktarım yolu)')
  .action((opts) => {
    let ayarlar;
    try {
      ayarlar = ayarlariOku();
    } catch {
      console.error(chalk.red('Hata: ayarlar.json okunamadı.'));
      process.exit(1);
    }

    const kaynakKlasor = opts.kaynak ?? expressAktarimYoluAl(ayarlar);
    const mukellefler = mukellefleriOku();

    console.log(chalk.bold('\n🔍 Antigravity — Klasör Tarama'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`Kaynak: ${chalk.cyan(kaynakKlasor)}\n`);

    const firmalar = bulunanFirmalariListele(kaynakKlasor);
    if (firmalar.length === 0) {
      console.log(chalk.yellow('Hiç firma klasörü bulunamadı.'));
      return;
    }

    console.log(chalk.bold(`Bulunan ${firmalar.length} firma klasörü:\n`));
    firmalar.forEach((firma) => {
      const sonuc = firmaKlasorunuEslestir(firma, mukellefler);
      const renk = sonuc.eslesmeYontemi === 'bilinmeyen' ? chalk.yellow : chalk.green;
      const etiket = sonuc.eslesmeYontemi === 'bilinmeyen'
        ? chalk.yellow('[Eşleşme yok]')
        : chalk.green(`[${sonuc.eslesmeYontemi}]`);
      console.log(`  ${renk(firma.padEnd(30))} → ${sonuc.mukellefAdi} ${etiket}`);
    });

    const eslesmeyenler = eslesemeyenleriListele(firmalar, mukellefler);
    if (eslesmeyenler.length > 0) {
      console.log(chalk.yellow(`\n⚠ ${eslesmeyenler.length} firma eşleştirilemedi. 'mukellefler.json' dosyasını güncelleyin.`));
    }

    // Dosya sayısı
    try {
      const tarama = zirveKlasoruTara({ kaynakKlasor });
      console.log(chalk.gray(`\nToplam ${tarama.length} fatura dosyası bulundu.`));
    } catch {
      // Hata sessizce geç
    }

    console.log(chalk.gray('─'.repeat(50)));
  });

// ── Mükellef komutu ──────────────────────────────────────────────────────────
program
  .command('mukellef')
  .description('Mükellef listesini göster')
  .action(() => {
    const mukellefler = mukellefleriOku();
    console.log(chalk.bold('\n👥 Mükellef Listesi'));
    console.log(chalk.gray('─'.repeat(60)));
    mukellefler.forEach((m, i) => {
      const durum = m.aktif ? chalk.green('aktif') : chalk.gray('pasif');
      console.log(
        `  ${String(i + 1).padStart(2)}. ${m.ad.padEnd(30)} VKN: ${m.vkn}  ${durum}`
      );
    });
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray(`Toplam: ${mukellefler.filter((m) => m.aktif).length} aktif mükellef\n`));
  });

program.parse();
