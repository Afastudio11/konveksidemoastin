import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft, ArrowUpRight, Box, CalendarDays, Check, CheckCircle, ClipboardCheck,
  Clock, Copy, CreditCard, FileDown, FileText, Home, MailCheck, MessageCircle,
  Package, PackageCheck, Paintbrush, Palette, Scissors, Search, Settings,
  ShieldCheck, ShoppingCart, Truck, UserRound, WalletCards,
} from 'lucide-react';

import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface TrackingItem {
  productName: string;
  productType?: string | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface ProductionStep { key: string; label: string }
interface StatusHistory { status: string; statusLabel: string; notes?: string | null; createdAt: string }

interface TrackingOrder {
  trackingCode: string;
  invoiceNumber: string;
  customerName?: string;
  items: TrackingItem[];
  totalAmount: string;
  dpAmount?: string;
  remainingAmount?: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  productionStatus: string;
  productionStatusLabel: string;
  productionProgress: number;
  productionDeadline?: string | null;
  currentStepIndex: number;
  productionSteps: ProductionStep[];
  statusHistory: StatusHistory[];
  createdAt: string;
}

const currency = (amount: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(amount || 0);

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock, design: Palette, beli_bahan: ShoppingCart, potong_printing: Scissors,
  jahit: Settings, bordir_sablon: Paintbrush, qc: ClipboardCheck, packing: Box,
  selesai: CheckCircle, dikirim: Truck,
};

const paymentTheme: Record<string, string> = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  dp_paid: 'border-blue-200 bg-blue-50 text-blue-700',
  waiting_pelunasan: 'border-amber-200 bg-amber-50 text-amber-700',
  waiting_dp: 'border-orange-200 bg-orange-50 text-orange-700',
};

function DetailItem({ icon: Icon, label, value, mono = false }: { icon: LucideIcon; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className={`mt-1.5 truncate text-base font-semibold text-slate-950 ${mono ? 'font-mono' : ''}`}>{value}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500"><Icon className="h-4 w-4" /></span>
      </div>
    </div>
  );
}

export default function Tracking() {
  const { trackingCode: paramCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCode = (paramCode || searchParams.get('code') || '').toUpperCase();
  const [inputCode, setInputCode] = useState(initialCode);
  const [searchCode, setSearchCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!paramCode) return;
    const normalized = paramCode.toUpperCase();
    setInputCode(normalized);
    setSearchCode(normalized);
  }, [paramCode]);

  const { data: order, isLoading, error } = useQuery<TrackingOrder>({
    queryKey: ['tracking', searchCode],
    queryFn: () => api.tracking.get(searchCode),
    enabled: Boolean(searchCode),
    retry: false,
  });

  const progress = Math.min(100, Math.max(0, Number(order?.productionProgress || 0)));
  const remainingAmount = Number(order?.remainingAmount || order?.totalAmount || 0);
  const orderedUnits = useMemo(
    () => order?.items?.reduce((total, item) => total + Number(item.quantity || 0), 0) || 0,
    [order?.items],
  );

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const normalized = inputCode.trim().toUpperCase();
    if (!normalized) return;
    setSearchCode(normalized);
    navigate(`/track/${encodeURIComponent(normalized)}`);
  };

  const copyTrackingCode = async () => {
    if (!order?.trackingCode) return;
    await navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  const whatsappMessage = order
    ? encodeURIComponent(`Halo, saya ingin menanyakan pesanan dengan kode tracking ${order.trackingCode}.`)
    : '';

  return (
    <div className="admin-poppins min-h-screen bg-[#f3f4f6] p-0 text-slate-950 lg:p-2">
      <div className="min-h-screen overflow-hidden bg-white lg:min-h-[calc(100vh-16px)] lg:rounded-lg lg:border lg:border-slate-200">
        <header className="sticky top-0 z-30 flex h-[58px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white">KI</span>
            <span><span className="block text-sm font-semibold leading-4">Konveksi Industry</span><span className="block text-[10px] text-slate-400">Pelacakan Pesanan</span></span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="h-8 text-slate-600">
            <Link to="/"><Home className="h-4 w-4" /><span className="hidden sm:inline">Kembali ke Beranda</span></Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-6 p-4 pb-12 sm:p-6">
          <section className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Cek Status Pesanan</h1>
              <p className="mt-1 text-sm text-slate-500">Lihat progres produksi, pembayaran, dan rincian pesanan terbaru.</p>
            </div>
            <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Data pesanan terlindungi
            </Badge>
          </section>

          <Card className="rounded-xl border-slate-200 shadow-none">
            <CardContent className="p-3">
              <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input aria-label="Kode tracking" value={inputCode} onChange={(event) => setInputCode(event.target.value.toUpperCase())}
                    placeholder="Masukkan kode tracking, contoh DEMO3B-0001"
                    className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 font-mono text-sm font-medium uppercase shadow-none" />
                </div>
                <Button type="submit" disabled={isLoading || !inputCode.trim()} className="h-10 rounded-lg bg-slate-950 px-5 text-white hover:bg-slate-800">
                  {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Search className="h-4 w-4" />}
                  {isLoading ? 'Mencari...' : 'Cek Pesanan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {!searchCode && (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: MailCheck, color: 'text-violet-500', title: 'Masukkan kode', description: 'Gunakan kode tracking yang diberikan saat order dibuat.' },
                { icon: PackageCheck, color: 'text-blue-500', title: 'Lihat progres', description: 'Pantau tahapan produksi dan pembaruan status secara real-time.' },
                { icon: FileDown, color: 'text-emerald-500', title: 'Unduh invoice', description: 'Simpan invoice pesanan langsung dari halaman detail.' },
              ].map(({ icon: Icon, color, title, description }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50"><Icon className={`h-5 w-5 ${color}`} /></span>
                  <h2 className="mt-4 text-base font-semibold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          )}

          {error && searchCode && !isLoading && (
            <Card className="mx-auto max-w-2xl rounded-xl border-red-100 shadow-none">
              <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-500"><Package className="h-6 w-6" /></span>
                <h2 className="mt-4 text-lg font-semibold">Pesanan tidak ditemukan</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Kode <span className="font-mono font-semibold text-slate-700">{searchCode}</span> tidak ditemukan. Periksa kembali huruf dan angkanya.</p>
                <Button variant="outline" size="sm" className="mt-5" onClick={() => setInputCode('')}><ArrowLeft className="h-4 w-4" />Masukkan Kode Lain</Button>
              </CardContent>
            </Card>
          )}

          {order && !isLoading && (
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-xl border-slate-200 shadow-none">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600">Pesanan ditemukan</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">{order.trackingCode}</h2>
                      <button onClick={copyTrackingCode} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Dibuat {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                  <div className={`w-fit rounded-lg border px-3 py-2 ${paymentTheme[order.paymentStatus] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Pembayaran</p>
                    <p className="mt-0.5 text-sm font-semibold">{order.paymentStatusLabel}</p>
                  </div>
                </div>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem icon={UserRound} label="Pelanggan" value={order.customerName || '-'} />
                  <DetailItem icon={FileText} label="Nomor Invoice" value={order.invoiceNumber} mono />
                  <DetailItem icon={Package} label="Jumlah Produk" value={`${orderedUnits} pcs`} />
                  <DetailItem icon={WalletCards} label="Total Pesanan" value={currency(Number(order.totalAmount))} />
                </CardContent>
              </Card>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-5">
                  <Card className="rounded-xl border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div><p className="text-xs text-slate-500">Progress Produksi</p><CardTitle className="mt-1 text-base font-semibold">{order.productionStatusLabel}</CardTitle></div>
                        <span className="text-2xl font-semibold text-indigo-600">{progress}%</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Progress value={progress} className="mb-4 h-2 bg-slate-100 [&>div]:bg-indigo-500" />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {order.productionSteps?.map((step, index) => {
                          const Icon = statusIcons[step.key] || Package;
                          const isCurrent = index === order.currentStepIndex;
                          const isCompleted = index < order.currentStepIndex;
                          return (
                            <div key={step.key} className={`rounded-lg border p-3 ${isCurrent ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : isCompleted ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                              <div className="flex items-center justify-between"><Icon className="h-4 w-4" />{isCompleted && <CheckCircle className="h-4 w-4" />}{isCurrent && <span className="h-2 w-2 rounded-full bg-indigo-500" />}</div>
                              <p className="mt-3 text-xs font-semibold leading-tight">{step.label}</p>
                              <p className="mt-1 text-[10px] opacity-70">{isCurrent ? 'Berjalan' : isCompleted ? 'Selesai' : 'Menunggu'}</p>
                            </div>
                          );
                        })}
                      </div>
                      {order.productionDeadline && <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-indigo-500" />Estimasi selesai: <strong className="font-semibold text-slate-900">{format(new Date(order.productionDeadline), 'dd MMMM yyyy', { locale: idLocale })}</strong></div>}
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 p-4"><CardTitle className="text-base font-semibold">Produk yang Dipesan</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-slate-100 p-0">
                      {order.items?.map((item, index) => (
                        <div key={`${item.productName}-${index}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span><div><p className="text-sm font-semibold">{item.productName}</p><div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">{item.productType && <span>{item.productType}</span>}{item.size && <span>• Ukuran {item.size}</span>}{item.color && <span>• {item.color}</span>}</div></div></div>
                          <span className="text-sm font-semibold text-indigo-600">{item.quantity} pcs</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {order.statusHistory?.length > 0 && (
                    <Card className="rounded-xl border-slate-200 shadow-none">
                      <CardHeader className="border-b border-slate-200 p-4"><CardTitle className="text-base font-semibold">Riwayat Perjalanan Pesanan</CardTitle></CardHeader>
                      <CardContent className="p-4">
                        {order.statusHistory.map((history, index) => {
                          const Icon = statusIcons[history.status] || Package;
                          return (
                            <div key={`${history.status}-${history.createdAt}`} className="relative flex gap-3 pb-5 last:pb-0">
                              {index < order.statusHistory.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-32px)] w-px bg-slate-200" />}
                              <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${index === 0 ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-3.5 w-3.5" /></span>
                              <div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">{history.statusLabel}</p><time className="text-xs text-slate-400">{format(new Date(history.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</time></div>{history.notes && <p className="mt-1 text-sm leading-6 text-slate-500">{history.notes}</p>}</div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
                  <Card className="rounded-xl border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 p-4"><CardTitle className="flex items-center gap-2 text-base font-semibold"><CreditCard className="h-4 w-4 text-emerald-500" />Ringkasan Pembayaran</CardTitle></CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-3 text-slate-500"><span>Total Pesanan</span><strong className="font-semibold text-slate-900">{currency(Number(order.totalAmount))}</strong></div>
                        {Number(order.dpAmount || 0) > 0 && <div className="flex justify-between gap-3 text-slate-500"><span>DP</span><strong className="font-semibold text-slate-900">{currency(Number(order.dpAmount))}</strong></div>}
                        <div className="border-t border-slate-200 pt-3"><div className="flex justify-between gap-3"><span className="font-medium text-slate-600">Sisa Tagihan</span><strong className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>{order.paymentStatus === 'paid' ? 'Lunas' : currency(remainingAmount)}</strong></div></div>
                      </div>
                      {order.paymentStatus !== 'paid' && <Button asChild className="h-9 w-full bg-slate-950 text-white hover:bg-slate-800"><Link to={`/pay/${order.trackingCode}`}><CreditCard className="h-4 w-4" />Bayar Sekarang</Link></Button>}
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border-slate-200 shadow-none"><CardContent className="space-y-2 p-3">
                    <a href={`/api/invoice/public/${order.trackingCode}/pdf`} className="block"><Button className="h-9 w-full bg-slate-950 text-white hover:bg-slate-800"><FileDown className="h-4 w-4" />Download Invoice</Button></a>
                    <a href={`https://wa.me/6285754777068?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="block"><Button variant="outline" className="h-9 w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="h-4 w-4" />Hubungi Admin<ArrowUpRight className="h-4 w-4" /></Button></a>
                  </CardContent></Card>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-500" /><div><p className="text-sm font-semibold">Jaga kode tracking Anda</p><p className="mt-1 text-xs leading-5 text-slate-500">Jangan membagikannya kepada pihak yang tidak berkepentingan.</p></div></div></div>
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
