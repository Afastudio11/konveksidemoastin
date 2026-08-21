import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  Receipt,
  Settings,
  Activity,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import logo from '@/assets/logo.png';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = useMemo(() => {
    const allMenuItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { path: '/admin/orders', label: 'Orders', icon: Package, permission: 'orders' },
      { path: '/admin/customers', label: 'Pelanggan', icon: Users, permission: 'customers' },
      { path: '/admin/expenses', label: 'Pengeluaran', icon: Receipt, permission: 'expenses' },
      { path: '/admin/activity-logs', label: 'Log Aktivitas', icon: Activity, permission: 'activity_logs' },
      { path: '/admin/settings', label: 'Pengaturan', icon: Settings, permission: 'settings' },
      { path: '/admin/users', label: 'Manajemen User', icon: Shield, permission: 'user_management' },
    ];

    if (user?.role === 'superadmin') {
      return allMenuItems;
    }

    const userPermissions = user?.permissions || [];
    return allMenuItems.filter(item => userPermissions.includes(item.permission));
  }, [user?.role, user?.permissions]);

  return (
    <div className="min-h-screen bg-gray-100 admin-poppins">
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-blue-900 text-white transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-blue-800">
          <Link 
            to={menuItems.length > 0 ? menuItems[0].path : '#'} 
            className="flex items-center justify-center"
          >
            <img src={logo} alt="Sekala Industry" className="h-12 w-auto" />
          </Link>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#CCFF00] text-blue-900'
                    : 'hover:bg-blue-800'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <div className="mb-4">
            <div className="font-medium">{user?.name}</div>
            <div className="text-sm text-blue-300">{user?.email}</div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-blue-800"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      <main className="lg:ml-64 p-6 pt-16 lg:pt-6">{children}</main>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
