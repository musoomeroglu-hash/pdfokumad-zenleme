'use client';

import { useState } from 'react';
import { Download, RefreshCw, FileBarChart } from 'lucide-react';
import { formatTL } from '@/lib/utils';
import type { RaporSatiri } from '@/types';

export default function RaporPage() {
  const [kaynakKlasor, setKaynakKlasor] = useState('');
  const [yil, setYil] = useState(new Date().getFullYear());
  const [ay, setAy] = useState('');
  const [satirlar, setSatirlar] = useState<RaporSatiri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  const olustur = async () => {
    if (!kaynakKlasor) return;
    setYukleniyor(true);
    setHata('');
    const res = await fetch('/api/rapor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kaynakKlasor, yil, ay: ay ? parseInt(ay) : undefined }),
    });
    if (res.ok) {
      const data: RaporSatiri[] = await res.json();
      setSatirlar(data);
    } else {
      const err = await res.json();
      setHata(err.error ?? 'Rapor oluşturulamadı');
    }
    setYukleniyor(false);
  };

  const csvIndir = async () => {
    const res = await fetch('/api/rapor/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ satirlar }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapor-${yil}${ay ? '-' + ay.padStart(2, '0') : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toplamAlis = satirlar.reduce((s, r) => s + r.alisToplam, 0);
  const toplamSatis = satirlar.reduce((s, r) => s + r.satisToplam, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Fatura Raporu</h1>
        <p className="text-slate-500 text-sm mt-1">Mükellef bazlı alış/satış özeti</p>
      </div>

      {/* Filtre */}
      <div className="card p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="label">Kaynak Klasör</label>
            <input
              className="input"
              value={kaynakKlasor}
              onChange={(e) => setKaynakKlasor(e.target.value)}
              placeholder='D:\Zirvenet\Express Aktarım'
            />
          </div>
          <div>
            <label className="label">Yıl</label>
            <input type="number" className="input w-28" value={yil}
              onChange={(e) => setYil(parseInt(e.target.value))} min={2020} max={2035} />
          </div>
          <div>
            <label className="label">Ay</label>
            <select className="input w-36" value={ay} onChange={(e) => setAy(e.target.value)}>
              <option value="">Tüm yıl</option>
              {['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'].map((a, i) => (
                <option key={i} value={String(i + 1)}>{a}</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={olustur} disabled={!kaynakKlasor || yukleniyor}>
            {yukleniyor ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
            Rapor Oluştur
          </button>
          {satirlar.length > 0 && (
            <button className="btn-secondary" onClick={csvIndir}>
              <Download className="w-4 h-4" /> CSV İndir
            </button>
          )}
        </div>
      </div>

      {hata && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {hata}
        </div>
      )}

      {satirlar.length > 0 && (
        <>
          {/* Özet */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Toplam Alış</p>
              <p className="text-lg font-bold text-slate-900">{formatTL(toplamAlis)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Toplam Satış</p>
              <p className="text-lg font-bold text-slate-900">{formatTL(toplamSatis)}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Mükellef Sayısı</p>
              <p className="text-lg font-bold text-slate-900">{new Set(satirlar.map((s) => s.mukellef)).size}</p>
            </div>
          </div>

          {/* Tablo */}
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Mükellef</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Ay</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Alış Adedi</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Satış Adedi</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Alış Toplam</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Satış Toplam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {satirlar.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{s.mukellef}</td>
                    <td className="px-4 py-3 text-slate-600">{s.ay}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{s.alisAdedi}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{s.satisAdedi}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">
                      {s.alisToplam > 0 ? formatTL(s.alisToplam) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">
                      {s.satisToplam > 0 ? formatTL(s.satisToplam) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold text-slate-700">Toplam</td>
                  <td className="px-4 py-3 text-right font-semibold">{satirlar.reduce((s, r) => s + r.alisAdedi, 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{satirlar.reduce((s, r) => s + r.satisAdedi, 0)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold">{formatTL(toplamAlis)}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm font-semibold">{formatTL(toplamSatis)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {!yukleniyor && satirlar.length === 0 && kaynakKlasor && (
        <div className="card p-12 text-center text-slate-400">
          Rapor oluşturmak için yukarıdaki formu doldurun ve &quot;Rapor Oluştur&quot; butonuna tıklayın.
        </div>
      )}
    </div>
  );
}
