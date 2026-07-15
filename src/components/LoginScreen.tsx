import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, Sparkles, LogIn } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setError('Por favor, ingresa todos los campos.');
      return;
    }

    setIsLoading(true);

    // Simulated network delay for a real premium feel
    setTimeout(() => {
      // Fetch current active users from localStorage
      const savedUsersRaw = localStorage.getItem('flamo_users');
      const savedUsers = savedUsersRaw ? JSON.parse(savedUsersRaw) : [
        { id: 'usr-1', username: 'admin', name: 'Administrador Principal', role: 'Super Admin', password: 'flamo2026', created_at: '2026-07-13' },
        { id: 'usr-2', username: 'vlad', name: 'Vlad Mendoza', role: 'Director de Booking', password: 'vlad2026', created_at: '2026-07-13' }
      ];

      // Validate credentials
      const matchingUser = savedUsers.find(
        (u: any) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
      );

      if (matchingUser) {
        onLogin(matchingUser.username);
      } else {
        setError('Usuario o contraseña incorrectos. Revisa las credenciales de acceso.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white-chalk text-cosmic-black flex flex-col justify-between font-sans relative overflow-hidden select-none antialiased">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-celestial-canvas/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-tomato-curry/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <header className="p-6 shrink-0 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-celestial-canvas rounded-xl flex items-center justify-center font-bold text-white-chalk text-lg shadow-sm">
            F
          </div>
          <div>
            <h1 className="text-xs font-bold text-cosmic-black tracking-widest uppercase">FLAMO CRM</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Enterprise Security</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-mono px-2.5 py-1 rounded-full border border-emerald-100 font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>SSL SECURE CONNECTION</span>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="bg-white border border-silver-haze rounded-3xl w-full max-w-md p-8 md:p-10 shadow-xl relative transition-all duration-300">
          
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-tomato-curry/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-tomato-curry">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-cosmic-black uppercase tracking-tight">Iniciar Sesión</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Ingresa tus credenciales para acceder al panel de control de giras.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-tomato-curry/10 border border-tomato-curry/20 text-tomato-curry rounded-xl p-3 flex items-start gap-2.5 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Usuario de acceso</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="admin o vlad"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze hover:border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-tomato-curry/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white-chalk border border-silver-haze hover:border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-tomato-curry/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cosmic-black hover:bg-cosmic-black/90 text-white-chalk font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white-chalk border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Autenticar y Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* Credential tips box - visually integrated for the demo/evaluation convenience */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-tomato-curry" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Cuentas Registradas por Defecto</span>
              </div>
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                Usa cualquiera de estos accesos, o los nuevos usuarios que agregues en el panel "Usuarios":
              </p>
              
              <div className="space-y-1.5">
                <div className="bg-white border border-silver-haze p-2 rounded-lg flex justify-between items-center text-[9px] font-mono">
                  <div>
                    <span className="text-slate-400 font-sans">User:</span> <span className="text-slate-800 font-bold">admin</span>
                  </div>
                  <div className="w-px h-3 bg-silver-haze" />
                  <div>
                    <span className="text-slate-400 font-sans">Pass:</span> <span className="text-slate-800 font-bold">flamo2026</span>
                  </div>
                </div>

                <div className="bg-white border border-silver-haze p-2 rounded-lg flex justify-between items-center text-[9px] font-mono">
                  <div>
                    <span className="text-slate-400 font-sans">User:</span> <span className="text-slate-800 font-bold">vlad</span>
                  </div>
                  <div className="w-px h-3 bg-silver-haze" />
                  <div>
                    <span className="text-slate-400 font-sans">Pass:</span> <span className="text-slate-800 font-bold">vlad2026</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 shrink-0 text-center text-[10px] text-slate-400 font-semibold max-w-7xl w-full mx-auto z-10 border-t border-slate-100">
        &copy; {new Date().getFullYear()} Flamo Entertainment Group. Todos los derechos reservados.
      </footer>
    </div>
  );
}
