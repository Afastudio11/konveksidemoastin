import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, User } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success('Login berhasil! Mengalihkan ke dashboard...');

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-muted/20 text-foreground font-sans">
      <div className="w-full max-w-[390px] space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-1.5 rounded-2xl bg-card border border-border shadow-xs mb-1">
            <img
              src="/ouruniform-logo.png"
              alt="ouruniform.id"
              className="size-11 rounded-xl object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              ouruniform.id
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Portal Manajemen Operasional & Produksi
            </p>
          </div>
        </div>

        {/* Minimalist Card */}
        <Card className="rounded-2xl border-border bg-card shadow-xs overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Alamat Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@konveksi.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="h-10 text-xs sm:text-sm rounded-lg border-border bg-background focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-10 text-xs sm:text-sm rounded-lg border-border bg-background pr-10 focus-visible:ring-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium text-xs sm:text-sm shadow-2xs transition-all gap-2 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Akses Cepat Demo Pill Tabs */}
            <div className="pt-4 border-t border-border/70 space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground text-center">
                Atau masuk cepat dengan akun demo:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLoginWithCreds('superadmin@konveksi.id', 'super123')}
                  disabled={isLoading}
                  className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted hover:border-foreground/20 transition-all text-center cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span>Super Admin</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Akses Penuh</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLoginWithCreds('admin@konveksi.id', 'admin123')}
                  disabled={isLoading}
                  className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted hover:border-foreground/20 transition-all text-center cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <User className="size-3.5 text-blue-600" />
                    <span>Admin Staf</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Operasional</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} ouruniform.id • Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
}
