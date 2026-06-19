import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, full_name, email, role, updated_at FROM profiles ORDER BY role, full_name'
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Profiles fetch error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data profil.' }, { status: 500 });
  }
}
