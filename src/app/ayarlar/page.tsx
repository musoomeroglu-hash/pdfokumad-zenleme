'use client';

import { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import type { Ayarlar } from '@/types';

const VARSAYILAN: Ayarlar = {
  zirvenetYolu: 'D:\\Zirvenet',
  expressAktarimAltKlasor: 'Express Aktarım',
  varsayilanHedefKlasor: 'D:\\Faturalar',
  dosyaFormati: 'pdf',
  kopyalamaYontemi: 'kopyala',
  iadeAyriKlasor: false,
  klasorSablonu: '{mukellefAdi}/{yil}-{ay}-{ayAdi}/{faturaTipi}',
  dosyaSablonu: '{faturaNo}.{uzanti}',
  duplikasyonKontrol: false,
};

export default function AyarlarPage() {
  const [ayarlar, setAyarlar] = useState<Ayarlar>(VARSAYILAN);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState('');

  useEffect(() => {
    fetch('/api/ayarlar')
      .then((r) => r.json())
      .then((data: Ayarlar) => setAyarlar({ ...VARSAYILAN, ...data }))
      .catch(() => {});
  }, []);

  const kaydet = async () => {
    setKaydediliyor(true);
    const res = await fetch('/api/ayarlar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ayarlar),
    });
    setMesaj(res.ok ? 'Ayarlar kaydedildi.' : 'Kayıt başarısız.');
    setKaydediliyor(false);
    setTimeout(() => setMesaj(''), 3000);
  };

  const set = (k: keyof Ayarlar, v: unknown) => setAyarlar((a) => ({ ...a, [k]: v }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
        <p className="text-slate-500 text-sm mt-1">Uygulama konfigürasyonu</p>
      </div>

      {mesaj && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {mesaj}
        </div>
      )}

      <div className="space-y-4 max-w-2xl">
        {/* Zirvenet */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Zirve Kurulum</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Zirvenet Kurulum Yolu</label>
              <input
                className="input"
                value={ayarlar.zirvenetYolu}
                onChange={(e) => set('zirvenetYolu', e.target.value)}
                placeholder='D:\Zirvenet'
              />
            </div>
            <div>
              <label className="label">Express Aktarım Alt Klasörü</label>
              <input
                className="input"
                value={ayarlar.expressAktarimAltKlasor}
                onChange={(e) => set('expressAktarimAltKlasor', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Hedef */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Varsayılan Hedef</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Varsayılan Hedef Klasör</label>
              <input
                className="input"
                value={ayarlar.varsayilanHedefKlasor}
                onChange={(e) => set('varsayilanHedefKlasor', e.target.value)}
                placeholder='D:\Faturalar'
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Varsayılan Dosya Formatı</label>
                <select className="input" value={ayarlar.dosyaFormati} onChange={(e) => set('dosyaFormati', e.target.value)}>
                  <option value="pdf">Sadece PDF</option>
                  <option value="html">Sadece HTML</option>
                  <option value="hepsi">PDF + HTML</option>
                </select>
              </div>
              <div>
                <label className="label">Kopyalama Yöntemi</label>
                <select className="input" value={ayarlar.kopyalamaYontemi} onChange={(e) => set('kopyalamaYontemi', e.target.value)}>
                  <option value="kopyala">Kopyala</option>
                  <option value="tasi">Taşı</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Davranış */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Davranış</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ayarlar.iadeAyriKlasor}
                onChange={(e) => set('iadeAyriKlasor', e.target.checked)}
                className="rounded"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">İade faturalarını ayrı klasöre koy</span>
                <p className="text-xs text-slate-400">Alış İade / Satış İade klasörleri oluşturulur</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ayarlar.duplikasyonKontrol ?? false}
                onChange={(e) => set('duplikasyonKontrol', e.target.checked)}
                className="rounded"
              />
              <div>
                <span className="text-sm font-medium text-slate-700">Duplikasyon kontrolü</span>
                <p className="text-xs text-slate-400">Daha önce işlenen faturalar tekrar kopyalanmaz (UUID bazlı)</p>
              </div>
            </label>
          </div>
        </div>

        {/* Şablonlar */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Klasör Şablonları</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Klasör Şablonu</label>
              <input
                className="input font-mono text-sm"
                value={ayarlar.klasorSablonu}
                onChange={(e) => set('klasorSablonu', e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                Değişkenler: {'{mukellefAdi}'} {'{yil}'} {'{ay}'} {'{ayAdi}'} {'{faturaTipi}'}
              </p>
            </div>
            <div>
              <label className="label">Dosya Adı Şablonu</label>
              <input
                className="input font-mono text-sm"
                value={ayarlar.dosyaSablonu}
                onChange={(e) => set('dosyaSablonu', e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                Değişkenler: {'{faturaNo}'} {'{uzanti}'}
              </p>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={kaydet} disabled={kaydediliyor}>
          {kaydediliyor ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}
