import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ArrowLeft, Plus, Trash2, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const productCategories = {
  KONVEKSI: [
    'PDH',
    'Rompi',
    'Jaket',
    'Jas/Almamater',
    'Toga',
    'Celana',
    'Varsity',
    'Dress',
    'Rok',
    'Sweater',
    'Jersey',
    'Hoodie',
    'Polo',
    'Seragam Sekolah',
    'Lainnya (Konveksi)',
  ],
  PERCETAKAN: [
    'Flyer',
    'Poster',
    'Baliho',
    'Map',
    'Packaging',
    'Kartu Nama',
    'Dos Arsip',
    'Paper Bag',
    'Stempel',
    'Stiker',
    'Kop Surat',
    'Lainnya (Percetakan)',
  ],
  MERCH: [
    'Mug',
    'Payung',
    'Goodie Bag',
    'Topi',
    'Gantungan Kunci',
    'Lainnya (Merch)',
  ],
};

interface ClothingSizeQuantity {
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
  XXL: number;
  XXXL: number;
  XXXXL: number;
  XXXXXL: number;
  XXXXXXL: number;
}

interface PaperSizeQuantity {
  A3: number;
  A4: number;
  A5: number;
  A6: number;
  F4: number;
  LETTER: number;
  CUSTOM: number;
}

interface MerchQuantity {
  QTY: number;
}

type SizeQuantity = ClothingSizeQuantity | PaperSizeQuantity | MerchQuantity;

interface OrderItem {
  productCategory: string;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  size: string;
  sizeQuantities: SizeQuantity;
  color: string;
  notes: string;
}

interface MaterialUsageInput {
  materialId: string;
  quantity: number;
  notes: string;
}

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

const parseFormattedNumber = (value: string) => {
  return parseInt(value.replace(/\./g, '')) || 0;
};

const defaultClothingSizes: ClothingSizeQuantity = {
  XS: 0,
  S: 0,
  M: 0,
  L: 0,
  XL: 0,
  XXL: 0,
  XXXL: 0,
  XXXXL: 0,
  XXXXXL: 0,
  XXXXXXL: 0,
};

const defaultPaperSizes: PaperSizeQuantity = {
  A3: 0,
  A4: 0,
  A5: 0,
  A6: 0,
  F4: 0,
  LETTER: 0,
  CUSTOM: 0,
};

const defaultMerchQuantity: MerchQuantity = {
  QTY: 0,
};

const clothingSizeLabels: { key: keyof ClothingSizeQuantity; label: string }[] = [
  { key: 'XS', label: 'XS' },
  { key: 'S', label: 'S' },
  { key: 'M', label: 'M' },
  { key: 'L', label: 'L' },
  { key: 'XL', label: 'XL' },
  { key: 'XXL', label: 'XXL' },
  { key: 'XXXL', label: '3XL' },
  { key: 'XXXXL', label: '4XL' },
  { key: 'XXXXXL', label: '5XL' },
  { key: 'XXXXXXL', label: '6XL' },
];

const paperSizeLabels: { key: keyof PaperSizeQuantity; label: string }[] = [
  { key: 'A3', label: 'A3' },
  { key: 'A4', label: 'A4' },
  { key: 'A5', label: 'A5' },
  { key: 'A6', label: 'A6' },
  { key: 'F4', label: 'F4/Folio' },
  { key: 'LETTER', label: 'Letter' },
  { key: 'CUSTOM', label: 'Custom' },
];

const merchQuantityLabels: { key: keyof MerchQuantity; label: string }[] = [
  { key: 'QTY', label: 'Jumlah' },
];

const getDefaultSizesForCategory = (category: string): SizeQuantity => {
  switch (category) {
    case 'KONVEKSI':
      return { ...defaultClothingSizes };
    case 'PERCETAKAN':
      return { ...defaultPaperSizes };
    case 'MERCH':
      return { ...defaultMerchQuantity };
    default:
      return { ...defaultClothingSizes };
  }
};

const getSizeLabelsForCategory = (category: string) => {
  switch (category) {
    case 'KONVEKSI':
      return clothingSizeLabels;
    case 'PERCETAKAN':
      return paperSizeLabels;
    case 'MERCH':
      return merchQuantityLabels;
    default:
      return clothingSizeLabels;
  }
};

const getSizeLabelText = (category: string): string => {
  switch (category) {
    case 'KONVEKSI':
      return 'Ukuran & Jumlah';
    case 'PERCETAKAN':
      return 'Ukuran Kertas & Jumlah';
    case 'MERCH':
      return 'Jumlah';
    default:
      return 'Ukuran & Jumlah';
  }
};

export default function NewOrder() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', 'order-form'],
    queryFn: () => api.inventory.list(token!, {}),
    enabled: !!token,
  });

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    address: '',
  });

  const [items, setItems] = useState<OrderItem[]>([
    {
      productCategory: '',
      productName: '',
      productType: '',
      quantity: 0,
      unitPrice: 0,
      size: '',
      sizeQuantities: { ...defaultClothingSizes },
      color: '',
      notes: '',
    },
  ]);

  const [priceInputs, setPriceInputs] = useState<{ [key: number]: string }>({
    0: '',
  });

  const [dpAmount, setDpAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [includePPN, setIncludePPN] = useState(false);
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const [productionDeadline, setProductionDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState<MaterialUsageInput[]>([]);

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => api.orders.create(token!, data),
    onSuccess: (response) => {
      toast.success(`Order berhasil dibuat! Invoice: ${response.invoiceNumber}`);
      navigate(`/admin/orders/${response.order.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal membuat order');
    },
  });

  const addItem = () => {
    const newIndex = items.length;
    setItems([
      ...items,
      {
        productCategory: '',
        productName: '',
        productType: '',
        quantity: 0,
        unitPrice: 0,
        size: '',
        sizeQuantities: { ...defaultClothingSizes },
        color: '',
        notes: '',
      },
    ]);
    setPriceInputs({ ...priceInputs, [newIndex]: '' });
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const addMaterial = () => setMaterials((current) => [
    ...current,
    { materialId: '', quantity: 0, notes: '' },
  ]);

  const updateMaterial = (index: number, field: keyof MaterialUsageInput, value: string | number) => {
    setMaterials((current) => current.map((material, materialIndex) => (
      materialIndex === index ? { ...material, [field]: value } : material
    )));
  };

  const removeMaterial = (index: number) => {
    setMaterials((current) => current.filter((_, materialIndex) => materialIndex !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    
    if (field === 'productCategory') {
      const oldCategory = newItems[index].productCategory;
      if (oldCategory !== value) {
        newItems[index] = {
          ...newItems[index],
          [field]: value,
          productName: '',
          sizeQuantities: getDefaultSizesForCategory(value),
          quantity: 0,
          size: '',
        };
        setItems(newItems);
        return;
      }
    }
    
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'sizeQuantities') {
      const totalQty = Object.values(value as SizeQuantity).reduce((sum: number, qty: number) => sum + qty, 0);
      newItems[index].quantity = totalQty;
      const sizes = Object.entries(value as SizeQuantity)
        .filter(([_, qty]) => qty > 0)
        .map(([size, qty]) => `${size}(${qty})`)
        .join(', ');
      newItems[index].size = sizes;
    }
    
    setItems(newItems);
  };

  const updateSizeQuantity = (index: number, size: string, qty: number) => {
    const newSizeQuantities = { ...items[index].sizeQuantities, [size]: qty } as SizeQuantity;
    updateItem(index, 'sizeQuantities', newSizeQuantities);
  };

  const handlePriceChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setPriceInputs({ ...priceInputs, [index]: numericValue ? formatNumber(parseInt(numericValue)) : '' });
    updateItem(index, 'unitPrice', parseInt(numericValue) || 0);
  };

  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  
  const calculateDiscount = () => {
    if (discountType === 'percent') {
      return Math.round((subtotalAmount * (parseFloat(discountValue) || 0)) / 100);
    }
    return parseFloat(discountValue) || 0;
  };

  const actualDiscountAmount = calculateDiscount();
  const ppnAmount = includePPN ? Math.round((subtotalAmount - actualDiscountAmount) * 0.11) : 0;
  const totalAmount = subtotalAmount - actualDiscountAmount + ppnAmount;

  // Update discountAmount state whenever actualDiscountAmount changes
  useEffect(() => {
    setDiscountAmount(actualDiscountAmount);
  }, [actualDiscountAmount]);

  // Auto-set DP to 50% when total changes
  useEffect(() => {
    if (totalAmount > 0) {
      const dp50 = Math.round(totalAmount * 0.5);
      setDpAmount(dp50);
    }
  }, [totalAmount]);

  const autoSetDp = () => {
    const dp50 = Math.round(totalAmount * 0.5);
    setDpAmount(dp50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer.name || !customer.phone) {
      toast.error('Nama dan nomor telepon pelanggan wajib diisi');
      return;
    }

    if (items.some((item) => !item.productCategory || !item.productName || item.quantity < 1 || item.unitPrice < 1)) {
      toast.error('Semua produk harus memiliki kategori, nama, jumlah, dan harga');
      return;
    }

    if (materials.some((material) => !material.materialId || material.quantity <= 0)) {
      toast.error('Setiap bahan baku harus dipilih dan jumlah pemakaiannya lebih dari 0');
      return;
    }

    const insufficientMaterial = materials.find((usage) => {
      const material = inventoryData?.materials?.find((item: any) => item.id === usage.materialId);
      return material && usage.quantity > Number(material.currentStock);
    });
    if (insufficientMaterial) {
      const material = inventoryData?.materials?.find((item: any) => item.id === insufficientMaterial.materialId);
      toast.error(`Stok ${material?.name} tidak cukup`);
      return;
    }

    createOrderMutation.mutate({
      customer,
      items,
      materials,
      discountAmount,
      dpAmount,
      includePPN,
      paymentDeadline: paymentDeadline || undefined,
      productionDeadline: productionDeadline || undefined,
      notes,
    });
  };

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/admin/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">Buat Order Baru</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nama Pelanggan *</Label>
                    <Input
                      id="customerName"
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Nomor WhatsApp *</Label>
                    <Input
                      id="customerPhone"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                      placeholder="08123456789"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email (Opsional)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customer.email}
                      onChange={(e) =>
                        setCustomer({ ...customer, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerCompany">Nama Instansi/Perusahaan (Opsional)</Label>
                    <Input
                      id="customerCompany"
                      value={customer.companyName}
                      onChange={(e) =>
                        setCustomer({ ...customer, companyName: e.target.value })
                      }
                      placeholder="PT/CV/Instansi..."
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="customerAddress">Alamat (Opsional)</Label>
                    <Input
                      id="customerAddress"
                      value={customer.address}
                      onChange={(e) =>
                        setCustomer({ ...customer, address: e.target.value })
                      }
                      placeholder="Alamat pengiriman"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Produk</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Produk
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Produk {index + 1}</span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Kategori Produk *</Label>
                        <Select
                          value={item.productCategory}
                          onValueChange={(value) => {
                            updateItem(index, 'productCategory', value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KONVEKSI">Konveksi</SelectItem>
                            <SelectItem value="PERCETAKAN">Percetakan</SelectItem>
                            <SelectItem value="MERCH">Merch</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Produk *</Label>
                        <Select
                          value={item.productName}
                          onValueChange={(value) => updateItem(index, 'productName', value)}
                          disabled={!item.productCategory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={item.productCategory ? "Pilih produk" : "Pilih kategori dulu"} />
                          </SelectTrigger>
                          <SelectContent>
                            {item.productCategory && productCategories[item.productCategory as keyof typeof productCategories]?.map((product) => (
                              <SelectItem key={product} value={product}>
                                {product}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipe/Varian Produk</Label>
                        <Input
                          value={item.productType}
                          onChange={(e) =>
                            updateItem(index, 'productType', e.target.value)
                          }
                          placeholder="Contoh: Lengan Pendek, Ukuran A3, dll"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Harga Satuan *</Label>
                        <Input
                          value={priceInputs[index] || ''}
                          onChange={(e) => handlePriceChange(index, e.target.value)}
                          placeholder="0"
                          required
                        />
                        {item.unitPrice > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Warna</Label>
                        <Input
                          value={item.color}
                          onChange={(e) => updateItem(index, 'color', e.target.value)}
                          placeholder="Hitam, Putih, dll"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(() => {
                        const sizeLabels = getSizeLabelsForCategory(item.productCategory);
                        const labelText = getSizeLabelText(item.productCategory);
                        const gridCols = item.productCategory === 'MERCH'
                          ? 'grid-cols-1 max-w-[150px]'
                          : item.productCategory === 'PERCETAKAN'
                            ? 'grid-cols-4 md:grid-cols-7'
                            : 'grid-cols-5 md:grid-cols-10';

                        return (
                          <>
                            <Label>{labelText} *</Label>
                            <div className={`grid ${gridCols} gap-2`}>
                              {sizeLabels.map(({ key, label }) => (
                                <div key={key} className="text-center">
                                  <div className="text-xs font-medium mb-1 text-muted-foreground">
                                    {label}
                                  </div>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={(item.sizeQuantities as any)[key] || ''}
                                    onChange={(e) =>
                                      updateSizeQuantity(index, key, parseInt(e.target.value) || 0)
                                    }
                                    className="text-center"
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Total: {item.quantity} pcs {item.size && `(${item.size})`}
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    <div className="space-y-2">
                      <Label>Catatan Produk</Label>
                      <Textarea
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        placeholder="Catatan khusus untuk produk ini"
                        rows={2}
                      />
                    </div>

                    <div className="text-right font-medium">
                      Subtotal: {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2"><Warehouse className="h-5 w-5 text-blue-700" />Bahan Baku Order</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Stok otomatis dipotong setelah order berhasil dibuat.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMaterial} disabled={inventoryLoading}>
                  <Plus className="mr-2 h-4 w-4" />Tambah Bahan
                </Button>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <button type="button" onClick={addMaterial} className="w-full rounded-xl border border-dashed border-slate-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40">
                    <Warehouse className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                    <span className="text-sm font-medium text-slate-600">Belum ada bahan baku dipilih</span>
                    <span className="mt-1 block text-xs text-slate-400">Klik untuk menambahkan kain, benang, tinta, atau bahan lainnya.</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {materials.map((usage, index) => {
                      const selected = inventoryData?.materials?.find((item: any) => item.id === usage.materialId);
                      const isInsufficient = selected && usage.quantity > Number(selected.currentStock);
                      return <div key={index} className="rounded-xl border border-slate-200 p-4">
                        <div className="grid gap-3 md:grid-cols-[1fr_170px_44px]">
                          <div className="space-y-2"><Label>Bahan Baku *</Label><Select value={usage.materialId} onValueChange={(value) => updateMaterial(index, 'materialId', value)}>
                            <SelectTrigger><SelectValue placeholder="Pilih bahan dari stok" /></SelectTrigger>
                            <SelectContent>{inventoryData?.materials?.map((material: any) => <SelectItem key={material.id} value={material.id}
                              disabled={materials.some((item, itemIndex) => itemIndex !== index && item.materialId === material.id)}>
                              {material.code} · {material.name} — stok {Number(material.currentStock).toLocaleString('id-ID')} {material.unit}
                            </SelectItem>)}</SelectContent>
                          </Select></div>
                          <div className="space-y-2"><Label>Jumlah Dipakai *</Label><div className="relative"><Input type="number" min="0.01" step="0.01" value={usage.quantity || ''}
                            onChange={(event) => updateMaterial(index, 'quantity', Number(event.target.value))} className={selected ? 'pr-14' : ''} placeholder="0" />
                            {selected && <span className="absolute right-3 top-2.5 text-sm text-slate-400">{selected.unit}</span>}</div></div>
                          <div className="flex items-end"><Button type="button" variant="ghost" size="icon" onClick={() => removeMaterial(index)} className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button></div>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2"><Input value={usage.notes} onChange={(event) => updateMaterial(index, 'notes', event.target.value)} placeholder="Catatan pemakaian (opsional)" />
                          <div className="flex items-center justify-end text-sm"><span className="text-slate-500">Estimasi biaya:&nbsp;</span><span className="font-semibold">{formatCurrency((selected ? Number(selected.unitPrice) : 0) * usage.quantity)}</span></div></div>
                        {isInsufficient && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertTriangle className="h-3.5 w-3.5" />Jumlah melebihi stok tersedia.</p>}
                      </div>;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotalAmount)}</span>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="discountValue">Potongan / Diskon</Label>
                    <div className="flex gap-2">
                      <Select
                        value={discountType}
                        onValueChange={(value: 'fixed' | 'percent') => setDiscountType(value)}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Rp</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percent' ? "0" : "Nominal"}
                      />
                    </div>
                    {discountType === 'percent' && actualDiscountAmount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Setara dengan {formatCurrency(actualDiscountAmount)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="includePPN"
                        checked={includePPN}
                        onCheckedChange={setIncludePPN}
                      />
                      <Label htmlFor="includePPN" className="cursor-pointer">
                        Include PPN 11%
                      </Label>
                    </div>
                    {includePPN && (
                      <span className="text-sm">{formatCurrency(ppnAmount)}</span>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  {materials.length > 0 && <div className="flex justify-between text-sm text-slate-500">
                    <span>Estimasi biaya bahan</span>
                    <span>{formatCurrency(materials.reduce((sum, usage) => {
                      const material = inventoryData?.materials?.find((item: any) => item.id === usage.materialId);
                      return sum + (Number(material?.unitPrice || 0) * usage.quantity);
                    }, 0))}</span>
                  </div>}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dpAmount">DP (50% otomatis)</Label>
                    {totalAmount > 0 && dpAmount !== Math.round(totalAmount * 0.5) && (
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm" 
                        className="text-xs h-auto p-0"
                        onClick={autoSetDp}
                      >
                        Reset 50%
                      </Button>
                    )}
                  </div>
                  <Input
                    id="dpAmount"
                    type="number"
                    min="0"
                    value={dpAmount}
                    onChange={(e) => setDpAmount(parseInt(e.target.value) || 0)}
                    placeholder="Jumlah DP"
                  />
                  <p className="text-xs text-muted-foreground">
                    DP otomatis dihitung 50% dari total. Anda bisa mengubahnya jika perlu.
                  </p>
                </div>

                {dpAmount > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>DP</span>
                      <span>{formatCurrency(dpAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sisa</span>
                      <span>{formatCurrency(totalAmount - dpAmount)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deadline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDeadline">Batas Pembayaran</Label>
                  <Input
                    id="paymentDeadline"
                    type="date"
                    value={paymentDeadline}
                    onChange={(e) => setPaymentDeadline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionDeadline">Batas Produksi</Label>
                  <Input
                    id="productionDeadline"
                    type="date"
                    value={productionDeadline}
                    onChange={(e) => setProductionDeadline(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Catatan Order</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan khusus untuk order ini"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-[#CCFF00] text-blue-900 hover:bg-[#b8e600]"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Memproses...' : 'Buat Order'}
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
