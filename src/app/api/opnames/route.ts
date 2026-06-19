import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET: List all stock opname records
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, 
              COALESCE(i.name, 'Barang Dihapus') as item_name,
              COALESCE(i.category, '-') as category,
              COALESCE(i.unit, '') as unit,
              COALESCE(p.full_name, 'Barista') as barista_name
       FROM stock_opname o 
       LEFT JOIN items i ON o.item_id = i.id 
       LEFT JOIN profiles p ON o.barista_id = p.id 
       ORDER BY o.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Opnames fetch error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data opname.' }, { status: 500 });
  }
}

// POST: Create a new stock opname + optionally sync stock
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, system_stock, physical_stock, status, barista_id, notes } = body;

    if (!item_id || system_stock === undefined || physical_stock === undefined) {
      return NextResponse.json({ error: 'Data opname tidak lengkap.' }, { status: 400 });
    }

    const sysStock = Number(system_stock);
    const physStock = Number(physical_stock);
    const discrepancy = physStock - sysStock;
    const newId = `op-${Date.now()}`;
    const opnameDate = new Date().toISOString().split('T')[0];

    // Insert opname record
    await pool.query(
      `INSERT INTO stock_opname (id, opname_date, item_id, system_stock, physical_stock, discrepancy, status, barista_id, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, opnameDate, item_id, sysStock, physStock, discrepancy, status || 'submitted', barista_id || null, notes || '']
    );

    // If verified, sync stock and create adjustment transaction
    if (status === 'verified') {
      await pool.query(
        'UPDATE items SET current_stock = ? WHERE id = ?',
        [physStock, item_id]
      );

      if (discrepancy !== 0) {
        const txId = `tx-adj-${Date.now()}`;
        await pool.query(
          'INSERT INTO transactions (id, item_id, type, quantity, actor_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            txId,
            item_id,
            discrepancy > 0 ? 'masuk' : 'terpakai',
            Math.abs(discrepancy),
            barista_id || null,
            `Penyesuaian Opname: ${notes || 'Penyesuaian otomatis selisih'}`
          ]
        );
      }
    }

    const [created] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, 
              COALESCE(i.name, 'Barang Dihapus') as item_name,
              COALESCE(i.category, '-') as category,
              COALESCE(i.unit, '') as unit,
              COALESCE(p.full_name, 'Barista') as barista_name
       FROM stock_opname o 
       LEFT JOIN items i ON o.item_id = i.id 
       LEFT JOIN profiles p ON o.barista_id = p.id 
       WHERE o.id = ?`,
      [newId]
    );

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Opname save error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan opname.' }, { status: 500 });
  }
}
