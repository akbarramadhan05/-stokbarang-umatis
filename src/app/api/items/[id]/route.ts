import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE: Remove item by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Item delete error:', error);
    return NextResponse.json({ error: 'Gagal menghapus barang.' }, { status: 500 });
  }
}
