import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Activity,
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  Shield,
  Users,
  Warehouse,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

const iconColors: Record<string, string> = {
  dashboard: 'text-indigo-500',
  orders: 'text-blue-500',
  customers: 'text-violet-500',
  expenses: 'text-rose-500',
  inventory: 'text-amber-500',
  financial_reports: 'text-emerald-500',
  activity_logs: 'text-cyan-500',
  settings: 'text-slate-500',
  user_management: 'text-orange-500',
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = useMemo(() => {
    const allMenuItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard', group: 'Operasional' },
      { path: '/admin/orders', label: 'Orders', icon: Package, permission: 'orders', group: 'Operasional' },
      { path: '/admin/customers', label: 'Pelanggan', icon: Users, permission: 'customers', group: 'Operasional' },
      { path: '/admin/expenses', label: 'Pengeluaran', icon: Receipt, permission: 'expenses', group: 'Keuangan & Stok' },
      { path: '/admin/inventory', label: 'Stok Bahan Baku', icon: Warehouse, permission: 'inventory', group: 'Keuangan & Stok' },
      { path: '/admin/financial-reports', label: 'Laporan Keuangan', icon: ChartNoAxesCombined, permission: 'financial_reports', group: 'Keuangan & Stok' },
      { path: '/admin/activity-logs', label: 'Log Aktivitas', icon: Activity, permission: 'activity_logs', group: 'Sistem' },
      { path: '/admin/settings', label: 'Pengaturan', icon: Settings, permission: 'settings', group: 'Sistem' },
      { path: '/admin/users', label: 'Manajemen User', icon: Shield, permission: 'user_management', group: 'Sistem' },
    ];

    if (user?.role === 'superadmin') return allMenuItems;
    const userPermissions = user?.permissions || [];
    return allMenuItems.filter((item) => userPermissions.includes(item.permission));
  }, [user?.permissions, user?.role]);

  const activeMenu = menuItems.find((item) => location.pathname.startsWith(item.path));
  const initials = (user?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const groups = ['Operasional', 'Keuangan & Stok', 'Sistem'];

  return (
    <div className="admin-square-shell admin-poppins min-h-screen bg-[#f3f4f6] text-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-[#f8f8f8] transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[58px] items-center justify-between px-3">
          <Link to={menuItems[0]?.path || '#'} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white">KI</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-4">Konveksi Industry</span>
              <span className="block text-[10px] font-medium text-slate-400">Workspace Admin</span>
            </span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-400" />
          </Link>
          <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-2">
          {groups.map((group) => {
            const items = menuItems.filter((item) => item.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-5">
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{group}</p>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                          isActive ? 'bg-slate-200/80 font-medium text-slate-950' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-950'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${iconColors[item.permission] || 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-950" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-2.5">
          <div className="rounded-lg border border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-xs font-semibold text-indigo-700">{initials || 'AD'}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-800">{user?.name || 'Admin'}</span>
                <span className="block truncate text-[10px] text-slate-400">{user?.email}</span>
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={handleLogout} title="Keluar">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-[260px] lg:p-2">
        <div className="min-h-screen overflow-hidden bg-white lg:min-h-[calc(100vh-16px)] lg:rounded-lg lg:border lg:border-slate-200">
          <header className="sticky top-0 z-30 flex h-[58px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <button className="-ml-1 rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
                <Menu className="h-4 w-4" />
              </button>
              {activeMenu ? <activeMenu.icon className={`h-4 w-4 ${iconColors[activeMenu.permission] || 'text-slate-500'}`} /> : <LayoutDashboard className="h-4 w-4 text-slate-500" />}
              <span className="truncate text-sm font-medium text-slate-600">{activeMenu?.label || 'Admin Panel'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-400 sm:inline">Diperbarui {format(new Date(), 'dd MMM yyyy', { locale: idLocale })}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" title="Notifikasi">
                <Bell className="h-4 w-4" />
              </Button>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-[10px] font-semibold text-white">{initials || 'AD'}</span>
            </div>
          </header>

          <main className="admin-square-content p-4 sm:p-5">{children}</main>
        </div>
      </div>

      {sidebarOpen && <button className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" />}
    </div>
  );
}
