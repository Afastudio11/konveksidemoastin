import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Search, 
  CalendarIcon, 
  X, 
  Eye,
  Activity,
  Users,
  Package,
  Receipt,
  CreditCard,
  UserPlus,
  Warehouse,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  order_create: 'Membuat Order',
  order_update: 'Mengubah Order',
  order_status_update: 'Ubah Status Order',
  order_payment_update: 'Ubah Pembayaran',
  order_delete: 'Hapus Order',
  expense_create: 'Tambah Pengeluaran',
  expense_update: 'Ubah Pengeluaran',
  expense_delete: 'Hapus Pengeluaran',
  customer_create: 'Tambah Pelanggan',
  customer_update: 'Ubah Pelanggan',
  customer_delete: 'Hapus Pelanggan',
  payment_manual: 'Pembayaran Manual',
  payment_confirm_dp: 'Konfirmasi DP',
  payment_confirm_pelunasan: 'Konfirmasi Pelunasan',
  user_create: 'Tambah User',
  user_update: 'Ubah User',
  user_delete: 'Hapus User',
  material_create: 'Tambah Bahan Baku',
  material_update: 'Ubah Bahan Baku',
  material_delete: 'Nonaktifkan Bahan Baku',
  stock_in: 'Stok Masuk',
  stock_out: 'Stok Keluar',
  stock_adjustment: 'Penyesuaian Stok',
  login: 'Login',
  logout: 'Logout',
};

const entityLabels: Record<string, string> = {
  order: 'Order',
  expense: 'Pengeluaran',
  customer: 'Pelanggan',
  payment: 'Pembayaran',
  user: 'User',
  raw_material: 'Bahan Baku',
  session: 'Sesi',
};

const getActionBadge = (actionType: string) => {
  const colors: Record<string, string> = {
    order_create: 'bg-green-500',
    order_update: 'bg-blue-500',
    order_status_update: 'bg-purple-500',
    order_payment_update: 'bg-yellow-500',
    order_delete: 'bg-red-500',
    expense_create: 'bg-green-500',
    expense_update: 'bg-blue-500',
    expense_delete: 'bg-red-500',
    customer_create: 'bg-green-500',
    customer_update: 'bg-blue-500',
    customer_delete: 'bg-red-500',
    payment_manual: 'bg-orange-500',
    payment_confirm_dp: 'bg-cyan-500',
    payment_confirm_pelunasan: 'bg-emerald-500',
    user_create: 'bg-green-500',
    user_update: 'bg-blue-500',
    user_delete: 'bg-red-500',
    material_create: 'bg-green-500',
    material_update: 'bg-blue-500',
    material_delete: 'bg-red-500',
    stock_in: 'bg-emerald-500',
    stock_out: 'bg-orange-500',
    stock_adjustment: 'bg-cyan-500',
    login: 'bg-gray-500',
    logout: 'bg-gray-400',
  };

  return (
    <Badge className={`${colors[actionType] || 'bg-gray-500'} text-white`}>
      {actionLabels[actionType] || actionType}
    </Badge>
  );
};

const getRoleBadge = (role: string) => {
  const colors: Record<string, string> = {
    superadmin: 'bg-purple-600',
    admin: 'bg-blue-600',
    production: 'bg-green-600',
    viewer: 'bg-gray-600',
  };

  const labels: Record<string, string> = {
    superadmin: 'Super Admin',
    admin: 'Admin',
    production: 'Produksi',
    viewer: 'Viewer',
  };

  return (
    <Badge className={`${colors[role] || 'bg-gray-500'} text-white`}>
      {labels[role] || role}
    </Badge>
  );
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'order':
      return <Package className="w-4 h-4" />;
    case 'expense':
      return <Receipt className="w-4 h-4" />;
    case 'customer':
      return <Users className="w-4 h-4" />;
    case 'payment':
      return <CreditCard className="w-4 h-4" />;
    case 'user':
      return <UserPlus className="w-4 h-4" />;
    case 'raw_material':
      return <Warehouse className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

export default function ActivityLogs() {
  const { token, user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [actorId, setActorId] = useState<string>('');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const [startDate, setStartDate] = useState<Date | undefined>(oneMonthAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const params: Record<string, string> = { 
    page: page.toString(), 
    limit: '20' 
  };
  if (search) params.search = search;
  if (actionType) params.actionType = actionType;
  if (entityType) params.entityType = entityType;
  if (actorId) params.actorId = actorId;
  if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
  if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api.auditLogs.list(token!, params),
    enabled: !!token && isSuperAdmin,
  });

  const { data: statsData } = useQuery({
    queryKey: ['audit-logs-stats', { startDate, endDate }],
    queryFn: () => {
      const statsParams: Record<string, string> = {};
      if (startDate) statsParams.startDate = format(startDate, 'yyyy-MM-dd');
      if (endDate) statsParams.endDate = format(endDate, 'yyyy-MM-dd');
      return api.auditLogs.stats(token!, statsParams);
    },
    enabled: !!token && isSuperAdmin,
  });

  const { data: usersData } = useQuery({
    queryKey: ['audit-logs-users'],
    queryFn: () => api.auditLogs.getUsers(token!),
    enabled: !!token && isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
              <p className="text-gray-600">
                Halaman ini hanya dapat diakses oleh Super Admin.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const clearFilters = () => {
    setSearch('');
    setActionType('');
    setEntityType('');
    setActorId('');
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  const hasFilters = search || actionType || entityType || actorId || startDate || endDate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas</h1>
            <p className="text-gray-600 mt-1">
              Pantau semua aktivitas admin untuk mencegah fraud
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img src="/icons/icon-activity.png" alt="Aktivitas" className="w-12 h-12 rounded-lg" />
                <div>
                  <p className="text-sm text-gray-600">Total Aktivitas</p>
                  <p className="text-xl font-bold">{statsData?.totalActivities || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img src="/icons/icon-order.png" alt="Order" className="w-12 h-12 rounded-lg" />
                <div>
                  <p className="text-sm text-gray-600">Order</p>
                  <p className="text-xl font-bold">
                    {statsData?.actionStats?.filter((s: any) => s.actionType.startsWith('order_')).reduce((acc: number, s: any) => acc + Number(s.count), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img src="/icons/icon-expense.png" alt="Pengeluaran" className="w-12 h-12 rounded-lg" />
                <div>
                  <p className="text-sm text-gray-600">Pengeluaran</p>
                  <p className="text-xl font-bold">
                    {statsData?.actionStats?.filter((s: any) => s.actionType.startsWith('expense_')).reduce((acc: number, s: any) => acc + Number(s.count), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <img src="/icons/icon-user.png" alt="User Aktif" className="w-12 h-12 rounded-lg" />
                <div>
                  <p className="text-sm text-gray-600">User Aktif</p>
                  <p className="text-xl font-bold">{statsData?.userStats?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              <Select value={actionType} onValueChange={(v) => { setActionType(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Jenis Aksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  <SelectItem value="order_create">Buat Order</SelectItem>
                  <SelectItem value="order_update">Ubah Order</SelectItem>
                  <SelectItem value="order_status_update">Ubah Status Order</SelectItem>
                  <SelectItem value="order_delete">Hapus Order</SelectItem>
                  <SelectItem value="expense_create">Tambah Pengeluaran</SelectItem>
                  <SelectItem value="expense_update">Ubah Pengeluaran</SelectItem>
                  <SelectItem value="expense_delete">Hapus Pengeluaran</SelectItem>
                  <SelectItem value="payment_manual">Pembayaran Manual</SelectItem>
                  <SelectItem value="user_create">Tambah User</SelectItem>
                  <SelectItem value="user_update">Ubah User</SelectItem>
                  <SelectItem value="user_delete">Hapus User</SelectItem>
                  <SelectItem value="material_create">Tambah Bahan Baku</SelectItem>
                  <SelectItem value="material_update">Ubah Bahan Baku</SelectItem>
                  <SelectItem value="material_delete">Nonaktifkan Bahan Baku</SelectItem>
                  <SelectItem value="stock_in">Stok Masuk</SelectItem>
                  <SelectItem value="stock_out">Stok Keluar</SelectItem>
                  <SelectItem value="stock_adjustment">Penyesuaian Stok</SelectItem>
                </SelectContent>
              </Select>

              <Select value={entityType} onValueChange={(v) => { setEntityType(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Jenis Data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Data</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="customer">Pelanggan</SelectItem>
                  <SelectItem value="payment">Pembayaran</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="raw_material">Bahan Baku</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actorId} onValueChange={(v) => { setActorId(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua User</SelectItem>
                  {usersData?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yy') : 'Dari'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => { setStartDate(date); setPage(1); }}
                    locale={idLocale}
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yy') : 'Sampai'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => { setEndDate(date); setPage(1); }}
                    locale={idLocale}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-4">
                <X className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                Memuat data...
              </div>
            ) : logsData?.logs?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Tidak ada aktivitas yang tercatat
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ringkasan</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData?.logs?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy', { locale: idLocale })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{log.actorName}</span>
                            {getRoleBadge(log.actorRole)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.actionType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entityType)}
                            <span>{entityLabels[log.entityType] || log.entityType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.summary}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {logsData?.pagination && logsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-gray-500">
                      Halaman {logsData.pagination.page} dari {logsData.pagination.totalPages}
                      ({logsData.pagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= logsData.pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Aktivitas</DialogTitle>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Waktu</p>
                    <p className="font-medium">
                      {format(new Date(selectedLog.createdAt), 'dd MMMM yyyy HH:mm:ss', { locale: idLocale })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User</p>
                    <p className="font-medium">{selectedLog.actorName}</p>
                    {getRoleBadge(selectedLog.actorRole)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Aksi</p>
                    {getActionBadge(selectedLog.actionType)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jenis Data</p>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(selectedLog.entityType)}
                      <span>{entityLabels[selectedLog.entityType] || selectedLog.entityType}</span>
                    </div>
                  </div>
                  {selectedLog.entityId && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">ID Data</p>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {selectedLog.entityId}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">Ringkasan</p>
                  <p className="font-medium">{selectedLog.summary}</p>
                </div>

                {selectedLog.beforeState && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Data Sebelum</p>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.beforeState, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.afterState && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Data Sesudah</p>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.afterState, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Metadata</p>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {(selectedLog.ipAddress || selectedLog.userAgent) && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    {selectedLog.ipAddress && (
                      <div>
                        <p className="text-sm text-gray-500">IP Address</p>
                        <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div>
                        <p className="text-sm text-gray-500">User Agent</p>
                        <p className="text-xs text-gray-600 truncate" title={selectedLog.userAgent}>
                          {selectedLog.userAgent}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
