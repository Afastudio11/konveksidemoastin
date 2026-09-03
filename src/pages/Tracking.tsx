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
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
  dp_paid: 'border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400',
  waiting_pelunasan: 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  waiting_dp: 'border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400',
};

function DetailItem({ icon: Icon, label, value, mono = false }: { icon: LucideIcon; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`mt-1.5 truncate text-sm sm:text-base font-semibold text-foreground ${mono ? 'font-mono' : ''}`}>{value}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
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
    <div className="admin-poppins min-h-screen bg-[#eaf5fb] text-[#0b1720]">
      <div className="min-h-screen overflow-hidden bg-[#f7fbfd]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#dbe8ef] bg-white/90 px-4 backdrop-blur-xl sm:px-7">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#087fb8] text-xs font-black text-white">KI</span>
            <span><span className="block text-sm font-semibold leading-5">Konveksi Industry</span><span className="block text-[10px] uppercase tracking-[0.13em] text-[#087fb8]">Pelacakan Pesanan</span></span>
          </Link>
          <Button asChild variant="ghost" size="sm" className="h-9 text-slate-600 hover:bg-[#e5f7ff] hover:text-[#087fb8]">
            <Link to="/"><Home className="h-4 w-4" /><span className="hidden sm:inline">Kembali ke Beranda</span></Link>
          </Button>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-5 p-4 pb-12 sm:p-6 lg:p-8">
          <section className="bg-card rounded-xl border border-border p-5 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Tracking</p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">Cek Status Pesanan</h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Lihat progres produksi, pembayaran, dan rincian pesanan secara transparan.</p>
            </div>
            <Badge variant="outline" className="w-fit text-xs px-3 py-1.5 border-border bg-muted/40 text-muted-foreground">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Data pesanan terlindungi
            </Badge>
          </section>

          <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardContent className="p-3">
              <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input aria-label="Kode tracking" value={inputCode} onChange={(event) => setInputCode(event.target.value.toUpperCase())}
                    placeholder="Masukkan kode tracking, contoh DEMO3B-0001"
                    className="h-11 rounded-lg border-border bg-card pl-10 font-mono text-sm uppercase shadow-none" />
                </div>
                <Button type="submit" disabled={isLoading || !inputCode.trim()} className="h-11 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-6 font-medium">
                  {isLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Search className="h-4 w-4 mr-2" />}
                  {isLoading ? 'Mencari...' : 'Cek Pesanan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {!searchCode && (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: MailCheck, title: 'Masukkan kode', description: 'Gunakan kode tracking yang diberikan saat order dibuat.' },
                { icon: PackageCheck, title: 'Lihat progres', description: 'Pantau tahapan produksi dan pembaruan status secara real-time.' },
                { icon: FileDown, title: 'Unduh invoice', description: 'Simpan invoice pesanan langsung dari halaman detail.' },
              ].map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground"><Icon className="h-5 w-5" /></span>
                  <h2 className="mt-4 text-sm sm:text-base font-semibold text-foreground">{title}</h2>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          )}

          {error && searchCode && !isLoading && (
            <Card className="mx-auto max-w-2xl rounded-xl border-border bg-card shadow-xs">
              <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-500"><Package className="h-6 w-6" /></span>
                <h2 className="mt-4 text-base sm:text-lg font-semibold text-foreground">Pesanan tidak ditemukan</h2>
                <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">Kode <span className="font-mono font-semibold text-foreground">{searchCode}</span> tidak ditemukan. Periksa kembali huruf dan angkanya.</p>
                <Button variant="outline" size="sm" className="mt-5 border-border text-xs" onClick={() => setInputCode('')}><ArrowLeft className="h-3.5 w-3.5 mr-1" />Masukkan Kode Lain</Button>
              </CardContent>
            </Card>
          )}

          {order && !isLoading && (
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <div className="flex flex-col gap-4 border-b border-border/60 bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                      Pesanan ditemukan
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <h2 className="font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">{order.trackingCode}</h2>
                      <button onClick={copyTrackingCode} className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground hover:bg-muted/50 cursor-pointer">
                        {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-muted-foreground" />}{copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Dibuat {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                  <div className={`w-fit rounded-lg border px-3 py-2 ${paymentTheme[order.paymentStatus] || 'border-border bg-muted/40 text-foreground'}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">Pembayaran</p>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold">{order.paymentStatusLabel}</p>
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
                        <span className="text-2xl font-bold text-[#087fb8]">{progress}%</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Progress value={progress} className="mb-4 h-2 bg-muted [&>div]:bg-[#6e3ff3]" />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {order.productionSteps?.map((step, index) => {
                          const Icon = statusIcons[step.key] || Package;
                          const isCurrent = index === order.currentStepIndex;
                          const isCompleted = index < order.currentStepIndex;
                          return (
                            <div
                              key={step.key}
                              className={`rounded-lg border p-3 transition-all ${
                                isCurrent
                                  ? 'border-[#6e3ff3] bg-[#6e3ff3]/10 text-[#6e3ff3] dark:text-[#aa8ef9]'
                                  : isCompleted
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                  : 'border-border bg-card text-muted-foreground'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Icon className="h-4 w-4" />
                                {isCompleted && <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                                {isCurrent && <span className="h-2 w-2 rounded-full bg-[#6e3ff3] animate-pulse" />}
                              </div>
                              <p className="mt-2.5 text-xs font-semibold leading-tight">{step.label}</p>
                              <p className="mt-1 text-[10px] opacity-70">
                                {isCurrent ? 'Berjalan' : isCompleted ? 'Selesai' : 'Menunggu'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {order.productionDeadline && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2.5 text-xs text-muted-foreground">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          Estimasi selesai:{' '}
                          <strong className="font-semibold text-foreground">
                            {format(new Date(order.productionDeadline), 'dd MMMM yyyy', { locale: idLocale })}
                          </strong>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border-slate-200 shadow-none">
                    <CardHeader className="border-b border-slate-200 p-4"><CardTitle className="text-base font-semibold">Produk yang Dipesan</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-slate-100 p-0">
                      {order.items?.map((item, index) => (
                        <div key={`${item.productName}-${index}`} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span><div><p className="text-sm font-semibold">{item.productName}</p><div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">{item.productType && <span>{item.productType}</span>}{item.size && <span>• Ukuran {item.size}</span>}{item.color && <span>• {item.color}</span>}</div></div></div>
                          <span className="rounded-lg bg-[#e5f7ff] px-2.5 py-1 text-sm font-semibold text-[#087fb8]">{item.quantity} pcs</span>
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
                              <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${index === 0 ? 'bg-[#087fb8] text-white' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-3.5 w-3.5" /></span>
                              <div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">{history.statusLabel}</p><time className="text-xs text-slate-400">{format(new Date(history.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</time></div>{history.notes && <p className="mt-1 text-sm leading-6 text-slate-500">{history.notes}</p>}</div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  )}
                </div>

                <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
                  <Card className="rounded-xl border border-border bg-card shadow-xs">
                    <CardHeader className="border-b border-border/60 p-4">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />Ringkasan Pembayaran
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4">
                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between gap-3 text-muted-foreground">
                          <span>Total Pesanan</span>
                          <strong className="font-semibold text-foreground">{currency(Number(order.totalAmount))}</strong>
                        </div>
                        {Number(order.dpAmount || 0) > 0 && (
                          <div className="flex justify-between gap-3 text-muted-foreground">
                            <span>DP</span>
                            <strong className="font-semibold text-foreground">{currency(Number(order.dpAmount))}</strong>
                          </div>
                        )}
                        <div className="border-t border-border/60 pt-2.5">
                          <div className="flex justify-between gap-3">
                            <span className="font-medium text-foreground">Sisa Tagihan</span>
                            <strong className="font-bold text-foreground">
                              {order.paymentStatus === 'paid' ? 'Lunas' : currency(remainingAmount)}
                            </strong>
                          </div>
                        </div>
                      </div>
                      {order.paymentStatus !== 'paid' && (
                        <Button asChild className="h-10 w-full bg-foreground text-background hover:bg-foreground/90 font-medium">
                          <Link to={`/pay/${order.trackingCode}`}><CreditCard className="h-4 w-4 mr-2" />Bayar Sekarang</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border border-border bg-card shadow-xs">
                    <CardContent className="space-y-2 p-3">
                      <a href={`/api/invoice/public/${order.trackingCode}/pdf`} className="block">
                        <Button variant="outline" className="h-9 sm:h-10 w-full border-border text-xs sm:text-sm">
                          <FileDown className="h-4 w-4 mr-1.5 text-muted-foreground" />Download Invoice
                        </Button>
                      </a>
                      <a href={`https://wa.me/6285754777068?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="block">
                        <Button className="h-9 sm:h-10 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium">
                          <MessageCircle className="h-4 w-4 mr-1.5" />Hubungi Admin<ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>

                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Jaga kode tracking Anda</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">Jangan membagikannya kepada pihak yang tidak berkepentingan.</p>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
