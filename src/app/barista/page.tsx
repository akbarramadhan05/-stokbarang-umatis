'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api-client';
import { Item, StockOpname, Transaction } from '@/types';
import { 
  ClipboardCheck, Eye, Plus, ArrowRight, ArrowLeft, RefreshCw, 
  LogOut, ClipboardList, CheckCircle2, ChevronRight, Calculator,
  Search, AlertCircle, Sparkles, Minus, ShoppingCart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import MockWarning from '@/components/mock-warning';

export default function BaristaDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Data States
  const [items, setItems] = useState<Item[]>([]);
  const [opnameHistory, setOpnameHistory] = useState<StockOpname[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Mutasi States
  const [mutasiOpen, setMutasiOpen] = useState(false);
  const [mutasiType, setMutasiType] = useState<'masuk' | 'keluar'>('masuk');
  const [mutasiQty, setMutasiQty] = useState('');
  const [mutasiNotes, setMutasiNotes] = useState('');

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
      const [itemsData, opData, txData] = await Promise.all([
        api.getItems(),
        api.getOpnames(),
        api.getTransactions(),
      ]);
      setItems(itemsData);
      setOpnameHistory(opData);
      setTransactions(txData);
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

  const startMutasi = (item: Item, type: 'masuk' | 'keluar') => {
    setSelectedItem(item);
    setMutasiType(type);
    setMutasiQty('');
    setMutasiNotes('');
    setMutasiOpen(true);
  };

  const handleSaveOpname = async () => {
    if (!selectedItem || physicalStock === '') return;
    setSubmitting(true);

    try {
      const physical = Number(physicalStock);
      const system = Number(selectedItem.current_stock);

      await api.addOpname({
        item_id: selectedItem.id,
        system_stock: system,
        physical_stock: physical,
        status: 'verified',
        barista_id: currentUser.id,
        notes: opnameNotes,
      });

      setWizardStep(3);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMutasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || mutasiQty === '') return;
    setSubmitting(true);

    try {
      await api.addTransaction({
        item_id: selectedItem.id,
        type: mutasiType,
        quantity: Number(mutasiQty),
        actor_id: currentUser.id,
        notes: mutasiNotes,
      });

      setMutasiOpen(false);
      setSelectedItem(null);
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
    const matchesLowStock = !showLowStockOnly || (item.current_stock < item.minimum_stock);
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOpnames = opnameHistory.filter(op => op.created_at.startsWith(todayStr));
  const todayTransactions = transactions.filter(tx => tx.created_at.startsWith(todayStr));

  return (
    <div className="min-h-screen flex flex-col bg-forest-dark text-slate-100 font-sans pb-12">
      <MockWarning />

      {/* Header - Compact for Mobile */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 py-3.5 px-4 flex justify-between items-center shadow-md shadow-black/25">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-0.5 shadow-md">
            <img src="/logo.png" alt="Umatis Logo" className="w-full h-full object-contain" />
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
            
            <div className="flex gap-2 flex-wrap items-center">
              <button 
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  showLowStockOnly 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                    : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Tampilkan hanya barang dengan stok di bawah minimum"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Barang Menipis ({items.filter(i => i.current_stock < i.minimum_stock).length})</span>
              </button>

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
                    className="glass-panel p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3 hover:border-emerald-500/20 hover:bg-emerald-950/5 transition-all group"
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

                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sisa di Sistem</p>
                        <p className={`text-base font-black ${isLow ? 'text-rose-400' : 'text-slate-200'}`}>
                          {item.current_stock.toLocaleString()} <span className="text-xs font-medium text-slate-400">{item.unit}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full mt-1 pt-2 border-t border-slate-800/40">
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => startMutasi(item, 'masuk')}
                          className="h-8 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Masuk</span>
                        </button>
                        <button 
                          onClick={() => startMutasi(item, 'keluar')}
                          className="h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Minus className="w-3 h-3" />
                          <span>Keluar</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => startOpname(item)}
                        className="h-8 w-full rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                      >
                        <span>Audit Opname</span>
                        <ChevronRight className="w-3 h-3" />
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

        {/* Mutasi Log Hari Ini */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5 border border-white/5">
          <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            Mutasi Stok Hari Ini ({todayTransactions.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="pb-2">Bahan</th>
                  <th className="pb-2">Jenis</th>
                  <th className="pb-2 text-right">Jumlah</th>
                  <th className="pb-2 text-right">Waktu</th>
                  <th className="pb-2 pl-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {todayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-5 text-center text-slate-500 font-medium">Belum mencatat mutasi stok hari ini.</td>
                  </tr>
                ) : (
                  todayTransactions.map(tx => {
                    const isIncome = tx.type === 'masuk';
                    return (
                      <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">{tx.item_name}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {isIncome ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-300">
                          {isIncome ? '+' : '-'}{tx.quantity} {tx.unit}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 pl-4 text-slate-400 max-w-xs truncate">{tx.notes || '-'}</td>
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

      {/* ============ MODAL: BARISTA MUTASI STOK ============ */}
      {mutasiOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Ambient gradients */}
            <div className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-2xl ${
              mutasiType === 'masuk' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            }`}></div>

            <div className="space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    mutasiType === 'masuk' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    Catat Barang {mutasiType === 'masuk' ? 'Masuk' : 'Keluar'}
                  </span>
                  <h3 className="font-extrabold text-slate-200 text-base">{selectedItem.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-950/50 border border-slate-800 text-[10px] font-bold uppercase text-emerald-400">
                  Satuan: {selectedItem.unit}
                </span>
              </div>

              {/* Current Stock display */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                <div className="text-center border-r border-slate-800/40">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Stok Saat Ini</p>
                  <p className="text-base font-extrabold text-slate-300 mt-0.5">
                    {selectedItem.current_stock.toLocaleString()} <span className="text-[10px] text-slate-500 font-medium">{selectedItem.unit}</span>
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Stok Setelah Mutasi</p>
                  <p className={`text-base font-extrabold mt-0.5 ${
                    mutasiQty === '' ? 'text-slate-300' :
                    mutasiType === 'masuk' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {mutasiQty === '' 
                      ? selectedItem.current_stock.toLocaleString() 
                      : mutasiType === 'masuk'
                        ? (Number(selectedItem.current_stock) + Number(mutasiQty)).toLocaleString()
                        : (Number(selectedItem.current_stock) - Number(mutasiQty)).toLocaleString()
                    }
                    <span className="text-[10px] text-slate-500 font-medium"> {selectedItem.unit}</span>
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSaveMutasi} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                    Jumlah Barang {mutasiType === 'masuk' ? 'Masuk' : 'Keluar'} ({selectedItem.unit})
                  </label>
                  <input 
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder={`Masukkan jumlah dalam ${selectedItem.unit}`}
                    value={mutasiQty}
                    onChange={(e) => setMutasiQty(e.target.value)}
                    className="w-full glass-input text-base text-center font-bold text-slate-200 py-3.5 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Keterangan / Catatan
                  </label>
                  <textarea 
                    placeholder={`Contoh: ${mutasiType === 'masuk' ? 'Restock bulanan' : 'Dipakai di bar'}, dll.`}
                    value={mutasiNotes}
                    onChange={(e) => setMutasiNotes(e.target.value)}
                    rows={2}
                    className="w-full glass-input text-xs resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setMutasiOpen(false); setSelectedItem(null); }}
                    className="h-11 px-4 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer flex items-center justify-center"
                  >
                    Batal
                  </button>
                  
                  <button 
                    type="submit" 
                    disabled={mutasiQty === '' || submitting}
                    className={`h-11 px-6 rounded-xl disabled:opacity-50 text-xs font-bold text-white border border-white/5 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-black/40 ${
                      mutasiType === 'masuk' 
                        ? 'bg-emerald-600 hover:bg-emerald-500 hover:border-emerald-500/20' 
                        : 'bg-rose-600 hover:bg-rose-500 hover:border-rose-500/20'
                    }`}
                  >
                    {submitting ? (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    ) : (
                      <>
                        <span>Simpan Mutasi</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
