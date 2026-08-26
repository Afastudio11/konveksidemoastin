import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CircleDollarSign,
  History,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
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

interface MaterialForm {
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  minimumStock: string;
  unitPrice: string;
  supplierName: string;
  storageLocation: string;
  notes: string;
}

interface MovementForm {
  type: 'in' | 'out' | 'adjustment';
  quantity: string;
  movementDate: string;
  reference: string;
  notes: string;
}

const emptyMaterialForm: MaterialForm = {
  code: '',
  name: '',
  category: '',
  unit: 'meter',
  currentStock: '0',
  minimumStock: '0',
  unitPrice: '0',
  supplierName: '',
  storageLocation: '',
  notes: '',
};

const emptyMovementForm = (): MovementForm => ({
  type: 'in',
  quantity: '',
  movementDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  reference: '',
  notes: '',
});

const suggestedCategories = ['Kain', 'Benang', 'Aksesori', 'Sablon', 'Bordir', 'Kemasan'];
const units = ['meter', 'yard', 'kg', 'roll', 'pcs', 'lusin', 'pack', 'liter'];

const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(value || 0);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0);

function stockStatus(material: any) {
  const stock = Number(material.currentStock);
  const minimum = Number(material.minimumStock);
  if (stock <= 0) return { label: 'Habis', className: 'bg-red-100 text-red-700 hover:bg-red-100' };
  if (stock <= minimum) return { label: 'Menipis', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' };
  return { label: 'Aman', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' };
}

export default function Inventory() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(emptyMaterialForm);
  const [movementForm, setMovementForm] = useState<MovementForm>(emptyMovementForm());

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    if (category !== 'all') params.category = category;
    if (status !== 'all') params.stockStatus = status;
    return params;
  }, [search, category, status]);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', queryParams],
    queryFn: () => api.inventory.list(token!, queryParams),
    enabled: !!token,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['inventory-movements', selectedMaterial?.id],
    queryFn: () => api.inventory.movements(token!, selectedMaterial.id),
    enabled: !!token && !!selectedMaterial?.id && historyDialogOpen,
  });

  const refreshInventory = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
  };

  const saveMaterial = useMutation({
    mutationFn: (payload: any) => selectedMaterial
      ? api.inventory.update(token!, selectedMaterial.id, payload)
      : api.inventory.create(token!, payload),
    onSuccess: () => {
      refreshInventory();
      toast.success(selectedMaterial ? 'Data bahan berhasil diperbarui' : 'Bahan baku berhasil ditambahkan');
      setMaterialDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal menyimpan bahan baku'),
  });

  const saveMovement = useMutation({
    mutationFn: (payload: any) => api.inventory.createMovement(token!, selectedMaterial.id, payload),
    onSuccess: () => {
      refreshInventory();
      toast.success('Transaksi stok berhasil disimpan');
      setMovementDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal menyimpan transaksi stok'),
  });

  const deleteMaterial = useMutation({
    mutationFn: () => api.inventory.delete(token!, selectedMaterial.id),
    onSuccess: () => {
      refreshInventory();
      toast.success('Bahan baku berhasil dinonaktifkan');
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => toast.error(error.message || 'Gagal menonaktifkan bahan baku'),
  });

  const openCreate = () => {
    setSelectedMaterial(null);
    setMaterialForm(emptyMaterialForm);
    setMaterialDialogOpen(true);
  };

  const openEdit = (material: any) => {
    setSelectedMaterial(material);
    setMaterialForm({
      code: material.code,
      name: material.name,
      category: material.category,
      unit: material.unit,
      currentStock: String(material.currentStock),
      minimumStock: String(material.minimumStock),
      unitPrice: String(material.unitPrice),
      supplierName: material.supplierName || '',
      storageLocation: material.storageLocation || '',
      notes: material.notes || '',
    });
    setMaterialDialogOpen(true);
  };

  const openMovement = (material: any, type: MovementForm['type'] = 'in') => {
    setSelectedMaterial(material);
    setMovementForm({ ...emptyMovementForm(), type });
    setMovementDialogOpen(true);
  };

  const handleMaterialSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!materialForm.code.trim() || !materialForm.name.trim() || !materialForm.category.trim()) {
      toast.error('Kode, nama, dan kategori wajib diisi');
      return;
    }

    const payload: any = {
      ...materialForm,
      minimumStock: Number(materialForm.minimumStock || 0),
      unitPrice: Number(materialForm.unitPrice || 0),
      supplierName: materialForm.supplierName || null,
      storageLocation: materialForm.storageLocation || null,
      notes: materialForm.notes || null,
    };
    if (!selectedMaterial) payload.currentStock = Number(materialForm.currentStock || 0);
    else delete payload.currentStock;
    saveMaterial.mutate(payload);
  };

  const handleMovementSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(movementForm.quantity);
    if (Number.isNaN(quantity) || (movementForm.type !== 'adjustment' && quantity <= 0) || quantity < 0) {
      toast.error('Jumlah stok tidak valid');
      return;
    }
    saveMovement.mutate({
      ...movementForm,
      quantity,
      reference: movementForm.reference || null,
      notes: movementForm.notes || null,
    });
  };

  const summary = data?.summary || { totalMaterials: 0, lowStock: 0, outOfStock: 0, totalValue: 0 };
  const allCategories = Array.from(new Set([...(data?.categories || []), ...suggestedCategories]));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-950">Stok Bahan Baku</h1>
            <p className="text-muted-foreground">Pantau persediaan dan pergerakan bahan produksi</p>
          </div>
          <Button onClick={openCreate} className="bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Bahan
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm text-muted-foreground">Total Jenis Bahan</p><p className="mt-1 text-2xl font-bold text-blue-600">{summary.totalMaterials}</p></div>
              <Boxes className="h-9 w-9 text-blue-200" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm text-muted-foreground">Stok Menipis</p><p className="mt-1 text-2xl font-bold text-amber-600">{summary.lowStock}</p></div>
              <AlertTriangle className="h-9 w-9 text-amber-200" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm text-muted-foreground">Stok Habis</p><p className="mt-1 text-2xl font-bold text-red-600">{summary.outOfStock}</p></div>
              <Warehouse className="h-9 w-9 text-red-200" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm text-muted-foreground">Nilai Persediaan</p><p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(summary.totalValue)}</p></div>
              <CircleDollarSign className="h-9 w-9 text-emerald-200" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_190px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode, bahan, supplier, atau lokasi..." className="pl-9" />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Semua kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {(data?.categories || []).map((item: string) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SlidersHorizontal className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="safe">Stok Aman</SelectItem>
                  <SelectItem value="low">Stok Menipis</SelectItem>
                  <SelectItem value="out">Stok Habis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-900 hover:bg-blue-900">
                    <TableHead className="text-white">Bahan Baku</TableHead>
                    <TableHead className="text-white">Kategori</TableHead>
                    <TableHead className="text-white">Supplier / Lokasi</TableHead>
                    <TableHead className="text-right text-white">Stok</TableHead>
                    <TableHead className="text-right text-white">Stok Minimum</TableHead>
                    <TableHead className="text-right text-white">Harga Satuan</TableHead>
                    <TableHead className="text-center text-white">Status</TableHead>
                    <TableHead className="text-center text-white">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="h-40 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" /></TableCell></TableRow>
                  ) : !data?.materials?.length ? (
                    <TableRow><TableCell colSpan={8} className="h-40 text-center text-muted-foreground"><PackagePlus className="mx-auto mb-2 h-9 w-9 text-gray-300" />Belum ada bahan baku yang sesuai filter</TableCell></TableRow>
                  ) : data.materials.map((material: any) => {
                    const materialStatus = stockStatus(material);
                    return (
                      <TableRow key={material.id}>
                        <TableCell>
                          <div className="font-semibold text-gray-950">{material.name}</div>
                          <div className="font-mono text-xs text-blue-600">{material.code}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{material.category}</Badge></TableCell>
                        <TableCell>
                          <div>{material.supplierName || '-'}</div>
                          <div className="text-xs text-muted-foreground">{material.storageLocation || 'Lokasi belum diatur'}</div>
                        </TableCell>
                        <TableCell className="text-right"><span className="text-lg font-bold">{formatNumber(Number(material.currentStock))}</span> <span className="text-xs text-muted-foreground">{material.unit}</span></TableCell>
                        <TableCell className="text-right">{formatNumber(Number(material.minimumStock))} {material.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(material.unitPrice))}</TableCell>
                        <TableCell className="text-center"><Badge className={materialStatus.className}>{materialStatus.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button size="sm" variant="ghost" title="Stok masuk" onClick={() => openMovement(material, 'in')}><ArrowDownToLine className="h-4 w-4 text-emerald-600" /></Button>
                            <Button size="sm" variant="ghost" title="Stok keluar" onClick={() => openMovement(material, 'out')}><ArrowUpFromLine className="h-4 w-4 text-orange-600" /></Button>
                            <Button size="sm" variant="ghost" title="Riwayat" onClick={() => { setSelectedMaterial(material); setHistoryDialogOpen(true); }}><History className="h-4 w-4 text-blue-600" /></Button>
                            <Button size="sm" variant="ghost" title="Edit" onClick={() => openEdit(material)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" title="Nonaktifkan" onClick={() => { setSelectedMaterial(material); setDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedMaterial ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</DialogTitle></DialogHeader>
          <form onSubmit={handleMaterialSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="material-code">Kode Bahan *</Label><Input id="material-code" value={materialForm.code} onChange={(e) => setMaterialForm({ ...materialForm, code: e.target.value.toUpperCase() })} placeholder="Contoh: KAIN-001" required /></div>
              <div className="space-y-2"><Label htmlFor="material-name">Nama Bahan *</Label><Input id="material-name" value={materialForm.name} onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })} placeholder="Cotton Combed 24s" required /></div>
              <div className="space-y-2"><Label htmlFor="material-category">Kategori *</Label><Input id="material-category" list="inventory-categories" value={materialForm.category} onChange={(e) => setMaterialForm({ ...materialForm, category: e.target.value })} placeholder="Pilih atau ketik kategori" required /><datalist id="inventory-categories">{allCategories.map((item) => <option key={item} value={item} />)}</datalist></div>
              <div className="space-y-2"><Label>Satuan *</Label><Select value={materialForm.unit} onValueChange={(value) => setMaterialForm({ ...materialForm, unit: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select></div>
              {!selectedMaterial && <div className="space-y-2"><Label htmlFor="current-stock">Stok Awal</Label><Input id="current-stock" type="number" min="0" step="0.01" value={materialForm.currentStock} onChange={(e) => setMaterialForm({ ...materialForm, currentStock: e.target.value })} /></div>}
              <div className="space-y-2"><Label htmlFor="minimum-stock">Stok Minimum</Label><Input id="minimum-stock" type="number" min="0" step="0.01" value={materialForm.minimumStock} onChange={(e) => setMaterialForm({ ...materialForm, minimumStock: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="unit-price">Harga per Satuan</Label><Input id="unit-price" type="number" min="0" step="1" value={materialForm.unitPrice} onChange={(e) => setMaterialForm({ ...materialForm, unitPrice: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="supplier">Supplier</Label><Input id="supplier" value={materialForm.supplierName} onChange={(e) => setMaterialForm({ ...materialForm, supplierName: e.target.value })} placeholder="Nama pemasok" /></div>
              <div className="space-y-2"><Label htmlFor="location">Lokasi Penyimpanan</Label><Input id="location" value={materialForm.storageLocation} onChange={(e) => setMaterialForm({ ...materialForm, storageLocation: e.target.value })} placeholder="Gudang A - Rak 01" /></div>
            </div>
            {selectedMaterial && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">Stok berjalan diubah melalui transaksi Masuk, Keluar, atau Penyesuaian agar histori tetap tercatat.</p>}
            <div className="space-y-2"><Label htmlFor="material-notes">Catatan</Label><Textarea id="material-notes" value={materialForm.notes} onChange={(e) => setMaterialForm({ ...materialForm, notes: e.target.value })} placeholder="Detail warna, spesifikasi, atau catatan pembelian" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMaterialDialogOpen(false)}>Batal</Button><Button type="submit" disabled={saveMaterial.isPending} className="bg-blue-900 hover:bg-blue-800">{saveMaterial.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedMaterial ? 'Simpan Perubahan' : 'Tambah Bahan'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Transaksi Stok — {selectedMaterial?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-blue-700">Stok saat ini</p><p className="text-2xl font-bold text-blue-900">{formatNumber(Number(selectedMaterial?.currentStock))} {selectedMaterial?.unit}</p></div>
            <div className="space-y-2"><Label>Jenis Transaksi</Label><Select value={movementForm.type} onValueChange={(value: MovementForm['type']) => setMovementForm({ ...movementForm, type: value, quantity: '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in">Stok Masuk</SelectItem><SelectItem value="out">Stok Keluar</SelectItem><SelectItem value="adjustment">Penyesuaian / Stok Opname</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="movement-quantity">{movementForm.type === 'adjustment' ? 'Stok Aktual Hasil Opname' : 'Jumlah'} *</Label><Input id="movement-quantity" type="number" min="0" step="0.01" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} placeholder={`Dalam ${selectedMaterial?.unit || 'satuan'}`} required /></div>
            <div className="space-y-2"><Label htmlFor="movement-date">Tanggal</Label><Input id="movement-date" type="datetime-local" value={movementForm.movementDate} onChange={(e) => setMovementForm({ ...movementForm, movementDate: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="movement-reference">Referensi</Label><Input id="movement-reference" value={movementForm.reference} onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })} placeholder="No. nota, invoice, atau order" /></div>
            <div className="space-y-2"><Label htmlFor="movement-notes">Keterangan</Label><Textarea id="movement-notes" value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} placeholder="Keperluan atau keterangan transaksi" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setMovementDialogOpen(false)}>Batal</Button><Button type="submit" disabled={saveMovement.isPending} className={movementForm.type === 'out' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-900 hover:bg-blue-800'}>{saveMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan Transaksi</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Riwayat Stok — {selectedMaterial?.name}</DialogTitle></DialogHeader>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Jenis</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Stok Akhir</TableHead><TableHead>Referensi / Catatan</TableHead></TableRow></TableHeader>
              <TableBody>
                {historyLoading ? <TableRow><TableCell colSpan={5} className="h-28 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                  : !historyData?.movements?.length ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">Belum ada transaksi stok</TableCell></TableRow>
                  : historyData.movements.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(movement.movementDate), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</TableCell>
                      <TableCell><Badge className={movement.type === 'in' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : movement.type === 'out' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}>{movement.type === 'in' ? 'Masuk' : movement.type === 'out' ? 'Keluar' : 'Penyesuaian'}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{formatNumber(Number(movement.quantity))}</TableCell>
                      <TableCell className="text-right">{formatNumber(Number(movement.newStock))} {selectedMaterial?.unit}</TableCell>
                      <TableCell><div>{movement.reference || '-'}</div><div className="max-w-xs truncate text-xs text-muted-foreground">{movement.notes || movement.createdByName || ''}</div></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Nonaktifkan bahan baku?</AlertDialogTitle><AlertDialogDescription><strong>{selectedMaterial?.name}</strong> akan hilang dari daftar stok aktif. Riwayat transaksinya tetap tersimpan untuk audit.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => deleteMaterial.mutate()} className="bg-red-600 hover:bg-red-700">Nonaktifkan</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
