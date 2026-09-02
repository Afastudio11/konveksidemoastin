import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  ArrowRight, BarChart3, CalendarIcon, CircleDollarSign, Clock3,
  Loader2, Package, TrendingDown, TrendingUp, Wallet, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const currency = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
}).format(value || 0);

const shortCurrency = (value: number) => new Intl.NumberFormat('id-ID', {
  notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1,
}).format(value || 0);

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
].map((label, index) => ({ value: String(index + 1), label }));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, index) => String(currentYear - index));

export default function FinancialReports() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('month');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const params: Record<string, string> = filterType === 'month'
    ? { month: selectedMonth, year: selectedYear }
    : filterType === 'date' && startDate && endDate
      ? { startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd') }
      : {};

  const { data, isLoading } = useQuery({
    queryKey: ['financial-reports', params],
    queryFn: () => api.financialReports.get(token!, params),
    enabled: !!token,
  });

  const filterLabel = filterType === 'month'
    ? `${months.find((month) => month.value === selectedMonth)?.label} ${selectedYear}`
    : filterType === 'date'
      ? startDate && endDate
        ? `${format(startDate, 'dd MMM', { locale: idLocale })} - ${format(endDate, 'dd MMM yyyy', { locale: idLocale })}`
        : 'Pilih rentang tanggal'
      : 'Semua Waktu';

  const summary = data?.summary || {};
  const trend = (data?.monthlyTrend || []).map((item: any) => ({
    month: format(new Date(`${item.month}-01T00:00:00`), 'MMM yy', { locale: idLocale }),
    Pendapatan: Number(item.revenue),
    'Biaya Bahan': Number(item.material_cost),
    'Biaya Produksi': Number(item.other_expense),
  }));

  const reset = () => {
    setFilterType('all'); setStartDate(undefined); setEndDate(undefined);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-4">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">Laporan Keuangan</h1>
              <p className="mt-1 text-sm text-slate-500">Pantau pendapatan, piutang, biaya produksi, dan biaya bahan hingga tingkat order.</p>
            </div>
            <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">{filterLabel}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <CalendarIcon className="mr-1 h-4 w-4 text-slate-500" />
            <Select value={filterType} onValueChange={(value: 'all' | 'month' | 'date') => setFilterType(value)}>
              <SelectTrigger className="h-9 w-[165px] bg-slate-50"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua Waktu</SelectItem><SelectItem value="month">Per Bulan</SelectItem><SelectItem value="date">Rentang Tanggal</SelectItem></SelectContent>
            </Select>
            {filterType === 'month' && <>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger className="h-9 w-[145px] bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map((month) => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent></Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger className="h-9 w-[105px] bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>{years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select>
            </>}
            {filterType === 'date' && <>
              <DateButton value={startDate} placeholder="Tanggal awal" onSelect={(date) => { setStartDate(date); if (date && endDate && date > endDate) setEndDate(undefined); }} />
              <span className="text-sm text-slate-400">sampai</span>
              <DateButton value={endDate} placeholder="Tanggal akhir" onSelect={setEndDate} disabledBefore={startDate} />
            </>}
            {filterType !== 'all' && <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500"><X className="mr-1 h-4 w-4" />Reset</Button>}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Nilai Order" value={summary.orderRevenue} helper={`${summary.totalOrders || 0} order valid`} icon={CircleDollarSign} theme="blue" loading={isLoading} />
          <SummaryCard title="Kas Diterima" value={summary.cashReceived} helper="Pembayaran masuk periode ini" icon={Wallet} theme="green" loading={isLoading} />
          <SummaryCard title="Piutang Berjalan" value={summary.outstandingReceivables} helper="Sisa tagihan pelanggan" icon={Clock3} theme="orange" loading={isLoading} />
          <SummaryCard title="Estimasi Laba Kotor" value={summary.estimatedGrossProfit} helper="Order dikurangi seluruh biaya" icon={TrendingUp} theme={Number(summary.estimatedGrossProfit) >= 0 ? 'lime' : 'red'} loading={isLoading} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5">
            <div className="mb-5"><h2 className="text-lg font-bold text-slate-950">Tren Keuangan 6 Bulan</h2><p className="text-sm text-slate-500">Pendapatan dibandingkan dengan biaya bahan dan biaya produksi.</p></div>
            <div className="h-[290px]">
              {isLoading ? <Loading /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={54} />
                <Tooltip formatter={(value: number) => currency(value)} contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Pendapatan" fill="#1D4ED8" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Biaya Bahan" fill="#F59E0B" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Biaya Produksi" fill="#EC4899" radius={[5, 5, 0, 0]} />
              </BarChart></ResponsiveContainer>}
            </div>
          </CardContent></Card>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm"><CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-950">Komposisi Biaya</h2><p className="mt-1 text-sm text-slate-500">Biaya yang mengurangi nilai order periode ini.</p>
            <div className="mt-7 space-y-5">
              <CostLine label="Pemakaian bahan baku" value={summary.materialCost} total={summary.orderRevenue} color="bg-amber-400" />
              <CostLine label="Pengeluaran produksi" value={summary.productionExpense} total={summary.orderRevenue} color="bg-pink-500" />
              <div className="border-t border-slate-200 pt-5"><div className="flex justify-between text-sm text-slate-500"><span>Total biaya</span><span className="font-semibold text-slate-950">{currency(Number(summary.totalCost || 0))}</span></div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">Margin estimasi</span>
                <span className="text-xl font-semibold text-emerald-600">{Number(summary.orderRevenue) ? `${((Number(summary.estimatedGrossProfit) / Number(summary.orderRevenue)) * 100).toFixed(1)}%` : '0%'}</span></div></div>
            </div>
          </CardContent></Card>
        </section>

        <Card className="overflow-hidden border-slate-200 shadow-sm"><CardContent className="p-0">
          <Tabs defaultValue="orders">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-bold text-slate-950">Rincian Laporan</h2><p className="text-sm text-slate-500">Telusuri profit per order dan konsumsi biaya per bahan.</p></div>
              <TabsList className="grid w-full grid-cols-2 sm:w-[320px]"><TabsTrigger value="orders">Per Order</TabsTrigger><TabsTrigger value="materials">Per Bahan Baku</TabsTrigger></TabsList>
            </div>
            <TabsContent value="orders" className="m-0"><OrderTable rows={data?.perOrder || []} loading={isLoading} onOpen={(id) => navigate(`/admin/orders/${id}`)} /></TabsContent>
            <TabsContent value="materials" className="m-0"><MaterialTable rows={data?.perMaterial || []} loading={isLoading} /></TabsContent>
          </Tabs>
        </CardContent></Card>
      </div>
    </AdminLayout>
  );
}

function DateButton({ value, placeholder, onSelect, disabledBefore }: { value?: Date; placeholder: string; onSelect: (date?: Date) => void; disabledBefore?: Date }) {
  return <Popover><PopoverTrigger asChild><Button variant="outline" className="h-9 w-[145px] justify-start bg-slate-50 px-3 font-normal">
    <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />{value ? format(value, 'dd/MM/yyyy') : placeholder}
  </Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={value} onSelect={onSelect}
    disabled={(date) => !!disabledBefore && date < disabledBefore} initialFocus /></PopoverContent></Popover>;
}

function SummaryCard({ title, value, helper, icon: Icon, theme, loading }: any) {
  const themes: Record<string, string> = { blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', orange: 'bg-amber-50 text-amber-700', lime: 'bg-lime-100 text-lime-800', red: 'bg-red-50 text-red-700' };
  return <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div>
    <p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{loading ? '-' : currency(Number(value || 0))}</p><p className="mt-2 text-xs text-slate-400">{helper}</p>
  </div><div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 ${themes[theme]}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>;
}

function CostLine({ label, value, total, color }: any) {
  const percentage = Number(total) ? Math.min(100, (Number(value) / Number(total)) * 100) : 0;
  return <div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-900">{currency(Number(value || 0))}</span></div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div><p className="mt-1.5 text-right text-xs text-slate-400">{percentage.toFixed(1)}% dari nilai order</p></div>;
}

function OrderTable({ rows, loading, onOpen }: any) {
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
    <TableHead className="pl-5">Order</TableHead><TableHead>Pelanggan</TableHead><TableHead className="text-right">Nilai Order</TableHead><TableHead className="text-right">Biaya Bahan</TableHead><TableHead className="text-right">Biaya Produksi</TableHead><TableHead className="text-right">Estimasi Laba</TableHead><TableHead className="text-right">Piutang</TableHead><TableHead className="pr-5 text-right">Aksi</TableHead>
  </TableRow></TableHeader><TableBody>{loading ? <LoadingRow columns={8} /> : !rows.length ? <EmptyRow columns={8} text="Belum ada data order pada periode ini" /> : rows.map((row: any) => <TableRow key={row.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onOpen(row.id)}>
    <TableCell className="pl-5"><p className="font-semibold text-slate-900">{row.invoiceNumber}</p><p className="text-xs text-slate-400">{format(new Date(row.createdAt), 'dd MMM yyyy', { locale: idLocale })}</p></TableCell>
    <TableCell className="font-medium text-slate-700">{row.customerName}</TableCell><TableCell className="text-right font-semibold">{currency(Number(row.totalAmount))}</TableCell>
    <TableCell className="text-right text-amber-700">{currency(Number(row.materialCost))}</TableCell><TableCell className="text-right text-pink-700">{currency(Number(row.otherExpense))}</TableCell>
    <TableCell className={`text-right font-bold ${Number(row.estimatedProfit) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{currency(Number(row.estimatedProfit))}</TableCell>
    <TableCell className="text-right text-orange-700">{currency(Number(row.outstandingAmount))}</TableCell><TableCell className="pr-5 text-right"><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); onOpen(row.id); }} className="text-slate-700">Detail <ArrowRight className="ml-1 h-4 w-4" /></Button></TableCell>
  </TableRow>)}</TableBody></Table></div>;
}

function MaterialTable({ rows, loading }: any) {
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50">
    <TableHead className="pl-5">Bahan Baku</TableHead><TableHead>Kategori</TableHead><TableHead className="text-right">Dipakai</TableHead><TableHead className="text-right">Jumlah Order</TableHead><TableHead className="text-right">Total Biaya</TableHead><TableHead className="text-right">Sisa Stok</TableHead><TableHead className="pr-5 text-right">Nilai Stok</TableHead>
  </TableRow></TableHeader><TableBody>{loading ? <LoadingRow columns={7} /> : !rows.length ? <EmptyRow columns={7} text="Belum ada pemakaian bahan pada periode ini" /> : rows.map((row: any) => <TableRow key={row.materialId}>
    <TableCell className="pl-5"><p className="font-semibold text-slate-900">{row.name}</p><p className="text-xs text-slate-400">{row.code}</p></TableCell><TableCell>{row.category}</TableCell>
    <TableCell className="text-right font-semibold">{Number(row.quantityUsed).toLocaleString('id-ID')} {row.unit}</TableCell><TableCell className="text-right">{row.orderCount}</TableCell>
    <TableCell className="text-right font-bold text-amber-700">{currency(Number(row.totalCost))}</TableCell><TableCell className="text-right">{Number(row.currentStock).toLocaleString('id-ID')} {row.unit}</TableCell>
    <TableCell className="pr-5 text-right">{currency(Number(row.currentStock) * Number(row.currentUnitPrice))}</TableCell>
  </TableRow>)}</TableBody></Table></div>;
}

function Loading() { return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-700" /></div>; }
function LoadingRow({ columns }: { columns: number }) { return <TableRow><TableCell colSpan={columns} className="h-32"><Loading /></TableCell></TableRow>; }
function EmptyRow({ columns, text }: { columns: number; text: string }) { return <TableRow><TableCell colSpan={columns} className="h-32 text-center text-slate-400">{text}</TableCell></TableRow>; }
