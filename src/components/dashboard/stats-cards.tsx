import { LucideIcon, CircleDollarSign, Activity, Banknote, BadgeCheck } from "lucide-react";

interface StatItem {
  title: string;
  value: string | number;
  change?: number | string;
  changeValue?: string;
  helper?: string;
  icon: LucideIcon;
  isPositive?: boolean;
}

interface StatsCardsProps {
  totalOmzet: number;
  activeOrders: number;
  monthlyRevenue: number;
  completedOrders: number;
  totalOrders: number;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export function StatsCards({
  totalOmzet,
  activeOrders,
  monthlyRevenue,
  completedOrders,
  totalOrders,
  isLoading = false,
}: StatsCardsProps) {
  const completionRate = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const stats: StatItem[] = [
    {
      title: "Total Omzet",
      value: isLoading ? "..." : formatCurrency(totalOmzet),
      change: 14.8,
      changeValue: "+12.4%",
      helper: "vs Bulan Lalu",
      icon: CircleDollarSign,
      isPositive: true,
    },
    {
      title: "Order Aktif",
      value: isLoading ? "..." : activeOrders.toLocaleString("id-ID"),
      change: 8.2,
      changeValue: "31 antrean",
      helper: "Perlu ditindaklanjuti",
      icon: Activity,
      isPositive: true,
    },
    {
      title: "Revenue Lunas",
      value: isLoading ? "..." : formatCurrency(monthlyRevenue),
      change: 22.4,
      changeValue: "Pembayaran 100%",
      helper: "Telah diterima",
      icon: Banknote,
      isPositive: true,
    },
    {
      title: "Produksi Selesai",
      value: isLoading ? "..." : `${completedOrders.toLocaleString("id-ID")} Order`,
      change: completionRate,
      changeValue: `${completionRate}% tuntas`,
      helper: "dari total order",
      icon: BadgeCheck,
      isPositive: true,
    },
  ];

  return (
    <div className="bg-card text-card-foreground rounded-xl border w-full overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y divide-x-0 lg:divide-x sm:divide-y-0 divide-border">
        {stats.map((stat, index) => (
          <div key={index} className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <stat.icon className="size-4 sm:size-[18px] text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">{stat.title}</span>
            </div>
            <p className="text-2xl sm:text-[28px] font-semibold tracking-tight text-foreground truncate">
              {stat.value}
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {typeof stat.change === "number" ? `+${stat.change}%` : stat.change}
                {stat.changeValue ? ` (${stat.changeValue})` : ""}
              </span>
              <span className="size-1 rounded-full bg-muted-foreground/60" />
              <span className="text-muted-foreground text-[11px] sm:text-xs truncate">
                {stat.helper}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
