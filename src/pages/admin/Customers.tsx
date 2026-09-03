import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from '@/components/ui/label';
import {
  Search,
  Phone,
  Mail,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Pencil,
  Trash2,
  FileDown,
  Loader2,
  Users,
  UserCheck,
  Building,
  Calendar,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

type SortField = 'name' | 'phone' | 'email' | 'companyName' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function AdminCustomers() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [isExporting, setIsExporting] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin';

  const params: Record<string, string> = { page: page.toString(), limit: '10' };
  if (search) params.search = search;

  const { data, isLoading } = useQuery<any>({
    queryKey: ['customers', params],
    queryFn: () => api.customers.list(token!, params),
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; formData: any }) =>
      api.customers.update(token!, data.id, data.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditDialogOpen(false);
      setSelectedCustomer(null);
      toast.success('Data pelanggan berhasil diperbarui');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal memperbarui data pelanggan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.customers.delete(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      toast.success('Pelanggan berhasil dihapus');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus pelanggan');
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-foreground" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-foreground" />
    );
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (customer: any) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCustomer) return;
    updateMutation.mutate({ id: selectedCustomer.id, formData: editForm });
  };

  const handleConfirmDelete = () => {
    if (!selectedCustomer) return;
    deleteMutation.mutate(selectedCustomer.id);
  };

  const handleExportPdf = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      await api.customers.exportPdf(token, search ? { search } : undefined);
      toast.success('Data pelanggan berhasil didownload');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengexport data');
    } finally {
      setIsExporting(false);
    }
  };

  const sortedCustomers = useMemo(() => {
    if (!data?.customers) return [];
    return [...data.customers].sort((a: any, b: any) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data?.customers, sortField, sortDirection]);

  // Derived stats from data
  const stats = useMemo(() => {
    const total = data?.pagination?.total || data?.customers?.length || 0;
    const withCompany = data?.customers?.filter((c: any) => !!c.companyName)?.length || 0;
    const withEmail = data?.customers?.filter((c: any) => !!c.email)?.length || 0;
    return { total, withCompany, withEmail };
  }, [data]);

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 pb-6 w-full">
        {/* Header - Square UI Leads */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Direktori Pelanggan
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Kelola database kontak pelanggan, instansi bisnis, dan riwayat pemesanan.
            </p>
          </div>
          {isSuperAdmin && (
            <Button
              onClick={handleExportPdf}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="h-9 text-xs border-border bg-card shadow-2xs gap-2 font-medium"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              Export PDF
            </Button>
          )}
        </div>

        {/* 4-Stat Metric Cards - Square UI Divider Layout */}
        <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Users className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Pelanggan</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.total}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Building className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Klien Instansi / Bisnis</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.withCompany}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Mail className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Kontak Email Terverifikasi</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {stats.withEmail}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter & Customer Table Card */}
        <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama, instansi, atau nomor telepon..."
                className="pl-9 h-9 text-xs sm:text-sm rounded-lg border-border bg-muted/20 focus:bg-background transition-colors"
              />
            </div>
            {data?.pagination && (
              <div className="text-xs text-muted-foreground shrink-0 font-medium">
                Total: <span className="text-foreground font-semibold">{data.pagination.total}</span> pelanggan
              </div>
            )}
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Memuat data pelanggan...</span>
              </div>
            ) : !sortedCustomers.length ? (
              <div className="text-center py-16 text-xs text-muted-foreground">
                <Users className="size-8 mx-auto mb-2 opacity-40" />
                <p>Tidak ada data pelanggan yang sesuai.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40 border-b border-border">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-4">
                          <button
                            onClick={() => handleSort('name')}
                            className="flex items-center hover:text-foreground transition-colors font-semibold"
                          >
                            Pelanggan
                            {getSortIcon('name')}
                          </button>
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('companyName')}
                            className="flex items-center hover:text-foreground transition-colors font-semibold"
                          >
                            Instansi / Usaha
                            {getSortIcon('companyName')}
                          </button>
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('phone')}
                            className="flex items-center hover:text-foreground transition-colors font-semibold"
                          >
                            WhatsApp / Telepon
                            {getSortIcon('phone')}
                          </button>
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('email')}
                            className="flex items-center hover:text-foreground transition-colors font-semibold"
                          >
                            Email
                            {getSortIcon('email')}
                          </button>
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          <button
                            onClick={() => handleSort('createdAt')}
                            className="flex items-center hover:text-foreground transition-colors font-semibold"
                          >
                            Terdaftar
                            {getSortIcon('createdAt')}
                          </button>
                        </TableHead>
                        <TableHead className="h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">
                          Aksi
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedCustomers.map((customer: any) => {
                        const cleanPhone = customer.phone?.replace(/\D/g, '') || '';
                        const initials = (customer.name || 'P')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n: string) => n[0]?.toUpperCase())
                          .join('');

                        return (
                          <TableRow
                            key={customer.id}
                            className="hover:bg-muted/30 border-b border-border/50 transition-colors"
                          >
                            {/* Pelanggan */}
                            <TableCell className="py-3 pl-4">
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-muted border border-border/70 flex items-center justify-center font-bold text-xs text-foreground shrink-0 shadow-2xs">
                                  {initials}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/admin/customers/${customer.id}`}
                                    className="font-semibold text-xs sm:text-sm text-foreground hover:underline truncate block"
                                  >
                                    {customer.name}
                                  </Link>
                                  <span className="text-[11px] text-muted-foreground block truncate">
                                    ID: #{customer.id?.substring(0, 6)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Instansi */}
                            <TableCell className="py-3">
                              {customer.companyName ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/80 text-foreground border border-border/60">
                                  <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="truncate max-w-[140px]">{customer.companyName}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/60">—</span>
                              )}
                            </TableCell>

                            {/* Telepon */}
                            <TableCell className="py-3">
                              {customer.phone ? (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-emerald-600 transition-colors group"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="font-mono text-[11px]">{customer.phone}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground/60">—</span>
                              )}
                            </TableCell>

                            {/* Email */}
                            <TableCell className="py-3">
                              {customer.email ? (
                                <a
                                  href={`mailto:${customer.email}`}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[160px] block"
                                >
                                  {customer.email}
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground/60">—</span>
                              )}
                            </TableCell>

                            {/* Terdaftar */}
                            <TableCell className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                            </TableCell>

                            {/* Aksi */}
                            <TableCell className="py-3 text-right pr-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link to={`/admin/customers/${customer.id}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs rounded-lg font-medium border-border gap-1 hover:bg-muted"
                                  >
                                    <span>Detail</span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                  </Button>
                                </Link>

                                {isSuperAdmin && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(customer)}
                                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                                      title="Edit pelanggan"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(customer)}
                                      className="size-7 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                      title="Hapus pelanggan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {data.pagination && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/70 text-xs">
                    <div className="text-muted-foreground">
                      Menampilkan halaman{' '}
                      <span className="font-semibold text-foreground">{page}</span> dari{' '}
                      <span className="font-semibold text-foreground">{data.pagination.totalPages || 1}</span> ({data.pagination.total} total)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs rounded-lg"
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Edit Data Pelanggan</DialogTitle>
              <DialogDescription className="text-xs">
                Perbarui informasi identitas dan kontak pelanggan.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3.5 py-3">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="phone" className="text-xs font-medium">Nomor WhatsApp / Telepon</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="address" className="text-xs font-medium">Alamat</Label>
                <Input
                  id="address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setEditDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="sm:max-w-[420px] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold">Hapus Pelanggan?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs leading-relaxed">
                Apakah Anda yakin ingin menghapus <strong>{selectedCustomer?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="h-8 text-xs">Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium"
              >
                {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
