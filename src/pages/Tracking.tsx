import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight, Box, CalendarDays, Check, CheckCircle, ClipboardCheck, Clock, Copy,
  CreditCard, FileDown, FileText, MailCheck, MessageCircle, Package, PackageCheck,
  Paintbrush, Palette, Scissors, Search, Settings, ShieldCheck, ShoppingCart, Truck,
  UserRound, WalletCards,
} from 'lucide-react';
import Header from '@/components/Header';
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Icon className="h-4 w-4" />{label}
      </div>
      <p className={`mt-2 truncate text-base font-bold text-slate-950 ${mono ? 'font-mono' : ''}`}>{value}</p>
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
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pb-16">
        <section className="relative overflow-hidden bg-[#172c73] px-4 pb-28 pt-28 sm:pb-32 sm:pt-32">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="relative mx-auto max-w-5xl text-center">
            <Badge className="mb-4 border-white/15 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Pelacakan Pesanan
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Pantau pesanan Anda dengan mudah</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Masukkan kode tracking untuk melihat progres produksi, status pembayaran, dan detail pesanan terbaru.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
          <Card className="overflow-hidden rounded-3xl border-0 shadow-xl shadow-slate-900/10">
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input aria-label="Kode tracking" value={inputCode} onChange={(event) => setInputCode(event.target.value.toUpperCase())}
                    placeholder="Contoh: DEMO3B-0001"
                    className="h-14 rounded-2xl border-slate-200 pl-12 font-mono text-base font-semibold uppercase shadow-none focus-visible:ring-blue-500" />
                </div>
                <Button type="submit" disabled={isLoading || !inputCode.trim()}
                  className="h-14 rounded-2xl bg-[#CCFF00] px-8 font-bold text-[#172c73] hover:bg-[#b8e600]">
                  {isLoading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#172c73]/30 border-t-[#172c73]" /> : <Search className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Mencari...' : 'Cek Pesanan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {!searchCode && (
            <div className="mx-auto mt-14 grid max-w-4xl gap-4 md:grid-cols-3">
              {[
                { icon: MailCheck, title: 'Masukkan kode', description: 'Gunakan kode tracking yang diberikan saat order dibuat.' },
                { icon: PackageCheck, title: 'Lihat progres', description: 'Pantau tahapan produksi dan pembaruan status secara real-time.' },
                { icon: FileDown, title: 'Unduh invoice', description: 'Simpan invoice pesanan langsung dari halaman detail.' },
              ].map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></div>
                  <h2 className="mt-3 font-bold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          )}

          {error && searchCode && !isLoading && (
            <Card className="mx-auto mt-8 max-w-2xl rounded-3xl border-red-100 shadow-sm">
              <CardContent className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500"><Package className="h-8 w-8" /></div>
                <h2 className="mt-5 text-xl font-bold text-slate-950">Pesanan tidak ditemukan</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Kode <span className="font-mono font-bold text-slate-700">{searchCode}</span> tidak ditemukan. Periksa kembali huruf dan angkanya, lalu coba lagi.</p>
                <Button variant="outline" className="mt-5 rounded-xl" onClick={() => setInputCode('')}>Masukkan Kode Lain</Button>
              </CardContent>
            </Card>
          )}

          {order && !isLoading && (
            <div className="mt-8 space-y-6">
              <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
                <div className="flex flex-col gap-5 border-b border-slate-100 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Pesanan ditemukan</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="font-mono text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{order.trackingCode}</h2>
                      <button onClick={copyTrackingCode} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">Dibuat {format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: idLocale })}</p>
                  </div>
                  <div className={`w-fit rounded-2xl border px-4 py-3 ${paymentTheme[order.paymentStatus] || 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Status Pembayaran</p>
                    <p className="mt-0.5 font-bold">{order.paymentStatusLabel}</p>
                  </div>
                </div>
                <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem icon={UserRound} label="Pelanggan" value={order.customerName || '-'} />
                  <DetailItem icon={FileText} label="Nomor Invoice" value={order.invoiceNumber} mono />
                  <DetailItem icon={Package} label="Jumlah Produk" value={`${orderedUnits} pcs`} />
                  <DetailItem icon={WalletCards} label="Total Pesanan" value={currency(Number(order.totalAmount))} />
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-6">
                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Progress Produksi</p><CardTitle className="mt-1 text-2xl text-slate-950">{order.productionStatusLabel}</CardTitle></div>
                        <div className="text-left sm:text-right"><span className="text-3xl font-black text-blue-700">{progress}%</span><p className="text-xs text-slate-400">telah selesai</p></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={progress} className="mb-6 h-3 bg-slate-100" />
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                        {order.productionSteps?.map((step, index) => {
                          const Icon = statusIcons[step.key] || Package;
                          const isCurrent = index === order.currentStepIndex;
                          const isCompleted = index < order.currentStepIndex;
                          return (
                            <div key={step.key} className={`rounded-2xl border p-3 transition ${isCurrent ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20' : isCompleted ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                              <div className="flex items-center justify-between"><Icon className="h-5 w-5" />{isCompleted && <CheckCircle className="h-4 w-4" />}{isCurrent && <span className="h-2 w-2 animate-pulse rounded-full bg-lime-300" />}</div>
                              <p className="mt-3 text-xs font-bold leading-tight">{step.label}</p>
                              <p className="mt-1 text-[10px] opacity-70">{isCurrent ? 'Sedang berjalan' : isCompleted ? 'Selesai' : 'Menunggu'}</p>
                            </div>
                          );
                        })}
                      </div>
                      {order.productionDeadline && (
                        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"><CalendarDays className="h-4 w-4 text-blue-600" />Estimasi selesai: <strong className="text-slate-900">{format(new Date(order.productionDeadline), 'dd MMMM yyyy', { locale: idLocale })}</strong></div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader><CardTitle className="text-xl text-slate-950">Produk yang Dipesan</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {order.items?.map((item, index) => (
                        <div key={`${item.productName}-${index}`} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">{index + 1}</div><div><p className="font-bold text-slate-900">{item.productName}</p><div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">{item.productType && <span className="rounded-md bg-slate-100 px-2 py-1">{item.productType}</span>}{item.size && <span className="rounded-md bg-slate-100 px-2 py-1">Ukuran {item.size}</span>}{item.color && <span className="rounded-md bg-slate-100 px-2 py-1">{item.color}</span>}</div></div></div>
                          <div className="rounded-xl bg-blue-50 px-4 py-2 text-center text-sm font-bold text-blue-700">{item.quantity} pcs</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {order.statusHistory?.length > 0 && (
                    <Card className="rounded-3xl border-slate-200 shadow-sm">
                      <CardHeader><CardTitle className="text-xl text-slate-950">Riwayat Perjalanan Pesanan</CardTitle></CardHeader>
                      <CardContent><div className="space-y-0">
                        {order.statusHistory.map((history, index) => {
                          const Icon = statusIcons[history.status] || Package;
                          return (
                            <div key={`${history.status}-${history.createdAt}`} className="relative flex gap-4 pb-6 last:pb-0">
                              {index < order.statusHistory.length - 1 && <div className="absolute left-[19px] top-10 h-[calc(100%-40px)] w-px bg-slate-200" />}
                              <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${index === 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-100 text-slate-500'}`}><Icon className="h-4 w-4" /></div>
                              <div className="min-w-0 flex-1 pt-0.5"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="font-bold text-slate-900">{history.statusLabel}</p><time className="text-xs text-slate-400">{format(new Date(history.createdAt), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</time></div>{history.notes && <p className="mt-1 text-sm leading-6 text-slate-500">{history.notes}</p>}</div>
                            </div>
                          );
                        })}
                      </div></CardContent>
                    </Card>
                  )}
                </div>

                <aside className="space-y-5 lg:sticky lg:top-28 lg:h-fit">
                  <Card className="rounded-3xl border-slate-200 shadow-sm">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-blue-600" />Ringkasan Pembayaran</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between gap-3 text-slate-500"><span>Total Pesanan</span><strong className="text-slate-900">{currency(Number(order.totalAmount))}</strong></div>
                        {Number(order.dpAmount || 0) > 0 && <div className="flex justify-between gap-3 text-slate-500"><span>DP</span><strong className="text-slate-900">{currency(Number(order.dpAmount))}</strong></div>}
                        <div className="border-t border-dashed border-slate-200 pt-3"><div className="flex justify-between gap-3"><span className="font-medium text-slate-600">Sisa Tagihan</span><strong className={order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-orange-600'}>{order.paymentStatus === 'paid' ? 'Lunas' : currency(remainingAmount)}</strong></div></div>
                      </div>
                      {order.paymentStatus !== 'paid' && <Button asChild className="h-12 w-full rounded-xl bg-[#CCFF00] font-bold text-[#172c73] hover:bg-[#b8e600]"><Link to={`/pay/${order.trackingCode}`}><CreditCard className="mr-2 h-4 w-4" />Bayar Sekarang</Link></Button>}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-slate-200 shadow-sm"><CardContent className="space-y-3 p-5">
                    <a href={`/api/invoice/public/${order.trackingCode}/pdf`} className="block"><Button className="h-12 w-full rounded-xl bg-blue-700 font-bold text-white hover:bg-blue-800"><FileDown className="mr-2 h-4 w-4" />Download Invoice</Button></a>
                    <a href={`https://wa.me/6285754777068?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="block"><Button variant="outline" className="h-12 w-full rounded-xl border-emerald-200 font-bold text-emerald-700 hover:bg-emerald-50"><MessageCircle className="mr-2 h-4 w-4" />Hubungi Admin<ArrowUpRight className="ml-2 h-4 w-4" /></Button></a>
                  </CardContent></Card>

                  <div className="rounded-2xl bg-slate-900 p-5 text-white"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-lime-300" /><div><p className="font-bold">Data pesanan terlindungi</p><p className="mt-1 text-xs leading-5 text-slate-400">Simpan kode tracking Anda dan jangan membagikannya kepada pihak yang tidak berkepentingan.</p></div></div></div>
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
