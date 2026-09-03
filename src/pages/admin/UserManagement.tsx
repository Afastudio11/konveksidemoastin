import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  customers: 'Pelanggan',
  expenses: 'Pengeluaran',
  inventory: 'Stok Bahan Baku',
  financial_reports: 'Laporan Keuangan',
  ai_assistant: 'Asisten AI',
  activity_logs: 'Log Aktivitas',
  settings: 'Pengaturan',
  user_management: 'Manajemen User',
};

export default function UserManagement() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin',
    permissions: [] as string[],
  });

  const fetchUsers = async () => {
    if (!token) return;
    try {
      const data = await api.users.list(token);
      setUsers(data.users);
      setAvailablePermissions(data.availablePermissions);
    } catch (error) {
      toast.error('Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'admin',
      permissions: ['dashboard'],
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (user: UserData) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (selectedUser) {
        const updateData: any = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          permissions: formData.permissions,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await api.users.update(token, selectedUser.id, updateData);
        toast.success('User berhasil diupdate');
      } else {
        await api.users.create(token, {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          permissions: formData.permissions,
        });
        toast.success('User berhasil ditambahkan');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan user');
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedUser) return;

    try {
      await api.users.delete(token, selectedUser.id);
      toast.success('User berhasil dihapus');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus user');
    }
  };

  if (currentUser?.role !== 'superadmin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Akses Ditolak</h2>
            <p className="text-gray-500">Hanya Super Admin yang bisa mengakses halaman ini</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen User</h1>
            <p className="text-gray-500">Kelola akun admin dan permission akses menu</p>
          </div>
          <Button onClick={handleOpenCreate} className="bg-slate-950 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Admin
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Memuat...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Akses Menu</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.role === 'superadmin' ? (
                            <Shield className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <User className="w-4 h-4 text-blue-600" />
                          )}
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'superadmin' ? 'default' : 'secondary'}>
                          {user.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {user.role === 'superadmin' ? (
                            <Badge variant="outline" className="text-xs">Semua Akses</Badge>
                          ) : (
                            user.permissions?.slice(0, 3).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {PERMISSION_LABELS[perm] || perm}
                              </Badge>
                            ))
                          )}
                          {user.role !== 'superadmin' && user.permissions?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 3} lainnya
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: id })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleOpenDelete(user)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'Edit User' : 'Tambah Admin Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {selectedUser && '(kosongkan jika tidak ingin mengubah)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedUser}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'admin' && (
              <div className="space-y-2">
                <Label>Akses Menu</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Pilih menu yang bisa diakses oleh admin ini
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                  {availablePermissions.map((perm) => (
                    <div key={perm} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm}
                        checked={formData.permissions.includes(perm)}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(perm, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={perm}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {PERMISSION_LABELS[perm] || perm}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.role === 'superadmin' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Super Admin memiliki akses ke semua menu secara otomatis
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-slate-950 hover:bg-slate-800">
                {selectedUser ? 'Update' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.name}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
