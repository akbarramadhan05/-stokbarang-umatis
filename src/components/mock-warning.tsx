'use client';

import { useState, useEffect } from 'react';
import { checkDbConnection } from '@/lib/api-client';
import { Database, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

export default function MockWarning() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkDbConnection().then(setDbConnected);
  }, []);

  // Still loading
  if (dbConnected === null) return null;

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-md border-b border-emerald-950/40 text-xs py-2 px-4 flex flex-wrap justify-between items-center z-50">
      <div className="flex items-center gap-2">
        {dbConnected ? (
          <>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5" />
              <span className="font-semibold">MySQL Database Terhubung</span>
            </div>
            <span className="text-slate-400 hidden sm:inline">• phpMyAdmin aktif</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-semibold">Database Tidak Terhubung</span>
            </div>
            <span className="text-slate-400 hidden md:inline">• Pastikan XAMPP MySQL sedang berjalan</span>
          </>
        )}
      </div>

      <div className="relative flex items-center gap-2 mt-1 sm:mt-0">
        {!dbConnected && (
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
              <Database className="w-3.5 h-3.5" /> Setup MySQL (phpMyAdmin)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>Pastikan XAMPP berjalan (Apache + MySQL).</li>
              <li>Buka phpMyAdmin di <code className="text-emerald-300">localhost/phpmyadmin</code>.</li>
              <li>Jalankan file <code className="text-emerald-300">init-database.sql</code> di tab SQL.</li>
              <li>Pastikan <code className="text-emerald-300">.env.local</code> berisi config MySQL yang benar.</li>
            </ol>
            <pre className="bg-black/40 p-1.5 rounded mt-1.5 text-[10px] overflow-x-auto text-emerald-400">
{`DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=umatis_stokbarang`}
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
