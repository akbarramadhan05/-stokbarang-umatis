import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: List all items with supplier_name enrichment
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, COALESCE(s.name, 'Tanpa Supplier') as supplier_name 
       FROM items i 
       LEFT JOIN suppliers s ON i.supplier_id = s.id 
       ORDER BY i.name`
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Items fetch error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data barang.' }, { status: 500 });
  }
}

// POST: Create or Update item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, category, unit, current_stock, minimum_stock, supplier_id } = body;

    if (!name || !category || !unit) {
      return NextResponse.json({ error: 'Nama, kategori, dan unit wajib diisi.' }, { status: 400 });
    }

    if (id) {
      // Update existing item
      await pool.query(
        `UPDATE items SET name = ?, category = ?, unit = ?, 
         minimum_stock = ?, supplier_id = ?, current_stock = ? WHERE id = ?`,
        [name, category, unit, Number(minimum_stock || 0), supplier_id || null, Number(current_stock || 0), id]
      );
      const [updated] = await pool.query<RowDataPacket[]>(
        `SELECT i.*, COALESCE(s.name, 'Tanpa Supplier') as supplier_name 
         FROM items i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE i.id = ?`, [id]
      );
      return NextResponse.json(updated[0]);
    } else {
      // Create new item
      const newId = `itm-${Date.now()}`;
      await pool.query(
        'INSERT INTO items (id, name, category, unit, current_stock, minimum_stock, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newId, name, category, unit, Number(current_stock || 0), Number(minimum_stock || 0), supplier_id || null]
      );
      const [created] = await pool.query<RowDataPacket[]>(
        `SELECT i.*, COALESCE(s.name, 'Tanpa Supplier') as supplier_name 
         FROM items i LEFT JOIN suppliers s ON i.supplier_id = s.id WHERE i.id = ?`, [newId]
      );
      return NextResponse.json(created[0]);
    }
  } catch (error: any) {
    console.error('Item save error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan barang.' }, { status: 500 });
  }
}
