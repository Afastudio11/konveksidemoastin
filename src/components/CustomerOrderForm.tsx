import { useState } from "react";
import { MessageCircle, Send, Package, User, Phone, MapPin, FileText, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
  productType: string;
  sizes: SizeQuantity;
  notes: string;
}

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
  { key: "XS", label: "XS" },
  { key: "S", label: "S" },
  { key: "M", label: "M" },
  { key: "L", label: "L" },
  { key: "XL", label: "XL" },
  { key: "XXL", label: "XXL" },
  { key: "XXXL", label: "3XL" },
  { key: "XXXXL", label: "4XL" },
  { key: "XXXXXL", label: "5XL" },
  { key: "XXXXXXL", label: "6XL" },
];

const paperSizeLabels: { key: keyof PaperSizeQuantity; label: string }[] = [
  { key: "A3", label: "A3" },
  { key: "A4", label: "A4" },
  { key: "A5", label: "A5" },
  { key: "A6", label: "A6" },
  { key: "F4", label: "F4/Folio" },
  { key: "LETTER", label: "Letter" },
  { key: "CUSTOM", label: "Custom" },
];

const merchQuantityLabels: { key: keyof MerchQuantity; label: string }[] = [
  { key: "QTY", label: "Jumlah" },
];

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

const allProductTypes = [
  ...productCategories.KONVEKSI,
  ...productCategories.PERCETAKAN,
  ...productCategories.MERCH,
];

const getProductCategory = (productType: string): 'KONVEKSI' | 'PERCETAKAN' | 'MERCH' | null => {
  if (productCategories.KONVEKSI.includes(productType)) return 'KONVEKSI';
  if (productCategories.PERCETAKAN.includes(productType)) return 'PERCETAKAN';
  if (productCategories.MERCH.includes(productType)) return 'MERCH';
  return null;
};

const getDefaultSizesForCategory = (category: 'KONVEKSI' | 'PERCETAKAN' | 'MERCH' | null): SizeQuantity => {
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

const getSizeLabelsForCategory = (category: 'KONVEKSI' | 'PERCETAKAN' | 'MERCH' | null) => {
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

const getSizeLabelText = (category: 'KONVEKSI' | 'PERCETAKAN' | 'MERCH' | null): string => {
  switch (category) {
    case 'KONVEKSI':
      return 'Jumlah per Ukuran';
    case 'PERCETAKAN':
      return 'Jumlah per Ukuran Kertas';
    case 'MERCH':
      return 'Jumlah';
    default:
      return 'Jumlah per Ukuran';
  }
};

const CustomerOrderForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    companyName: "",
    address: "",
    notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([
    { productType: "", sizes: { ...defaultClothingSizes }, notes: "" },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = () => {
    setItems([...items, { productType: "", sizes: { ...defaultClothingSizes }, notes: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    if (field === 'productType') {
      const oldCategory = getProductCategory(newItems[index].productType);
      const newCategory = getProductCategory(value);
      if (oldCategory !== newCategory) {
        newItems[index] = {
          ...newItems[index],
          [field]: value,
          sizes: getDefaultSizesForCategory(newCategory),
        };
      } else {
        newItems[index] = { ...newItems[index], [field]: value };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const updateSizeQuantity = (itemIndex: number, sizeKey: string, quantity: number) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      sizes: {
        ...newItems[itemIndex].sizes,
        [sizeKey]: Math.max(0, quantity),
      } as SizeQuantity,
    };
    setItems(newItems);
  };

  const getItemQuantity = (item: OrderItem) => {
    return Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalQuantity = () => {
    return items.reduce((sum, item) => sum + getItemQuantity(item), 0);
  };

  const formatSizesForMessage = (sizes: SizeQuantity, productType: string) => {
    const category = getProductCategory(productType);
    const labels = getSizeLabelsForCategory(category);
    const sizeStrings = labels
      .filter(({ key }) => (sizes as any)[key] > 0)
      .map(({ key, label }) => `${label}: ${(sizes as any)[key]}`);
    return sizeStrings.join(", ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error("Nama dan nomor WhatsApp wajib diisi");
      return;
    }

    const invalidItems = items.filter((item) => {
      const qty = getItemQuantity(item);
      return !item.productType || qty < 1;
    });

    if (invalidItems.length > 0) {
      const missingProduct = items.some((item) => !item.productType);
      const lowQuantity = items.some((item) => getItemQuantity(item) < 1 && item.productType);
      
      if (missingProduct && lowQuantity) {
        toast.error("Pilih jenis produk untuk semua item dan pastikan jumlah minimal 1 pcs per produk");
      } else if (missingProduct) {
        toast.error("Pilih jenis produk untuk semua item");
      } else {
        toast.error("Jumlah minimal 1 pcs per produk");
      }
      return;
    }

    setIsSubmitting(true);

    const orderDetails = items
      .map((item, idx) => {
        const sizesText = formatSizesForMessage(item.sizes, item.productType);
        const qty = getItemQuantity(item);
        const category = getProductCategory(item.productType);
        const sizeLabel = category === 'MERCH' ? 'Qty' : 'Ukuran';
        return `${idx + 1}. ${item.productType} - ${qty} pcs\n   ${sizeLabel}: ${sizesText}${item.notes ? `\n   Catatan: ${item.notes}` : ""}`;
      })
      .join("\n\n");

    const message = `Halo Konveksi Industry, saya ingin memesan:

*Data Pelanggan:*
Nama: ${formData.name}
No. WA: ${formData.phone}
${formData.email ? `Email: ${formData.email}` : ""}
${formData.address ? `Alamat: ${formData.address}` : ""}

*Detail Pesanan:*
${orderDetails}

Total: ${getTotalQuantity()} pcs

${formData.notes ? `*Catatan:*\n${formData.notes}` : ""}

Mohon info harga dan estimasi waktu pengerjaan. Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/6285754777068?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");

    toast.success("Mengarahkan ke WhatsApp untuk konfirmasi pesanan...");
    setIsSubmitting(false);
  };

  return (
    <section id="order-form" className="py-8 md:py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            Form <span className="text-accent">Pemesanan</span>
          </h2>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Isi form di bawah ini untuk memulai pemesanan. Tim kami akan menghubungi Anda via WhatsApp untuk konfirmasi harga dan detail produksi.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0">
            <CardHeader className="bg-accent rounded-t-lg">
              <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                Form Pesanan Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-lg font-bold text-primary">
                    <User className="w-5 h-5" />
                    Data Pelanggan
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-semibold">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Masukkan nama lengkap"
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-semibold">
                        Nomor WhatsApp <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="08123456789"
                          className="h-12 pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-semibold">
                        Email (Opsional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="email@example.com"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="font-semibold">
                        Nama Instansi/Perusahaan (Opsional)
                      </Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        placeholder="PT/CV/Instansi..."
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="font-semibold">
                        Alamat (Opsional)
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          placeholder="Alamat pengiriman"
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <Package className="w-5 h-5" />
                      Detail Produk
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="border-primary text-primary hover:bg-primary hover:text-white"
                    >
                      + Tambah Produk
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 md:p-6 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-accent transition-colors"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-primary">
                            Produk {index + 1}
                          </span>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              Hapus
                            </Button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="font-semibold">
                                Jenis Produk <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                value={item.productType}
                                onValueChange={(value) =>
                                  updateItem(index, "productType", value)
                                }
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Pilih jenis produk" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">KONVEKSI</div>
                                  {productCategories.KONVEKSI.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-1">PERCETAKAN</div>
                                  {productCategories.PERCETAKAN.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted mt-1">MERCH</div>
                                  {productCategories.MERCH.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-end">
                              <div className="bg-primary/10 rounded-lg px-4 py-3 w-full">
                                <span className="text-sm text-muted-foreground">Total Qty:</span>
                                <span className="ml-2 text-xl font-bold text-primary">
                                  {getItemQuantity(item)} pcs
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {(() => {
                              const category = getProductCategory(item.productType);
                              const sizeLabels = getSizeLabelsForCategory(category);
                              const labelText = getSizeLabelText(category);
                              const gridCols = category === 'MERCH' 
                                ? 'grid-cols-1 max-w-[150px]' 
                                : category === 'PERCETAKAN'
                                  ? 'grid-cols-4 sm:grid-cols-4 md:grid-cols-7'
                                  : 'grid-cols-5 sm:grid-cols-5 md:grid-cols-10';
                              
                              return (
                                <>
                                  <Label className="font-semibold">
                                    {labelText} <span className="text-red-500">*</span>
                                  </Label>
                                  <div className={`grid ${gridCols} gap-2`}>
                                    {sizeLabels.map(({ key, label }) => (
                                      <div key={key} className="space-y-1">
                                        <Label className="text-xs text-center block text-muted-foreground">
                                          {label}
                                        </Label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={(item.sizes as any)[key] || ""}
                                          onChange={(e) =>
                                            updateSizeQuantity(
                                              index,
                                              key,
                                              parseInt(e.target.value) || 0
                                            )
                                          }
                                          className="h-10 text-center px-1"
                                          placeholder="0"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label className="font-semibold">
                            Catatan Produk (warna, desain, dll)
                          </Label>
                          <Textarea
                            value={item.notes}
                            onChange={(e) =>
                              updateItem(index, "notes", e.target.value)
                            }
                            placeholder="Contoh: Warna hitam, logo di dada kiri, sablon 2 warna..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-lg font-bold text-primary">
                    <FileText className="w-5 h-5" />
                    Catatan Tambahan
                  </div>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Catatan khusus untuk pesanan Anda (deadline, referensi desain, dll)"
                    rows={3}
                  />
                </div>

                <div className="bg-accent/20 rounded-xl p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Quantity</div>
                      <div className="text-2xl font-black text-primary">
                        {getTotalQuantity()} PCS
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground max-w-md">
                      <p className="font-semibold text-foreground mb-1">Langkah Selanjutnya:</p>
                      <p>Setelah submit, Anda akan diarahkan ke WhatsApp untuk konfirmasi pesanan. Tim kami akan memberikan penawaran harga dan estimasi waktu.</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? (
                    "Memproses..."
                  ) : (
                    <>
                      <MessageCircle className="w-6 h-6 mr-2" />
                      Kirim Pesanan via WhatsApp
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Dengan mengirim pesanan, Anda menyetujui untuk dihubungi via WhatsApp oleh tim Konveksi Industry
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CustomerOrderForm;
