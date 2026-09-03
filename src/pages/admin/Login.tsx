import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';

const menuPermissionMap = [
  { path: '/admin/dashboard', permission: 'dashboard' },
  { path: '/admin/orders', permission: 'orders' },
  { path: '/admin/customers', permission: 'customers' },
  { path: '/admin/expenses', permission: 'expenses' },
  { path: '/admin/inventory', permission: 'inventory' },
  { path: '/admin/financial-reports', permission: 'financial_reports' },
  { path: '/admin/ai-assistant', permission: 'ai_assistant' },
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
    <div className="admin-poppins grid min-h-screen bg-[#f3f4f6] p-2 lg:grid-cols-[minmax(0,1fr)_460px]">
      <section className="hidden min-h-[calc(100vh-16px)] flex-col justify-between overflow-hidden rounded-lg bg-slate-950 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-950">KI</span>
          <div><p className="text-sm font-semibold">Konveksi Industry</p><p className="text-[11px] text-slate-400">Business Workspace</p></div>
        </div>
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />Operasional terintegrasi</span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">Satu workspace untuk mengelola seluruh alur produksi.</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400">Order, pelanggan, bahan baku, pengeluaran, dan laporan keuangan tersaji dalam sistem yang ringkas dan mudah dipantau.</p>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} Konveksi Industry</p>
      </section>

      <div className="flex min-h-[calc(100vh-16px)] items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-md rounded-xl border-slate-200 shadow-none">
        <CardHeader className="border-b border-slate-100 p-5 text-left">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm"><LockKeyhole className="h-5 w-5" /></div>
          <CardTitle className="text-xl font-semibold tracking-tight">Masuk ke Workspace</CardTitle>
          <CardDescription className="text-sm">Gunakan akun admin Konveksi Industry Anda.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="superadmin@konveksi.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button
              type="submit"
              className="h-10 w-full bg-slate-950 font-medium text-white hover:bg-slate-800"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : <><span>Masuk</span><ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>

          {/* Akun demo klik langsung */}
          <div className="mt-5 space-y-2 border-t pt-4 text-xs text-muted-foreground">
            <p className="font-medium text-slate-600">Akses cepat akun demo</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLoginWithCreds('superadmin@konveksi.id', 'super123')}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleLoginWithCreds('admin@konveksi.id', 'admin123')}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Admin
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
