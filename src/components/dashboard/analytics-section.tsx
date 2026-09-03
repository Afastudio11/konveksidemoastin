import { useState, useMemo } from "react";
import {
  Package,
  Layers,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

interface ProductSale {
  productName: string;
  totalQuantity: number;
}

interface ProductCategorySale {
  productCategory: string;
  totalQuantity: number;
  orderCount: number;
}

interface ColorSale {
  color: string;
  totalQuantity: number;
}

interface AnalyticsSectionProps {
  productSales?: ProductSale[];
  productCategorySales?: ProductCategorySale[];
  colorSales?: ColorSale[];
  isLoading?: boolean;
}

const COLOR_MAP: Record<string, { bg: string; border: string }> = {
  Merah: { bg: "#ef4444", border: "#dc2626" },
  Navy: { bg: "#1e3a8a", border: "#172554" },
  Hitam: { bg: "#18181b", border: "#09090b" },
  Putih: { bg: "#f8fafc", border: "#cbd5e1" },
  "Abu-abu": { bg: "#94a3b8", border: "#64748b" },
  Biru: { bg: "#3b82f6", border: "#2563eb" },
  Hijau: { bg: "#22c55e", border: "#16a34a" },
  Kuning: { bg: "#eab308", border: "#ca8a04" },
  Orange: { bg: "#f97316", border: "#ea580c" },
  Maroon: { bg: "#881337", border: "#4c0519" },
};

const CATEGORY_COLORS = ["#6e3ff3", "#aa8ef9", "#8b5cf6", "#c4b5fd"];

export function AnalyticsSection({
  productSales = [],
  productCategorySales = [],
  colorSales = [],
  isLoading = false,
}: AnalyticsSectionProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Total calculations
  const totalProductVolume = useMemo(
    () => productSales.reduce((sum, p) => sum + p.totalQuantity, 0) || 1,
    [productSales]
  );

  const totalCategoryVolume = useMemo(
    () => productCategorySales.reduce((sum, c) => sum + c.totalQuantity, 0) || 1,
    [productCategorySales]
  );

  const totalColorVolume = useMemo(
    () => colorSales.reduce((sum, c) => sum + c.totalQuantity, 0) || 1,
    [colorSales]
  );

  // Category Pie Data
  const pieData = useMemo(() => {
    return productCategorySales.map((cat, i) => {
      const label =
        cat.productCategory === "konveksi"
          ? "Konveksi & Apparel"
          : cat.productCategory === "percetakan"
          ? "Percetakan & Merchandise"
          : cat.productCategory;

      return {
        name: label,
        value: cat.totalQuantity,
        orderCount: cat.orderCount,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        percent: ((cat.totalQuantity / totalCategoryVolume) * 100).toFixed(1),
      };
    });
  }, [productCategorySales, totalCategoryVolume]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full items-stretch">
      {/* 1. PRODUK TERLARIS */}
      <div className="bg-card text-card-foreground rounded-xl border shadow-xs flex flex-col justify-between overflow-hidden">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0">
                <Package className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <h4 className="font-semibold text-sm leading-tight">Produk Terlaris</h4>
                <p className="text-[11px] text-muted-foreground">Berdasarkan kuantitas produksi</p>
              </div>
            </div>
            <span className="text-[11px] font-medium bg-accent px-2 py-0.5 rounded-full text-muted-foreground">
              Top 5
            </span>
          </div>

          {/* List Content */}
          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-[#6e3ff3]" />
              </div>
            ) : !productSales.length ? (
              <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
                Belum ada data produk
              </div>
            ) : (
              <div className="space-y-2.5">
                {productSales.slice(0, 5).map((product, idx) => {
                  const share = ((product.totalQuantity / totalProductVolume) * 100).toFixed(1);
                  const isTop1 = idx === 0;

                  return (
                    <div
                      key={product.productName}
                      className="group relative flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted/30 transition-all"
                    >
                      {/* Sub-background progress fill */}
                      <div
                        className="absolute inset-y-0 left-0 bg-[#6e3ff3]/6 dark:bg-[#6e3ff3]/12 rounded-lg pointer-events-none transition-all duration-300"
                        style={{ width: `${share}%` }}
                      />

                      <div className="relative flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {product.productName}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {share}% pangsa
                            </span>
                            <span>•</span>
                            <span>Konveksi</span>
                          </p>
                        </div>
                      </div>

                      <div className="relative text-right shrink-0">
                        <p className="text-xs font-bold text-foreground">
                          {product.totalQuantity.toLocaleString("id-ID")}{" "}
                          <span className="text-[10px] font-normal text-muted-foreground">pcs</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Total volume terlaris</span>
          <span className="font-semibold text-foreground">
            {totalProductVolume.toLocaleString("id-ID")} pcs
          </span>
        </div>
      </div>

      {/* 2. KATEGORI TERLARIS (Donut Chart + Legend) */}
      <div className="bg-card text-card-foreground rounded-xl border shadow-xs flex flex-col justify-between overflow-hidden">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0">
                <Layers className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <h4 className="font-semibold text-sm leading-tight">Distribusi Kategori</h4>
                <p className="text-[11px] text-muted-foreground">Proporsi unit & pesanan selesai</p>
              </div>
            </div>
            <span className="text-[11px] font-medium bg-accent px-2 py-0.5 rounded-full text-muted-foreground">
              {productCategorySales.length} Kategori
            </span>
          </div>

          {/* Donut Chart & Legend */}
          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !pieData.length ? (
              <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
                Belum ada data kategori
              </div>
            ) : (
              <div className="space-y-4">
                {/* Donut graphic */}
                <div className="relative h-36 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip
                        formatter={(val: number) => [`${val.toLocaleString("id-ID")} pcs`, "Volume"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--popover))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "0.5rem",
                          fontSize: "12px",
                        }}
                      />
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-lg font-bold text-foreground leading-none">
                      {totalCategoryVolume > 1000
                        ? `${(totalCategoryVolume / 1000).toFixed(0)}k`
                        : totalCategoryVolume}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Total pcs</span>
                  </div>
                </div>

                {/* Detailed Legend items */}
                <div className="space-y-2">
                  {pieData.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {cat.orderCount} order selesai
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-foreground">
                          {cat.value.toLocaleString("id-ID")}{" "}
                          <span className="text-[10px] text-muted-foreground font-normal">pcs</span>
                        </p>
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          {cat.percent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Total order diselesaikan</span>
          <span className="font-semibold text-foreground">
            {productCategorySales.reduce((acc, c) => acc + c.orderCount, 0)} order
          </span>
        </div>
      </div>

      {/* 3. WARNA KAIN TERLARIS (Proportional Segmented Bar + Color Grid) */}
      <div className="bg-card text-card-foreground rounded-xl border shadow-xs flex flex-col justify-between overflow-hidden">
        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0">
                <Tag className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <h4 className="font-semibold text-sm leading-tight">Warna Kain Terlaris</h4>
                <p className="text-[11px] text-muted-foreground">Distribusi kain masuk produksi</p>
              </div>
            </div>
            <span className="text-[11px] font-medium bg-accent px-2 py-0.5 rounded-full text-muted-foreground">
              {colorSales.length} Varian
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {isLoading ? (
              <div className="flex h-52 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !colorSales.length ? (
              <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
                Belum ada data warna
              </div>
            ) : (
              <>
                {/* GitHub-style / Apple-style Multi-Segmented Proportional Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Proporsi Pemakaian Kain</span>
                    <span className="font-medium text-foreground">100%</span>
                  </div>
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted/60 p-0.5 gap-0.5 border border-border/50">
                    {colorSales.slice(0, 6).map((c) => {
                      const share = (c.totalQuantity / totalColorVolume) * 100;
                      const cfg = COLOR_MAP[c.color] || { bg: "#94a3b8", border: "#64748b" };
                      const isHovered = hoveredColor === c.color;

                      return (
                        <div
                          key={c.color}
                          className={`h-full rounded-xs transition-all duration-200 cursor-pointer ${
                            isHovered ? "ring-2 ring-foreground scale-y-110 z-10" : ""
                          }`}
                          style={{
                            width: `${Math.max(share, 3)}%`,
                            backgroundColor: cfg.bg,
                          }}
                          onMouseEnter={() => setHoveredColor(c.color)}
                          onMouseLeave={() => setHoveredColor(null)}
                          title={`${c.color}: ${c.totalQuantity.toLocaleString("id-ID")} pcs (${share.toFixed(1)}%)`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Fabric Swatch Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {colorSales.slice(0, 6).map((c) => {
                    const share = ((c.totalQuantity / totalColorVolume) * 100).toFixed(1);
                    const cfg = COLOR_MAP[c.color] || { bg: "#94a3b8", border: "#64748b" };
                    const isHovered = hoveredColor === c.color;

                    return (
                      <div
                        key={c.color}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                          isHovered
                            ? "border-foreground/40 bg-accent shadow-2xs"
                            : "border-border/60 bg-muted/20 hover:bg-muted/40"
                        }`}
                        onMouseEnter={() => setHoveredColor(c.color)}
                        onMouseLeave={() => setHoveredColor(null)}
                      >
                        {/* Realistic Fabric Swatch */}
                        <div
                          className="size-6 rounded-md shrink-0 border shadow-2xs flex items-center justify-center"
                          style={{
                            backgroundColor: cfg.bg,
                            borderColor: cfg.border,
                          }}
                        >
                          {c.color === "Putih" && (
                            <span className="size-1.5 rounded-full bg-slate-300" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {c.color}
                            </p>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {share}%
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">
                            {c.totalQuantity.toLocaleString("id-ID")} pcs
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-muted/20 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Kain terpopuler</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <span
              className="size-2 rounded-full inline-block"
              style={{ backgroundColor: COLOR_MAP[colorSales[0]?.color]?.bg || "#ef4444" }}
            />
            {colorSales[0]?.color || "Merah"} ({((colorSales[0]?.totalQuantity || 0) / totalColorVolume * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
