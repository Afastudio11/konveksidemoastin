import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import logoDark from '@/assets/logo-dark.png';

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
  const { login, user } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loggedInUser = await login(email, password);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 p-4 admin-poppins">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoDark} alt="Sekala Industry" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Sekala Industry Admin</CardTitle>
          <CardDescription>
            Masuk ke dashboard admin Sekala Industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sekala.id"
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
              className="w-full bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]"
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
