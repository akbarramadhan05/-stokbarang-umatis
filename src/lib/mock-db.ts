import { Profile, Supplier, Item, Transaction, StockOpname, UserRole } from '@/types';

// Mock profiles
const MOCK_PROFILES: Profile[] = [
  { id: 'usr-admin', full_name: 'Budi (Admin Stok)', role: 'admin', updated_at: new Date().toISOString() },
  { id: 'usr-owner', full_name: 'Santi (Owner Umatis)', role: 'owner', updated_at: new Date().toISOString() },
  { id: 'usr-barista', full_name: 'Gede (Senior Barista)', role: 'barista', updated_at: new Date().toISOString() },
];

const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', name: 'Bali Kopi Roasters', phone: '0811-389-222', email: 'orders@balicofee.com', address: 'Jl. Sunset Road No. 88, Seminyak, Bali', created_at: new Date().toISOString() },
  { id: 'sup-2', name: 'Monin Indonesia Distributor', phone: '021-5698-123', email: 'sales@monin-indo.co.id', address: 'Kawasan Industri Pulogadung, Jakarta', created_at: new Date().toISOString() },
  { id: 'sup-3', name: 'Indomilk Horeca Bali', phone: '0812-445-678', email: 'bali@indomilk-horeca.com', address: 'Jl. Bypass Ngurah Rai No. 100, Kuta, Bali', created_at: new Date().toISOString() },
];

const MOCK_ITEMS: Item[] = [
  { id: 'itm-1', name: 'Espresso Beans Toraja Blend', category: 'Coffee', unit: 'gram', current_stock: 4500, minimum_stock: 1000, supplier_id: 'sup-1', created_at: new Date().toISOString() },
  { id: 'itm-2', name: 'Monin Caramel Syrup', category: 'Syrup', unit: 'pcs', current_stock: 12, minimum_stock: 3, supplier_id: 'sup-2', created_at: new Date().toISOString() },
  { id: 'itm-3', name: 'Greenfields Fresh Milk 1L', category: 'Dairy', unit: 'pcs', current_stock: 4, minimum_stock: 12, supplier_id: 'sup-3', created_at: new Date().toISOString() }, // LOW STOCK!
  { id: 'itm-4', name: 'Monin Vanilla Syrup', category: 'Syrup', unit: 'pcs', current_stock: 8, minimum_stock: 3, supplier_id: 'sup-2', created_at: new Date().toISOString() },
  { id: 'itm-5', name: 'Oatmilk Oatly 1L', category: 'Dairy', unit: 'pcs', current_stock: 2, minimum_stock: 8, supplier_id: 'sup-3', created_at: new Date().toISOString() }, // LOW STOCK!
  { id: 'itm-6', name: 'Mint Leaves Fresh', category: 'Garnish', unit: 'gram', current_stock: 250, minimum_stock: 100, supplier_id: 'sup-1', created_at: new Date().toISOString() },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', item_id: 'itm-1', type: 'masuk', quantity: 5000, actor_id: 'usr-admin', notes: 'Restock mingguan biji kopi', created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString() },
  { id: 'tx-2', item_id: 'itm-3', type: 'masuk', quantity: 24, actor_id: 'usr-admin', notes: 'Pengiriman dari Indomilk', created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString() },
  { id: 'tx-3', item_id: 'itm-3', type: 'keluar', quantity: 2, actor_id: 'usr-admin', notes: 'Susu rusak/pecah di gudang', created_at: new Date(Date.now() - 3600000 * 8).toISOString() },
  { id: 'tx-4', item_id: 'itm-1', type: 'terpakai', quantity: 500, actor_id: 'usr-barista', notes: 'Penggunaan harian bar espresso', created_at: new Date(Date.now() - 3600000 * 4).toISOString() },
];

const MOCK_OPNAMES: StockOpname[] = [
  { id: 'op-1', opname_date: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0], item_id: 'itm-1', system_stock: 5000, physical_stock: 4980, discrepancy: -20, status: 'verified', barista_id: 'usr-barista', notes: 'Selisih wajar grind adjustment', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
];

// Helper to initialize local storage
const initializeMockData = () => {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('umatis_profiles')) {
    localStorage.setItem('umatis_profiles', JSON.stringify(MOCK_PROFILES));
  }
  if (!localStorage.getItem('umatis_suppliers')) {
    localStorage.setItem('umatis_suppliers', JSON.stringify(MOCK_SUPPLIERS));
  }
  if (!localStorage.getItem('umatis_items')) {
    localStorage.setItem('umatis_items', JSON.stringify(MOCK_ITEMS));
  }
  if (!localStorage.getItem('umatis_transactions')) {
    localStorage.setItem('umatis_transactions', JSON.stringify(MOCK_TRANSACTIONS));
  }
  if (!localStorage.getItem('umatis_opnames')) {
    localStorage.setItem('umatis_opnames', JSON.stringify(MOCK_OPNAMES));
  }
};

// Retrieve records
export const getMockProfiles = (): Profile[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('umatis_profiles') || '[]');
};

export const getMockSuppliers = (): Supplier[] => {
  initializeMockData();
  return JSON.parse(localStorage.getItem('umatis_suppliers') || '[]');
};

export const getMockItems = (): Item[] => {
  initializeMockData();
  const items: Item[] = JSON.parse(localStorage.getItem('umatis_items') || '[]');
  const suppliers = getMockSuppliers();
  return items.map(item => ({
    ...item,
    supplier_name: suppliers.find(s => s.id === item.supplier_id)?.name || 'Tanpa Supplier'
  }));
};

export const getMockTransactions = (): Transaction[] => {
  initializeMockData();
  const txs: Transaction[] = JSON.parse(localStorage.getItem('umatis_transactions') || '[]');
  const items = getMockItems();
  const profiles = getMockProfiles();
  return txs.map(tx => {
    const item = items.find(i => i.id === tx.item_id);
    return {
      ...tx,
      item_name: item?.name || 'Barang Dihapus',
      category: item?.category || '-',
      unit: item?.unit || '',
      actor_name: profiles.find(p => p.id === tx.actor_id)?.full_name || 'Sistem'
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const getMockOpnames = (): StockOpname[] => {
  initializeMockData();
  const ops: StockOpname[] = JSON.parse(localStorage.getItem('umatis_opnames') || '[]');
  const items = getMockItems();
  const profiles = getMockProfiles();
  return ops.map(op => {
    const item = items.find(i => i.id === op.item_id);
    return {
      ...op,
      item_name: item?.name || 'Barang Dihapus',
      category: item?.category || '-',
      unit: item?.unit || '',
      barista_name: profiles.find(p => p.id === op.barista_id)?.full_name || 'Barista'
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

// Modifiers

// Suppliers CRUD
export const saveSupplier = (supplier: Partial<Supplier>): Supplier => {
  const suppliers = getMockSuppliers();
  if (supplier.id) {
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if (idx !== -1) {
      suppliers[idx] = { ...suppliers[idx], ...supplier };
    }
  } else {
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supplier.name || 'Supplier Baru',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      created_at: new Date().toISOString(),
    };
    suppliers.push(newSup);
    supplier = newSup;
  }
  localStorage.setItem('umatis_suppliers', JSON.stringify(suppliers));
  return supplier as Supplier;
};

export const deleteSupplier = (id: string) => {
  const suppliers = getMockSuppliers();
  const filtered = suppliers.filter(s => s.id !== id);
  localStorage.setItem('umatis_suppliers', JSON.stringify(filtered));
};

// Items CRUD
export const saveItem = (item: Partial<Item>): Item => {
  const items = getMockItems();
  let resultItem: Item;

  if (item.id) {
    const idx = items.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      items[idx] = {
        ...items[idx],
        name: item.name ?? items[idx].name,
        category: item.category ?? items[idx].category,
        unit: item.unit ?? items[idx].unit,
        minimum_stock: Number(item.minimum_stock ?? items[idx].minimum_stock),
        supplier_id: item.supplier_id !== undefined ? item.supplier_id : items[idx].supplier_id,
        current_stock: Number(item.current_stock ?? items[idx].current_stock),
      };
      resultItem = items[idx];
    } else {
      throw new Error("Item not found");
    }
  } else {
    const newItem: Item = {
      id: `itm-${Date.now()}`,
      name: item.name || 'Barang Baru',
      category: item.category || 'Coffee',
      unit: item.unit || 'pcs',
      current_stock: Number(item.current_stock || 0),
      minimum_stock: Number(item.minimum_stock || 0),
      supplier_id: item.supplier_id || null,
      created_at: new Date().toISOString(),
    };
    items.push(newItem);
    resultItem = newItem;
  }

  // clean supplier_name reference before saving
  const itemsToSave = items.map(({ supplier_name, ...rest }) => rest);
  localStorage.setItem('umatis_items', JSON.stringify(itemsToSave));
  
  return resultItem;
};

export const deleteItem = (id: string) => {
  const items = getMockItems();
  const filtered = items.filter(i => i.id !== id).map(({ supplier_name, ...rest }) => rest);
  localStorage.setItem('umatis_items', JSON.stringify(filtered));
};

// Add Transaction
export const addTransaction = (tx: Omit<Transaction, 'id' | 'created_at'>): Transaction => {
  const txs = getMockTransactions();
  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  
  // Update inventory stock
  const items = getMockItems();
  const itemIdx = items.findIndex(i => i.id === tx.item_id);
  if (itemIdx !== -1) {
    const qty = Number(tx.quantity);
    if (tx.type === 'masuk') {
      items[itemIdx].current_stock += qty;
    } else {
      items[itemIdx].current_stock -= qty;
    }
    
    // Save items
    const itemsToSave = items.map(({ supplier_name, ...rest }) => rest);
    localStorage.setItem('umatis_items', JSON.stringify(itemsToSave));
  }

  txs.push(newTx);
  // clean item_name reference before saving
  const txsToSave = txs.map(({ item_name, category, unit, actor_name, ...rest }) => rest);
  localStorage.setItem('umatis_transactions', JSON.stringify(txsToSave));
  
  return newTx;
};

// Add Stock Opname
export const addStockOpname = (op: Omit<StockOpname, 'id' | 'created_at' | 'discrepancy'>): StockOpname => {
  const ops = getMockOpnames();
  const systemStock = Number(op.system_stock);
  const physicalStock = Number(op.physical_stock);
  const discrepancy = physicalStock - systemStock;

  const newOp: StockOpname = {
    ...op,
    id: `op-${Date.now()}`,
    discrepancy,
    created_at: new Date().toISOString(),
  };

  // If status is verified, sync current stock
  if (op.status === 'verified') {
    const items = getMockItems();
    const itemIdx = items.findIndex(i => i.id === op.item_id);
    if (itemIdx !== -1) {
      items[itemIdx].current_stock = physicalStock;
      
      const itemsToSave = items.map(({ supplier_name, ...rest }) => rest);
      localStorage.setItem('umatis_items', JSON.stringify(itemsToSave));
    }

    // Add a corresponding adjustment transaction
    if (discrepancy !== 0) {
      addTransaction({
        item_id: op.item_id,
        type: discrepancy > 0 ? 'masuk' : 'terpakai',
        quantity: Math.abs(discrepancy),
        actor_id: op.barista_id,
        notes: `Penyesuaian Opname: ${op.notes || 'Penyesuaian otomatis selisih'}`
      });
    }
  }

  ops.push(newOp);
  const opsToSave = ops.map(({ item_name, category, unit, barista_name, ...rest }) => rest);
  localStorage.setItem('umatis_opnames', JSON.stringify(opsToSave));

  return newOp;
};

// Update Stock Opname Status
export const updateOpnameStatus = (id: string, status: 'draft' | 'submitted' | 'verified', actorId: string): StockOpname => {
  const ops = getMockOpnames();
  const idx = ops.findIndex(o => o.id === id);
  if (idx === -1) throw new Error("Opname record not found");

  const op = ops[idx];
  op.status = status;

  if (status === 'verified') {
    const items = getMockItems();
    const itemIdx = items.findIndex(i => i.id === op.item_id);
    if (itemIdx !== -1) {
      items[itemIdx].current_stock = op.physical_stock;
      
      const itemsToSave = items.map(({ supplier_name, ...rest }) => rest);
      localStorage.setItem('umatis_items', JSON.stringify(itemsToSave));
    }

    if (op.discrepancy !== 0) {
      addTransaction({
        item_id: op.item_id,
        type: op.discrepancy > 0 ? 'masuk' : 'terpakai',
        quantity: Math.abs(op.discrepancy),
        actor_id: actorId,
        notes: `Verifikasi Opname: ${op.notes || 'Penyesuaian otomatis selisih'}`
      });
    }
  }

  localStorage.setItem('umatis_opnames', JSON.stringify(ops.map(({ item_name, category, unit, barista_name, ...rest }) => rest)));
  return op;
};
