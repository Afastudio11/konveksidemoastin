import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Pencil, Trash2, Search, ArrowLeft, FolderOpen, AlertCircle, CheckCircle2, X, FileDown, Loader2, ChevronLeft, ChevronRight, Lock, Eye } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isAfter, isBefore, isEqual } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('id-ID').format(value);
};

interface ExpenseFormData {
  date: string;
  customerId: string;
  orderId: string;
  projectName: string;
  itemName: string;
  vendorName: string;
  quantity: number;
  unitPrice: number;
  workStatus: 'proses' | 'selesai';
  vendorPaymentStatus: 'belum' | 'lunas';
  notes: string;
}

const defaultFormData: ExpenseFormData = {
  date: new Date().toISOString().split('T')[0],
  customerId: '',
  orderId: '',
  projectName: '',
  itemName: '',
  vendorName: '',
  quantity: 1,
  unitPrice: 0,
  workStatus: 'proses',
  vendorPaymentStatus: 'belum',
  notes: '',
};

interface ProjectSummary {
  projectKey: string;
  projectName: string;
  customerName: string | null;
  customerId: string | null;
  totalExpenses: number;
  totalItems: number;
  unpaidCount: number;
  unpaidAmount: number;
  inProgressCount: number;
  expenseIds: string[];
}

export default function Expenses() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(defaultFormData);
  const [priceDisplay, setPriceDisplay] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkStatus, setFilterWorkStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth.getMonth() === now.getMonth() && 
           selectedMonth.getFullYear() === now.getFullYear();
  }, [selectedMonth]);
  
  const isMonthLocked = useMemo(() => {
    const now = new Date();
    const firstOfCurrentMonth = startOfMonth(now);
    const selectedMonthStart = startOfMonth(selectedMonth);
    return isBefore(selectedMonthStart, firstOfCurrentMonth);
  }, [selectedMonth]);

  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);

  const handlePreviousMonth = () => {
    if (isCurrentMonth) {
      const prevMonth = subMonths(selectedMonth, 1);
      setSelectedMonth(prevMonth);
      setSelectedProject(null);
    }
  };

  const handleNextMonth = () => {
    if (!isCurrentMonth) {
      const nextMonth = new Date(selectedMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setSelectedMonth(nextMonth);
      setSelectedProject(null);
    }
  };

  const canGoPrevious = useMemo(() => {
    return isCurrentMonth;
  }, [isCurrentMonth]);

  const handleExportPdf = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const params: Record<string, string> = {
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      };
      await api.expenses.exportPdf(token, params);
      toast.success(`Laporan ${format(selectedMonth, 'MMMM yyyy', { locale: idLocale })} berhasil diexport ke PDF`);
    } catch (error) {
      toast.error('Gagal mengexport laporan ke PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', searchTerm, filterWorkStatus, filterPaymentStatus, monthStart.toISOString(), monthEnd.toISOString()],
    queryFn: () => {
      const params: Record<string, string> = { 
        limit: '500',
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      };
      if (searchTerm) params.search = searchTerm;
      if (filterWorkStatus) params.workStatus = filterWorkStatus;
      if (filterPaymentStatus) params.vendorPaymentStatus = filterPaymentStatus;
      return api.expenses.list(token!, params);
    },
    enabled: !!token,
  });

  const { data: customers } = useQuery({
    queryKey: ['expense-customers'],
    queryFn: () => api.expenses.getCustomers(token!),
    enabled: !!token,
  });

  const { data: customerOrders } = useQuery({
    queryKey: ['expense-orders', formData.customerId],
    queryFn: () => api.expenses.getOrdersByCustomer(token!, formData.customerId),
    enabled: !!token && !!formData.customerId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.expenses.create(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Pengeluaran berhasil ditambahkan');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menambahkan pengeluaran');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.expenses.update(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Pengeluaran berhasil diupdate');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal mengupdate pengeluaran');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.expenses.delete(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Pengeluaran berhasil dihapus');
      setDeleteDialogOpen(false);
      setSelectedExpense(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus pengeluaran');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (expenseIds: string[]) => {
      for (const id of expenseIds) {
        await api.expenses.delete(token!, id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Semua pengeluaran project berhasil dihapus');
      setDeleteProjectDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus pengeluaran project');
    },
  });

  const handleDeleteProject = (e: React.MouseEvent, project: ProjectSummary) => {
    e.stopPropagation();
    if (isMonthLocked) {
      toast.error('Data bulan lalu tidak dapat dihapus');
      return;
    }
    setProjectToDelete(project);
    setDeleteProjectDialogOpen(true);
  };

  const handleOpenDialog = (expense?: any) => {
    if (isMonthLocked && !expense) {
      toast.error('Tidak dapat menambah pengeluaran ke bulan yang sudah terkunci');
      return;
    }
    if (isMonthLocked && expense) {
      toast.error('Data bulan lalu tidak dapat diedit');
      return;
    }
    
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        customerId: expense.customerId || '',
        orderId: expense.orderId || '',
        projectName: expense.projectName || '',
        itemName: expense.itemName || '',
        vendorName: expense.vendorName || '',
        quantity: expense.quantity || 1,
        unitPrice: Number(expense.unitPrice) || 0,
        workStatus: expense.workStatus || 'proses',
        vendorPaymentStatus: expense.vendorPaymentStatus || 'belum',
        notes: expense.notes || '',
      });
      setPriceDisplay(formatNumber(Number(expense.unitPrice) || 0));
    } else {
      setSelectedExpense(null);
      setFormData({
        ...defaultFormData,
        projectName: selectedProject || '',
      });
      setPriceDisplay('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedExpense(null);
    setFormData(defaultFormData);
    setPriceDisplay('');
  };

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setPriceDisplay(numericValue ? formatNumber(parseInt(numericValue)) : '');
    setFormData({ ...formData, unitPrice: parseInt(numericValue) || 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName) {
      toast.error('Nama barang/jasa wajib diisi');
      return;
    }

    const submitData = {
      ...formData,
      customerId: formData.customerId || null,
      orderId: formData.orderId || null,
    };

    if (selectedExpense) {
      updateMutation.mutate({ id: selectedExpense.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const totalValue = formData.quantity * formData.unitPrice;

  const projectSummaries: ProjectSummary[] = [];
  if (data?.expenses) {
    const projectMap = new Map<string, ProjectSummary>();
    
    data.expenses.forEach((expense: any) => {
      const projectKey = expense.projectName || expense.customer?.name || 'Lainnya';
      
      if (!projectMap.has(projectKey)) {
        projectMap.set(projectKey, {
          projectKey,
          projectName: expense.projectName || '',
          customerName: expense.customer?.name || null,
          customerId: expense.customerId || null,
          totalExpenses: 0,
          totalItems: 0,
          unpaidCount: 0,
          unpaidAmount: 0,
          inProgressCount: 0,
          expenseIds: [],
        });
      }
      
      const summary = projectMap.get(projectKey)!;
      summary.totalExpenses += Number(expense.totalValue) || 0;
      summary.totalItems += 1;
      summary.expenseIds.push(expense.id);
      
      if (expense.vendorPaymentStatus === 'belum') {
        summary.unpaidCount += 1;
        summary.unpaidAmount += Number(expense.totalValue) || 0;
      }
      
      if (expense.workStatus === 'proses') {
        summary.inProgressCount += 1;
      }
    });
    
    projectMap.forEach((summary) => {
      projectSummaries.push(summary);
    });
    
    projectSummaries.sort((a, b) => b.unpaidAmount - a.unpaidAmount);
  }

  const filteredExpenses = selectedProject
    ? data?.expenses?.filter((expense: any) => {
        const projectKey = expense.projectName || expense.customer?.name || 'Lainnya';
        return projectKey === selectedProject;
      })
    : [];

  const selectedProjectSummary = projectSummaries.find(p => p.projectKey === selectedProject);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Beban Pengeluaran Produksi</h1>
            <p className="text-muted-foreground">Kelola pengeluaran operasional dan produksi</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportPdf} 
              variant="outline"
              disabled={isExporting}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
            {!isMonthLocked && (
              <Button onClick={() => handleOpenDialog()} className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengeluaran
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-gradient-to-r from-blue-600 to-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousMonth}
                disabled={!canGoPrevious}
                className="text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">
                  {format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}
                </h2>
                {isMonthLocked ? (
                  <Badge className="bg-red-500 text-white flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Terkunci
                  </Badge>
                ) : (
                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Aktif
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
                className="text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            
            {isMonthLocked && (
              <p className="text-center text-white/80 text-sm mt-2">
                Data bulan ini telah dikunci secara otomatis dan hanya dapat dilihat atau didownload
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Pengeluaran</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(data?.summary?.totalExpenses || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Jumlah Project</div>
              <div className="text-xl font-bold">{projectSummaries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Belum Dibayar</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(projectSummaries.reduce((sum, p) => sum + p.unpaidAmount, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Dalam Proses</div>
              <div className="text-xl font-bold text-yellow-600">
                {projectSummaries.reduce((sum, p) => sum + p.inProgressCount, 0)} item
              </div>
            </CardContent>
          </Card>
        </div>

        {!selectedProject ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari project atau pelanggan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : projectSummaries.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada data pengeluaran untuk bulan {format(selectedMonth, 'MMMM yyyy', { locale: idLocale })}</p>
                </div>
              ) : (
                projectSummaries.map((project) => (
                  <Card 
                    key={project.projectKey} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow border-l-4 relative group ${
                      isMonthLocked ? 'border-l-gray-400' : 'border-l-blue-500'
                    }`}
                    onClick={() => setSelectedProject(project.projectKey)}
                  >
                    {!isMonthLocked && (
                      <button
                        onClick={(e) => handleDeleteProject(e, project)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Hapus Project"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {isMonthLocked && (
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between pr-8">
                        <span className="truncate">
                          {project.customerName || project.projectName || 'Lainnya'}
                        </span>
                        {project.unpaidCount > 0 ? (
                          <Badge variant="destructive" className="ml-2 flex-shrink-0">
                            {project.unpaidCount} belum bayar
                          </Badge>
                        ) : (
                          <Badge className="ml-2 bg-green-500 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Lunas
                          </Badge>
                        )}
                      </CardTitle>
                      {project.projectName && project.customerName && (
                        <p className="text-sm text-muted-foreground">{project.projectName}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Pengeluaran</span>
                          <span className="font-semibold">{formatCurrency(project.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Jumlah Item</span>
                          <span>{project.totalItems} item</span>
                        </div>
                        {project.unpaidAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Belum Dibayar
                            </span>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(project.unpaidAmount)}
                            </span>
                          </div>
                        )}
                        {project.inProgressCount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-yellow-600">Dalam Proses</span>
                            <span className="text-yellow-600">{project.inProgressCount} item</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">
                    {selectedProjectSummary?.customerName || selectedProjectSummary?.projectName || 'Lainnya'}
                  </h2>
                  {isMonthLocked && (
                    <Badge className="bg-gray-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Hanya Lihat
                    </Badge>
                  )}
                </div>
                {selectedProjectSummary?.projectName && selectedProjectSummary?.customerName && (
                  <p className="text-sm text-muted-foreground">{selectedProjectSummary.projectName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Total Project</div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(selectedProjectSummary?.totalExpenses || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Jumlah Item</div>
                  <div className="text-xl font-bold">{selectedProjectSummary?.totalItems || 0}</div>
                </CardContent>
              </Card>
              <Card className={selectedProjectSummary?.unpaidAmount ? 'bg-red-50' : 'bg-green-50'}>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Belum Dibayar</div>
                  <div className={`text-xl font-bold ${selectedProjectSummary?.unpaidAmount ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedProjectSummary?.unpaidAmount || 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Dalam Proses</div>
                  <div className="text-xl font-bold text-yellow-600">
                    {selectedProjectSummary?.inProgressCount || 0} item
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <Select value={filterWorkStatus} onValueChange={setFilterWorkStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status Kerja" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="proses">Proses</SelectItem>
                      <SelectItem value="selesai">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status Bayar Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Pembayaran</SelectItem>
                      <SelectItem value="belum">Belum Lunas</SelectItem>
                      <SelectItem value="lunas">Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isMonthLocked && (
                    <Button 
                      onClick={() => handleOpenDialog()} 
                      className="ml-auto bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Pengeluaran
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-900 hover:bg-blue-900">
                        <TableHead className="text-white">Tanggal</TableHead>
                        <TableHead className="text-white">Nama Barang</TableHead>
                        <TableHead className="text-white">Vendor</TableHead>
                        <TableHead className="text-white text-center">Qty</TableHead>
                        <TableHead className="text-white text-right">Harga Satuan</TableHead>
                        <TableHead className="text-white text-right">Total</TableHead>
                        <TableHead className="text-white text-center">Status</TableHead>
                        <TableHead className="text-white text-center">Pembayaran</TableHead>
                        {!isMonthLocked && (
                          <TableHead className="text-white text-center">Aksi</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isMonthLocked ? 8 : 9} className="text-center py-8 text-muted-foreground">
                            Belum ada data pengeluaran untuk project ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExpenses?.map((expense: any) => (
                          <TableRow key={expense.id}>
                            <TableCell>
                              {expense.date
                                ? format(new Date(expense.date), 'dd/MM/yy', { locale: idLocale })
                                : '-'}
                            </TableCell>
                            <TableCell className="font-medium">{expense.itemName}</TableCell>
                            <TableCell>{expense.vendorName || '-'}</TableCell>
                            <TableCell className="text-center">{expense.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Number(expense.unitPrice))}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(expense.totalValue))}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={expense.workStatus === 'selesai' ? 'bg-green-500' : 'bg-yellow-500'}
                              >
                                {expense.workStatus === 'selesai' ? 'SELESAI' : 'PROSES'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                className={expense.vendorPaymentStatus === 'lunas' ? 'bg-green-500' : 'bg-red-500'}
                              >
                                {expense.vendorPaymentStatus === 'lunas' ? 'LUNAS' : 'BELUM'}
                              </Badge>
                            </TableCell>
                            {!isMonthLocked && (
                              <TableCell>
                                <div className="flex justify-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenDialog(expense)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedExpense(expense);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Pelanggan</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value) => setFormData({ ...formData, customerId: value, orderId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih pelanggan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">- Tidak ada -</SelectItem>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectName">Nama Project</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Nama project (opsional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderId">Order Terkait</Label>
                <Select
                  value={formData.orderId}
                  onValueChange={(value) => setFormData({ ...formData, orderId: value })}
                  disabled={!formData.customerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.customerId ? "Pilih order" : "Pilih pelanggan dulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">- Tidak ada -</SelectItem>
                    {customerOrders?.map((order: any) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.invoiceNumber} - {order.trackingCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemName">Nama Barang/Jasa *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="Contoh: Kain, Kancing, Ongkos Potong"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorName">Nama Vendor</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="Nama penyedia barang/jasa"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah (Qty)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Harga Satuan</Label>
                <Input
                  id="unitPrice"
                  value={priceDisplay}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Nilai</Label>
                <div className="h-10 flex items-center px-3 bg-gray-100 rounded-md font-medium">
                  {formatCurrency(totalValue)}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workStatus">Status Pengerjaan</Label>
                <Select
                  value={formData.workStatus}
                  onValueChange={(value: 'proses' | 'selesai') => setFormData({ ...formData, workStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proses">Proses</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorPaymentStatus">Status Bayar Vendor</Label>
                <Select
                  value={formData.vendorPaymentStatus}
                  onValueChange={(value: 'belum' | 'lunas') => setFormData({ ...formData, vendorPaymentStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="belum">Belum Lunas</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Keterangan</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Catatan tambahan"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengeluaran "{selectedExpense?.itemName}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedExpense && deleteMutation.mutate(selectedExpense.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteProjectDialogOpen} onOpenChange={setDeleteProjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Semua Pengeluaran Project</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus semua pengeluaran untuk project "{projectToDelete?.customerName || projectToDelete?.projectName || 'Lainnya'}"? 
              <br /><br />
              <span className="font-semibold text-red-600">
                {projectToDelete?.totalItems} item dengan total {formatCurrency(projectToDelete?.totalExpenses || 0)} akan dihapus.
              </span>
              <br /><br />
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && deleteProjectMutation.mutate(projectToDelete.expenseIds)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProjectMutation.isPending ? 'Menghapus...' : 'Hapus Semua'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
