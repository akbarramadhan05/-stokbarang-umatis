'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import * as mockDb from '@/lib/mock-db';
import { Item, StockOpname } from '@/types';
import { 
  ClipboardCheck, Eye, Plus, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, ClipboardList, CheckCircle2, ChevronRight, Calculator,
  Search, AlertCircle, Sparkles
} from 'lucide-react';
import MockWarning from '@/components/mock-warning';

export default function BaristaDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data States
  const [items, setItems] = useState<Item[]>([]);
  const [opnameHistory, setOpnameHistory] = useState<StockOpname[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Wizard States
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Select Item, 2: Input Stock, 3: Success
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [physicalStock, setPhysicalStock] = useState('');
  const [opnameNotes, setOpnameNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem('umatis_user');
      if (!userStr) {
        router.push('/');
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== 'barista' && user.role !== 'admin') {
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
        const { data: oData } = await supabase.from('stock_opname').select('*').order('created_at', { ascending: false });
        const { data: pData } = await supabase.from('profiles').select('id, full_name');

        const enrichedItems = ((iData || []) as any[]).map((item: any) => ({
          ...item,
          supplier_name: ((sData || []) as any[]).find((s: any) => s.id === item.supplier_id)?.name || 'Tanpa Supplier'
        }));
        setItems(enrichedItems);

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
        setOpnameHistory(enrichedOps);
      } else {
        setItems(mockDb.getMockItems());
        setOpnameHistory(mockDb.getMockOpnames());
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

  const startOpname = (item: Item) => {
    setSelectedItem(item);
    setPhysicalStock('');
    setOpnameNotes('');
    setWizardStep(2);
    setWizardOpen(true);
  };

  const handleSaveOpname = async () => {
    if (!selectedItem || physicalStock === '') return;
    setSubmitting(true);

    try {
      const physical = Number(physicalStock);
      const system = Number(selectedItem.current_stock);
      const discrepancy = physical - system;

      if (isSupabaseConfigured) {
        // Post to Supabase Stock Opname Table
        const payload = {
          opname_date: new Date().toISOString().split('T')[0],
          item_id: selectedItem.id,
          system_stock: system,
          physical_stock: physical,
          discrepancy,
          status: 'submitted', // submitted role (awaits admin verification or autosync if trigger set)
          barista_id: currentUser.id,
          notes: opnameNotes,
        };
        
        await supabase.from('stock_opname').insert(payload);

        // Also insert auto-transaction to balance stocks if we want live update
        // We'll simulate this so the barista sees live updates
        if (discrepancy !== 0) {
          await supabase.from('transactions').insert({
            item_id: selectedItem.id,
            type: discrepancy > 0 ? 'masuk' : 'terpakai',
            quantity: Math.abs(discrepancy),
            actor_id: currentUser.id,
            notes: `Auto adjustment dari Opname Barista. ${opnameNotes}`,
          });
        }
      } else {
        // Save in LocalStorage mock DB
        mockDb.addStockOpname({
          opname_date: new Date().toISOString().split('T')[0],
          item_id: selectedItem.id,
          system_stock: system,
          physical_stock: physical,
          status: 'verified', // in mock mode, auto verify to make testing intuitive
          barista_id: currentUser.id,
          notes: opnameNotes,
        });
      }

      setWizardStep(3);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOpnames = opnameHistory.filter(op => op.created_at.startsWith(todayStr));

  return (
    <div className="min-h-screen flex flex-col bg-forest-dark text-slate-100 font-sans pb-12">
      <MockWarning />

      {/* Header - Compact for Mobile */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 py-3.5 px-4 flex justify-between items-center shadow-md shadow-black/25">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-slate-200 uppercase">Umatis Bar</h1>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Barista Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-lg hidden sm:inline">
            {currentUser?.full_name?.split(' ')[0] || 'Barista'}
          </span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-slate-900/50 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-400 text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3 h-3" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-4xl w-full mx-auto px-4 mt-6 flex-1 space-y-6">
        
        {/* Quick Stock Check Title & Filter */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-200">Katalog Bahan & Stock Opname</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Pilih bahan untuk memasukkan jumlah fisik atau periksa sisa stok.</p>
            </div>
            
            <div className="flex gap-2">
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input text-[11px] py-1.5 px-2.5 min-w-[100px] cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c} className="bg-slate-900">{c === 'All' ? 'Semua Kategori' : c}</option>
                ))}
              </select>
              
              <button 
                onClick={loadData}
                className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center text-slate-400 hover:text-emerald-400 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari nama bahan bar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 glass-input text-xs"
            />
          </div>

          {/* Grid of Large touch-friendly cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {loading ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500">
                <span className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2"></span>
                <span className="text-xs uppercase tracking-widest font-bold">Sinkronisasi data...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs font-semibold">Bahan bar tidak ditemukan.</div>
            ) : (
              filteredItems.map(item => {
                const isLow = item.current_stock < item.minimum_stock;
                return (
                  <div 
                    key={item.id}
                    className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-4 hover:border-emerald-500/20 hover:bg-emerald-950/5 transition-all group"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.category}</span>
                        {isLow && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Stok kritis"></span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-200 text-sm mt-0.5 group-hover:text-emerald-300 transition-colors">{item.name}</h3>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sisa di Sistem</p>
                        <p className={`text-base font-black ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                          {item.current_stock.toLocaleString()} <span className="text-xs font-medium text-slate-400">{item.unit}</span>
                        </p>
                      </div>

                      {/* Touch action button (min 44x44px target) */}
                      <button 
                        onClick={() => startOpname(item)}
                        className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:scale-102 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md shadow-emerald-950/40"
                      >
                        <span>Audit</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Audit Log Hari Ini */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5">
          <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            Audit Hari Ini ({todayOpnames.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-2">Bahan</th>
                  <th className="pb-2 text-right">Fisik</th>
                  <th className="pb-2 text-right">Selisih</th>
                  <th className="pb-2 text-right">Waktu</th>
                  <th className="pb-2 pl-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {todayOpnames.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-5 text-center text-slate-500 font-medium">Belum melakukan opname hari ini.</td>
                  </tr>
                ) : (
                  todayOpnames.map(op => {
                    const isDiff = op.discrepancy !== 0;
                    const isPositive = op.discrepancy > 0;
                    return (
                      <tr key={op.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">{op.item_name}</td>
                        <td className="py-3 text-right font-bold text-slate-300">{op.physical_stock} {op.unit}</td>
                        <td className="py-3 text-right font-black">
                          {isDiff ? (
                            <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                              {isPositive ? '+' : ''}{op.discrepancy} {op.unit}
                            </span>
                          ) : (
                            <span className="text-slate-500">Pas</span>
                          )}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {new Date(op.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 pl-4 text-slate-400 max-w-xs truncate">{op.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ============ WIZARD MODAL: STOCK OPNAME ============ */}
      {wizardOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient gradients */}
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>

            {/* STEP 2: ENTER VALUES */}
            {wizardStep === 2 && (
              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Audit Langkah 2 dari 2</span>
                    <h3 className="font-extrabold text-slate-200 text-base">{selectedItem.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-950/50 border border-slate-800 text-[10px] font-bold uppercase text-emerald-400">
                    Satuan: {selectedItem.unit}
                  </span>
                </div>

                {/* System Stock display */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                  <div className="text-center border-r border-slate-800/40">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Tercatat Sistem</p>
                    <p className="text-base font-extrabold text-slate-300 mt-0.5">
                      {selectedItem.current_stock.toLocaleString()} <span className="text-[10px] text-slate-500 font-medium">{selectedItem.unit}</span>
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Selisih Hitung</p>
                    <p className={`text-base font-extrabold mt-0.5 ${
                      physicalStock === '' ? 'text-slate-400' : 
                      Number(physicalStock) - Number(selectedItem.current_stock) === 0 ? 'text-slate-400' :
                      Number(physicalStock) - Number(selectedItem.current_stock) > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {physicalStock === '' ? '0' : (Number(physicalStock) - Number(selectedItem.current_stock)).toLocaleString()} 
                      <span className="text-[10px] text-slate-500 font-medium"> {selectedItem.unit}</span>
                    </p>
                  </div>
                </div>

                {/* Physical Count Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                      Jumlah Fisik Terhitung ({selectedItem.unit})
                    </label>
                    <input 
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder={`Masukkan angka dalam ${selectedItem.unit}`}
                      value={physicalStock}
                      onChange={(e) => setPhysicalStock(e.target.value)}
                      className="w-full glass-input text-base text-center font-bold text-slate-200 py-3.5 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea 
                      placeholder="Contoh: Terbuang karena kadaluwarsa, Botol pecah, dll."
                      value={opnameNotes}
                      onChange={(e) => setOpnameNotes(e.target.value)}
                      rows={2}
                      className="w-full glass-input text-xs resize-none"
                    />
                  </div>
                </div>

                {/* Buttons (min 44x44px target) */}
                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setWizardOpen(false); setSelectedItem(null); }}
                    className="h-11 px-4 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-center"
                  >
                    Batal
                  </button>
                  
                  <button 
                    type="button" 
                    disabled={physicalStock === '' || submitting}
                    onClick={handleSaveOpname}
                    className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white border border-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                      <>
                        <span>Simpan Hasil</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS MICROINTERACTION */}
            {wizardStep === 3 && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-8 h-8 animate-bounce" />
                </div>
                
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center justify-center gap-1.5">
                    Opname Disimpan! <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-[280px] mx-auto">
                    Data selisih audit bahan <span className="font-semibold text-slate-200">{selectedItem.name}</span> berhasil dicatat ke sistem.
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      setWizardOpen(false);
                      setSelectedItem(null);
                      setWizardStep(1);
                    }}
                    className="h-11 w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center transition-all"
                  >
                    Tutup Layar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
