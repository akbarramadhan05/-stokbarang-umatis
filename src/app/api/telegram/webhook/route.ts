import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    
    // Proses update yang didapat dari webhook Telegram
    await handleTelegramUpdate(update);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    // Selalu return 200 OK ke Telegram agar tidak dicoba kirim ulang berulang kali
    return NextResponse.json({ ok: false, error: 'Failed to process update' }, { status: 200 });
  }
}
