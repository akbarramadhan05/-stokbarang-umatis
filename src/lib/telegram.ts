import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

const getBotToken = () => process.env.TELEGRAM_BOT_TOKEN;
const getChatId = () => process.env.TELEGRAM_CHAT_ID;

/**
 * Mengirim pesan permintaan izin login ke Telegram Admin/Group
 */
export async function sendLoginVerification(
  attemptId: string,
  fullName: string,
  email: string,
  role: string
): Promise<boolean> {
  const token = getBotToken();
  const chatId = getChatId();

  if (!token || !chatId) {
    console.warn('Telegram Bot Token atau Chat ID belum dikonfigurasi.');
    return false;
  }

  const format = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  });
  const timeString = format.format(new Date());

  const messageText = `⚠️ *Percobaan Login Baru!*

*Nama:* ${fullName}
*Email:* ${email}
*Role:* ${role}
*Waktu:* ${timeString}
*Status:* Menunggu Persetujuan

Apakah Anda mengizinkan login ini?`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: 'Ya, Izinkan ✅', callback_data: `approve_${attemptId}` },
        { text: 'Bukan, Tolak ❌', callback_data: `reject_${attemptId}` },
      ],
    ],
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error('Gagal mengirim pesan ke Telegram:', data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending Telegram verification:', err);
    return false;
  }
}

/**
 * Menangani satu update callback dari Telegram
 */
export async function handleTelegramUpdate(update: any): Promise<void> {
  const token = getBotToken();
  if (!token) return;

  const cq = update.callback_query;
  if (!cq || !cq.data) return;

  const callbackData = cq.data as string;
  const callbackQueryId = cq.id;

  if (callbackData.startsWith('approve_') || callbackData.startsWith('reject_')) {
    const isApprove = callbackData.startsWith('approve_');
    const attemptId = callbackData.substring(isApprove ? 8 : 7);

    try {
      // 1. Jawab callback query secara instan agar Telegram langsung menghentikan loading spinner di tombol
      const answerPromise = fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text: isApprove ? 'Login disetujui!' : 'Login ditolak.',
        }),
      }).catch(err => console.error('Error answering callback query:', err));

      // 2. Dapatkan status attempt saat ini dari database (dijalankan paralel dengan answerCallbackQuery)
      const dbQueryPromise = pool.query<RowDataPacket[]>(
        'SELECT status, email, role, user_id FROM login_attempts WHERE id = ?',
        [attemptId]
      );

      const [[attempts]] = await Promise.all([dbQueryPromise, answerPromise]);

      if (attempts.length === 0) {
        // Edit pesan jika attempt tidak ditemukan
        if (cq.message) {
          fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: cq.message.chat.id,
              message_id: cq.message.message_id,
              text: '⚠️ *SESI LOGIN KEDALUWARSA / TIDAK DITEMUKAN*',
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: [] },
            }),
          }).catch(err => console.error('Error editing message for missing attempt:', err));
        }
        return;
      }

      const attempt = attempts[0];

      if (attempt.status !== 'pending') {
        return; // Sudah di-resolve sebelumnya
      }

      // 3. Update status di database dan edit pesan Telegram secara paralel
      const newStatus = isApprove ? 'approved' : 'rejected';
      const dbUpdatePromise = pool.query(
        'UPDATE login_attempts SET status = ? WHERE id = ?',
        [newStatus, attemptId]
      );

      let editPromise: Promise<any> = Promise.resolve();
      if (cq.message) {
        const format = new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'medium',
          timeZone: 'Asia/Jakarta',
        });
        const resolveTimeString = format.format(new Date());

        const userAgentText = cq.message.text || '';
        const cleanOriginalText = userAgentText
          .replace('Apakah Anda mengizinkan login ini?', '')
          .replace('*Status:* Menunggu Persetujuan', '')
          .trim();

        const statusHeader = isApprove ? '✅ *LOGIN DISETUJUI*' : '❌ *LOGIN DITOLAK (BUKAN USER)*';
        const updatedText = `${statusHeader}\n\n${cleanOriginalText}\n\n*Keputusan:* ${
          isApprove ? 'Disetujui' : 'Ditolak (Bukan User)'
        }\n*Waktu Keputusan:* ${resolveTimeString}`;

        editPromise = fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cq.message.chat.id,
            message_id: cq.message.message_id,
            text: updatedText,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [] }, // Hapus tombol
          }),
        }).catch(err => console.error('Error editing Telegram message:', err));
      }

      await Promise.all([dbUpdatePromise, editPromise]);
    } catch (err) {
      console.error('Error handling Telegram callback update:', err);
    }
  }
}

/**
 * Menarik update baru dari Telegram (Long Polling Fallback untuk testing lokal)
 */
export async function pollTelegramUpdates(): Promise<void> {
  const token = getBotToken();
  if (!token) return;

  try {
    // Ambil offset dari database
    const [settings] = await pool.query<RowDataPacket[]>(
      'SELECT setting_value FROM telegram_settings WHERE setting_key = "last_update_id"'
    );
    let offset = 0;
    if (settings.length > 0) {
      offset = parseInt(settings[0].setting_value, 10);
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&limit=100&timeout=0`
    );
    if (!response.ok) return;

    const data = await response.json();
    if (!data.ok || !data.result || data.result.length === 0) return;

    let maxUpdateId = offset - 1;

    // Proses update secara paralel
    const updatePromises = data.result.map(async (update: any) => {
      if (update.update_id > maxUpdateId) {
        maxUpdateId = update.update_id;
      }
      await handleTelegramUpdate(update);
    });

    await Promise.all(updatePromises);

    // Perbarui offset di database jika ada update baru yang diproses
    if (maxUpdateId >= offset) {
      const nextOffset = String(maxUpdateId + 1);
      await pool.query(
        'INSERT INTO telegram_settings (setting_key, setting_value) VALUES ("last_update_id", ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [nextOffset, nextOffset]
      );
    }
  } catch (err) {
    console.error('Error in pollTelegramUpdates:', err);
  }
}
