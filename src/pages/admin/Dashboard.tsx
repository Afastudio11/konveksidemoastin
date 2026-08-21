import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  Plus,
  Eye,
  CalendarIcon,
  X,
  FileSpreadsheet,
  FileText,
  Download,
  BarChart3,
  ShoppingBag,
  Palette,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

import iconProdukTerlaris from '@/assets/icon-produk-terlaris.png';
import iconTipeProduk from '@/assets/icon-tipe-produk.png';
import iconWarnaTerlaris from '@/assets/icon-warna-terlaris.png';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getColorCode = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'Hitam': '#000000',
    'Putih': '#FFFFFF',
    'Navy': '#001F3F',
    'Merah': '#E53935',
    'Biru': '#1E88E5',
    'Hijau': '#43A047',
    'Abu-abu': '#9E9E9E',
    'Kuning': '#FDD835',
    'Orange': '#FB8C00',
    'Coklat': '#795548',
    'Maroon': '#800000',
    'Cream': '#FFFDD0',
    'Pink': '#E91E63',
    'Ungu': '#9C27B0',
  };
  return colorMap[colorName] || '#808080';
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

export default function AdminDashboard() {
  const { token } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'month' | 'date'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getFilterParams = () => {
    const params: Record<string, string> = {};
    if (filterType === 'month') {
      params.month = selectedMonth;
      params.year = selectedYear;
    } else if (filterType === 'date' && startDate && endDate) {
      params.startDate = format(startDate, 'yyyy-MM-dd');
      params.endDate = format(endDate, 'yyyy-MM-dd');
    }
    return params;
  };

  const filterParams = getFilterParams();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', filterParams],
    queryFn: () => api.dashboard.stats(token!, filterParams),
    enabled: !!token,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders', filterParams],
    queryFn: () => api.dashboard.recentOrders(token!, filterParams),
    enabled: !!token,
  });

  const { data: productAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['product-analytics', filterParams],
    queryFn: () => api.dashboard.productAnalytics(token!, filterParams),
    enabled: !!token,
  });

  const exportExcelMutation = useMutation({
    mutationFn: () => api.dashboard.exportExcel(token!, filterParams),
    onSuccess: () => {
      toast.success('Export Excel berhasil!');
    },
    onError: () => {
      toast.error('Gagal export Excel');
    },
  });

  const exportPdfMutation = useMutation({
    mutationFn: () => api.dashboard.exportPdf(token!, filterParams),
    onSuccess: () => {
      toast.success('Export PDF berhasil!');
    },
    onError: () => {
      toast.error('Gagal export PDF');
    },
  });

  const clearFilters = () => {
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
    return 'Semua Waktu';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Selamat datang di Sekala Industry Admin</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending}
            >
              {exportExcelMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => exportPdfMutation.mutate()}
              disabled={exportPdfMutation.isPending}
            >
              {exportPdfMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Link to="/admin/orders/new">
              <Button className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]">
                <Plus className="w-4 h-4 mr-2" />
                Buat Order Baru
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter Periode:</span>
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
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}

              <div className="ml-auto">
                <Badge variant="outline" className="text-sm">
                  {getFilterLabel()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Order</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Aktif</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selesai</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedOrders || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DP Terbayar</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.paidDpAmount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nominal Tertahan</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats?.pendingAmount || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {filterType === 'all' ? 'Revenue (Lunas)' : 'Revenue Periode'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.monthlyRevenue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900 to-blue-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">
                {filterType === 'all' ? 'Total Omzet Keseluruhan' : 'Omzet Periode'}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-[#CCFF00]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#CCFF00]">
                {formatCurrency(filterType === 'all' ? stats?.totalOmzetAllTime : stats?.totalOmzet || 0)}
              </div>
              <p className="text-xs text-blue-200 mt-1">
                {filterType === 'all' ? 'Total omzet semua waktu' : `Total omzet periode ${getFilterLabel()}`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src={iconProdukTerlaris} alt="Produk Terlaris" className="h-12 w-12 rounded-full" />
                Produk Terlaris
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : !productAnalytics?.productSales?.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  Belum ada data produk
                </div>
              ) : (
                <div className="space-y-4">
                  {productAnalytics.productSales.slice(0, 5).map((product, index) => {
                    const maxQty = productAnalytics.productSales[0]?.totalQuantity || 1;
                    const percentage = (product.totalQuantity / maxQty) * 100;
                    return (
                      <div key={product.productName} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              #{index + 1}
                            </span>
                            <span className="font-medium text-sm">{product.productName}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{product.totalQuantity.toLocaleString('id-ID')} pcs</div>
                            <div className="text-xs text-muted-foreground">{formatCurrency(product.totalRevenue)}</div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img src={iconTipeProduk} alt="Kategori Terlaris" className="h-12 w-12 rounded-full" />
                Kategori Terlaris
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : !productAnalytics?.productCategorySales?.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  Belum ada data kategori produk
                </div>
              ) : (
                <div className="space-y-4">
                  {productAnalytics.productCategorySales.slice(0, 5).map((category, index) => {
                    const maxQty = productAnalytics.productCategorySales[0]?.totalQuantity || 1;
                    const percentage = (category.totalQuantity / maxQty) * 100;
                    const categoryLabel = category.productCategory === 'konveksi' ? 'Konveksi' : category.productCategory === 'percetakan' ? 'Percetakan' : category.productCategory;
                    return (
                      <div key={category.productCategory} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              #{index + 1}
                            </span>
                            <span className="font-medium text-sm">{categoryLabel}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-sm">{category.totalQuantity.toLocaleString('id-ID')} pcs</div>
                            <div className="text-xs text-muted-foreground">{category.orderCount} order</div>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2 [&>div]:bg-green-500" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <img src={iconWarnaTerlaris} alt="Warna Terlaris" className="h-12 w-12 rounded-full" />
              Warna Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : !productAnalytics?.colorSales?.length ? (
              <div className="text-center py-4 text-muted-foreground">
                Belum ada data warna
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {productAnalytics.colorSales.slice(0, 10).map((color, index) => (
                  <div key={color.color} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ 
                        backgroundColor: getColorCode(color.color)
                      }}
                    />
                    <span className="font-medium text-sm">{color.color}</span>
                    <Badge variant="secondary" className="text-xs">
                      {color.totalQuantity.toLocaleString('id-ID')} pcs
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : !recentOrders?.orders?.length ? (
              <div className="text-center py-4 text-muted-foreground">
                Belum ada order
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{order.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.customer?.name} - {order.trackingCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(Number(order.totalAmount))}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {getPaymentBadge(order.paymentStatus)}
                          {getStatusBadge(order.productionStatus)}
                        </div>
                      </div>
                      <Link to={`/admin/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
