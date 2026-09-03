import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  CreditCard,
  FileDown,
  FileText,
  Home,
  MailCheck,
  MessageCircle,
  Package,
  PackageCheck,
  Paintbrush,
  Palette,
  Scissors,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  Wallet,
  Sparkles,
  Building2,
} from 'lucide-react';

import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TrackingItem {
  productName: string;
  productType?: string | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface ProductionStep {
  key: string;
  label: string;
}

interface StatusHistory {
  status: string;
  statusLabel: string;
  notes?: string | null;
  createdAt: string;
}

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

const currency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const statusIcons: Record<string, LucideIcon> = {
  pending: Clock,
  design: Palette,
  beli_bahan: ShoppingCart,
  potong_printing: Scissors,
  jahit: Settings,
  bordir_sablon: Paintbrush,
  qc: ClipboardCheck,
  packing: Box,
  selesai: CheckCircle2,
  dikirim: Truck,
};

const paymentTheme: Record<string, string> = {
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  dp_paid: 'border-blue-200 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  waiting_pelunasan: 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  waiting_dp: 'border-orange-200 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800',
};

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
    window.setTimeout(() => setCopied(false), 1500);
  };

  const whatsappMessage = order
    ? encodeURIComponent(`Halo ouruniform.id, saya ingin menanyakan progres pesanan dengan kode tracking ${order.trackingCode} (${order.invoiceNumber}).`)
    : encodeURIComponent('Halo ouruniform.id, saya ingin menanyakan status pesanan saya.');

  return (
    <div className="min-h-screen bg-muted/20 text-foreground font-sans">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/ouruniform-logo.png"
            alt="ouruniform.id"
            className="size-8 sm:size-9 rounded-lg object-contain bg-card border border-border/80 p-0.5 shadow-2xs"
          />
          <div>
            <span className="block text-sm font-bold leading-tight tracking-tight text-foreground">
              ouruniform.id
            </span>
            <span className="block text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Pelacakan Pesanan
            </span>
          </div>
        </Link>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 sm:h-9 text-xs rounded-lg border-border hover:bg-muted font-medium"
        >
          <Link to="/">
            <Home className="size-3.5 mr-1.5 text-muted-foreground" />
            <span>Kembali ke Beranda</span>
          </Link>
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8 pb-16">
        {/* Title Header Banner */}
        <section className="bg-card rounded-xl border border-border p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Order Tracking System
            </p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
              Cek Status & Progres Pesanan
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Pantau tahapan produksi konveksi, status pembayaran, dan rincian pesanan secara real-time.
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit text-xs px-3 py-1.5 border-border bg-muted/40 text-muted-foreground font-normal rounded-lg"
          >
            <ShieldCheck className="mr-1.5 size-3.5 text-emerald-600" />
            Data pesanan terlindungi
          </Badge>
        </section>

        {/* Tracking Search Input Card */}
        <Card className="rounded-xl border-border bg-card shadow-xs">
          <CardContent className="p-3 sm:p-3.5">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Kode tracking"
                  value={inputCode}
                  onChange={(event) => setInputCode(event.target.value.toUpperCase())}
                  placeholder="Masukkan kode tracking (contoh: DEMO3B-0219)..."
                  className="h-10 sm:h-11 rounded-lg border-border bg-card pl-10 font-mono text-xs sm:text-sm uppercase shadow-none tracking-wider"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !inputCode.trim()}
                className="h-10 sm:h-11 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-6 text-xs sm:text-sm font-medium shrink-0"
              >
                {isLoading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                ) : (
                  <Search className="size-4 mr-2" />
                )}
                {isLoading ? 'Mencari...' : 'Cek Pesanan'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Empty State / Feature Guides when no code is searched */}
        {!searchCode && (
          <div className="grid gap-3.5 md:grid-cols-3">
            {[
              {
                icon: MailCheck,
                title: 'Masukkan Kode Tracking',
                description: 'Gunakan kode unik yang Anda terima melalui WhatsApp atau invoice resmi kami.',
              },
              {
                icon: PackageCheck,
                title: 'Pantau Tahapan Produksi',
                description: 'Ketahui posisi pengerjaan mulai dari pemotongan, sablon, bordir, hingga proses packing.',
              },
              {
                icon: FileDown,
                title: 'Unduh Invoice PDF',
                description: 'Akses dan cetak bukti transaksi serta rincian spesifikasi pesanan kapan saja.',
              },
            ].map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-foreground/20"
              >
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <h2 className="mt-3.5 text-sm font-semibold text-foreground">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && searchCode && !isLoading && (
          <Card className="mx-auto max-w-xl rounded-xl border-border bg-card shadow-xs">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 text-rose-600 mb-3">
                <Package className="size-6" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Pesanan Tidak Ditemukan
              </h2>
              <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                Kode tracking <span className="font-mono font-semibold text-foreground">{searchCode}</span> belum terdaftar di sistem. Mohon periksa kembali ejaan huruf dan angkanya.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-5 rounded-lg border-border text-xs gap-1.5"
                onClick={() => setInputCode('')}
              >
                <ArrowLeft className="size-3.5" />
                <span>Masukkan Kode Lain</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active Order Details */}
        {order && !isLoading && (
          <div className="space-y-5">
            {/* Header Status Card */}
            <Card className="overflow-hidden rounded-xl border-border bg-card shadow-xs">
              <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between bg-muted/15">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="size-3" />
                    Pesanan Terverifikasi
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {order.trackingCode}
                    </h2>
                    <button
                      onClick={copyTrackingCode}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors cursor-pointer shadow-2xs"
                    >
                      {copied ? (
                        <Check className="size-3 text-emerald-600" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground" />
                      )}
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dibuat {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>

                <div
                  className={`w-fit rounded-xl border px-3.5 py-2 ${
                    paymentTheme[order.paymentStatus] || 'border-border bg-muted/40 text-foreground'
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                    Status Pembayaran
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold">
                    {order.paymentStatusLabel}
                  </p>
                </div>
              </div>

              {/* 4-Metric Divider Card - Square UI Leads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                    <UserRound className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Pelanggan</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate mt-0.5">
                      {order.customerName || '-'}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Nomor Invoice</p>
                    <p className="text-sm sm:text-base font-semibold font-mono text-foreground truncate mt-0.5">
                      {order.invoiceNumber}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                    <Package className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Jumlah Produk</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground mt-0.5">
                      {orderedUnits} <span className="text-xs font-normal text-muted-foreground">pcs</span>
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
                    <Wallet className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Total Pesanan</p>
                    <p className="text-sm sm:text-base font-semibold font-mono text-foreground mt-0.5">
                      {currency(Number(order.totalAmount))}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Layout Columns: Pipeline & Sidebar */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
              {/* Left Column: Progress & Products */}
              <div className="space-y-5">
                {/* Progress Pipeline Card */}
                <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-border/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Tahapan Produksi Berjalan</p>
                        <CardTitle className="mt-0.5 text-base sm:text-lg font-bold text-foreground">
                          {order.productionStatusLabel}
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                          {progress}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">Selesai</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5">
                    {/* Modern Progress Bar */}
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-5">
                      <div
                        className="h-full bg-foreground transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Step Cards Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                      {order.productionSteps?.map((step, index) => {
                        const Icon = statusIcons[step.key] || Package;
                        const isCurrent = index === order.currentStepIndex;
                        const isCompleted = index < order.currentStepIndex;

                        return (
                          <div
                            key={step.key}
                            className={`rounded-xl border p-3 transition-all ${
                              isCurrent
                                ? 'border-foreground/30 bg-muted/60 text-foreground ring-1 ring-foreground/20'
                                : isCompleted
                                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800'
                                : 'border-border/70 bg-card text-muted-foreground opacity-75'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className="size-4" />
                              {isCompleted && (
                                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              )}
                              {isCurrent && (
                                <span className="size-2 rounded-full bg-foreground animate-pulse" />
                              )}
                            </div>
                            <p className="mt-2.5 text-xs font-semibold leading-tight text-foreground">
                              {step.label}
                            </p>
                            <p className="mt-1 text-[10px] opacity-75">
                              {isCurrent ? 'Sedang Berjalan' : isCompleted ? 'Selesai' : 'Menunggu'}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {order.productionDeadline && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3.5 py-2.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-4 text-muted-foreground shrink-0" />
                        <span>
                          Estimasi selesai:{' '}
                          <strong className="font-semibold text-foreground">
                            {format(new Date(order.productionDeadline), 'dd MMMM yyyy', {
                              locale: idLocale,
                            })}
                          </strong>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Products Ordered Card */}
                <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
                  <CardHeader className="border-b border-border/70 p-4 sm:p-5">
                    <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                      Rincian Produk Dipesan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/60 p-0">
                    {order.items?.map((item, index) => (
                      <div
                        key={`${item.productName}-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted border border-border text-xs font-semibold text-foreground">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-foreground">
                              {item.productName}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {item.productType && <span>Tipe: {item.productType}</span>}
                              {item.size && <span>• Ukuran: {item.size}</span>}
                              {item.color && <span>• Warna: {item.color}</span>}
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-muted border border-border text-xs font-bold font-mono text-foreground w-fit">
                          {item.quantity} pcs
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Timeline History Card */}
                {order.statusHistory?.length > 0 && (
                  <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-border/70 p-4 sm:p-5">
                      <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                        Riwayat Perjalanan Pesanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5">
                      {order.statusHistory.map((history, index) => {
                        const Icon = statusIcons[history.status] || Package;
                        return (
                          <div
                            key={`${history.status}-${history.createdAt}`}
                            className="relative flex gap-3.5 pb-5 last:pb-0"
                          >
                            {index < order.statusHistory.length - 1 && (
                              <span className="absolute left-4 top-8 h-[calc(100%-32px)] w-px bg-border" />
                            )}
                            <span
                              className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                                index === 0
                                  ? 'bg-foreground text-background border-foreground'
                                  : 'bg-muted/50 text-muted-foreground border-border'
                              }`}
                            >
                              <Icon className="size-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                                <p className="text-xs sm:text-sm font-semibold text-foreground">
                                  {history.statusLabel}
                                </p>
                                <time className="text-[11px] text-muted-foreground">
                                  {format(new Date(history.createdAt), 'dd MMM yyyy, HH:mm', {
                                    locale: idLocale,
                                  })}
                                </time>
                              </div>
                              {history.notes && (
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                  {history.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Payment & Actions */}
              <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
                <Card className="rounded-xl border border-border bg-card shadow-xs">
                  <CardHeader className="border-b border-border/60 p-4">
                    <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
                      <CreditCard className="size-4 text-muted-foreground" />
                      Ringkasan Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex justify-between gap-3 text-muted-foreground">
                        <span>Total Pesanan</span>
                        <strong className="font-semibold font-mono text-foreground">
                          {currency(Number(order.totalAmount))}
                        </strong>
                      </div>
                      {Number(order.dpAmount || 0) > 0 && (
                        <div className="flex justify-between gap-3 text-muted-foreground">
                          <span>Uang Muka (DP)</span>
                          <strong className="font-semibold font-mono text-foreground">
                            {currency(Number(order.dpAmount))}
                          </strong>
                        </div>
                      )}
                      <div className="border-t border-border/60 pt-2.5">
                        <div className="flex justify-between gap-3">
                          <span className="font-medium text-foreground">Sisa Tagihan</span>
                          <strong className="font-bold font-mono text-foreground">
                            {order.paymentStatus === 'paid' ? 'Lunas' : currency(remainingAmount)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {order.paymentStatus !== 'paid' && (
                      <Button
                        asChild
                        className="h-10 w-full bg-foreground text-background hover:bg-foreground/90 font-medium text-xs sm:text-sm rounded-lg"
                      >
                        <Link to={`/pay/${order.trackingCode}`}>
                          <CreditCard className="size-4 mr-2" />
                          Bayar Sekarang
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Actions: Download Invoice & WhatsApp */}
                <Card className="rounded-xl border border-border bg-card shadow-xs">
                  <CardContent className="space-y-2 p-3 sm:p-4">
                    <a
                      href={`/api/invoice/public/${order.trackingCode}/pdf`}
                      className="block"
                    >
                      <Button
                        variant="outline"
                        className="h-9 sm:h-10 w-full border-border text-xs sm:text-sm rounded-lg hover:bg-muted font-medium"
                      >
                        <FileDown className="size-4 mr-2 text-muted-foreground" />
                        Download Invoice PDF
                      </Button>
                    </a>

                    <a
                      href={`https://wa.me/6285754777068?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button className="h-9 sm:h-10 w-full bg-foreground text-background hover:bg-foreground/90 text-xs sm:text-sm font-medium rounded-lg">
                        <MessageCircle className="size-4 mr-2" />
                        <span>Hubungi CS via WhatsApp</span>
                        <ArrowUpRight className="size-3.5 ml-1" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>

                {/* Disclaimer Security Card */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 size-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Keamanan Kode Tracking
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                        Simpan kode ini untuk mengecek progres berkala. Jangan membagikannya kepada pihak yang tidak berkepentingan.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
