'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import * as mockDb from '@/lib/mock-db';
import { Item, Transaction, StockOpname } from '@/types';
import { 
  TrendingUp, AlertTriangle, Download, Package, Calendar, 
  RefreshCw, LogOut, CheckCircle, BarChart2, Eye, ShieldAlert,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import MockWarning from '@/components/mock-warning';

export default function OwnerDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data States
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CSV Export Filter states
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem('umatis_user');
      if (!userStr) {
        router.push('/');
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== 'owner' && user.role !== 'admin') {
        router.push('/');
        return;
      }
      setCurrentUser(user);
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data: iData } = await supabase.from('items').select('*');
        const { data: sData } = await supabase.from('suppliers').select('id, name');
        const { data: tData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        const { data: oData } = await supabase.from('stock_opname').select('*').order('created_at', { ascending: false });
        const { data: pData } = await supabase.from('profiles').select('id, full_name');

        // Enrich Items
        const enrichedItems = ((iData || []) as any[]).map((item: any) => ({
          ...item,
          supplier_name: ((sData || []) as any[]).find((s: any) => s.id === item.supplier_id)?.name || 'Tanpa Supplier'
        }));
        setItems(enrichedItems);

        // Enrich Transactions
        const enrichedTxs = ((tData || []) as any[]).map((tx: any) => {
          const itm = ((iData || []) as any[]).find((i: any) => i.id === tx.item_id);
          return {
            ...tx,
            item_name: itm?.name || 'Barang Dihapus',
            category: itm?.category || '-',
            unit: itm?.unit || '',
            actor_name: ((pData || []) as any[]).find((p: any) => p.id === tx.actor_id)?.full_name || 'Staf'
          };
        });
        setTransactions(enrichedTxs);

        // Enrich Opnames
        const enrichedOps = ((oData || []) as any[]).map((op: any) => {
          const itm = ((iData || []) as any[]).find((i: any) => i.id === op.item_id);
          return {
            ...op,
            item_name: itm?.name || 'Barang Dihapus',
            category: itm?.category || '-',
            unit: itm?.unit || '',
            barista_name: ((pData || []) as any[]).find((p: any) => p.id === op.barista_id)?.full_name || 'Barista'
          };
        });
        setOpnames(enrichedOps);
      } else {
        setItems(mockDb.getMockItems());
        setTransactions(mockDb.getMockTransactions());
        setOpnames(mockDb.getMockOpnames());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('umatis_user');
    router.push('/');
  };

  // CSV Exporters
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    // Escape csv cells correctly
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          const clean = cell ? cell.toString().replace(/"/g, '""') : '';
          return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentInventory = () => {
    const headers = ['ID Barang', 'Nama Bahan', 'Kategori', 'Stok Saat Ini', 'Stok Minimum', 'Unit', 'Supplier Utama'];
    const rows = items.map(item => [
      item.id,
      item.name,
      item.category,
      item.current_stock.toString(),
      item.minimum_stock.toString(),
      item.unit,
      item.supplier_name || 'Tanpa Supplier'
    ]);
    downloadCSV(`Umatis_Master_Stok_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const exportTransactions = () => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000; // include full end day

    const filtered = transactions.filter(t => {
      const time = new Date(t.created_at).getTime();
      return time >= start && time <= end;
    });

    const headers = ['ID Transaksi', 'Waktu', 'Nama Bahan', 'Kategori', 'Jenis Mutasi', 'Jumlah', 'Unit', 'Petugas', 'Keterangan'];
    const rows = filtered.map(t => [
      t.id,
      new Date(t.created_at).toLocaleString('id-ID'),
      t.item_name || 'Barang Dihapus',
      t.category || '-',
      t.type,
      t.quantity.toString(),
      t.unit || '',
      t.actor_name || 'Sistem',
      t.notes || ''
    ]);
    downloadCSV(`Umatis_Mutasi_Stok_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  const exportOpnameDiscrepancies = () => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime() + 86400000;

    const filtered = opnames.filter(o => {
      const time = new Date(o.created_at).getTime();
      return time >= start && time <= end;
    });

    const headers = ['ID Opname', 'Tanggal Audit', 'Nama Bahan', 'Kategori', 'Stok Sistem', 'Stok Fisik', 'Selisih (Fisik - Sistem)', 'Unit', 'Status', 'Barista Pemeriksa', 'Catatan'];
    const rows = filtered.map(o => [
      o.id,
      o.opname_date,
      o.item_name || 'Barang Dihapus',
      o.category || '-',
      o.system_stock.toString(),
      o.physical_stock.toString(),
      o.discrepancy.toString(),
      o.unit || '',
      o.status,
      o.barista_name || 'Barista',
      o.notes || ''
    ]);
    downloadCSV(`Umatis_Selisih_Opname_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  // Stats logic
  const lowStockCount = items.filter(item => item.current_stock < item.minimum_stock).length;
  
  // Categorized stocks count for SVG chart
  const categories = Array.from(new Set(items.map(i => i.category)));
  const categoryData = categories.map(cat => {
    const total = items.filter(i => i.category === cat).reduce((sum, item) => sum + Number(item.current_stock), 0);
    return { name: cat, value: total };
  }).sort((a, b) => b.value - a.value);

  // Recent transactions summary
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-forest-dark text-slate-100 font-sans pb-12">
      <MockWarning />

      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 py-4 px-6 flex justify-between items-center shadow-lg shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-slate-200">UMATIS RESTO</h1>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Owner Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-200">{currentUser?.full_name || 'Owner'}</p>
            <p className="text-xs text-slate-400 italic capitalize">{currentUser?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-900/50 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-400 text-xs px-3 py-2 rounded-xl transition-all cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-1 space-y-6">
        
        {/* Row 1: Alerts and quick indicators */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card: Low Stock Status Alert */}
          <div className={`glass-panel p-6 rounded-2xl border relative overflow-hidden flex flex-col justify-between md:col-span-2 ${
            lowStockCount > 0 ? 'border-amber-500/25 bg-amber-500/5' : 'border-white/5'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-200">Kondisi Inventaris Real-Time</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tingkat persediaan bahan pokok operasional bar hari ini.</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                lowStockCount > 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              }`}>
                {lowStockCount > 0 ? `${lowStockCount} Bahan Kritis` : 'Aman'}
              </span>
            </div>

            {lowStockCount > 0 ? (
              <div className="my-4 flex items-start gap-3 bg-amber-950/40 p-4 rounded-xl border border-amber-900/30">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">Pemberitahuan Re-order Segera</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Beberapa bahan bar berada di bawah tingkat persediaan minimum yang ditetapkan. Hubungi Supplier terkait.</p>
                </div>
              </div>
            ) : (
              <div className="my-4 flex items-start gap-3 bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/30">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">Stok Bahan Tercukupi</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">Semua persediaan bahan bar masih berada di atas limit minimal. Operasional bar berjalan lancar.</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-800/40">
              <span>Diperbarui secara real-time dari database</span>
              <button 
                onClick={loadData}
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Card: Category Distribution Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Volume Bahan per Kategori
            </h3>

            {categoryData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500">Tidak ada data.</div>
            ) : (
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {/* SVG Visual Progress Bar styled as charts */}
                {categoryData.slice(0, 4).map((cat, idx) => {
                  const maxVal = Math.max(...categoryData.map(c => c.value));
                  const percentage = maxVal > 0 ? (cat.value / maxVal) * 100 : 0;
                  const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-teal-500', 'bg-blue-500'];

                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{cat.name}</span>
                        <span className="text-slate-400 font-bold">{cat.value.toLocaleString()} unit</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950/40 border border-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${colors[idx % colors.length]} opacity-80`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Row 2: CSV Export Center & Critical Stock Tracker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card: Export Center */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-full lg:col-span-1">
            <div>
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                Pusat Ekspor Laporan (CSV)
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">Unduh data transaksi, master stok, atau opname dalam bentuk file CSV bersih yang siap diolah.</p>

              {/* Date Filters */}
              <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/40 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Rentang Tanggal (Untuk Transaksi & Opname)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Mulai</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full glass-input text-xs py-1.5 px-2.5 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Akhir</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full glass-input text-xs py-1.5 px-2.5 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button 
                onClick={exportCurrentInventory}
                className="w-full bg-slate-900/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/40 text-slate-200 hover:text-emerald-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Unduh Master Stok Saat Ini</span>
                <Download className="w-4 h-4" />
              </button>

              <button 
                onClick={exportTransactions}
                className="w-full bg-slate-900/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/40 text-slate-200 hover:text-emerald-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Unduh Laporan Mutasi Stok</span>
                <Download className="w-4 h-4" />
              </button>

              <button 
                onClick={exportOpnameDiscrepancies}
                className="w-full bg-slate-900/60 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/40 text-slate-200 hover:text-emerald-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Unduh Laporan Selisih Opname</span>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card: Detailed Critical Items List */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col lg:col-span-2">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              Daftar Barang dengan Stok Kritis / Dibawah Minimum
            </h3>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="pb-2 pl-2">Nama Bahan</th>
                    <th className="pb-2">Kategori</th>
                    <th className="pb-2 text-right">Stok Saat Ini</th>
                    <th className="pb-2 text-right">Batas Minimum</th>
                    <th className="pb-2 pl-4">Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {items.filter(item => item.current_stock < item.minimum_stock).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Tidak ada bahan bar yang kritis. Kerja bagus!</td>
                    </tr>
                  ) : (
                    items.filter(item => item.current_stock < item.minimum_stock).map(item => (
                      <tr key={item.id} className="hover:bg-rose-950/5 transition-colors">
                        <td className="py-3.5 pl-2 font-semibold text-rose-300">{item.name}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px]">{item.category}</span>
                        </td>
                        <td className="py-3.5 text-right font-black text-rose-400">{item.current_stock.toLocaleString()} {item.unit}</td>
                        <td className="py-3.5 text-right text-slate-400">{item.minimum_stock.toLocaleString()} {item.unit}</td>
                        <td className="py-3.5 pl-4 text-slate-400 italic">{item.supplier_name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Row 3: Live Transactions Log */}
        <section className="glass-panel p-6 rounded-2xl border border-white/5">
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            5 Aktivitas Mutasi Stok Terakhir
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-2 pl-2">Waktu</th>
                  <th className="pb-2">Bahan Bar</th>
                  <th className="pb-2">Kategori</th>
                  <th className="pb-2">Jenis Mutasi</th>
                  <th className="pb-2 text-right">Jumlah</th>
                  <th className="pb-2 pl-4">Oleh Petugas</th>
                  <th className="pb-2 pl-4 pr-2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 font-medium">Belum ada catatan mutasi.</td>
                  </tr>
                ) : (
                  recentTransactions.map(tx => {
                    const isIncome = tx.type === 'masuk';
                    const isUsed = tx.type === 'terpakai';
                    return (
                      <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3.5 pl-2 text-slate-400">
                          {new Date(tx.created_at).toLocaleString('id-ID', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 font-bold text-slate-200">{tx.item_name}</td>
                        <td className="py-3.5 text-slate-400">{tx.category}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            isUsed ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-black text-slate-200">
                          {isIncome ? '+' : '-'}{tx.quantity.toLocaleString()} {tx.unit}
                        </td>
                        <td className="py-3.5 pl-4 text-slate-300">{tx.actor_name}</td>
                        <td className="py-3.5 pl-4 pr-2 text-slate-400 max-w-xs truncate">{tx.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}
