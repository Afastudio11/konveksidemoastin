import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Copy,
  Phone,
  Mail,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  FileText,
  Download,
  Receipt,
  Plus,
  CreditCard,
  Pencil,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const productionStatuses = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'design', label: 'Design' },
  { value: 'beli_bahan', label: 'Beli Bahan' },
  { value: 'potong_printing', label: 'Potong/Printing' },
  { value: 'jahit', label: 'Jahit' },
  { value: 'bordir_sablon', label: 'Bordir/Sablon' },
  { value: 'qc', label: 'Quality Control' },
  { value: 'packing', label: 'Packing' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dikirim', label: 'Dikirim' },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'selesai':
    case 'dikirim':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-gray-500" />;
    default:
      return <Package className="w-4 h-4 text-blue-500" />;
  }
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

export default function OrderDetail() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState<Array<{ materialId: string; quantity: number; notes: string }>>([]);
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    dpAmount: '',
    notes: '',
  });

  const isSuperAdmin = user?.role === 'superadmin';

  const { data: order, isLoading } = useQuery<any>({
    queryKey: ['order', orderId],
    queryFn: () => api.orders.get(token!, orderId!),
    enabled: !!token && !!orderId,
  });

  const { data: paymentInvoices } = useQuery<any[]>({
    queryKey: ['paymentInvoices', orderId],
    queryFn: () => api.invoices.getPaymentInvoices(token!, orderId!),
    enabled: !!token && !!orderId,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', 'order-detail'],
    queryFn: () => api.inventory.list(token!, {}),
    enabled: !!token && materialDialogOpen,
  });

  useEffect(() => {
    if (order?.productionStatus) {
      setSelectedStatus(order.productionStatus);
    }
  }, [order?.productionStatus]);

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      api.orders.updateStatus(token!, orderId!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      toast.success('Status berhasil diupdate');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengupdate status');
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (amount: number) => {
      return api.orders.updatePayment(token!, orderId!, {
        status: 'paid',
        amount: amount,
        paymentMethod: 'manual',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['paymentInvoices', orderId] });
      setPaymentDialogOpen(false);
      setPaymentAmount('');
      setPaymentAmountDisplay('');
      toast.success('Pembayaran berhasil dicatat');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengupdate pembayaran');
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () => api.orders.delete(token!, orderId!),
    onSuccess: () => {
      toast.success('Order berhasil dihapus');
      navigate('/admin/orders');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus order');
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: (data: any) => api.orders.update(token!, orderId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      setEditDialogOpen(false);
      toast.success('Order berhasil diupdate');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengupdate order');
    },
  });

  const updateMaterialsMutation = useMutation({
    mutationFn: () => api.orders.updateMaterials(token!, orderId!, materialForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['financial-reports'] });
      setMaterialDialogOpen(false);
      toast.success('Pemakaian bahan dan stok berhasil diperbarui');
    },
    onError: (error: any) => toast.error(error.message || 'Gagal memperbarui bahan baku'),
  });

  const openMaterialDialog = () => {
    setMaterialForm((order?.materialUsages || []).map((usage: any) => ({
      materialId: usage.materialId,
      quantity: Number(usage.quantity),
      notes: usage.notes || '',
    })));
    setMaterialDialogOpen(true);
  };

  const handleOpenEditDialog = () => {
    if (order) {
      setEditForm({
        customerName: order.customer?.name || '',
        customerPhone: order.customer?.phone || '',
        customerEmail: order.customer?.email || '',
        customerAddress: order.customer?.address || '',
        dpAmount: order.dpAmount?.toString() || '0',
        notes: order.notes || '',
      });
      setEditDialogOpen(true);
    }
  };

  const handleSubmitEdit = () => {
    const data = {
      customer: {
        name: editForm.customerName,
        phone: editForm.customerPhone,
        email: editForm.customerEmail || null,
        address: editForm.customerAddress || null,
      },
      dpAmount: parseInt(editForm.dpAmount) || 0,
      notes: editForm.notes || null,
    };
    updateOrderMutation.mutate(data);
  };

  const handleDeleteOrder = () => {
    deleteOrderMutation.mutate();
  };

  const handlePaymentAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setPaymentAmount(numericValue);
    setPaymentAmountDisplay(numericValue ? formatNumber(parseInt(numericValue)) : '');
  };

  const handleSubmitPayment = () => {
    const amount = parseInt(paymentAmount) || 0;
    if (amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }
    updatePaymentMutation.mutate(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard');
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    updateStatusMutation.mutate(status);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Order tidak ditemukan</div>
        </div>
      </AdminLayout>
    );
  }

  const trackingUrl = `${window.location.origin}/track/${order.trackingCode}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{order.invoiceNumber}</h1>
              <p className="text-muted-foreground">
                Tracking: {order.trackingCode}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => copyToClipboard(trackingUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenEditDialog}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit Order
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Status Produksi</span>
                  <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productionStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={order.productionProgress} className="h-3" />
                  <div className="text-center text-sm text-muted-foreground">
                    {order.productionProgress}% selesai
                  </div>

                  <div className="grid grid-cols-5 gap-2 mt-6">
                    {productionStatuses.slice(0, 10).map((status, index) => {
                      const currentIndex = productionStatuses.findIndex(
                        (s) => s.value === order.productionStatus
                      );
                      const isCompleted = index <= currentIndex;
                      const isCurrent = status.value === order.productionStatus;

                      return (
                        <div
                          key={status.value}
                          className={`text-center p-2 rounded-lg text-xs ${
                            isCurrent
                              ? 'bg-[#CCFF00] text-blue-900 font-bold'
                              : isCompleted
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {status.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detail Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex justify-between items-start p-4 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        {item.productType && (
                          <div className="text-sm text-muted-foreground">
                            Tipe: {item.productType}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {item.size && `Ukuran: ${item.size}`}
                          {item.color && ` | Warna: ${item.color}`}
                        </div>
                        <div className="text-sm">
                          {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                        </div>
                      </div>
                      <div className="font-medium">
                        {formatCurrency(Number(item.subtotal))}
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="font-bold">
                        {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </div>
                    {Number(order.discountAmount) > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Potongan / Diskon</span>
                        <span>-{formatCurrency(Number(order.discountAmount))}</span>
                      </div>
                    )}
                    {Number(order.dpAmount) > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>DP</span>
                          <span>{formatCurrency(Number(order.dpAmount))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sisa</span>
                          <span>{formatCurrency(Number(order.remainingAmount))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5 text-blue-700" />Pemakaian Bahan Baku</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Biaya bahan tercatat ke laporan keuangan order ini.</p>
                </div>
                <Button variant="outline" size="sm" onClick={openMaterialDialog}><Pencil className="mr-2 h-4 w-4" />Kelola Bahan</Button>
              </CardHeader>
              <CardContent>
                {!order.materialUsages?.length ? (
                  <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Belum ada bahan baku yang dialokasikan.</div>
                ) : (
                  <div className="space-y-3">
                    {order.materialUsages.map((usage: any) => <div key={usage.id} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                      <div><p className="font-semibold">{usage.name}</p><p className="text-xs text-muted-foreground">{usage.code} · {usage.category}{usage.notes ? ` · ${usage.notes}` : ''}</p></div>
                      <div className="text-right"><p className="font-semibold">{Number(usage.quantity).toLocaleString('id-ID')} {usage.unit}</p><p className="text-xs text-muted-foreground">{formatCurrency(Number(usage.totalCost))}</p></div>
                    </div>)}
                    <Separator />
                    <div className="flex justify-between font-bold"><span>Total Biaya Bahan</span><span>{formatCurrency(order.materialUsages.reduce((sum: number, usage: any) => sum + Number(usage.totalCost), 0))}</span></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.statusHistory?.map((history: any, index: number) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="mt-1">{getStatusIcon(history.status)}</div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {productionStatuses.find((s) => s.value === history.status)
                            ?.label || history.status}
                        </div>
                        {history.notes && (
                          <div className="text-sm text-muted-foreground">
                            {history.notes}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(history.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: idLocale,
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge
                    className={`${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-500'
                        : order.paymentStatus === 'waiting_pelunasan'
                        ? 'bg-blue-500'
                        : order.paymentStatus === 'dp_paid'
                        ? 'bg-blue-500'
                        : order.paymentStatus === 'waiting_dp'
                        ? 'bg-yellow-500'
                        : order.paymentStatus === 'waiting_payment'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    } text-white`}
                  >
                    {order.paymentStatus === 'paid'
                      ? 'Lunas'
                      : order.paymentStatus === 'waiting_pelunasan'
                      ? 'Menunggu Pelunasan'
                      : order.paymentStatus === 'dp_paid'
                      ? 'DP Lunas'
                      : order.paymentStatus === 'waiting_dp'
                      ? 'Menunggu DP'
                      : order.paymentStatus === 'waiting_payment'
                      ? 'Menunggu Pembayaran'
                      : order.paymentStatus}
                  </Badge>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tagihan</span>
                      <span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span>
                    </div>
                    {Number(order.dpAmount) > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">DP Ditetapkan</span>
                          <span className="text-blue-600">
                            {formatCurrency(Number(order.dpAmount))}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">DP Terbayar</span>
                          <span className={Number(order.paidDpAmount || 0) >= Number(order.dpAmount) ? 'text-green-600 font-medium' : 'text-orange-600'}>
                            {formatCurrency(Number(order.paidDpAmount || 0))}
                          </span>
                        </div>
                      </>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sudah Dibayar</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(Number(order.totalAmount) - Number(order.remainingAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sisa Tagihan</span>
                      <span className={Number(order.remainingAmount) > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                        {formatCurrency(Number(order.remainingAmount))}
                      </span>
                    </div>
                  </div>

                  {order.paymentStatus !== 'paid' && Number(order.remainingAmount) > 0 && (
                    <div className="space-y-2">
                      {(order.paymentStatus === 'waiting_dp' && Number(order.dpAmount) > 0) && (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setPaymentAmount(order.dpAmount?.toString() || '');
                            setPaymentAmountDisplay(formatNumber(Number(order.dpAmount || 0)));
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Konfirmasi DP ({formatCurrency(Number(order.dpAmount))})
                        </Button>
                      )}
                      {(order.paymentStatus === 'waiting_pelunasan' || order.paymentStatus === 'dp_paid') && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setPaymentAmount(order.remainingAmount?.toString() || '');
                            setPaymentAmountDisplay(formatNumber(Number(order.remainingAmount || 0)));
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Konfirmasi Pelunasan ({formatCurrency(Number(order.remainingAmount))})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setPaymentDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Catat Pembayaran Manual
                      </Button>
                    </div>
                  )}

                  {order.paymentDeadline && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Batas Bayar: </span>
                      {format(new Date(order.paymentDeadline), 'dd MMM yyyy', {
                        locale: idLocale,
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Tagihan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Number(order.dpAmount) > 0 && (
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-sm">Tagihan DP</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(Number(order.dpAmount))}
                          </div>
                        </div>
                        <Badge className={Number(order.paidDpAmount || 0) >= Number(order.dpAmount) ? 'bg-green-500' : 'bg-yellow-500'}>
                          {Number(order.paidDpAmount || 0) >= Number(order.dpAmount) ? 'Lunas' : 'Belum Lunas'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            try {
                              await api.invoices.downloadBillingInvoiceHtml(token!, orderId!, 'dp');
                            } catch (error) {
                              toast.error('Gagal membuka invoice');
                            }
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Lihat Invoice
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={async () => {
                            try {
                              await api.invoices.downloadBillingInvoicePdf(token!, orderId!, 'dp');
                            } catch (error) {
                              toast.error('Gagal mendownload PDF');
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">
                          {Number(order.dpAmount) > 0 ? 'Tagihan Pelunasan' : 'Tagihan Pesanan'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Number(order.dpAmount) > 0 
                            ? formatCurrency(Number(order.totalAmount) - Number(order.dpAmount))
                            : formatCurrency(Number(order.totalAmount))
                          }
                        </div>
                      </div>
                      <Badge className={order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {order.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={async () => {
                          try {
                            await api.invoices.downloadBillingInvoiceHtml(token!, orderId!, 'pelunasan');
                          } catch (error) {
                            toast.error('Gagal membuka invoice');
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Lihat Invoice
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={async () => {
                          try {
                            await api.invoices.downloadBillingInvoicePdf(token!, orderId!, 'pelunasan');
                          } catch (error) {
                            toast.error('Gagal mendownload PDF');
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="font-medium text-lg">{order.customer?.name}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {order.customer?.phone}
                    </a>
                  </div>
                  {order.customer?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {order.customer.email}
                    </div>
                  )}
                  {order.customer?.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      {order.customer.address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Invoice Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentInvoices && paymentInvoices.length > 0 ? (
                    paymentInvoices.map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {invoice.invoiceType === 'dp' ? 'Invoice DP' : 'Invoice Pelunasan'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(Number(invoice.amount))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.invoices.downloadPaymentInvoiceHtml(token!, invoice.id);
                              } catch (error) {
                                toast.error('Gagal membuka invoice');
                              }
                            }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.invoices.downloadPaymentInvoicePdf(token!, invoice.id);
                              } catch (error) {
                                toast.error('Gagal mendownload PDF');
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      Belum ada invoice pembayaran
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Link Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-100 rounded-lg text-sm font-mono break-all">
                    {trackingUrl}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => copyToClipboard(trackingUrl)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Salin Link
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${order.customer?.phone?.replace(
                          /\D/g,
                          ''
                        )}?text=${encodeURIComponent(
                          `Halo ${order.customer?.name}, berikut link tracking pesanan Anda:\n\n${trackingUrl}\n\nNomor Invoice: ${order.invoiceNumber}\nNomor Tracking: ${order.trackingCode}`
                        )}`,
                        '_blank'
                      )
                    }
                  >
                    Kirim via WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kelola Bahan Baku Order</DialogTitle>
            <DialogDescription>Perubahan akan mengembalikan alokasi lama lalu memotong stok sesuai daftar terbaru.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto py-3">
            {materialForm.length === 0 && <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada bahan. Tambahkan bahan yang dipakai untuk order ini.</div>}
            {materialForm.map((usage, index) => {
              const selected = inventoryData?.materials?.find((material: any) => material.id === usage.materialId);
              return <div key={index} className="rounded-xl border p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_150px_40px]">
                  <div className="space-y-2"><Label>Bahan Baku</Label><Select value={usage.materialId} onValueChange={(value) => setMaterialForm((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, materialId: value } : item))}>
                    <SelectTrigger><SelectValue placeholder="Pilih bahan" /></SelectTrigger><SelectContent>{inventoryData?.materials?.map((material: any) => <SelectItem key={material.id} value={material.id}
                      disabled={materialForm.some((item, itemIndex) => itemIndex !== index && item.materialId === material.id)}>{material.code} · {material.name} ({Number(material.currentStock).toLocaleString('id-ID')} {material.unit})</SelectItem>)}</SelectContent>
                  </Select></div>
                  <div className="space-y-2"><Label>Jumlah</Label><div className="relative"><Input type="number" min="0.01" step="0.01" value={usage.quantity || ''}
                    onChange={(event) => setMaterialForm((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(event.target.value) } : item))} className={selected ? 'pr-12' : ''} />
                    {selected && <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">{selected.unit}</span>}</div></div>
                  <div className="flex items-end"><Button variant="ghost" size="icon" onClick={() => setMaterialForm((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></div>
                </div>
                <Input className="mt-3" placeholder="Catatan pemakaian (opsional)" value={usage.notes} onChange={(event) => setMaterialForm((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, notes: event.target.value } : item))} />
              </div>;
            })}
            <Button variant="outline" className="w-full" onClick={() => setMaterialForm((current) => [...current, { materialId: '', quantity: 0, notes: '' }])}><Plus className="mr-2 h-4 w-4" />Tambah Bahan</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Batal</Button><Button onClick={() => updateMaterialsMutation.mutate()}
            disabled={updateMaterialsMutation.isPending || materialForm.some((item) => !item.materialId || item.quantity <= 0)} className="bg-blue-700 hover:bg-blue-800">
            {updateMaterialsMutation.isPending ? 'Menyimpan...' : 'Simpan & Potong Stok'}
          </Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sisa yang harus dibayar</Label>
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(Number(order?.remainingAmount || 0))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Jumlah Pembayaran</Label>
              <Input
                id="paymentAmount"
                value={paymentAmountDisplay}
                onChange={(e) => handlePaymentAmountChange(e.target.value)}
                placeholder="Masukkan jumlah pembayaran"
              />
              {parseInt(paymentAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(parseInt(paymentAmount))}
                </p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {parseInt(paymentAmount) > 0 && parseInt(paymentAmount) < Number(order?.remainingAmount || 0) && (
                <p>Ini akan dicatat sebagai pembayaran DP</p>
              )}
              {parseInt(paymentAmount) >= Number(order?.remainingAmount || 0) && (
                <p className="text-green-600">Ini akan melunaskan pesanan</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitPayment}
              disabled={updatePaymentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updatePaymentMutation.isPending ? 'Memproses...' : 'Simpan Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Edit informasi pelanggan dan detail order. Hanya Super Admin yang dapat melakukan perubahan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nama Pelanggan *</Label>
              <Input
                id="customerName"
                value={editForm.customerName}
                onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                placeholder="Nama pelanggan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">No. Telepon *</Label>
              <Input
                id="customerPhone"
                value={editForm.customerPhone}
                onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={editForm.customerEmail}
                onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Alamat</Label>
              <Textarea
                id="customerAddress"
                value={editForm.customerAddress}
                onChange={(e) => setEditForm({ ...editForm, customerAddress: e.target.value })}
                placeholder="Alamat lengkap"
                rows={2}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="dpAmount">Jumlah DP (Rp)</Label>
              <Input
                id="dpAmount"
                type="number"
                value={editForm.dpAmount}
                onChange={(e) => setEditForm({ ...editForm, dpAmount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Catatan tambahan"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmitEdit}
              disabled={updateOrderMutation.isPending || !editForm.customerName || !editForm.customerPhone}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateOrderMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus order <strong>{order?.invoiceNumber}</strong>? 
              Tindakan ini tidak dapat dibatalkan dan semua data terkait order ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
