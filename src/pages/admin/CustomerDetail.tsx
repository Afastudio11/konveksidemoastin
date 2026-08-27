import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

const currency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const paymentLabels: Record<string, string> = {
  waiting_dp: 'Menunggu DP',
  dp_paid: 'DP Dibayar',
  waiting_pelunasan: 'Menunggu Pelunasan',
  paid: 'Lunas',
  pending: 'Belum Dibayar',
  partial: 'Dibayar Sebagian',
};

const productionLabels: Record<string, string> = {
  pending: 'Menunggu',
  design: 'Design',
  beli_bahan: 'Beli Bahan',
  potong_printing: 'Potong/Printing',
  jahit: 'Jahit',
  bordir_sablon: 'Bordir/Sablon',
  qc: 'Quality Control',
  packing: 'Packing',
  selesai: 'Selesai',
  dikirim: 'Dikirim',
};

function SummaryCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Package;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{helper}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data: customer, isLoading, isError } = useQuery<any>({
    queryKey: ['customer', id],
    queryFn: () => api.customers.get(token!, id!),
    enabled: Boolean(token && id),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[55vh] items-center justify-center text-slate-500">
          Memuat detail pelanggan...
        </div>
      </AdminLayout>
    );
  }

  if (isError || !customer) {
    return (
      <AdminLayout>
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
          <UserRound className="h-12 w-12 text-slate-300" />
          <div>
            <h1 className="text-xl font-bold text-slate-950">Pelanggan tidak ditemukan</h1>
            <p className="mt-1 text-sm text-slate-500">Data pelanggan tidak tersedia atau sudah dihapus.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const orders = customer.orders || [];
  const totalOrderValue = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || 0), 0);
  const outstanding = orders.reduce((sum: number, order: any) => sum + Number(order.remainingAmount || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" className="mb-3 -ml-3 text-slate-600">
            <Link to="/admin/customers"><ArrowLeft className="mr-2 h-4 w-4" />Daftar Pelanggan</Link>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Detail Pelanggan</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{customer.name}</h1>
              <p className="mt-1 text-sm text-slate-500">Informasi kontak dan seluruh riwayat order pelanggan.</p>
            </div>
            <Badge variant="secondary" className="w-fit px-3 py-1.5">
              Terdaftar {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: idLocale })}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard title="Total Order" value={String(orders.length)} helper="Seluruh transaksi pelanggan" icon={Package} />
          <SummaryCard title="Nilai Order" value={currency(totalOrderValue)} helper="Akumulasi nilai pesanan" icon={ReceiptText} />
          <SummaryCard title="Sisa Tagihan" value={currency(outstanding)} helper="Piutang yang belum dibayar" icon={WalletCards} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="h-fit border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div><p className="text-xs text-slate-400">Nama</p><p className="font-medium text-slate-900">{customer.name}</p></div>
              </div>
              {customer.companyName && (
                <div className="flex gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div><p className="text-xs text-slate-400">Instansi/Perusahaan</p><p className="font-medium text-slate-900">{customer.companyName}</p></div>
                </div>
              )}
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div><p className="text-xs text-slate-400">Telepon</p><a className="font-medium text-blue-600 hover:underline" href={`https://wa.me/${customer.phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{customer.phone}</a></div>
              </div>
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div><p className="text-xs text-slate-400">Email</p>{customer.email ? <a className="font-medium text-blue-600 hover:underline" href={`mailto:${customer.email}`}>{customer.email}</a> : <p className="text-slate-400">Belum diisi</p>}</div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div><p className="text-xs text-slate-400">Alamat</p><p className="font-medium leading-relaxed text-slate-900">{customer.address || 'Belum diisi'}</p></div>
              </div>
              <div className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div><p className="text-xs text-slate-400">Tanggal Terdaftar</p><p className="font-medium text-slate-900">{format(new Date(customer.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}</p></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Order</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <Package className="h-9 w-9 text-slate-300" />
                  <p className="mt-3 font-medium text-slate-700">Belum ada order</p>
                  <p className="text-sm text-slate-400">Pelanggan ini belum memiliki transaksi.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5">Invoice</TableHead>
                        <TableHead>Status Pembayaran</TableHead>
                        <TableHead>Status Produksi</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="pr-5 text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="pl-5">
                            <p className="font-semibold text-slate-900">{order.invoiceNumber}</p>
                            <p className="text-xs text-slate-400">{format(new Date(order.createdAt), 'dd MMM yyyy', { locale: idLocale })}</p>
                          </TableCell>
                          <TableCell><Badge variant="outline">{paymentLabels[order.paymentStatus] || order.paymentStatus}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{productionLabels[order.productionStatus] || order.productionStatus}</Badge></TableCell>
                          <TableCell className="text-right font-semibold">{currency(Number(order.totalAmount))}</TableCell>
                          <TableCell className="pr-5 text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/admin/orders/${order.id}`}>Cek Detail<ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
