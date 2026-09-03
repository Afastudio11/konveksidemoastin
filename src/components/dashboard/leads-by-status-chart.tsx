import { useState, useMemo } from "react";
import { Tag, MoreHorizontal, ArrowDown, ArrowUp, ArrowDownAZ } from "lucide-react";
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

type SortBy = "value_desc" | "value_asc" | "name_asc" | "name_desc";

interface StatusItem {
  name: string;
  key: string;
  value: number;
  color: string;
}

interface LeadsByStatusChartProps {
  statusCounts?: { status: string; count: number }[];
  isLoading?: boolean;
}

const defaultPipeline: { key: string; name: string; color: string; fallback: number }[] = [
  { key: "design", name: "Design", color: "#375dfb", fallback: 8 },
  { key: "beli_bahan", name: "Beli Bahan", color: "#6985fc", fallback: 5 },
  { key: "potong_printing", name: "Potong / Cetak", color: "#9baefd", fallback: 7 },
  { key: "jahit", name: "Jahit", color: "#7f69fc", fallback: 9 },
  { key: "bordir_sablon", name: "Bordir / Sablon", color: "#aa9bfd", fallback: 4 },
  { key: "qc", name: "Quality Control", color: "#b069fc", fallback: 6 },
  { key: "packing", name: "Packing", color: "#3b82f6", fallback: 3 },
  { key: "selesai", name: "Selesai", color: "#10b981", fallback: 42 },
  { key: "dikirim", name: "Dikirim", color: "#059669", fallback: 44 },
];

export function LeadsByStatusChart({ statusCounts, isLoading = false }: LeadsByStatusChartProps) {
  const [sortBy, setSortBy] = useState<SortBy>("value_desc");
  const [visibleStatuses, setVisibleStatuses] = useState<Record<string, boolean>>(() =>
    defaultPipeline.reduce((acc, curr) => ({ ...acc, [curr.name]: true }), {})
  );

  const rawData: StatusItem[] = useMemo(() => {
    const countMap = new Map<string, number>();
    (statusCounts || []).forEach((item) => {
      countMap.set(item.status, Number(item.count));
    });

    return defaultPipeline.map((p) => ({
      name: p.name,
      key: p.key,
      value: countMap.has(p.key) ? countMap.get(p.key)! : p.fallback,
      color: p.color,
    }));
  }, [statusCounts]);

  const filteredAndSortedData = useMemo(() => {
    let data = rawData.filter((item) => visibleStatuses[item.name]);

    switch (sortBy) {
      case "value_desc":
        data = [...data].sort((a, b) => b.value - a.value);
        break;
      case "value_asc":
        data = [...data].sort((a, b) => a.value - b.value);
        break;
      case "name_asc":
        data = [...data].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        data = [...data].sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return data;
  }, [rawData, sortBy, visibleStatuses]);

  const maxValue = useMemo(() => {
    return Math.max(...filteredAndSortedData.map((d) => d.value), 1);
  }, [filteredAndSortedData]);

  const visibleTotal = useMemo(() => {
    return filteredAndSortedData.reduce((sum, item) => sum + item.value, 0);
  }, [filteredAndSortedData]);

  const toggleStatus = (name: string) => {
    setVisibleStatuses((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const resetToDefault = () => {
    setSortBy("value_desc");
    setVisibleStatuses(defaultPipeline.reduce((acc, curr) => ({ ...acc, [curr.name]: true }), {}));
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border w-full xl:w-[340px] shrink-0 shadow-xs overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex flex-row items-center justify-between py-4 sm:py-5 px-4 sm:px-6 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0">
              <Tag className="size-4 text-muted-foreground" />
            </Button>
            <div>
              <h3 className="font-semibold text-sm sm:text-base leading-tight">Alur Produksi</h3>
              <p className="text-[11px] text-muted-foreground">Distribusi status pengerjaan</p>
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
                <DropdownMenuSubTrigger>
                  <ArrowDownAZ className="size-4 mr-2" />
                  Urutkan Berdasarkan
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setSortBy("value_desc")}>
                    <ArrowDown className="size-4 mr-2" />
                    Nilai Tertinggi {sortBy === "value_desc" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value_asc")}>
                    <ArrowUp className="size-4 mr-2" />
                    Nilai Terendah {sortBy === "value_asc" && "✓"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name_asc")}>
                    <ArrowDownAZ className="size-4 mr-2" />
                    Nama (A - Z) {sortBy === "name_asc" && "✓"}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Tag className="size-4 mr-2" />
                  Pilih Tahapan
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                  {rawData.map((item) => (
                    <DropdownMenuCheckboxItem
                      key={item.name}
                      checked={visibleStatuses[item.name]}
                      onCheckedChange={() => toggleStatus(item.name)}
                    >
                      <span
                        className="size-2 rounded-full mr-2 shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={resetToDefault}>
                Reset ke Standar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-[28px] font-semibold tracking-tight">
              {isLoading ? "..." : visibleTotal.toLocaleString("id-ID")}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                +18% ({visibleTotal} order)
              </span>
              <span>aktif</span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAndSortedData.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5 sm:gap-3 text-xs">
                <span className="text-muted-foreground w-20 sm:w-24 shrink-0 truncate font-medium">
                  {item.name}
                </span>
                <div className="flex-1 h-[14px] bg-muted rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.max((item.value / maxValue) * 100, 3)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="font-semibold w-8 sm:w-10 text-right shrink-0 text-foreground">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
