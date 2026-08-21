import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-500',
    design: 'bg-purple-500',
    beli_bahan: 'bg-orange-500',
    potong_printing: 'bg-blue-500',
    jahit: 'bg-cyan-500',
    bordir_sablon: 'bg-pink-500',
    qc: 'bg-yellow-500',
    packing: 'bg-indigo-500',
    selesai: 'bg-green-500',
    dikirim: 'bg-green-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    design: 'Design',
    beli_bahan: 'Beli Bahan',
    potong_printing: 'Potong/Printing',
    jahit: 'Jahit',
    bordir_sablon: 'Bordir/Sablon',
    qc: 'QC',
    packing: 'Packing',
    selesai: 'Selesai',
    dikirim: 'Dikirim',
  };

  return (
    <Badge className={`${statusColors[status] || 'bg-gray-500'} text-white`}>
      {statusLabels[status] || status}
    </Badge>
  );
};

const getPaymentBadge = (status: string) => {
  const colors: Record<string, string> = {
    waiting_payment: 'bg-yellow-500',
    waiting_dp: 'bg-yellow-500',
    dp_paid: 'bg-blue-500',
    waiting_pelunasan: 'bg-orange-500',
    paid: 'bg-green-500',
    expired: 'bg-red-500',
    cancelled: 'bg-gray-500',
  };

  const labels: Record<string, string> = {
    waiting_payment: 'Belum Bayar',
    waiting_dp: 'Menunggu DP',
    dp_paid: 'DP Dibayar',
    waiting_pelunasan: 'Menunggu Pelunasan',
    paid: 'Lunas',
    expired: 'Kadaluarsa',
    cancelled: 'Dibatalkan',
  };

  return (
    <Badge className={`${colors[status] || 'bg-gray-500'} text-white`}>
      {labels[status] || status}
    </Badge>
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
  const [page, setPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [productionStatus, setProductionStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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

  const getFilterLabel = () => {
    if (filterType === 'month') {
      const monthLabel = months.find(m => m.value === selectedMonth)?.label;
      return `${monthLabel} ${selectedYear}`;
    } else if (filterType === 'date' && startDate && endDate) {
      return `${format(startDate, 'dd MMM', { locale: idLocale })} - ${format(endDate, 'dd MMM yyyy', { locale: idLocale })}`;
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Kelola semua pesanan</p>
          </div>
          <Link to="/admin/orders/new">
            <Button className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]">
              <Plus className="w-4 h-4 mr-2" />
              Buat Order Baru
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status Pembayaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pembayaran</SelectItem>
                    <SelectItem value="waiting_dp">Menunggu DP</SelectItem>
                    <SelectItem value="waiting_pelunasan">Menunggu Pelunasan</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="expired">Kadaluarsa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={productionStatus} onValueChange={setProductionStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status Produksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="beli_bahan">Beli Bahan</SelectItem>
                    <SelectItem value="potong_printing">Potong/Printing</SelectItem>
                    <SelectItem value="jahit">Jahit</SelectItem>
                    <SelectItem value="bordir_sablon">Bordir/Sablon</SelectItem>
                    <SelectItem value="qc">QC</SelectItem>
                    <SelectItem value="packing">Packing</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                    <SelectItem value="dikirim">Dikirim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter Tanggal:</span>
                </div>
                
                <Select value={filterType} onValueChange={(val: 'all' | 'month' | 'date') => setFilterType(val)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Pilih Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="month">Per Bulan</SelectItem>
                    <SelectItem value="date">Rentang Tanggal</SelectItem>
                  </SelectContent>
                </Select>

                {filterType === 'month' && (
                  <>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Tahun" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year.value} value={year.value}>
                            {year.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {filterType === 'date' && (
                  <>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'dd/MM/yyyy') : 'Dari'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">-</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'dd/MM/yyyy') : 'Sampai'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}

                {filterType !== 'all' && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                )}

                {getFilterLabel() && (
                  <Badge variant="outline" className="text-sm ml-auto">
                    {getFilterLabel()}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : !data?.orders?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada order
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pembayaran</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            {order.invoiceNumber}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {order.trackingCode}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{order.customer?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.customer?.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(Number(order.totalAmount))}
                          </TableCell>
                          <TableCell>
                            {getPaymentBadge(order.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(order.productionStatus)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link to={`/admin/orders/${order.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {data.pagination && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Total: {data.pagination.total} order
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
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
