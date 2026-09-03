import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Atom,
  Sparkles,
  LayoutGrid,
  ChartArea,
  Users,
  Receipt,
  Warehouse,
  ChartNoAxesCombined,
  Activity,
  Settings,
  Shield,
  HelpCircle,
  Globe,
  ChevronsUpDown,
  UserCircle,
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronDown,
  Folder,
  MoreHorizontal,
  Bell,
  MessageSquare,
  Search,
  Check,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/lib/auth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [foldersOpen, setFoldersOpen] = useState(true);

  const menuItems = useMemo(() => {
    const all = [
      {
        title: "AI Assistant",
        icon: Sparkles,
        path: "/admin/ai-assistant",
        permission: "ai_assistant",
      },
      {
        title: "Dashboard",
        icon: LayoutGrid,
        path: "/admin/dashboard",
        permission: "dashboard",
      },
      {
        title: "Pesanan (Orders)",
        icon: ChartArea,
        path: "/admin/orders",
        permission: "orders",
      },
      {
        title: "Pelanggan",
        icon: Users,
        path: "/admin/customers",
        permission: "customers",
      },
      {
        title: "Pengeluaran",
        icon: Receipt,
        path: "/admin/expenses",
        permission: "expenses",
      },
      {
        title: "Stok Bahan Baku",
        icon: Warehouse,
        path: "/admin/inventory",
        permission: "inventory",
      },
      {
        title: "Laporan Keuangan",
        icon: ChartNoAxesCombined,
        path: "/admin/financial-reports",
        permission: "financial_reports",
      },
      {
        title: "Log Aktivitas",
        icon: Activity,
        path: "/admin/activity-logs",
        permission: "activity_logs",
      },
      {
        title: "Pengaturan",
        icon: Settings,
        path: "/admin/settings",
        permission: "settings",
      },
      {
        title: "Manajemen User",
        icon: Shield,
        path: "/admin/users",
        permission: "user_management",
      },
    ];

    if (user?.role === "superadmin") return all;
    const userPermissions = user?.permissions || [];
    return all.filter((item) => userPermissions.includes(item.permission));
  }, [user?.permissions, user?.role]);

  const activeMenu = menuItems.find((item) =>
    location.pathname.startsWith(item.path)
  ) || menuItems[1];

  const folders = [
    { name: "Proyek Batch September", hasNotification: true, path: "/admin/batches/batch-september-2026" },
    { name: "Seragam Kantor BUMN", hasNotification: false, path: "/admin/batches/seragam-kantor-bumn" },
    { name: "Kaos Polo & Merchandise", hasNotification: true, path: "/admin/batches/kaos-polo-merchandise" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const initials = (user?.name || "AD")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="admin-square-shell min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Square UI Leads Architecture */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] sm:w-[270px] flex-col border-r border-border bg-card text-card-foreground transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-3 sm:p-4 lg:p-5 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/ouruniform-logo.png"
              alt="ouruniform.id"
              className="size-8 rounded-lg object-contain shrink-0 bg-background border border-border/70 p-0.5 shadow-2xs"
            />
            <div className="min-w-0 flex-1">
              <span className="font-bold text-sm sm:text-base tracking-tight text-foreground truncate block">
                ouruniform.id
              </span>
              <span className="text-[10px] font-medium text-muted-foreground block -mt-0.5">
                Konveksi & Apparel
              </span>
            </div>
          </div>
          <button
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-5 py-4 space-y-4">
          {/* Workspace Pill Card */}
          <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border bg-muted/40 p-2.5">
            <img
              src="/ouruniform-logo.png"
              alt="ouruniform.id"
              className="size-8 rounded-lg object-contain shrink-0 bg-background border border-border/70 p-0.5 shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm truncate text-foreground">
                ouruniform.id
              </p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="size-3 shrink-0" />
                <span className="text-[10px] sm:text-xs truncate">
                  Workspace Utama
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 h-9 sm:h-[38px] px-3 rounded-lg text-sm transition-colors group ${
                    isActive
                      ? "bg-accent font-semibold text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  <Icon
                    className={`size-4 sm:size-[18px] shrink-0 ${
                      item.isGradient
                        ? "text-[#6e3ff3]"
                        : isActive
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      item.isGradient
                        ? "bg-clip-text text-transparent bg-linear-to-r from-[#6e3ff3] to-[#df3674] font-semibold"
                        : ""
                    }`}
                  >
                    {item.title}
                  </span>
                  {isActive && (
                    <ChevronRight className="ml-auto size-3.5 text-muted-foreground opacity-70" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Collapsible Folders / Batch List */}
          <Collapsible open={foldersOpen} onOpenChange={setFoldersOpen} className="pt-2">
            <div className="flex items-center justify-between px-1 text-[10px] sm:text-[11px] font-semibold tracking-wider text-muted-foreground">
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                  <ChevronDown
                    className={`size-3 transition-transform ${
                      foldersOpen ? "" : "-rotate-90"
                    }`}
                  />
                  BATCH PRODUKSI
                </div>
              </CollapsibleTrigger>
              <MoreHorizontal className="size-3.5 cursor-pointer hover:text-foreground transition-colors" />
            </div>

            <CollapsibleContent className="mt-2 space-y-1">
              {folders.map((folder) => (
                <Link
                  key={folder.name}
                  to={folder.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 h-8 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                >
                  <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {folder.hasNotification && (
                    <div className="size-1.5 rounded-full bg-[#6e3ff3] shrink-0" />
                  )}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 sm:p-4 lg:p-5 border-t border-border space-y-2">
          <div className="space-y-0.5">
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/admin/activity-logs">
                <HelpCircle className="size-4 mr-2" />
                <span>Pusat Bantuan & Log</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link to="/admin/settings">
                <Settings className="size-4 mr-2" />
                <span>Pengaturan Sistem</span>
              </Link>
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full h-8 text-xs border-border justify-center gap-1.5"
            asChild
          >
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <Globe className="size-3.5" />
              <span>ouruniform.id</span>
            </Link>
          </Button>

          {/* User Profile Pill & Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors border border-border/70 mt-1">
                <Avatar className="size-7 sm:size-8 border">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
                      user?.name || "LN"
                    )}`}
                  />
                  <AvatarFallback className="text-xs">{initials || "AD"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.email || "admin@ouruniform.id"}
                  </p>
                </div>
                <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                <UserCircle className="size-4 mr-2" />
                Profil Pengguna
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/financial-reports")}>
                <CreditCard className="size-4 mr-2" />
                Laporan & Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                <Settings className="size-4 mr-2" />
                Pengaturan Akun
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="size-4 mr-2" />
                Keluar (Log out)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[270px] flex flex-col min-h-screen">
        {/* Dashboard Header - Square UI Leads Architecture */}
        <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-3.5 border-b border-border bg-card/95 backdrop-blur-xs sticky top-0 z-30 w-full">
          {/* Mobile Sidebar Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden -ml-1 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka navigasi"
          >
            <Menu className="size-5" />
          </Button>

          {/* Current Page Identity */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {activeMenu && (
              <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-foreground shrink-0 hidden sm:flex">
                <activeMenu.icon className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-sm sm:text-base leading-tight truncate">
                {activeMenu?.title || "Dashboard"}
              </h2>
              <p className="text-[11px] text-muted-foreground hidden md:block leading-tight">
                Pusat Kontrol Operasional & Produksi
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Search */}
            <div className="relative hidden md:block w-48 lg:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari order, invoice... ⌘K"
                className="h-8 w-full rounded-lg border border-border bg-background px-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
                onClick={() => navigate("/admin/orders")}
                readOnly
              />
            </div>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8 sm:size-9 relative">
                  <Bell className="size-4 text-muted-foreground" />
                  <span className="absolute top-1.5 right-1.5 size-2 bg-blue-500 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-xs">Pemberitahuan</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    2 baru
                  </span>
                </div>
                <div className="divide-y divide-border text-xs">
                  <DropdownMenuItem className="p-3 cursor-pointer items-start gap-2.5">
                    <span className="size-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Order Baru Diterima</p>
                      <p className="text-muted-foreground text-[11px]">
                        Order #INV-2026-0098 dari PT Nusantara Kreatif telah masuk.
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        5 menit lalu
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-3 cursor-pointer items-start gap-2.5 opacity-70">
                    <span className="size-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Produksi Selesai</p>
                      <p className="text-muted-foreground text-[11px]">
                        Order 420 pcs Kemeja Drill telah siap dikirim ke customer.
                      </p>
                      <span className="text-[10px] text-muted-foreground mt-1 block">
                        1 jam lalu
                      </span>
                    </div>
                  </DropdownMenuItem>
                </div>
                <div className="p-2 border-t border-border text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground w-full"
                    onClick={() => navigate("/admin/activity-logs")}
                  >
                    Lihat semua aktivitas
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messages Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8 sm:size-9">
                  <MessageSquare className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2">
                <DropdownMenuLabel className="text-xs">Pesan WhatsApp & Pelanggan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/admin/customers")}
                  className="text-xs cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">Yusuf Hidayat</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      "Apakah bordir logo depan sudah selesai?"
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle (Light/Dark Switch) */}
            <ThemeToggle />

            {/* User Avatar Pill */}
            <div
              className="flex items-center gap-2 pl-1 cursor-pointer"
              onClick={() => navigate("/admin/settings")}
            >
              <Avatar className="size-8 border">
                <AvatarImage
                  src={`https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
                    user?.name || "LN"
                  )}`}
                />
                <AvatarFallback className="text-xs">{initials || "AD"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main
          className={
            location.pathname.startsWith("/admin/ai-assistant")
              ? "flex-1 w-full bg-background overflow-hidden flex flex-col p-0"
              : "flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full bg-background overflow-x-hidden"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
