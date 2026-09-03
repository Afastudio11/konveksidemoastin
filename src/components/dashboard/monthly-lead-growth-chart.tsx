import { useState } from "react";
import { useTheme } from "next-themes";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import {
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

type ChartType = "line" | "area" | "bar";
type Period = "3m" | "6m" | "12m";

interface MonthlyLeadGrowthChartProps {
  monthlyRevenue?: number;
  totalOrders?: number;
}

const mockGrowthData = [
  { month: "Jan", revenue: 185, orders: 18, change: 12 },
  { month: "Feb", revenue: 210, orders: 22, change: 14 },
  { month: "Mar", revenue: 290, orders: 28, change: 38 },
  { month: "Apr", revenue: 340, orders: 32, change: 17 },
  { month: "Mei", revenue: 310, orders: 29, change: -8 },
  { month: "Jun", revenue: 420, orders: 39, change: 35 },
  { month: "Jul", revenue: 490, orders: 45, change: 16 },
  { month: "Agu", revenue: 580, orders: 54, change: 18 },
  { month: "Sep", revenue: 640, orders: 61, change: 10 },
  { month: "Okt", revenue: 710, orders: 67, change: 11 },
  { month: "Nov", revenue: 790, orders: 75, change: 12 },
  { month: "Des", revenue: 923, orders: 88, change: 16 },
];

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-md space-y-1 text-xs">
        <p className="font-semibold text-sm">{label} 2026</p>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Omzet:</span>
          <span className="font-semibold text-foreground">Rp{data.revenue} Juta</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Volume:</span>
          <span className="font-medium text-foreground">{data.orders} Order</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
          <TrendingUp className="size-3" />
          <span>+{data.change}% pertumbuhan</span>
        </div>
      </div>
    );
  }
  return null;
}

export function MonthlyLeadGrowthChart({}: MonthlyLeadGrowthChartProps) {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<ChartType>("area");
  const [period, setPeriod] = useState<Period>("12m");
  const [showGrid, setShowGrid] = useState(true);
  const [smoothCurve, setSmoothCurve] = useState(true);

  const axisColor = theme === "dark" ? "#71717a" : "#a1a1aa";
  const gridColor = theme === "dark" ? "#27272a" : "#e4e4e7";
  const lineColor = "#6e3ff3";

  const getDataForPeriod = () => {
    switch (period) {
      case "3m":
        return mockGrowthData.slice(-3);
      case "6m":
        return mockGrowthData.slice(-6);
      case "12m":
      default:
        return mockGrowthData;
    }
  };

  const data = getDataForPeriod();

  const resetToDefault = () => {
    setChartType("area");
    setPeriod("12m");
    setShowGrid(true);
    setSmoothCurve(true);
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border flex-1 shadow-xs overflow-hidden">
      <div className="flex flex-row items-center justify-between py-4 sm:py-5 px-4 sm:px-6 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0">
            <TrendingUp className="size-4 text-muted-foreground" />
          </Button>
          <div>
            <h3 className="font-semibold text-sm sm:text-base leading-tight">
              Pertumbuhan Omzet & Order
            </h3>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Performa transaksi bulanan skala konveksi
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Tipe Chart</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setChartType("line")}>
                  Line Chart {chartType === "line" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("area")}>
                  Area Chart {chartType === "area" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChartType("bar")}>
                  Bar Chart {chartType === "bar" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Rentang Waktu</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setPeriod("3m")}>
                  3 Bulan Terakhir {period === "3m" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriod("6m")}>
                  6 Bulan Terakhir {period === "6m" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPeriod("12m")}>
                  12 Bulan Terakhir {period === "12m" && "✓"}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showGrid}
              onCheckedChange={setShowGrid}
            >
              Tampilkan Grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={smoothCurve}
              onCheckedChange={setSmoothCurve}
              disabled={chartType === "bar"}
            >
              Kurva Halus (Smooth)
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetToDefault}>
              Reset ke Standar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4 sm:p-6">
        <div className="h-[220px] sm:h-[270px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                  tickFormatter={(val) => `${val}Jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="leadBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6e3ff3" />
                    <stop offset="100%" stopColor="#aa8ef9" />
                  </linearGradient>
                </defs>
                <Bar dataKey="revenue" fill="url(#leadBarGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : chartType === "area" ? (
              <AreaChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                  tickFormatter={(val) => `${val}Jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <defs>
                  <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6e3ff3" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6e3ff3" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type={smoothCurve ? "monotone" : "linear"}
                  dataKey="revenue"
                  stroke={lineColor}
                  strokeWidth={2.5}
                  fill="url(#leadAreaGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />}
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: axisColor }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: axisColor }}
                  tickFormatter={(val) => `${val}Jt`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type={smoothCurve ? "monotone" : "linear"}
                  dataKey="revenue"
                  stroke={lineColor}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, fill: lineColor, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
