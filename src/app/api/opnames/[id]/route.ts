import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// PATCH: Update opname status (e.g., verify)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, actor_id } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status wajib diisi.' }, { status: 400 });
    }

    // Fetch current opname
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM stock_opname WHERE id = ?', [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Opname tidak ditemukan.' }, { status: 404 });
    }

    const op = existing[0];

    // Update status
    await pool.query('UPDATE stock_opname SET status = ? WHERE id = ?', [status, id]);

    // If verifying, sync stock and create adjustment
    if (status === 'verified') {
      await pool.query(
        'UPDATE items SET current_stock = ? WHERE id = ?',
        [op.physical_stock, op.item_id]
      );

      if (op.discrepancy !== 0) {
        const txId = `tx-vrf-${Date.now()}`;
        await pool.query(
          'INSERT INTO transactions (id, item_id, type, quantity, actor_id, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [
            txId,
            op.item_id,
            op.discrepancy > 0 ? 'masuk' : 'terpakai',
            Math.abs(op.discrepancy),
            actor_id || null,
            `Verifikasi Opname: ${op.notes || 'Penyesuaian otomatis selisih'}`
          ]
        );
      }
    }

    const [updated] = await pool.query<RowDataPacket[]>(
      `SELECT o.*, 
              COALESCE(i.name, 'Barang Dihapus') as item_name,
              COALESCE(i.category, '-') as category,
              COALESCE(i.unit, '') as unit,
              COALESCE(p.full_name, 'Barista') as barista_name
       FROM stock_opname o 
       LEFT JOIN items i ON o.item_id = i.id 
       LEFT JOIN profiles p ON o.barista_id = p.id 
       WHERE o.id = ?`,
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Opname update error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui opname.' }, { status: 500 });
  }
}
