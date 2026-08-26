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
  { path: '/admin/inventory', permission: 'inventory' },
  { path: '/admin/financial-reports', permission: 'financial_reports' },
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4 admin-poppins">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Konveksi Industry Admin</CardTitle>
          <CardDescription>
            Masuk ke dashboard admin Konveksi Industry
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              className="w-full bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600] font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* Akun demo klik langsung */}
          <div className="mt-4 pt-3 border-t text-center text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium">Akun Demo (Klik untuk langsung login):</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleLoginWithCreds('superadmin@konveksi.id', 'super123')}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 text-xs font-medium transition-colors"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleLoginWithCreds('admin@konveksi.id', 'admin123')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border text-xs font-medium transition-colors"
              >
                👤 Admin
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
