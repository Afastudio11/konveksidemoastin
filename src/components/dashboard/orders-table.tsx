import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  ClipboardList,
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface RecentOrder {
  id: string;
  invoiceNumber: string;
  trackingCode: string;
  totalAmount: string | number;
  paymentStatus: string;
  productionStatus: string;
  createdAt: string;
  customer?: { name?: string; phone?: string; email?: string };
}

interface OrdersTableProps {
  orders?: RecentOrder[];
  isLoading?: boolean;
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  waiting_payment: {
    label: "Belum Bayar",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  waiting_dp: {
    label: "Menunggu DP",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  dp_paid: {
    label: "DP Dibayar",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  waiting_pelunasan: {
    label: "Menunggu Pelunasan",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  paid: {
    label: "Lunas",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  expired: {
    label: "Kadaluarsa",
    className: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  },
};

const productionStatusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Menunggu",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  },
  design: {
    label: "Design",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  beli_bahan: {
    label: "Beli Bahan",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  potong_printing: {
    label: "Potong/Printing",
    className: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  },
  jahit: {
    label: "Jahit",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  },
  bordir_sablon: {
    label: "Bordir / Sablon",
    className: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  },
  qc: {
    label: "QC",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  packing: {
    label: "Packing",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  selesai: {
    label: "Selesai",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  dikirim: {
    label: "Dikirim",
    className: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-800",
  },
};

const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

export function OrdersTable({ orders = [], isLoading = false }: OrdersTableProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [productionFilter, setProductionFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchQuery =
        !searchQuery ||
        order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer?.phone || "").includes(searchQuery);

      const matchPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      const matchProduction = productionFilter === "all" || order.productionStatus === productionFilter;

      return matchQuery && matchPayment && matchProduction;
    });
  }, [orders, searchQuery, paymentFilter, productionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const allSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((order) => selectedIds[order.id]);

  const toggleSelectAll = () => {
    if (allSelected) {
      const next = { ...selectedIds };
      paginatedOrders.forEach((o) => delete next[o.id]);
      setSelectedIds(next);
    } else {
      const next = { ...selectedIds };
      paginatedOrders.forEach((o) => (next[o.id] = true));
      setSelectedIds(next);
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow-xs overflow-hidden w-full">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-b from-[#6e3ff3] to-[#aa8ef9] text-white">
            <ClipboardList className="size-3.5" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base">Daftar Pesanan Terbaru</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
            {filteredOrders.length}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari invoice, pelanggan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 pl-8 text-xs bg-card"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1 text-xs border-border bg-card">
                <Filter className="size-3.5 text-muted-foreground" />
                <span>Status</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs font-medium">Status Pembayaran</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPaymentFilter("all")} className={paymentFilter === "all" ? "bg-accent font-medium" : ""}>
                Semua Pembayaran
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter("paid")} className={paymentFilter === "paid" ? "bg-accent font-medium" : ""}>
                Lunas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter("waiting_payment")} className={paymentFilter === "waiting_payment" ? "bg-accent font-medium" : ""}>
                Belum Bayar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPaymentFilter("dp_paid")} className={paymentFilter === "dp_paid" ? "bg-accent font-medium" : ""}>
                DP Dibayar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium">Status Produksi</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setProductionFilter("all")} className={productionFilter === "all" ? "bg-accent font-medium" : ""}>
                Semua Produksi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProductionFilter("design")} className={productionFilter === "design" ? "bg-accent font-medium" : ""}>
                Design
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProductionFilter("jahit")} className={productionFilter === "jahit" ? "bg-accent font-medium" : ""}>
                Jahit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setProductionFilter("selesai")} className={productionFilter === "selesai" ? "bg-accent font-medium" : ""}>
                Selesai
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/70">
              <TableHead className="w-10 pl-4 sm:pl-5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua baris"
                />
              </TableHead>
              <TableHead className="text-xs font-medium">Invoice & Tracking</TableHead>
              <TableHead className="text-xs font-medium">Pelanggan</TableHead>
              <TableHead className="text-xs font-medium">Total Nilai</TableHead>
              <TableHead className="text-xs font-medium">Pembayaran</TableHead>
              <TableHead className="text-xs font-medium">Status Produksi</TableHead>
              <TableHead className="text-xs font-medium">Tanggal</TableHead>
              <TableHead className="w-12 pr-4 sm:pr-5 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-36 text-center">
                  <Loader2 className="size-6 animate-spin mx-auto text-[#6e3ff3]" />
                </TableCell>
              </TableRow>
            ) : !paginatedOrders.length ? (
              <TableRow>
                <TableCell colSpan={8} className="h-36 text-center text-xs text-muted-foreground">
                  Tidak ada order yang cocok dengan pencarian atau filter.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => {
                const payConfig =
                  paymentStatusConfig[order.paymentStatus] || {
                    label: order.paymentStatus,
                    className: "bg-muted text-muted-foreground border-border",
                  };
                const prodConfig =
                  productionStatusConfig[order.productionStatus] || {
                    label: order.productionStatus,
                    className: "bg-muted text-muted-foreground border-border",
                  };
                const dateObj = new Date(order.createdAt);
                const dateFormatted = !Number.isNaN(dateObj.getTime())
                  ? format(dateObj, "dd MMM yyyy", { locale: idLocale })
                  : "-";

                const isSelected = !!selectedIds[order.id];

                return (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/50 ${
                      isSelected ? "bg-accent/40" : ""
                    }`}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <TableCell
                      className="pl-4 sm:pl-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectRow(order.id);
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectRow(order.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-xs sm:text-sm text-foreground">
                        {order.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {order.trackingCode}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 sm:size-8 border">
                          <AvatarImage
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                              order.customer?.name || "AD"
                            )}`}
                          />
                          <AvatarFallback className="text-[10px]">
                            {(order.customer?.name || "AD").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[140px]">
                            {order.customer?.name || "Pelanggan"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {order.customer?.phone || "-"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-semibold text-xs sm:text-sm text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 font-medium ${payConfig.className}`}
                      >
                        {payConfig.label}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 font-medium ${prodConfig.className}`}
                      >
                        {prodConfig.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {dateFormatted}
                    </TableCell>

                    <TableCell
                      className="pr-4 sm:pr-5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}`)}>
                            <Eye className="size-3.5 mr-2 text-muted-foreground" />
                            Detail Order
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/track/${order.trackingCode}`, "_blank")}
                          >
                            <ExternalLink className="size-3.5 mr-2 text-muted-foreground" />
                            Lacak Pesanan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin/orders/${order.id}`)}>
                            <FileText className="size-3.5 mr-2 text-muted-foreground" />
                            Cetak Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Tampilkan per halaman:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(val) => {
              setItemsPerPage(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-7 w-16 text-xs bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="hidden sm:inline">
            Menampilkan {filteredOrders.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
            {Math.min(currentPage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} order
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="px-2 text-xs font-medium text-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
