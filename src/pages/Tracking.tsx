import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import {
  Package,
  Clock,
  CheckCircle,
  Palette,
  ShoppingCart,
  Scissors,
  Settings,
  Paintbrush,
  ClipboardCheck,
  Box,
  Truck,
  Search,
  Phone,
  CreditCard,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  design: Palette,
  beli_bahan: ShoppingCart,
  potong_printing: Scissors,
  jahit: Settings,
  bordir_sablon: Paintbrush,
  qc: ClipboardCheck,
  packing: Box,
  selesai: CheckCircle,
  dikirim: Truck,
};

export default function Tracking() {
  const { trackingCode: paramCode } = useParams();
  const [searchParams] = useSearchParams();
  const [inputCode, setInputCode] = useState(paramCode || searchParams.get('code') || '');
  const [searchCode, setSearchCode] = useState(paramCode || searchParams.get('code') || '');

  const { data: order, isLoading, error } = useQuery<any>({
    queryKey: ['tracking', searchCode],
    queryFn: () => api.tracking.get(searchCode),
    enabled: !!searchCode,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setSearchCode(inputCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      <Header />

      <main className="container mx-auto px-4 py-8 pt-32 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <div className="max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Lacak Pesanan</h1>
            <p className="text-blue-200">Masukkan kode tracking untuk melihat status pesanan Anda</p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode tracking (contoh: ABCD1234)"
                  className="flex-1 uppercase font-mono"
                />
                <Button type="submit" className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]">
                  <Search className="w-4 h-4 mr-2" />
                  Cari
                </Button>
              </form>
            </CardContent>
          </Card>

          {isLoading && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Mencari pesanan...</p>
              </CardContent>
            </Card>
          )}

          {error && searchCode && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Pesanan Tidak Ditemukan</h3>
                <p className="text-red-600">
                  Kode tracking "{searchCode}" tidak ditemukan. Pastikan kode yang Anda masukkan benar.
                </p>
              </CardContent>
            </Card>
          )}

          {order && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detail Pesanan</CardTitle>
                    <Badge
                      className={`${
                        order.paymentStatus === 'paid'
                          ? 'bg-green-500'
                          : order.paymentStatus === 'waiting_payment'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      } text-white`}
                    >
                      {order.paymentStatusLabel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Tracking Code</div>
                      <div className="font-mono font-bold text-lg">{order.trackingCode}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Invoice</div>
                      <div className="font-medium">{order.invoiceNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Pelanggan</div>
                      <div className="font-medium">{order.customerName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-bold text-lg">{formatCurrency(Number(order.totalAmount))}</div>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Produk yang Dipesan</h4>
                      <div className="space-y-2">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                            <div>
                              <span className="font-medium">{item.productName}</span>
                              {item.productType && <span className="text-muted-foreground"> - {item.productType}</span>}
                              {item.size && <span className="text-muted-foreground"> | {item.size}</span>}
                              {item.color && <span className="text-muted-foreground"> | {item.color}</span>}
                            </div>
                            <span>{item.quantity} pcs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Produksi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">{order.productionProgress}%</div>
                    <Progress value={order.productionProgress} className="h-4 mb-2" />
                    <Badge className="bg-[#CCFF00] text-blue-900 text-lg px-4 py-1">
                      {order.productionStatusLabel}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {order.productionSteps?.map((step: any, index: number) => {
                      const Icon = statusIcons[step.key] || Package;
                      const isCompleted = index <= order.currentStepIndex;
                      const isCurrent = index === order.currentStepIndex;

                      return (
                        <div
                          key={step.key}
                          className={`flex flex-col items-center text-center p-2 rounded-lg transition-all ${
                            isCurrent
                              ? 'bg-[#CCFF00] text-blue-900 scale-110 shadow-lg'
                              : isCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-medium leading-tight">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {order.statusHistory && order.statusHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Riwayat Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.statusHistory.map((history: any, index: number) => {
                        const Icon = statusIcons[history.status] || Package;
                        return (
                          <div key={index} className="flex items-start gap-4">
                            <div
                              className={`p-2 rounded-full ${
                                index === 0 ? 'bg-[#CCFF00] text-blue-900' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{history.statusLabel}</div>
                              {history.notes && (
                                <div className="text-sm text-muted-foreground">{history.notes}</div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(history.createdAt), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.paymentStatus !== 'paid' && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-yellow-900">Menunggu Pembayaran</h4>
                        <p className="text-sm text-yellow-700">
                          Sisa: {formatCurrency(Number(order.remainingAmount || order.totalAmount))}
                        </p>
                      </div>
                      <Link to={`/pay/${order.trackingCode}`}>
                        <Button className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Bayar Sekarang
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <a 
                  href={`/api/invoice/public/${order.trackingCode}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Download Invoice
                  </Button>
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <Phone className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
