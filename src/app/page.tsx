import { Users, FolderOpen, FileCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { mukellefleriOku } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const mukellefler = mukellefleriOku();
  const aktifSayi = mukellefler.filter((m) => m.aktif).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Fatura klasörleme otomasyon aracı</p>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Aktif Mükellef</p>
              <p className="text-2xl font-bold text-slate-900">{aktifSayi}</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Klasörleme</p>
              <p className="text-sm font-medium text-slate-700 mt-1">Hazır</p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Durum</p>
              <p className="text-sm font-medium text-green-600 mt-1">Çevrimiçi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı aksiyonlar */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Hızlı Aksiyonlar</h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          <Link
            href="/klasorleme"
            className="flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors group"
          >
            <div>
              <p className="font-medium text-blue-800">Klasörleme Başlat</p>
              <p className="text-xs text-blue-600 mt-0.5">Faturaları otomatik klasörle</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/mukellefler"
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
          >
            <div>
              <p className="font-medium text-slate-800">Mükellef Ekle</p>
              <p className="text-xs text-slate-500 mt-0.5">VKN-isim eşleştirmesi</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/rapor"
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
          >
            <div>
              <p className="font-medium text-slate-800">Rapor Görüntüle</p>
              <p className="text-xs text-slate-500 mt-0.5">Fatura özet raporu</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/ayarlar"
            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors group"
          >
            <div>
              <p className="font-medium text-slate-800">Ayarlar</p>
              <p className="text-xs text-slate-500 mt-0.5">Zirvenet yolu ve tercihler</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Mükellef listesi özeti */}
      {mukellefler.length > 0 && (
        <div className="card mt-4">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Son Mükellefler</h2>
            <Link href="/mukellefler" className="text-sm text-blue-600 hover:text-blue-700">
              Tümünü gör →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {mukellefler.slice(0, 5).map((m) => (
              <div key={m.vkn} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{m.ad}</p>
                  <p className="text-xs text-slate-400">VKN: {m.vkn}</p>
                </div>
                <span className={m.aktif ? 'badge-green' : 'badge-red'}>
                  {m.aktif ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
