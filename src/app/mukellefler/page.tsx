'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Upload, Search, RefreshCw } from 'lucide-react';
import type { Mukellef } from '@/types';

interface KesfetSonuc {
  firmaKlasor: string;
  eslesmedi: boolean;
}

export default function MukellefleerPage() {
  const [mukellefler, setMukellefler] = useState<Mukellef[]>([]);
  const [arama, setArama] = useState('');
  const [modalAcik, setModalAcik] = useState(false);
  const [duzenle, setDuzenle] = useState<Mukellef | null>(null);
  const [form, setForm] = useState({ vkn: '', ad: '', zirveKlasorAdi: '', entegrator: '', aktif: true });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [kesfetSonuclari, setKesfetSonuclari] = useState<KesfetSonuc[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  const yukle = async () => {
    const res = await fetch('/api/mukellefler');
    const data: Mukellef[] = await res.json();
    setMukellefler(data);
  };

  useEffect(() => { yukle(); }, []);

  const filtrelenmis = mukellefler.filter(
    (m) =>
      m.ad.toLowerCase().includes(arama.toLowerCase()) ||
      m.vkn.includes(arama)
  );

  const formAc = (m?: Mukellef) => {
    setDuzenle(m ?? null);
    setForm(m
      ? { vkn: m.vkn, ad: m.ad, zirveKlasorAdi: m.zirveKlasorAdi ?? '', entegrator: m.entegrator ?? '', aktif: m.aktif }
      : { vkn: '', ad: '', zirveKlasorAdi: '', entegrator: '', aktif: true }
    );
    setModalAcik(true);
  };

  const kaydet = async () => {
    setYukleniyor(true);
    const method = duzenle ? 'PUT' : 'POST';
    const res = await fetch('/api/mukellefler', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: duzenle?.id }),
    });
    if (res.ok) {
      setMesaj(duzenle ? 'Mükellef güncellendi' : 'Mükellef eklendi');
      setModalAcik(false);
      await yukle();
    } else {
      const err = await res.json();
      setMesaj(err.error ?? 'Hata oluştu');
    }
    setYukleniyor(false);
    setTimeout(() => setMesaj(''), 3000);
  };

  const sil = async (vkn: string) => {
    if (!confirm('Bu mükellef silinsin mi?')) return;
    await fetch('/api/mukellefler', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vkn }) });
    await yukle();
  };

  const importDosya = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setYukleniyor(true);
    const fd = new FormData();
    fd.append('dosya', file);
    const res = await fetch('/api/import', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) {
      setMesaj(`${data.eklenen} eklendi, ${data.guncellenen} güncellendi`);
      await yukle();
    } else {
      setMesaj(data.error ?? 'Import hatası');
    }
    setYukleniyor(false);
    e.target.value = '';
    setTimeout(() => setMesaj(''), 4000);
  };

  const kesfet = async () => {
    setYukleniyor(true);
    const res = await fetch('/api/kesfet');
    const data: KesfetSonuc[] = await res.json();
    setKesfetSonuclari(data);
    setYukleniyor(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mükellefler</h1>
          <p className="text-slate-500 text-sm mt-1">VKN–isim eşleştirme tablosu</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={kesfet} disabled={yukleniyor}>
            <Search className="w-4 h-4" /> Zirve'den Keşfet
          </button>
          <button className="btn-secondary" onClick={() => importRef.current?.click()}>
            <Upload className="w-4 h-4" /> CSV/Excel Import
          </button>
          <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={importDosya} />
          <button className="btn-primary" onClick={() => formAc()}>
            <Plus className="w-4 h-4" /> Mükellef Ekle
          </button>
        </div>
      </div>

      {mesaj && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          {mesaj}
        </div>
      )}

      {/* Keşfet sonuçları */}
      {kesfetSonuclari.length > 0 && (
        <div className="card mb-4 p-4">
          <p className="font-medium text-slate-700 mb-2">
            Zirve klasöründe {kesfetSonuclari.filter((k) => k.eslesmedi).length} eşleşmeyen firma:
          </p>
          <div className="flex flex-wrap gap-2">
            {kesfetSonuclari
              .filter((k) => k.eslesmedi)
              .map((k) => (
                <button
                  key={k.firmaKlasor}
                  className="badge-yellow cursor-pointer"
                  onClick={() => { formAc(); setForm((f) => ({ ...f, zirveKlasorAdi: k.firmaKlasor })); }}
                >
                  {k.firmaKlasor}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Arama */}
      <div className="mb-4">
        <input
          className="input max-w-xs"
          placeholder="İsim veya VKN ara..."
          value={arama}
          onChange={(e) => setArama(e.target.value)}
        />
      </div>

      {/* Tablo */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Mükellef Adı</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">VKN</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Zirve Klasör</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Entegratör</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Durum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtrelenmis.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  {arama ? 'Sonuç bulunamadı' : 'Henüz mükellef eklenmemiş'}
                </td>
              </tr>
            )}
            {filtrelenmis.map((m) => (
              <tr key={m.vkn} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{m.ad}</td>
                <td className="px-4 py-3 text-slate-600 font-mono">{m.vkn}</td>
                <td className="px-4 py-3 text-slate-500">{m.zirveKlasorAdi ?? '-'}</td>
                <td className="px-4 py-3 text-slate-500">{m.entegrator ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={m.aktif ? 'badge-green' : 'badge-red'}>
                    {m.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => formAc(m)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => sil(m.vkn)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          {mukellefler.filter((m) => m.aktif).length} aktif / {mukellefler.length} toplam mükellef
        </div>
      </div>

      {/* Modal */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              {duzenle ? 'Mükellef Düzenle' : 'Mükellef Ekle'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">VKN / TCKN *</label>
                <input
                  className="input"
                  value={form.vkn}
                  onChange={(e) => setForm({ ...form, vkn: e.target.value })}
                  placeholder="10 haneli VKN"
                  disabled={!!duzenle}
                />
              </div>
              <div>
                <label className="label">Mükellef Adı *</label>
                <input
                  className="input"
                  value={form.ad}
                  onChange={(e) => setForm({ ...form, ad: e.target.value })}
                  placeholder="Örn: Musa Ömeroğlu"
                />
              </div>
              <div>
                <label className="label">Zirve Klasör Adı</label>
                <input
                  className="input"
                  value={form.zirveKlasorAdi}
                  onChange={(e) => setForm({ ...form, zirveKlasorAdi: e.target.value })}
                  placeholder="Örn: MUSA OMEROGLU"
                />
              </div>
              <div>
                <label className="label">Entegratör</label>
                <input
                  className="input"
                  value={form.entegrator}
                  onChange={(e) => setForm({ ...form, entegrator: e.target.value })}
                  placeholder="Örn: Zirve Dönüşüm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="aktif"
                  checked={form.aktif}
                  onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="aktif" className="text-sm text-slate-700">Aktif</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={kaydet} disabled={yukleniyor}>
                {yukleniyor ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Kaydet
              </button>
              <button className="btn-secondary flex-1" onClick={() => setModalAcik(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
