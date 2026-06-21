import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { pollTelegramUpdates } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get('attempt_id');
    const action = searchParams.get('action');

    if (!attemptId) {
      return NextResponse.json({ error: 'Parameter attempt_id wajib diisi.' }, { status: 400 });
    }

    // ─── Fitur Pembatalan (Cancel) ────────────────────────
    if (action === 'cancel') {
      await pool.query(
        "UPDATE login_attempts SET status = 'rejected' WHERE id = ? AND status = 'pending'",
        [attemptId]
      );
      return NextResponse.json({ success: true, message: 'Percobaan login dibatalkan.' });
    }

    // ─── Fitur Simulasi (Mock Approval/Rejection) untuk Dev ───
    if (process.env.NODE_ENV === 'development' && (action === 'mock_approve' || action === 'mock_reject')) {
      const targetStatus = action === 'mock_approve' ? 'approved' : 'rejected';
      await pool.query(
        'UPDATE login_attempts SET status = ? WHERE id = ?',
        [targetStatus, attemptId]
      );
      return NextResponse.json({ success: true, message: `Simulasi status diubah menjadi: ${targetStatus}` });
    }

    // ─── Polling Telegram Updates ──────────────────────────
    // Panggil helper untuk membaca update dari Telegram secara real-time
    // Ini menghilangkan kebutuhan untuk setup webhook HTTPS (ngrok) di lokal.
    await pollTelegramUpdates();

    // ─── Periksa Status di Database ────────────────────────
    const [attempts] = await pool.query<RowDataPacket[]>(
      'SELECT status, user_id FROM login_attempts WHERE id = ?',
      [attemptId]
    );

    if (attempts.length === 0) {
      return NextResponse.json({ error: 'Sesi login tidak ditemukan atau kedaluwarsa.' }, { status: 404 });
    }

    const attempt = attempts[0];

    // Jika disetujui, ambil profil pengguna lengkap untuk dikembalikan ke frontend
    if (attempt.status === 'approved') {
      const [profiles] = await pool.query<RowDataPacket[]>(
        'SELECT id, full_name, email, role FROM profiles WHERE id = ?',
        [attempt.user_id]
      );

      if (profiles.length === 0) {
        return NextResponse.json({ error: 'Profil user tidak ditemukan.' }, { status: 404 });
      }

      const user = profiles[0];
      return NextResponse.json({
        status: 'approved',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      });
    }

    return NextResponse.json({
      status: attempt.status, // 'pending' atau 'rejected'
    });
  } catch (error: any) {
    console.error('Error fetching login status:', error);
    return NextResponse.json({ error: 'Gagal mengambil status login.' }, { status: 500 });
  }
}
