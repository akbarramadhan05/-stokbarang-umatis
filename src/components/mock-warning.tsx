'use client';

import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Database, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function MockWarning() {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border-b border-emerald-950/40 text-xs py-2 px-4 flex flex-wrap justify-between items-center z-50">
      <div className="flex items-center gap-2">
        {isSupabaseConfigured ? (
          <>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5" />
              <span className="font-semibold">Supabase PostgreSQL Terhubung</span>
            </div>
            <span className="text-slate-400 hidden sm:inline">• Sinkronisasi langsung aktif</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-semibold">Demo Sandbox Mode (LocalStorage)</span>
            </div>
            <span className="text-slate-400 hidden md:inline">• Data tersimpan lokal di browser Anda</span>
          </>
        )}
      </div>

      <div className="relative flex items-center gap-2 mt-1 sm:mt-0">
        {!isSupabaseConfigured && (
          <button
            onClick={() => setShowTooltip(!showTooltip)}
            className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Bagaimana cara menghubungkan database?</span>
          </button>
        )}

        {showTooltip && (
          <div className="absolute right-0 top-7 w-72 p-3 bg-emerald-950/95 border border-emerald-800/40 text-slate-200 rounded-lg shadow-2xl z-50 text-xs backdrop-blur-lg">
            <h4 className="font-bold text-amber-400 mb-1.5 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Setup Supabase Backend
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Jalankan skema database DDL di Supabase SQL Editor.</li>
              <li>Buat file <code className="text-emerald-300">.env.local</code> di folder root proyek.</li>
              <li>Tambahkan variabel environment berikut:</li>
            </ol>
            <pre className="bg-black/40 p-1.5 rounded mt-1.5 text-[10px] overflow-x-auto text-emerald-400">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            </pre>
            <button
              onClick={() => setShowTooltip(false)}
              className="mt-2.5 w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-1 rounded transition-all cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
