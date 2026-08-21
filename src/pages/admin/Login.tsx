import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const menuPermissionMap = [
  { path: '/admin/dashboard', permission: 'dashboard' },
  { path: '/admin/orders', permission: 'orders' },
  { path: '/admin/customers', permission: 'customers' },
  { path: '/admin/expenses', permission: 'expenses' },
  { path: '/admin/activity-logs', permission: 'activity_logs' },
  { path: '/admin/settings', permission: 'settings' },
  { path: '/admin/users', permission: 'user_management' },
];

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getFirstAllowedPath = (userRole: string, permissions: string[]): string => {
    if (userRole === 'superadmin') {
      return '/admin/dashboard';
    }
    
    for (const menu of menuPermissionMap) {
      if (permissions.includes(menu.permission)) {
        return menu.path;
      }
    }
    
    return '/admin/dashboard';
  };

  const handleLoginWithCreds = async (inputEmail: string, inputPass: string) => {
    setEmail(inputEmail);
    setPassword(inputPass);
    setIsLoading(true);

    try {
      const loggedInUser = await login(inputEmail, inputPass);
      toast.success('Login berhasil!');
      
      const firstPath = getFirstAllowedPath(
        loggedInUser?.role || 'admin',
        loggedInUser?.permissions || []
      );
      navigate(firstPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLoginWithCreds(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-4 admin-poppins">
      <Card className="w-full max-w-md shadow-2xl border-slate-700/50 bg-slate-900/90 backdrop-blur-xl text-white">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
              KI
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-white">
            Konveksi Industry
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Masuk ke panel manajemen admin & pesanan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-300">Email Admin</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@konveksi.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-500"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/25 h-10 text-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
          </form>

          {/* Quick Demo Login Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                ⚡ Akun Demo (Klik untuk langsung login):
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                1-Click Login
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleLoginWithCreds('superadmin@konveksi.id', 'super123')}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-amber-500/10 hover:border-amber-500/60 text-left transition-all group disabled:opacity-50"
              >
                <div className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                  👑 Super Admin
                </div>
                <div className="text-[10px] text-slate-400 truncate">superadmin@konveksi.id</div>
                <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 mt-0.5">
                  Pass: <span className="text-amber-400 font-semibold">super123</span>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleLoginWithCreds('admin@konveksi.id', 'admin123')}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-blue-500/10 hover:border-blue-500/60 text-left transition-all group disabled:opacity-50"
              >
                <div className="text-xs font-bold text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                  👤 Admin
                </div>
                <div className="text-[10px] text-slate-400 truncate">admin@konveksi.id</div>
                <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300 mt-0.5">
                  Pass: <span className="text-blue-400 font-semibold">admin123</span>
                </div>
              </button>
            </div>

            {/* Fallback button if DB hasn't been re-seeded */}
            <div className="text-center pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleLoginWithCreds('superadmin@sekala.id', 'super123')}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Atau klik jika akun lama: <span className="underline">superadmin@sekala.id</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
