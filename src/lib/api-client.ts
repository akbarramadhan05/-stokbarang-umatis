// Centralized API Client — replaces mockDb and supabase calls
// All functions return Promises and interact with Next.js API Routes → MySQL

const headers = { 'Content-Type': 'application/json' };

// ─── Auth ──────────────────────────────────────────────
export const loginUser = async (email: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login gagal.');
  return data;
};

// ─── Profiles ──────────────────────────────────────────
export const getProfiles = async () => {
  const res = await fetch('/api/profiles');
  if (!res.ok) throw new Error('Gagal mengambil data profil.');
  return res.json();
};

// ─── Suppliers ─────────────────────────────────────────
export const getSuppliers = async () => {
  const res = await fetch('/api/suppliers');
  if (!res.ok) throw new Error('Gagal mengambil data supplier.');
  return res.json();
};

export const saveSupplier = async (supplier: Record<string, any>) => {
  const res = await fetch('/api/suppliers', {
    method: 'POST',
    headers,
    body: JSON.stringify(supplier),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan supplier.');
  return data;
};

export const deleteSupplier = async (id: string) => {
  const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus supplier.');
  return res.json();
};

// ─── Items ─────────────────────────────────────────────
export const getItems = async () => {
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('Gagal mengambil data barang.');
  return res.json();
};

export const saveItem = async (item: Record<string, any>) => {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers,
    body: JSON.stringify(item),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan barang.');
  return data;
};

export const deleteItem = async (id: string) => {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus barang.');
  return res.json();
};

// ─── Transactions ──────────────────────────────────────
export const getTransactions = async () => {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Gagal mengambil data transaksi.');
  return res.json();
};

export const addTransaction = async (tx: Record<string, any>) => {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers,
    body: JSON.stringify(tx),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi.');
  return data;
};

// ─── Stock Opname ──────────────────────────────────────
export const getOpnames = async () => {
  const res = await fetch('/api/opnames');
  if (!res.ok) throw new Error('Gagal mengambil data opname.');
  return res.json();
};

export const addOpname = async (opname: Record<string, any>) => {
  const res = await fetch('/api/opnames', {
    method: 'POST',
    headers,
    body: JSON.stringify(opname),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal menyimpan opname.');
  return data;
};

export const updateOpnameStatus = async (id: string, status: string, actorId: string) => {
  const res = await fetch(`/api/opnames/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status, actor_id: actorId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Gagal memperbarui opname.');
  return data;
};

// ─── Health Check ──────────────────────────────────────
export const checkDbConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/profiles');
    return res.ok;
  } catch {
    return false;
  }
};
