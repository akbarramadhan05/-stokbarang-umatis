'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api-client';
import { Lock, Mail, ChevronRight, AlertCircle, GlassWater } from 'lucide-react';
import MockWarning from '@/components/mock-warning';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Clear previous session/user data on load to ensure roles can be re-selected
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('umatis_user');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await loginUser(email, password);

      // Save login info to session
      sessionStorage.setItem(
        'umatis_user',
        JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        })
      );

      // Redirect based on role
      setTimeout(() => {
        redirectUser(user.role);
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
      setLoading(false);
    }
  };

  const redirectUser = (role: 'admin' | 'owner' | 'barista') => {
    if (role === 'admin') router.push('/admin');
    else if (role === 'owner') router.push('/owner');
    else if (role === 'barista') router.push('/barista');
  };

  const fillQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('demopassword123');
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* DB Connection Banner */}
      <MockWarning />

      {/* Main Container */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Brand */}
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-white flex items-center justify-center mb-3 border border-emerald-500/25 shadow-emerald-950/40 shadow-lg p-2.5 overflow-hidden">
              <img src="/logo.png" alt="Umatis Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-widest text-slate-100 uppercase">
              Umatis
            </h1>
            <span className="text-xs uppercase tracking-[0.25em] text-emerald-400 font-semibold mt-1">
              Bar & Stock Opname
            </span>
          </div>

          {/* Card */}
          <div className="glass-panel rounded-2xl p-8 border border-white/5 relative overflow-hidden shadow-2xl">
            {/* Background glowing effects inside card */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <h2 className="text-xl font-bold text-slate-200 mb-6 text-center">
              Masuk ke Dashboard
            </h2>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Alamat Email
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center border border-slate-800/20 text-slate-500 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@umatis.com"
                    className="flex-1 glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Kata Sandi
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center border border-slate-800/20 text-slate-500 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="flex-1 glass-input text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-slate-100 font-bold py-3 px-4 rounded-xl border border-emerald-500/30 transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-100 border-t-transparent animate-spin"></span>
                ) : (
                  <>
                    <span>Masuk Aplikasi</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper */}
            <div className="mt-8 border-t border-slate-800/60 pt-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
                Silakan login sesuai profesi Anda
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickLogin('admin@umatis.com')}
                  className="bg-slate-950/40 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-600/40 py-2 px-1 rounded-lg text-[10px] font-medium text-slate-300 hover:text-emerald-400 transition-all cursor-pointer text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('owner@umatis.com')}
                  className="bg-slate-950/40 hover:bg-amber-950/30 border border-slate-800 hover:border-amber-600/40 py-2 px-1 rounded-lg text-[10px] font-medium text-slate-300 hover:text-amber-400 transition-all cursor-pointer text-center"
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('barista@umatis.com')}
                  className="bg-slate-950/40 hover:bg-blue-950/30 border border-slate-800 hover:border-blue-600/40 py-2 px-1 rounded-lg text-[10px] font-medium text-slate-300 hover:text-blue-400 transition-all cursor-pointer text-center"
                >
                  Barista
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6 text-slate-500 text-xs">
            &copy; 2026 Umatis Resto & Venue. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
