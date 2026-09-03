import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Plus,
  Calendar as CalendarIcon,
  X,
  Search,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getProductionBadge = (status: string) => {
  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', label: 'Menunggu' },
    design: { bg: 'bg-violet-100 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', label: 'Design' },
    beli_bahan: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'Beli Bahan' },
    potong_printing: { bg: 'bg-indigo-100 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', label: 'Potong/Print' },
    jahit: { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', label: 'Jahit' },
    bordir_sablon: { bg: 'bg-pink-100 dark:bg-pink-950/40', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800', label: 'Bordir/Sablon' },
    qc: { bg: 'bg-cyan-100 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', label: 'QC' },
    packing: { bg: 'bg-teal-100 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', label: 'Packing' },
    selesai: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'Selesai' },
    dikirim: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800', label: 'Dikirim' },
  };

  const cfg = configs[status] || { bg: 'bg-muted', text: 'text-foreground', border: 'border-border', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const getPaymentBadge = (status: string) => {
  const configs: Record<string, { bg: string; text: string; border: string; label: string }> = {
    waiting_payment: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', label: 'Belum Bayar' },
    waiting_dp: { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', label: 'Menunggu DP' },
    dp_paid: { bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'DP Dibayar' },
    waiting_pelunasan: { bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', label: 'Menunggu Pelunasan' },
    paid: { bg: 'bg-emerald-100 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'Lunas' },
    expired: { bg: 'bg-rose-100 dark:bg-rose-950/40', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'Kadaluarsa' },
    cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', label: 'Dibatalkan' },
  };

  const cfg = configs[status] || { bg: 'bg-muted', text: 'text-foreground', border: 'border-border', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const months = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

export default function AdminOrders() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [productionStatus, setProductionStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const params: Record<string, string> = { page: page.toString(), limit: '10' };
  if (paymentStatus && paymentStatus !== 'all') params.paymentStatus = paymentStatus;
  if (productionStatus && productionStatus !== 'all') params.productionStatus = productionStatus;

  if (filterType === 'month') {
    const monthNum = parseInt(selectedMonth);
    const yearNum = parseInt(selectedYear);
    const start = new Date(yearNum, monthNum - 1, 1);
    const end = new Date(yearNum, monthNum, 0);
    params.startDate = format(start, 'yyyy-MM-dd');
    params.endDate = format(end, 'yyyy-MM-dd');
  } else if (filterType === 'date' && startDate && endDate) {
    params.startDate = format(startDate, 'yyyy-MM-dd');
    params.endDate = format(endDate, 'yyyy-MM-dd');
  }

  const { data, isLoading } = useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.orders.list(token!, params),
    enabled: !!token,
  });

  const clearDateFilters = () => {
    setFilterType('all');
    setSelectedMonth(String(new Date().getMonth() + 1));
    setSelectedYear(String(currentYear));
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success(`Disalin: ${text}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Client-side search filter for invoice/tracking/customer
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    if (!search.trim()) return data.orders;
    const q = search.toLowerCase();
    return data.orders.filter((order: any) =>
      order.invoiceNumber?.toLowerCase().includes(q) ||
      order.trackingCode?.toLowerCase().includes(q) ||
      order.customer?.name?.toLowerCase().includes(q) ||
      order.customer?.phone?.toLowerCase().includes(q)
    );
  }, [data?.orders, search]);

  // Derive metric stats from orders
  const stats = useMemo(() => {
    const total = data?.pagination?.total || data?.orders?.length || 0;
    const inProduction = data?.orders?.filter((o: any) =>
      !['selesai', 'dikirim', 'pending'].includes(o.productionStatus)
    ).length || 0;
    const waitingPayment = data?.orders?.filter((o: any) =>
      ['waiting_payment', 'waiting_dp', 'waiting_pelunasan'].includes(o.paymentStatus)
    ).length || 0;
    const completed = data?.orders?.filter((o: any) =>
      ['selesai', 'dikirim'].includes(o.productionStatus)
    ).length || 0;
    return { total, inProduction, waitingPayment, completed };
  }, [data]);

  const hasActiveFilters = paymentStatus !== 'all' || productionStatus !== 'all' || filterType !== 'all' || !!search;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 pb-6 w-full">
        {/* Header - Square UI Leads */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Daftar Pesanan
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Kelola seluruh order konveksi, tracking status pengerjaan, dan status pelunasan invoice.
            </p>
          </div>
          <Link to="/admin/orders/new">
            <Button className="h-9 sm:h-10 text-xs sm:text-sm bg-foreground text-background hover:bg-foreground/90 font-medium shadow-2xs gap-2">
              <Plus className="w-4 h-4" />
              Buat Order Baru
            </Button>
          </Link>
        </div>

        {/* 4-Stat Metric Cards - Square UI Divider Layout */}
        <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Package className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Pesanan</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.total}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Clock className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Sedang Produksi</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.inProduction}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <AlertCircle className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Menunggu Pembayaran</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.waitingPayment}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <CheckCircle2 className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Selesai & Dikirim</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.completed}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter & Orders Table Card */}
        <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
          {/* Unified Filter Toolbar */}
          <div className="p-3.5 sm:p-4 border-b border-border/70 space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor invoice, tracking, atau pelanggan..."
                  className="pl-9 h-9 text-xs sm:text-sm rounded-lg border-border bg-muted/20 focus:bg-background transition-colors"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="h-9 w-[150px] text-xs rounded-lg border-border">
                    <SelectValue placeholder="Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    <SelectItem value="waiting_dp">Menunggu DP</SelectItem>
                    <SelectItem value="dp_paid">DP Dibayar</SelectItem>
                    <SelectItem value="waiting_pelunasan">Menunggu Pelunasan</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="expired">Kadaluarsa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={productionStatus} onValueChange={setProductionStatus}>
                  <SelectTrigger className="h-9 w-[140px] text-xs rounded-lg border-border">
                    <SelectValue placeholder="Status Produksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="beli_bahan">Beli Bahan</SelectItem>
                    <SelectItem value="potong_printing">Potong/Print</SelectItem>
                    <SelectItem value="jahit">Jahit</SelectItem>
                    <SelectItem value="bordir_sablon">Bordir/Sablon</SelectItem>
                    <SelectItem value="qc">QC</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                    <SelectItem value="dikirim">Dikirim</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter Type */}
                <Select value={filterType} onValueChange={(val: 'all' | 'month' | 'date') => setFilterType(val)}>
                  <SelectTrigger className="h-9 w-[130px] text-xs rounded-lg border-border">
                    <SelectValue placeholder="Filter Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="month">Per Bulan</SelectItem>
                    <SelectItem value="date">Rentang Tanggal</SelectItem>
                  </SelectContent>
                </Select>

                {/* Month Picker */}
                {filterType === 'month' && (
                  <div className="flex items-center gap-1.5">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="h-9 w-[110px] text-xs rounded-lg border-border">
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-9 w-[85px] text-xs rounded-lg border-border">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Range Picker */}
                {filterType === 'date' && (
                  <div className="flex items-center gap-1.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg border-border font-normal">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          {startDate ? format(startDate, 'dd/MM/yy') : 'Dari'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <span className="text-xs text-muted-foreground">-</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 text-xs rounded-lg border-border font-normal">
                          <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          {endDate ? format(endDate, 'dd/MM/yy') : 'Sampai'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Reset button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPaymentStatus('all');
                      setProductionStatus('all');
                      setSearch('');
                      clearDateFilters();
                    }}
                    className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table Content */}
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Memuat daftar pesanan...</span>
              </div>
            ) : !filteredOrders.length ? (
              <div className="text-center py-16 text-xs text-muted-foreground">
                <Package className="size-8 mx-auto mb-2 opacity-40" />
                <p>Tidak ada pesanan yang sesuai dengan filter.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-4">
                          Invoice / Tracking
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Pelanggan
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Total Nilai
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Pembayaran
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Status Produksi
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Tanggal Order
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order: any) => {
                        const customerInitials = (order.customer?.name || 'C')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n: string) => n[0]?.toUpperCase())
                          .join('');

                        return (
                          <TableRow
                            key={order.id}
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="hover:bg-muted/30 border-b border-border/50 cursor-pointer transition-colors group"
                          >
                            {/* Invoice & Tracking */}
                            <TableCell className="py-3 pl-4">
                              <div className="space-y-1">
                                <div className="font-semibold text-xs sm:text-sm text-foreground font-mono group-hover:underline">
                                  {order.invoiceNumber}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                                    {order.trackingCode}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopy(e, order.trackingCode)}
                                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="Salin kode tracking"
                                  >
                                    {copiedCode === order.trackingCode ? (
                                      <Check className="size-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </TableCell>

                            {/* Pelanggan */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-muted border border-border/70 flex items-center justify-center font-bold text-xs text-foreground shrink-0 shadow-2xs">
                                  {customerInitials}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs sm:text-sm text-foreground truncate block">
                                    {order.customer?.name || 'Pelanggan'}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground block truncate">
                                    {order.customer?.phone || '—'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Total Nilai */}
                            <TableCell className="py-3">
                              <div>
                                <span className="font-semibold text-xs sm:text-sm text-foreground block">
                                  {formatCurrency(Number(order.totalAmount))}
                                </span>
                                {Number(order.remainingAmount) > 0 && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                                    Sisa: {formatCurrency(Number(order.remainingAmount))}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* Pembayaran */}
                            <TableCell className="py-3">
                              {getPaymentBadge(order.paymentStatus)}
                            </TableCell>

                            {/* Status Produksi */}
                            <TableCell className="py-3">
                              {getProductionBadge(order.productionStatus)}
                            </TableCell>

                            {/* Tanggal */}
                            <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                            </TableCell>

                            {/* Aksi */}
                            <TableCell className="py-3 text-right pr-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/orders/${order.id}`);
                                }}
                                className="h-7 px-2.5 text-xs rounded-lg font-medium border-border gap-1 hover:bg-muted"
                              >
                                <span>Detail</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.pagination && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/70 text-xs">
                    <div className="text-muted-foreground">
                      Menampilkan halaman{' '}
                      <span className="font-semibold text-foreground">{page}</span> dari{' '}
                      <span className="font-semibold text-foreground">{data.pagination.totalPages || 1}</span> ({data.pagination.total} total)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg"
                        disabled={page >= data.pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
