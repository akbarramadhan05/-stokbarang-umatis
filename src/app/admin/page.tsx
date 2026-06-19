'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api-client';
import { Item, Supplier, Transaction, Profile, UserRole } from '@/types';
import { 
  Package, Users, Truck, ArrowUpDown, Plus, Search, Edit2, Trash2, 
  AlertTriangle, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, 
  LogOut, ClipboardList, ShoppingCart, UserCheck, MapPin, Phone, Mail
} from 'lucide-react';
import MockWarning from '@/components/mock-warning';

const getWhatsAppUrl = (phone: string, supplierName: string) => {
  if (!phone) return '#';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  const text = encodeURIComponent(`Halo ${supplierName}, kami ingin memesan stok bahan untuk Umatis Resto & Venue.`);
  return `https://wa.me/${cleaned}?text=${text}`;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'items' | 'suppliers' | 'transactions' | 'users'>('items');
  
  // Data States
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // UI Loading & Interaction States
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Form Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Item> | null>(null);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier> | null>(null);
  
  // Transaction Form fields
  const [txItemId, setTxItemId] = useState('');
  const [txType, setTxType] = useState<'masuk' | 'keluar' | 'terpakai'>('masuk');
  const [txQty, setTxQty] = useState('');
  const [txNotes, setTxNotes] = useState('');

  // Check auth and session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = sessionStorage.getItem('umatis_user');
      if (!userStr) {
        router.push('/');
        return;
      }
      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        // Not authorized, kick to correct dashboard or login
        if (user.role === 'owner') router.push('/owner');
        else if (user.role === 'barista') router.push('/barista');
        else router.push('/');
        return;
      }
      setCurrentUser(user);
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesData, suppliersData, itemsData, txData] = await Promise.all([
        api.getProfiles(),
        api.getSuppliers(),
        api.getItems(),
        api.getTransactions(),
      ]);
      setProfiles(profilesData);
      setSuppliers(suppliersData);
      setItems(itemsData);
      setTransactions(txData);
    } catch (err) {
      console.error("Error loading data", err);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers

  // Item Save
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem?.name || !currentItem?.category || !currentItem?.unit) return;

    try {
      await api.saveItem({
        id: currentItem.id || undefined,
        name: currentItem.name,
        category: currentItem.category,
        unit: currentItem.unit,
        minimum_stock: Number(currentItem.minimum_stock || 0),
        supplier_id: currentItem.supplier_id || null,
        current_stock: Number(currentItem.current_stock || 0),
      });
      setItemModalOpen(false);
      setCurrentItem(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Item Delete
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;
    try {
      await api.deleteItem(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Supplier Save
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier?.name) return;

    try {
      await api.saveSupplier({
        id: currentSupplier.id || undefined,
        name: currentSupplier.name,
        phone: currentSupplier.phone || '',
        email: currentSupplier.email || '',
        address: currentSupplier.address || '',
      });
      setSupplierModalOpen(false);
      setCurrentSupplier(null);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Supplier Delete
  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Hapus supplier ini? Peringatan: Barang terkait akan kehilangan referensi supplier.')) return;
    try {
      await api.deleteSupplier(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Transaction Save
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txItemId || !txQty) return;

    try {
      await api.addTransaction({
        item_id: txItemId,
        type: txType,
        quantity: Number(txQty),
        actor_id: currentUser.id,
        notes: txNotes,
      });
      // Reset form
      setTxItemId('');
      setTxQty('');
      setTxNotes('');
      setTransactionModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('umatis_user');
    router.push('/');
  };

  // Calculated Metrics
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.current_stock < item.minimum_stock);
  const totalSuppliers = suppliers.length;
  const transactionsToday = transactions.filter(tx => {
    const today = new Date().toISOString().split('T')[0];
    return tx.created_at.startsWith(today);
  }).length;

  // Filtered Lists
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.supplier_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-forest-dark text-slate-100 font-sans pb-12">
      <MockWarning />

      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/5 py-4 px-6 flex justify-between items-center shadow-lg shadow-black/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1 shadow-md">
            <img src="/logo.png" alt="Umatis Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-slate-200">UMATIS RESTO</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Admin Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-slate-200">{currentUser?.full_name || 'Admin'}</p>
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

      {/* Main Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-1">
        
        {/* Metrik Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Bahan</p>
              <h3 className="text-2xl font-black text-slate-100">{totalItems}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className={`glass-panel p-5 rounded-2xl border relative overflow-hidden flex items-center justify-between transition-all ${
            lowStockItems.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'
          }`}>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Stok Tipis</p>
              <h3 className={`text-2xl font-black ${
                lowStockItems.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-100'
              }`}>{lowStockItems.length}</h3>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              lowStockItems.length > 0 ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-slate-500/10 border border-slate-500/20 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Supplier Aktif</p>
              <h3 className="text-2xl font-black text-slate-100">{totalSuppliers}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Mutasi Hari Ini</p>
              <h3 className="text-2xl font-black text-slate-100">{transactionsToday}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* Tab Buttons */}
        <section className="flex gap-2 border-b border-slate-800/80 mb-6 overflow-x-auto no-scrollbar py-1">
          <button 
            onClick={() => { setActiveTab('items'); setSearchQuery(''); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'items' 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Bahan Bar ({items.length})
          </button>
          
          <button 
            onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suppliers' 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            Supplier ({suppliers.length})
          </button>

          <button 
            onClick={() => { setActiveTab('transactions'); setSearchQuery(''); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'transactions' 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Riwayat Transaksi ({transactions.length})
          </button>

          <button 
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Daftar Pengguna ({profiles.length})
          </button>
        </section>

        {/* Tab Contents */}
        <section className="glass-panel rounded-2xl p-6 border border-white/5 relative min-h-[400px]">
          
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-forest-dark/40 backdrop-blur-sm rounded-2xl">
              <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3"></span>
              <p className="text-sm text-slate-400 font-semibold tracking-wider uppercase">Loading database...</p>
            </div>
          ) : null}

          {/* ============ TAB: ITEMS ============ */}
          {activeTab === 'items' && (
            <div>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
                <div className="flex flex-wrap gap-2 flex-1 max-w-lg">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Cari bahan..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 glass-input text-xs"
                    />
                  </div>
                  
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="glass-input text-xs cursor-pointer min-w-[120px]"
                  >
                    {categories.map(c => (
                      <option key={c} value={c} className="bg-slate-900 text-slate-200">{c === 'All' ? 'Semua Kategori' : c}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => {
                    setCurrentItem({ name: '', category: 'Coffee', unit: 'gram', current_stock: 0, minimum_stock: 0, supplier_id: suppliers[0]?.id || '' });
                    setItemModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 hover:scale-102 text-xs font-bold uppercase tracking-wider text-slate-100 py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Bahan
                </button>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 pl-3">Nama Bahan</th>
                      <th className="pb-3">Kategori</th>
                      <th className="pb-3 text-right">Stok Sekarang</th>
                      <th className="pb-3 text-right">Stok Minimum</th>
                      <th className="pb-3 pl-6">Supplier</th>
                      <th className="pb-3 pr-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Tidak ada bahan bar ditemukan.</td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const isLow = item.current_stock < item.minimum_stock;
                        return (
                          <tr key={item.id} className="hover:bg-white/2 transition-colors">
                            <td className="py-4 pl-3 font-semibold text-slate-200">{item.name}</td>
                            <td className="py-4">
                              <span className="px-2 py-1 rounded bg-slate-950/40 border border-slate-800 text-slate-400 font-medium">{item.category}</span>
                            </td>
                            <td className="py-4 text-right">
                              <span className={`font-bold px-2 py-0.5 rounded ${isLow ? 'bg-rose-500/15 text-rose-400' : 'text-emerald-400'}`}>
                                {item.current_stock.toLocaleString()} {item.unit}
                              </span>
                            </td>
                            <td className="py-4 text-right font-medium text-slate-400">{item.minimum_stock.toLocaleString()} {item.unit}</td>
                            <td className="py-4 pl-6 text-slate-300 italic">{item.supplier_name}</td>
                            <td className="py-4 pr-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => {
                                    setCurrentItem(item);
                                    setItemModalOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 cursor-pointer transition-all"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 cursor-pointer transition-all"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ TAB: SUPPLIERS ============ */}
          {activeTab === 'suppliers' && (
            <div>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Cari supplier..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 glass-input text-xs"
                  />
                </div>

                <button 
                  onClick={() => {
                    setCurrentSupplier({ name: '', phone: '', email: '', address: '' });
                    setSupplierModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 hover:scale-102 text-xs font-bold uppercase tracking-wider text-slate-100 py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Supplier
                </button>
              </div>

              {/* Suppliers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 pl-3">Nama Supplier</th>
                      <th className="pb-3 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Telepon</th>
                      <th className="pb-3"><Mail className="w-3.5 h-3.5" />Email</th>
                      <th className="pb-3"><MapPin className="w-3.5 h-3.5" />Alamat</th>
                      <th className="pb-3 pr-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">Tidak ada supplier ditemukan.</td>
                      </tr>
                    ) : (
                      suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(supplier => (
                        <tr key={supplier.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-4 pl-3 font-semibold text-slate-200">{supplier.name}</td>
                          <td className="py-4 text-slate-300">
                            {supplier.phone ? (
                              <div className="flex items-center gap-2">
                                <span>{supplier.phone}</span>
                                <a 
                                  href={getWhatsAppUrl(supplier.phone, supplier.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#25D366] hover:bg-[#20ba5a] text-white transition-colors"
                                  title="Hubungi via WhatsApp"
                                >
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.985l.41.243c1.58.939 3.502 1.435 5.463 1.436 5.864 0 10.635-4.746 10.638-10.58.002-2.83-1.096-5.49-3.09-7.487-1.993-1.997-4.65-3.097-7.478-3.097-5.867 0-10.637 4.747-10.64 10.584-.001 1.942.508 3.841 1.472 5.51l.269.467-1.01 3.693 3.796-.99zM17.15 15.64c-.3-.15-1.777-.872-2.031-.967-.255-.095-.441-.142-.627.142-.186.284-.72.903-.882 1.093-.162.19-.325.213-.625.063-.3-.15-1.267-.467-2.414-1.488-.893-.794-1.496-1.777-1.671-2.078-.176-.3-.019-.462.13-.611.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.524-.075-.15-.625-1.493-.856-2.057-.225-.548-.473-.474-.627-.482-.15-.008-.325-.01-.5-.01s-.458.067-.698.327c-.24.26-1.066 1.037-1.066 2.53 0 1.493 1.092 2.932 1.241 3.13.15.198 2.15 3.266 5.208 4.582.727.313 1.296.5 1.738.64.73.232 1.396.199 1.921.121.585-.087 1.778-.723 2.031-1.386.254-.664.254-1.233.178-1.386-.076-.153-.277-.247-.577-.397z"/>
                                  </svg>
                                </a>
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-4 text-slate-300">{supplier.email || '-'}</td>
                          <td className="py-4 text-slate-400 max-w-xs truncate">{supplier.address || '-'}</td>
                          <td className="py-4 pr-3 text-right">
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => {
                                  setCurrentSupplier(supplier);
                                  setSupplierModalOpen(true);
                                }}
                                className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 cursor-pointer transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 cursor-pointer transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ TAB: TRANSACTIONS ============ */}
          {activeTab === 'transactions' && (
            <div>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between mb-6">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Cari transaksi..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 glass-input text-xs"
                  />
                </div>

                <button 
                  onClick={() => {
                    if (items.length === 0) {
                      alert('Tambah bahan bar terlebih dahulu sebelum mencatat mutasi.');
                      return;
                    }
                    setTxItemId(items[0].id);
                    setTxType('masuk');
                    setTxQty('');
                    setTxNotes('');
                    setTransactionModalOpen(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 hover:scale-102 text-xs font-bold uppercase tracking-wider text-slate-100 py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Catat Mutasi Stok
                </button>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 pl-3">Waktu</th>
                      <th className="pb-3">Bahan Bar</th>
                      <th className="pb-3">Jenis</th>
                      <th className="pb-3 text-right">Jumlah</th>
                      <th className="pb-3 pl-6">Petugas</th>
                      <th className="pb-3 pr-3 pl-6">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {transactions.filter(t => (t.item_name || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">Belum ada riwayat mutasi stok.</td>
                      </tr>
                    ) : (
                      transactions.filter(t => (t.item_name || '').toLowerCase().includes(searchQuery.toLowerCase())).map(tx => {
                        const isIncome = tx.type === 'masuk';
                        const isUsed = tx.type === 'terpakai';
                        const dateFormatted = new Date(tx.created_at).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        });

                        return (
                          <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                            <td className="py-4 pl-3 text-slate-400 font-medium">{dateFormatted}</td>
                            <td className="py-4 font-semibold text-slate-200">
                              {tx.item_name}
                              <span className="block text-[10px] text-slate-500 font-medium italic">{tx.category}</span>
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                isUsed ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {isIncome && <ArrowUpRight className="w-3 h-3" />}
                                {!isIncome && <ArrowDownRight className="w-3 h-3" />}
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-4 text-right font-bold text-slate-200">
                              {isIncome ? '+' : '-'}{tx.quantity.toLocaleString()} {tx.unit}
                            </td>
                            <td className="py-4 pl-6 text-slate-300">{tx.actor_name}</td>
                            <td className="py-4 pr-3 pl-6 text-slate-400 max-w-xs truncate" title={tx.notes}>{tx.notes || '-'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============ TAB: USERS ============ */}
          {activeTab === 'users' && (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Monitoring Hak Akses</h3>
                <p className="text-xs text-slate-500 mt-1">Mengelola dan mendaftarkan akun di MySQL database profil.</p>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="pb-3 pl-3">Nama Lengkap</th>
                      <th className="pb-3">User ID</th>
                      <th className="pb-3">Hak Akses / Peran</th>
                      <th className="pb-3 pr-3 text-right">Status Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {profiles.map(prof => {
                      const isAdmin = prof.role === 'admin';
                      const isOwner = prof.role === 'owner';
                      return (
                        <tr key={prof.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-4 pl-3 font-bold text-slate-200 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-700/20 flex items-center justify-center text-slate-400 font-bold border border-emerald-500/20">
                              {prof.full_name[0].toUpperCase()}
                            </div>
                            {prof.full_name}
                          </td>
                          <td className="py-4 text-slate-500 font-mono text-[10px]">{prof.id}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              isOwner ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {prof.role}
                            </span>
                          </td>
                          <td className="py-4 pr-3 text-right text-slate-400 italic">
                            Aktif
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </section>
      </main>

      {/* ============ MODAL: ITEM CRUD ============ */}
      {itemModalOpen && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-200 mb-4">
              {currentItem.id ? 'Edit Bahan Bar' : 'Tambah Bahan Bar Baru'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Bahan</label>
                <input 
                  type="text" 
                  required
                  value={currentItem.name || ''} 
                  onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                  placeholder="Contoh: Monin Caramel Syrup"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Kategori</label>
                  <select 
                    value={currentItem.category || 'Coffee'} 
                    onChange={(e) => setCurrentItem({...currentItem, category: e.target.value})}
                    className="w-full glass-input text-xs cursor-pointer"
                  >
                    <option value="Coffee" className="bg-slate-900">Coffee</option>
                    <option value="Syrup" className="bg-slate-900">Syrup</option>
                    <option value="Dairy" className="bg-slate-900">Dairy</option>
                    <option value="Garnish" className="bg-slate-900">Garnish</option>
                    <option value="Others" className="bg-slate-900">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Satuan Unit</label>
                  <input 
                    type="text" 
                    required
                    value={currentItem.unit || ''} 
                    onChange={(e) => setCurrentItem({...currentItem, unit: e.target.value})}
                    placeholder="gram, ml, pcs"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stok Awal</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    disabled={!!currentItem.id} // Don't adjust stock directly via form. Use transactions
                    value={currentItem.current_stock !== undefined ? currentItem.current_stock : ''} 
                    onChange={(e) => setCurrentItem({...currentItem, current_stock: Number(e.target.value)})}
                    placeholder="0"
                    className="w-full glass-input text-xs disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stok Minimum (Warning)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={currentItem.minimum_stock !== undefined ? currentItem.minimum_stock : ''} 
                    onChange={(e) => setCurrentItem({...currentItem, minimum_stock: Number(e.target.value)})}
                    placeholder="Batas warning tipis"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Supplier Utama</label>
                <select 
                  value={currentItem.supplier_id || ''} 
                  onChange={(e) => setCurrentItem({...currentItem, supplier_id: e.target.value})}
                  className="w-full glass-input text-xs cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Tanpa Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setItemModalOpen(false); setCurrentItem(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white border border-emerald-500/20 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: SUPPLIER CRUD ============ */}
      {supplierModalOpen && currentSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-200 mb-4">
              {currentSupplier.id ? 'Edit Supplier' : 'Tambah Supplier Baru'}
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Supplier / Vendor</label>
                <input 
                  type="text" 
                  required
                  value={currentSupplier.name || ''} 
                  onChange={(e) => setCurrentSupplier({...currentSupplier, name: e.target.value})}
                  placeholder="Contoh: Horeca Bali Supplier"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">No. Telepon / WhatsApp</label>
                <input 
                  type="text" 
                  value={currentSupplier.phone || ''} 
                  onChange={(e) => setCurrentSupplier({...currentSupplier, phone: e.target.value})}
                  placeholder="081x-xxxx-xxxx"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={currentSupplier.email || ''} 
                  onChange={(e) => setCurrentSupplier({...currentSupplier, email: e.target.value})}
                  placeholder="order@vendor.com"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Alamat Kantor / Gudang</label>
                <textarea 
                  value={currentSupplier.address || ''} 
                  onChange={(e) => setCurrentSupplier({...currentSupplier, address: e.target.value})}
                  placeholder="Jl. Raya Kuta No..."
                  rows={3}
                  className="w-full glass-input text-xs resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setSupplierModalOpen(false); setCurrentSupplier(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white border border-emerald-500/20 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ MODAL: TRANSACTION / MUTASI ============ */}
      {transactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-200 mb-4">Catat Mutasi Stok</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Pilih Bahan Bar</label>
                <select 
                  required
                  value={txItemId} 
                  onChange={(e) => setTxItemId(e.target.value)}
                  className="w-full glass-input text-xs cursor-pointer"
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id} className="bg-slate-900">
                      {item.name} ({item.category}) - Sisa: {item.current_stock} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Jenis Mutasi</label>
                  <select 
                    value={txType} 
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full glass-input text-xs cursor-pointer"
                  >
                    <option value="masuk" className="bg-slate-900">Barang Masuk (+)</option>
                    <option value="keluar" className="bg-slate-900">Barang Keluar (-)</option>
                    <option value="terpakai" className="bg-slate-900">Barang Terpakai (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Jumlah ({items.find(i => i.id === txItemId)?.unit || ''})
                  </label>
                  <input 
                    type="number" 
                    min="0.1" 
                    step="any"
                    required
                    value={txQty} 
                    onChange={(e) => setTxQty(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full glass-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Catatan / Keterangan</label>
                <input 
                  type="text" 
                  value={txNotes} 
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Contoh: Kiriman supplier, Barang Expired, dll."
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setTransactionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white border border-emerald-500/20 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
