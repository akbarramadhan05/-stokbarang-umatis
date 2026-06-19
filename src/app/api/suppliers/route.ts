import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET: List all suppliers
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM suppliers ORDER BY name'
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Suppliers fetch error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data supplier.' }, { status: 500 });
  }
}

// POST: Create or Update supplier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, email, address } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nama supplier wajib diisi.' }, { status: 400 });
    }

    if (id) {
      // Update existing supplier
      await pool.query(
        'UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
        [name, phone || '', email || '', address || '', id]
      );
      const [updated] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers WHERE id = ?', [id]);
      return NextResponse.json(updated[0]);
    } else {
      // Create new supplier
      const newId = `sup-${Date.now()}`;
      await pool.query(
        'INSERT INTO suppliers (id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)',
        [newId, name, phone || '', email || '', address || '']
      );
      const [created] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers WHERE id = ?', [newId]);
      return NextResponse.json(created[0]);
    }
  } catch (error: any) {
    console.error('Supplier save error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan supplier.' }, { status: 500 });
  }
}
