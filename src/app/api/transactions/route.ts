import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: List all transactions with item_name, category, unit, actor_name enrichment
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, 
              COALESCE(i.name, 'Barang Dihapus') as item_name,
              COALESCE(i.category, '-') as category,
              COALESCE(i.unit, '') as unit,
              COALESCE(p.full_name, 'Sistem') as actor_name
       FROM transactions t 
       LEFT JOIN items i ON t.item_id = i.id 
       LEFT JOIN profiles p ON t.actor_id = p.id 
       ORDER BY t.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data transaksi.' }, { status: 500 });
  }
}

// POST: Create a new transaction + update item stock
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, type, quantity, actor_id, notes } = body;

    if (!item_id || !type || !quantity) {
      return NextResponse.json({ error: 'Item, jenis, dan jumlah wajib diisi.' }, { status: 400 });
    }

    const newId = `tx-${Date.now()}`;
    const qty = Number(quantity);

    // Insert transaction record
    await pool.query(
      'INSERT INTO transactions (id, item_id, type, quantity, actor_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [newId, item_id, type, qty, actor_id || null, notes || '']
    );

    // Update item stock
    if (type === 'masuk') {
      await pool.query(
        'UPDATE items SET current_stock = current_stock + ? WHERE id = ?',
        [qty, item_id]
      );
    } else {
      // keluar or terpakai
      await pool.query(
        'UPDATE items SET current_stock = current_stock - ? WHERE id = ?',
        [qty, item_id]
      );
    }

    const [created] = await pool.query<RowDataPacket[]>(
      `SELECT t.*, 
              COALESCE(i.name, 'Barang Dihapus') as item_name,
              COALESCE(i.category, '-') as category,
              COALESCE(i.unit, '') as unit,
              COALESCE(p.full_name, 'Sistem') as actor_name
       FROM transactions t 
       LEFT JOIN items i ON t.item_id = i.id 
       LEFT JOIN profiles p ON t.actor_id = p.id 
       WHERE t.id = ?`,
      [newId]
    );

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Transaction save error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan transaksi.' }, { status: 500 });
  }
}
