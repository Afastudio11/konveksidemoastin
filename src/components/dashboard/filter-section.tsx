import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ChevronDown,
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar as CalendarIcon,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export type DateFilterType = "all" | "today" | "yesterday" | "last_7_days" | "last_30_days" | "this_month" | "custom";

interface FilterSectionProps {
  filterType: DateFilterType;
  onFilterChange: (type: DateFilterType) => void;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (start?: Date, end?: Date) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  isExportingExcel?: boolean;
  isExportingPdf?: boolean;
}

const dateFilterLabels: Record<DateFilterType, string> = {
  all: "Semua Waktu",
  today: "Hari Ini",
  yesterday: "Kemarin",
  last_7_days: "7 Hari Terakhir",
  last_30_days: "30 Hari Terakhir",
  this_month: "Bulan Ini",
  custom: "Rentang Tanggal",
};

export function FilterSection({
  filterType,
  onFilterChange,
  startDate,
  endDate,
  onDateRangeChange,
  onExportExcel,
  onExportPdf,
  isExportingExcel = false,
  isExportingPdf = false,
}: FilterSectionProps) {
  const [customPopoverOpen, setCustomPopoverOpen] = useState(false);

  const getLabel = () => {
    if (filterType === "custom" && startDate && endDate) {
      return `${format(startDate, "dd MMM", { locale: idLocale })} - ${format(endDate, "dd MMM yyyy", { locale: idLocale })}`;
    }
    return dateFilterLabels[filterType] || "Pilih Periode";
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-9 sm:h-10 text-xs sm:text-sm font-medium border-border bg-card">
              <span>{getLabel()}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Pilih Rentang Waktu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(dateFilterLabels) as DateFilterType[]).map((key) => {
              if (key === "custom") return null;
              return (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onFilterChange(key)}
                  className={`text-sm cursor-pointer ${filterType === key ? "bg-accent font-medium text-foreground" : ""}`}
                >
                  {dateFilterLabels[key]}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onFilterChange("custom");
                setCustomPopoverOpen(true);
              }}
              className={`text-sm cursor-pointer ${filterType === "custom" ? "bg-accent font-medium" : ""}`}
            >
              <CalendarIcon className="size-3.5 mr-2" />
              Pilih Tanggal Manual...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {filterType === "custom" && (
          <Popover open={customPopoverOpen} onOpenChange={setCustomPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-dashed">
                <CalendarIcon className="size-3.5 text-muted-foreground" />
                {startDate && endDate ? `${format(startDate, "dd/MM/yy")} - ${format(endDate, "dd/MM/yy")}` : "Atur Kalender"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Pilih Rentang Tanggal</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      onDateRangeChange(undefined, undefined);
                      onFilterChange("all");
                      setCustomPopoverOpen(false);
                    }}
                  >
                    Reset
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Mulai:</p>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => onDateRangeChange(d, endDate && d && d > endDate ? undefined : endDate)}
                      initialFocus
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground mb-1">Sampai:</p>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => onDateRangeChange(startDate, d)}
                      disabled={(d) => !!startDate && d < startDate}
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-foreground text-background hover:bg-foreground/90 text-xs"
                  onClick={() => setCustomPopoverOpen(false)}
                >
                  Terapkan Filter
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {filterType !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              onFilterChange("all");
              onDateRangeChange(undefined, undefined);
            }}
            title="Reset ke Semua Waktu"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 h-9 sm:h-10 text-xs sm:text-sm border-border bg-card">
              <Download className="size-4 text-muted-foreground" />
              <span>Export</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onExportExcel} disabled={isExportingExcel} className="cursor-pointer">
              <FileSpreadsheet className="size-4 mr-2 text-emerald-600" />
              Export ke Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportPdf} disabled={isExportingPdf} className="cursor-pointer">
              <FileText className="size-4 mr-2 text-rose-600" />
              Export ke PDF (.pdf)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button asChild className="gap-2 h-9 sm:h-10 text-xs sm:text-sm bg-foreground text-background hover:bg-foreground/90 font-medium">
          <Link to="/admin/orders/new">
            <Plus className="size-4" />
            <span>Buat Order</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
