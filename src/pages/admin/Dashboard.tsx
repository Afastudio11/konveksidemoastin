import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Activity, ArrowRight, BarChart3, CalendarIcon, CheckCircle2, Clock3,
  Factory, FileSpreadsheet, FileText, Loader2, Package, Palette, Plus,
  TrendingUp, Users, Wallet, X,
} from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
}).format(amount);

const formatOrderDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd MMM yyyy', { locale: idLocale });
};

const getColorCode = (name: string) => ({
  Hitam: '#111827', Putih: '#FFFFFF', Navy: '#172554', Merah: '#EF4444',
  Biru: '#3B82F6', Hijau: '#22C55E', 'Abu-abu': '#9CA3AF', Kuning: '#FACC15',
  Orange: '#F97316', Coklat: '#795548', Maroon: '#800000', Cream: '#FFFDD0',
  Pink: '#EC4899', Ungu: '#A855F7',
} as Record<string, string>)[name] || '#94A3B8';

const paymentStyles: Record<string, [string, string]> = {
  waiting_payment: ['Belum Bayar', 'bg-amber-50 text-amber-700'],
  waiting_dp: ['Menunggu DP', 'bg-amber-50 text-amber-700'],
  dp_paid: ['DP Dibayar', 'bg-blue-50 text-blue-700'],
  waiting_pelunasan: ['Menunggu Pelunasan', 'bg-orange-50 text-orange-700'],
  paid: ['Lunas', 'bg-emerald-50 text-emerald-700'],
  expired: ['Kadaluarsa', 'bg-red-50 text-red-700'],
  cancelled: ['Dibatalkan', 'bg-slate-100 text-slate-600'],
};

const productionStyles: Record<string, [string, string]> = {
  pending: ['Menunggu', 'bg-slate-100 text-slate-600'],
  design: ['Design', 'bg-violet-50 text-violet-700'],
  beli_bahan: ['Beli Bahan', 'bg-orange-50 text-orange-700'],
  potong_printing: ['Potong/Printing', 'bg-blue-50 text-blue-700'],
  jahit: ['Jahit', 'bg-cyan-50 text-cyan-700'],
  bordir_sablon: ['Bordir/Sablon', 'bg-pink-50 text-pink-700'],
  qc: ['QC', 'bg-yellow-50 text-yellow-700'],
  packing: ['Packing', 'bg-indigo-50 text-indigo-700'],
  selesai: ['Selesai', 'bg-emerald-50 text-emerald-700'],
  dikirim: ['Dikirim', 'bg-green-100 text-green-800'],
};

const statusBadge = (status: string, styles: Record<string, [string, string]>) => {
  const [label, className] = styles[status] || [status, 'bg-slate-100 text-slate-600'];
  return <Badge className={`border-0 font-medium shadow-none ${className}`}>{label}</Badge>;
};

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
].map((label, index) => ({ value: String(index + 1), label }));

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => String(currentYear - index));

const pipelineStages = [
  ['design', 'Design', 'bg-violet-500'], ['beli_bahan', 'Beli Bahan', 'bg-orange-500'],
  ['potong_printing', 'Potong / Printing', 'bg-blue-500'], ['jahit', 'Jahit', 'bg-cyan-500'],
  ['bordir_sablon', 'Bordir / Sablon', 'bg-pink-500'], ['qc', 'Quality Control', 'bg-yellow-500'],
  ['packing', 'Packing', 'bg-indigo-500'], ['selesai', 'Selesai', 'bg-emerald-500'],
  ['dikirim', 'Dikirim', 'bg-green-700'],
] as const;

interface RecentOrder {
  id: string;
  invoiceNumber: string;
  trackingCode: string;
  totalAmount: string | number;
  paymentStatus: string;
  productionStatus: string;
  createdAt: string;
  customer?: { name?: string; phone?: string };
}

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('all');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const filterParams: Record<string, string> = filterType === 'month'
    ? { month: selectedMonth, year: selectedYear }
    : filterType === 'date' && startDate && endDate
      ? { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') }
      : {};

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', filterParams],
    queryFn: () => api.dashboard.stats(token!, filterParams), enabled: !!token,
  });
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders', filterParams],
    queryFn: () => api.dashboard.recentOrders(token!, filterParams), enabled: !!token,
  });
  const { data: productAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['product-analytics', filterParams],
    queryFn: () => api.dashboard.productAnalytics(token!, filterParams), enabled: !!token,
  });
  const { data: productionOverview, isLoading: productionLoading } = useQuery({
    queryKey: ['production-overview', filterParams],
    queryFn: () => api.dashboard.productionOverview(token!, filterParams), enabled: !!token,
  });

  const exportExcel = useMutation({
    mutationFn: () => api.dashboard.exportExcel(token!, filterParams),
    onSuccess: () => toast.success('Export Excel berhasil!'), onError: () => toast.error('Gagal export Excel'),
  });
  const exportPdf = useMutation({
    mutationFn: () => api.dashboard.exportPdf(token!, filterParams),
    onSuccess: () => toast.success('Export PDF berhasil!'), onError: () => toast.error('Gagal export PDF'),
  });

  const resetFilter = () => {
    setFilterType('all'); setSelectedMonth(String(new Date().getMonth() + 1));
    setSelectedYear(String(currentYear)); setStartDate(undefined); setEndDate(undefined);
  };
  const filterLabel = filterType === 'month'
    ? `${months.find((month) => month.value === selectedMonth)?.label} ${selectedYear}`
    : filterType === 'date'
      ? startDate && endDate
        ? `${format(startDate, 'dd MMM', { locale: idLocale })} - ${format(endDate, 'dd MMM yyyy', { locale: idLocale })}`
        : 'Pilih rentang tanggal'
      : 'Semua Waktu';

  const totalOrders = Number(stats?.totalOrders || 0);
  const completedOrders = Number(stats?.completedOrders || 0);
  const completionRate = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const omzet = Number(filterType === 'all' ? stats?.totalOmzetAllTime : stats?.totalOmzet || 0);
  const productionCounts = new Map<string, number>(
    (productionOverview?.statusCounts || []).map((item: { status: string; count: number }) => [item.status, Number(item.count)]),
  );
  const totalProduction = pipelineStages.reduce((sum, [status]) => sum + (productionCounts.get(status) || 0), 0);

  const operations = [
    ['Total Order', totalOrders, 'Order pada periode ini', Package, 'bg-blue-50 text-blue-700'],
    ['Total Pelanggan', Number(stats?.totalCustomers || 0), 'Pelanggan bertransaksi', Users, 'bg-violet-50 text-violet-700'],
    ['Order Aktif', Number(stats?.activeOrders || 0), 'Perlu ditindaklanjuti', Clock3, 'bg-amber-50 text-amber-700'],
    ['Produksi Selesai', completedOrders, `${completionRate}% dari total order`, CheckCircle2, 'bg-emerald-50 text-emerald-700'],
  ] as const;

  const moneyMetrics = [
    [filterType === 'all' ? 'Revenue Lunas' : 'Revenue Periode', Number(stats?.monthlyRevenue || 0), 'Pembayaran sudah lunas', TrendingUp, 'bg-emerald-50 text-emerald-700'],
    ['DP Terbayar', Number(stats?.paidDpAmount || 0), 'Uang muka telah diterima', Wallet, 'bg-blue-50 text-blue-700'],
    ['Belum Diterima', Number(stats?.pendingAmount || 0), 'Nominal masih tertahan', Clock3, 'bg-amber-50 text-amber-700'],
  ] as const;

  return (
    <AdminLayout>
      <div className="space-y-5 pb-8">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                <Activity className="h-4 w-4" /> Ringkasan bisnis
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Dashboard Operasional</h1>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">
                Halo {user?.name?.split(' ')[0] || 'Admin'}, pantau penjualan, pembayaran, dan progres produksi dalam satu tampilan.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => exportExcel.mutate()} disabled={exportExcel.isPending}>
                {exportExcel.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Excel
              </Button>
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => exportPdf.mutate()} disabled={exportPdf.isPending}>
                {exportPdf.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} PDF
              </Button>
              <Button asChild className="h-10 rounded-xl bg-[#CCFF00] text-blue-950 shadow-none hover:bg-[#b8e600]">
                <Link to="/admin/orders/new"><Plus className="mr-2 h-4 w-4" />Buat Order</Link>
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CalendarIcon className="h-4 w-4 text-blue-700" /> Periode data
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <Select value={filterType} onValueChange={(value: 'all' | 'month' | 'date') => setFilterType(value)}>
                  <SelectTrigger className="h-10 w-full rounded-xl bg-white sm:w-[165px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="month">Per Bulan</SelectItem>
                    <SelectItem value="date">Rentang Tanggal</SelectItem>
                  </SelectContent>
                </Select>
                {filterType === 'month' && <>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-10 w-[145px] rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{months.map((month) => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-10 w-[105px] rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                  </Select>
                </>}
                {filterType === 'date' && <>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className="h-10 w-[145px] justify-start rounded-xl bg-white px-3 font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />{startDate ? format(startDate, 'dd/MM/yyyy') : 'Tanggal awal'}
                    </Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={(date) => {
                      setStartDate(date); if (date && endDate && date > endDate) setEndDate(undefined);
                    }} disabled={(date) => !!endDate && date > endDate} initialFocus /></PopoverContent>
                  </Popover>
                  <span className="text-sm text-slate-400">sampai</span>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className="h-10 w-[145px] justify-start rounded-xl bg-white px-3 font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />{endDate ? format(endDate, 'dd/MM/yyyy') : 'Tanggal akhir'}
                    </Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={setEndDate}
                      disabled={(date) => !!startDate && date < startDate} initialFocus /></PopoverContent>
                  </Popover>
                </>}
                {filterType !== 'all' && <Button variant="ghost" size="sm" className="rounded-lg text-slate-500" onClick={resetFilter}>
                  <X className="mr-1 h-4 w-4" />Reset
                </Button>}
              </div>
              <Badge variant="outline" className="w-fit rounded-full border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">{filterLabel}</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 text-white shadow-lg shadow-blue-950/10 md:col-span-2">
            <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-blue-500/20" />
            <div className="absolute -bottom-20 right-20 h-44 w-44 rounded-full bg-[#CCFF00]/10" />
            <CardContent className="relative flex h-full min-h-[190px] flex-col justify-between p-6">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-medium text-blue-100">{filterType === 'all' ? 'Total Omzet Keseluruhan' : 'Omzet Periode'}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-[#CCFF00] sm:text-4xl">{statsLoading ? 'Memuat...' : formatCurrency(omzet)}</p></div>
                <div className="rounded-2xl bg-white/10 p-3"><BarChart3 className="h-6 w-6 text-[#CCFF00]" /></div>
              </div>
              <div className="flex items-center justify-between border-t border-white/15 pt-4 text-sm">
                <span className="text-blue-100">Data {filterLabel.toLowerCase()}</span>
                <span className="font-semibold">{totalOrders.toLocaleString('id-ID')} order</span>
              </div>
            </CardContent>
          </Card>
          {moneyMetrics.map(([label, value, helper, Icon, iconClass]) => <Card key={label} className="border-slate-200 shadow-sm">
            <CardContent className="flex h-full min-h-[190px] flex-col justify-between p-5">
              <div className={`w-fit rounded-xl p-2.5 ${iconClass}`}><Icon className="h-5 w-5" /></div>
              <div><p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-1 break-words text-xl font-bold tracking-tight text-slate-950">{statsLoading ? '-' : formatCurrency(value)}</p>
                <p className="mt-2 text-xs text-slate-400">{helper}</p></div>
            </CardContent>
          </Card>)}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {operations.map(([label, value, helper, Icon, iconClass]) => <Card key={label} className="border-slate-200 shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-2xl p-3 ${iconClass}`}><Icon className="h-5 w-5" /></div>
              <div className="min-w-0"><p className="text-sm font-medium text-slate-500">{label}</p>
                <div className="mt-0.5 flex items-baseline gap-2"><span className="text-2xl font-bold text-slate-950">{statsLoading ? '-' : value.toLocaleString('id-ID')}</span>
                  <span className="truncate text-xs text-slate-400">{helper}</span></div></div>
            </CardContent>
          </Card>)}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div><div className="flex items-center gap-2"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Factory className="h-5 w-5" /></div>
                  <h2 className="text-lg font-bold text-slate-950">Alur Produksi</h2></div>
                  <p className="mt-2 text-sm text-slate-500">Posisi order lunas pada setiap tahap produksi.</p></div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 text-right"><p className="text-xs text-slate-400">Dalam alur</p>
                  <p className="text-lg font-bold text-slate-900">{productionLoading ? '-' : totalProduction} order</p></div>
              </div>
              <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
                {pipelineStages.map(([status, label, color]) => <div key={status} className="flex items-center justify-between bg-white p-4 hover:bg-slate-50">
                  <div className="flex min-w-0 items-center gap-3"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
                    <span className="truncate text-sm font-medium text-slate-600">{label}</span></div>
                  <span className="ml-3 text-lg font-bold text-slate-950">{productionLoading ? '-' : productionCounts.get(status) || 0}</span>
                </div>)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5">
            <div className="flex items-center gap-2"><div className="rounded-lg bg-violet-50 p-2 text-violet-700"><Package className="h-5 w-5" /></div>
              <h2 className="text-lg font-bold text-slate-950">Produk Terlaris</h2></div>
            <p className="mt-2 text-sm text-slate-500">Produk dengan volume tertinggi.</p>
            <div className="mt-5 space-y-4">
              {analyticsLoading ? <LoadingBlock /> : !productAnalytics?.productSales?.length ? <EmptyBlock text="Belum ada data produk" />
                : productAnalytics.productSales.slice(0, 5).map((product, index) => <div key={product.productName}>
                  <div className="mb-2 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{index + 1}</span>
                    <span className="truncate text-sm font-semibold text-slate-800">{product.productName}</span></div>
                    <span className="shrink-0 text-sm font-bold text-slate-950">{product.totalQuantity.toLocaleString('id-ID')} pcs</span></div>
                  <Progress value={(product.totalQuantity / (productAnalytics.productSales[0]?.totalQuantity || 1)) * 100} className="h-1.5 bg-slate-100" />
                </div>)}
            </div>
          </CardContent></Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5">
            <SectionTitle icon={BarChart3} iconClass="bg-emerald-50 text-emerald-700" title="Kategori Terlaris" subtitle="Perbandingan volume berdasarkan kategori." />
            {analyticsLoading ? <LoadingBlock /> : !productAnalytics?.productCategorySales?.length ? <EmptyBlock text="Belum ada data kategori" />
              : <div className="space-y-5">{productAnalytics.productCategorySales.slice(0, 5).map((category, index) => {
                const categoryLabel = category.productCategory === 'konveksi' ? 'Konveksi' : category.productCategory === 'percetakan' ? 'Percetakan' : category.productCategory;
                return <div key={category.productCategory}><div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{index + 1}. {categoryLabel}</span>
                  <span className="font-bold text-slate-950">{category.totalQuantity.toLocaleString('id-ID')} pcs · {category.orderCount} order</span></div>
                  <Progress value={(category.totalQuantity / (productAnalytics.productCategorySales[0]?.totalQuantity || 1)) * 100} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
                </div>;
              })}</div>}
          </CardContent></Card>

          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5">
            <SectionTitle icon={Palette} iconClass="bg-pink-50 text-pink-700" title="Warna Terlaris" subtitle="Warna yang paling banyak masuk ke produksi." />
            {analyticsLoading ? <LoadingBlock /> : !productAnalytics?.colorSales?.length ? <EmptyBlock text="Belum ada data warna" />
              : <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{productAnalytics.colorSales.slice(0, 9).map((color) => <div key={color.color}
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                <span className="h-7 w-7 shrink-0 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: getColorCode(color.color) }} />
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{color.color}</p>
                  <p className="text-xs text-slate-400">{color.totalQuantity.toLocaleString('id-ID')} pcs</p></div>
              </div>)}</div>}
          </CardContent></Card>
        </section>

        <Card className="overflow-hidden border-slate-200 shadow-sm"><CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-bold text-slate-950">Order Terbaru</h2>
              <p className="mt-1 text-sm text-slate-500">Klik baris untuk membuka detail dan tindak lanjut order.</p></div>
            <Button asChild variant="outline" className="w-fit rounded-xl"><Link to="/admin/orders">Lihat Semua <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="pl-5">Invoice</TableHead><TableHead>Pelanggan</TableHead><TableHead>Total</TableHead>
              <TableHead>Pembayaran</TableHead><TableHead>Produksi</TableHead><TableHead>Tanggal</TableHead><TableHead className="pr-5 text-right">Aksi</TableHead>
            </TableRow></TableHeader>
            <TableBody>{ordersLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-700" /></TableCell></TableRow>
              : !recentOrders?.orders?.length ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-400">Belum ada order pada periode ini</TableCell></TableRow>
              : recentOrders.orders.map((order: RecentOrder) => <TableRow key={order.id} role="link" tabIndex={0}
                className="cursor-pointer border-slate-100 hover:bg-blue-50/40" onClick={() => navigate(`/admin/orders/${order.id}`)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') navigate(`/admin/orders/${order.id}`); }}>
                <TableCell className="pl-5"><p className="font-semibold text-slate-950">{order.invoiceNumber}</p><p className="mt-0.5 text-xs text-slate-400">{order.trackingCode}</p></TableCell>
                <TableCell><p className="font-medium text-slate-800">{order.customer?.name || '-'}</p><p className="mt-0.5 text-xs text-slate-400">{order.customer?.phone || '-'}</p></TableCell>
                <TableCell className="font-semibold text-slate-900">{formatCurrency(Number(order.totalAmount))}</TableCell>
                <TableCell>{statusBadge(order.paymentStatus, paymentStyles)}</TableCell><TableCell>{statusBadge(order.productionStatus, productionStyles)}</TableCell>
                <TableCell className="whitespace-nowrap text-slate-500">{formatOrderDate(order.createdAt)}</TableCell>
                <TableCell className="pr-5 text-right"><Button variant="ghost" size="sm" className="rounded-lg font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                  onClick={(event) => { event.stopPropagation(); navigate(`/admin/orders/${order.id}`); }}>
                  Cek Detail <ArrowRight className="ml-1.5 h-4 w-4" /></Button></TableCell>
              </TableRow>)}</TableBody>
          </Table></div>
        </CardContent></Card>
      </div>
    </AdminLayout>
  );
}

function LoadingBlock() {
  return <div className="flex h-36 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-700" /></div>;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="flex h-36 items-center justify-center text-sm text-slate-400">{text}</div>;
}

function SectionTitle({ icon: Icon, iconClass, title, subtitle }: {
  icon: typeof BarChart3; iconClass: string; title: string; subtitle: string;
}) {
  return <div className="mb-5 flex items-center gap-3"><div className={`rounded-lg p-2 ${iconClass}`}><Icon className="h-5 w-5" /></div>
    <div><h2 className="text-lg font-bold text-slate-950">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div></div>;
}
