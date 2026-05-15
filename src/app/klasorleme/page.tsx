'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft, FolderSearch, Filter, FolderOutput, Play, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADIMLAR = ['Kaynak', 'Filtrele', 'Hedef', 'Çalıştır'];

interface TaramaSonuc {
  firma: string;
  mukellef: string;
  eslesti: boolean;
  dosyaSayisi: number;
}

interface IlerlemeVerisi {
  islenen: number;
  toplam: number;
  dosya: string;
  done?: boolean;
  result?: { basarili: number; basarisiz: number; atlanan: number; duplikat: number };
  hata?: string;
}

interface Filtre {
  yil: number;
  ay: string;
  secilenMukellefler: string[];
  faturaTipi: string;
}

interface HedefAyarlar {
  hedefKlasor: string;
  dosyaFormati: string;
  kopyalamaYontemi: string;
  iadeAyriKlasor: boolean;
  duplikasyonKontrol: boolean;
}

export default function KlasorlemePage() {
  const [adim, setAdim] = useState(0);
  const [kaynakKlasor, setKaynakKlasor] = useState('');
  const [taraniyorMu, setTaraniyorMu] = useState(false);
  const [taramaSonuclari, setTaramaSonuclari] = useState<TaramaSonuc[]>([]);
  const [filtre, setFiltre] = useState<Filtre>({
    yil: new Date().getFullYear(),
    ay: '',
    secilenMukellefler: [],
    faturaTipi: 'hepsi',
  });
  const [hedef, setHedef] = useState<HedefAyarlar>({
    hedefKlasor: '',
    dosyaFormati: 'pdf',
    kopyalamaYontemi: 'kopyala',
    iadeAyriKlasor: false,
    duplikasyonKontrol: false,
  });
  const [ilerleme, setIlerleme] = useState<IlerlemeVerisi | null>(null);
  const [calisiyorMu, setCalisiyorMu] = useState(false);

  const tara = async () => {
    if (!kaynakKlasor) return;
    setTaraniyorMu(true);
    const res = await fetch('/api/tara', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kaynakKlasor }),
    });
    const data: TaramaSonuc[] = await res.json();
    setTaramaSonuclari(data);
    setTaraniyorMu(false);
  };

  const tumunuSec = () => {
    const hepsi = taramaSonuclari.map((t) => t.mukellef);
    setFiltre((f) => ({ ...f, secilenMukellefler: f.secilenMukellefler.length === hepsi.length ? [] : hepsi }));
  };

  const klasorle = async () => {
    setCalisiyorMu(true);
    setIlerleme({ islened: 0, toplam: 0, dosya: 'Başlatılıyor...' } as unknown as IlerlemeVerisi);

    const ayNo = filtre.ay ? parseInt(filtre.ay) : undefined;

    try {
      const res = await fetch('/api/klasorle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kaynakKlasor,
          hedefKlasor: hedef.hedefKlasor,
          yil: filtre.yil,
          ay: ayNo,
          kopyalama: hedef.kopyalamaYontemi,
          dosyaFormati: filtre.faturaTipi === 'hepsi' ? hedef.dosyaFormati : hedef.dosyaFormati,
          iadeAyriKlasor: hedef.iadeAyriKlasor,
          duplikasyonKontrol: hedef.duplikasyonKontrol,
          secilenMukellefler: filtre.secilenMukellefler.length > 0 ? filtre.secilenMukellefler : undefined,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data: IlerlemeVerisi = JSON.parse(line.slice(6));
            setIlerleme(data);
          } catch { /* kısmi chunk */ }
        }
      }
    } catch (err) {
      setIlerleme({ islenen: 0, toplam: 0, dosya: '', hata: String(err) } as IlerlemeVerisi);
    } finally {
      setCalisiyorMu(false);
    }
  };

  const yuzde = ilerleme?.toplam
    ? Math.round((ilerleme.islenen / ilerleme.toplam) * 100)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Klasörleme</h1>
        <p className="text-slate-500 text-sm mt-1">Faturaları otomatik klasörle — 4 adımda</p>
      </div>

      {/* Adım göstergesi */}
      <div className="flex items-center gap-2 mb-8">
        {ADIMLAR.map((ad, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              onClick={() => i < adim && setAdim(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                i === adim ? 'bg-blue-600 text-white' :
                i < adim ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200' :
                'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                i === adim ? 'bg-white/20 text-white' :
                i < adim ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-500'
              )}>
                {i < adim ? '✓' : i + 1}
              </span>
              {ad}
            </button>
            {i < ADIMLAR.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* ADIM 1: Kaynak */}
        {adim === 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <FolderSearch className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Kaynak Klasör</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Zirve Express Aktarım Klasörü *</label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={kaynakKlasor}
                    onChange={(e) => setKaynakKlasor(e.target.value)}
                    placeholder='Örn: D:\Zirvenet\Express Aktarım'
                  />
                  <button className="btn-secondary" onClick={tara} disabled={!kaynakKlasor || taraniyorMu}>
                    {taraniyorMu ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderSearch className="w-4 h-4" />}
                    Tara
                  </button>
                </div>
              </div>

              {taramaSonuclari.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    {taramaSonuclari.length} firma klasörü bulundu:
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {taramaSonuclari.map((t) => (
                      <div key={t.firma} className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg text-sm border',
                        t.eslesti ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                      )}>
                        <div>
                          <p className="font-mono text-xs text-slate-600">{t.firma}</p>
                          <p className="font-medium text-slate-800">{t.mukellef}</p>
                        </div>
                        <span className={t.eslesti ? 'badge-green' : 'badge-yellow'}>
                          {t.eslesti ? `${t.dosyaSayisi} dosya` : 'Eşleşme yok'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {taramaSonuclari.some((t) => !t.eslesti) && (
                    <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      ⚠ Bazı firmalar eşleştirilemedi. Mükellefler sayfasından ekleyebilirsiniz.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADIM 2: Filtrele */}
        {adim === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Filter className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Filtreleme</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Yıl *</label>
                <input
                  type="number"
                  className="input"
                  value={filtre.yil}
                  onChange={(e) => setFiltre({ ...filtre, yil: parseInt(e.target.value) })}
                  min={2020} max={2035}
                />
              </div>
              <div>
                <label className="label">Ay (boş = tümü)</label>
                <select className="input" value={filtre.ay} onChange={(e) => setFiltre({ ...filtre, ay: e.target.value })}>
                  <option value="">Tüm aylar</option>
                  {['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'].map((a, i) => (
                    <option key={i} value={String(i + 1)}>{a}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Mükellef Seçimi</label>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                  <div
                    className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50"
                    onClick={tumunuSec}
                  >
                    <input type="checkbox" readOnly
                      checked={filtre.secilenMukellefler.length === taramaSonuclari.length && taramaSonuclari.length > 0}
                      className="pointer-events-none"
                    />
                    <span className="text-sm font-medium text-slate-700">Tümünü Seç</span>
                  </div>
                  {taramaSonuclari.map((t) => (
                    <div
                      key={t.firma}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50"
                      onClick={() => {
                        setFiltre((f) => ({
                          ...f,
                          secilenMukellefler: f.secilenMukellefler.includes(t.mukellef)
                            ? f.secilenMukellefler.filter((m) => m !== t.mukellef)
                            : [...f.secilenMukellefler, t.mukellef],
                        }));
                      }}
                    >
                      <input type="checkbox" readOnly
                        checked={filtre.secilenMukellefler.includes(t.mukellef)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm text-slate-700">{t.mukellef}</span>
                    </div>
                  ))}
                  {taramaSonuclari.length === 0 && (
                    <p className="px-3 py-4 text-sm text-slate-400 text-center">Önce Adım 1&apos;de tarama yapın</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADIM 3: Hedef */}
        {adim === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <FolderOutput className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Hedef Ayarları</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Hedef Klasör *</label>
                <input
                  className="input"
                  value={hedef.hedefKlasor}
                  onChange={(e) => setHedef({ ...hedef, hedefKlasor: e.target.value })}
                  placeholder='Örn: D:\Faturalar'
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Dosya Formatı</label>
                  <select className="input" value={hedef.dosyaFormati} onChange={(e) => setHedef({ ...hedef, dosyaFormati: e.target.value })}>
                    <option value="pdf">Sadece PDF</option>
                    <option value="html">Sadece HTML</option>
                    <option value="hepsi">PDF + HTML</option>
                  </select>
                </div>
                <div>
                  <label className="label">Kopyalama Yöntemi</label>
                  <select className="input" value={hedef.kopyalamaYontemi} onChange={(e) => setHedef({ ...hedef, kopyalamaYontemi: e.target.value })}>
                    <option value="kopyala">Kopyala</option>
                    <option value="tasi">Taşı</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hedef.iadeAyriKlasor}
                    onChange={(e) => setHedef({ ...hedef, iadeAyriKlasor: e.target.checked })} />
                  <span className="text-sm text-slate-700">İade faturalarını ayrı klasöre koy</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hedef.duplikasyonKontrol}
                    onChange={(e) => setHedef({ ...hedef, duplikasyonKontrol: e.target.checked })} />
                  <span className="text-sm text-slate-700">Duplikasyon kontrolü (daha önce işlenenleri atla)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ADIM 4: Çalıştır */}
        {adim === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Play className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-800">Çalıştır</h2>
            </div>

            {/* Özet */}
            {!ilerleme && (
              <div className="bg-slate-50 rounded-lg p-4 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kaynak:</span>
                  <span className="text-slate-800 font-mono text-xs">{kaynakKlasor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hedef:</span>
                  <span className="text-slate-800 font-mono text-xs">{hedef.hedefKlasor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dönem:</span>
                  <span className="text-slate-800">{filtre.yil}{filtre.ay ? `-${filtre.ay.padStart(2,'0')}` : ' (tüm yıl)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mükellef:</span>
                  <span className="text-slate-800">
                    {filtre.secilenMukellefler.length > 0
                      ? `${filtre.secilenMukellefler.length} seçili`
                      : 'Tümü'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format:</span>
                  <span className="text-slate-800">{hedef.dosyaFormati.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Yöntem:</span>
                  <span className="text-slate-800 capitalize">{hedef.kopyalamaYontemi}</span>
                </div>
              </div>
            )}

            {/* İlerleme */}
            {ilerleme && (
              <div className="mb-5 space-y-3">
                {ilerleme.hata ? (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
                    <XCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{ilerleme.hata}</span>
                  </div>
                ) : ilerleme.done && ilerleme.result ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">Klasörleme tamamlandı!</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{ilerleme.result.basarili}</p>
                        <p className="text-xs text-green-600">Başarılı</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-700">{ilerleme.result.basarisiz}</p>
                        <p className="text-xs text-red-600">Başarısız</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-yellow-700">{ilerleme.result.atlanan}</p>
                        <p className="text-xs text-yellow-600">Atlanan</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-700">{ilerleme.result.duplikat}</p>
                        <p className="text-xs text-slate-600">Duplikat</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-sm text-slate-600 mb-2">
                      <span className="truncate max-w-xs">{ilerleme.dosya}</span>
                      <span className="font-medium">{yuzde}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${yuzde}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {ilerleme.islenen} / {ilerleme.toplam} dosya
                    </p>
                  </div>
                )}
              </div>
            )}

            {!calisiyorMu && !ilerleme?.done && (
              <button
                className="btn-primary w-full justify-center py-3"
                onClick={klasorle}
                disabled={!kaynakKlasor || !hedef.hedefKlasor}
              >
                <Play className="w-4 h-4" />
                Klasörlemeyi Başlat
              </button>
            )}

            {ilerleme?.done && (
              <button
                className="btn-secondary w-full justify-center"
                onClick={() => { setIlerleme(null); setAdim(0); }}
              >
                Yeni Klasörleme
              </button>
            )}
          </div>
        )}

        {/* Navigasyon butonları */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
          <button
            className="btn-secondary"
            onClick={() => setAdim((a) => a - 1)}
            disabled={adim === 0}
          >
            <ChevronLeft className="w-4 h-4" /> Geri
          </button>
          {adim < ADIMLAR.length - 1 && (
            <button
              className="btn-primary"
              onClick={() => setAdim((a) => a + 1)}
              disabled={
                (adim === 0 && !kaynakKlasor) ||
                (adim === 2 && !hedef.hedefKlasor)
              }
            >
              İleri <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
