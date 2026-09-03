import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Factory,
  FileText,
  Layers,
  Package,
  Scissors,
  Truck,
  Users,
  Wallet,
  AlertCircle,
  Download,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchProject {
  id: string;
  code: string;
  name: string;
  category: string;
  deadline: string;
  progress: number;
  totalPcs: number;
  totalBudget: number;
  expensesRealized: number;
  status: 'planning' | 'in_progress' | 'qc' | 'ready_to_ship';
  currentStage: string;
  description: string;
  stages: Array<{
    name: string;
    pic: string;
    status: 'selesai' | 'proses' | 'menunggu';
    completionDate?: string;
    notes: string;
  }>;
  materials: Array<{
    name: string;
    category: string;
    quantity: string;
    status: 'Tersedia' | 'Sedang Digunakan' | 'Menipis';
    supplier: string;
  }>;
  expenses: Array<{
    item: string;
    vendor: string;
    amount: number;
    paymentStatus: 'Lunas' | 'Belum Dibayar';
    date: string;
  }>;
  orders: Array<{
    invoice: string;
    customer: string;
    company: string;
    product: string;
    quantity: number;
    orderTotal: number;
    paymentStatus: string;
  }>;
}

const batchDataMap: Record<string, BatchProject> = {
  'batch-september-2026': {
    id: 'batch-september-2026',
    code: 'BATCH-202609-01',
    name: 'Proyek Batch September 2026',
    category: 'Kombinasi Kemeja PDH & Jaket Lapangan',
    deadline: '22 September 2026',
    progress: 68,
    totalPcs: 850,
    totalBudget: 42500000,
    expensesRealized: 26850000,
    status: 'in_progress',
    currentStage: 'Penjahitan & Bordir Komputer',
    description: 'Produksi terpusat klaster pesanan instansi pemerintah daerah dan korporasi untuk pengiriman akhir September.',
    stages: [
      { name: 'Surat Perintah Kerja (SPK) & Approval Desain', pic: 'Tim Desain (Fathan)', status: 'selesai', completionDate: '01 Sep 2026', notes: 'Pola ukuran S-XXL dan mockup bordir disetujui klien' },
      { name: 'Pengadaan Bahan Baku (Kain Drill & Benang)', pic: 'Logistik (Andi)', status: 'selesai', completionDate: '03 Sep 2026', notes: 'Kain Drill American Khaki 120m telah masuk gudang' },
      { name: 'Pola & Pemotongan Bahan (Cutting)', pic: 'Divisi Potong (Pak Yanto)', status: 'selesai', completionDate: '06 Sep 2026', notes: '850 pola badan, lengan, dan kerah selesai dipotong presisi' },
      { name: 'Bordir Komputer & Sablon Logo', pic: 'Vendor Mitra Bordir Pro', status: 'proses', notes: 'Progress bordir logo dada dan punggung mencapai 75%' },
      { name: 'Penjahitan (Assembly Sewing Line)', pic: 'Line Leader (Bu Rahma)', status: 'proses', notes: '2 line jahit aktif, kapasitas 90 pcs/hari' },
      { name: 'Quality Control (QC) & Buang Benang', pic: 'Tim QC (Ibu Siti)', status: 'menunggu', notes: 'Pengecekan jahitan, kerapian benang, dan kesesuaian size chart' },
      { name: 'Steam Ironing & Packing Plastik Zipper', pic: 'Finishing Team', status: 'menunggu', notes: 'Setiap kemeja dipress uap dan dipacking zipper bag custom' },
      { name: 'Ekspedisi & Distribusi Pelanggan', pic: 'Logistik', status: 'menunggu', notes: 'Pengiriman via cargo ke kantor klien' },
    ],
    materials: [
      { name: 'Kain Drill American Khaki', category: 'Kain Utama', quantity: '120 meter', status: 'Sedang Digunakan', supplier: 'PT Grand Textile' },
      { name: 'Kain Furing Asahi Hitam', category: 'Kain Tambahan', quantity: '45 meter', status: 'Tersedia', supplier: 'Toko Tekstil Bandung' },
      { name: 'Benang Jahit Astra Khaki & Hitam', category: 'Benang', quantity: '24 roll', status: 'Sedang Digunakan', supplier: 'UD Benang Rajawali' },
      { name: 'Kancing Kemeja Formal 4 Lubang', category: 'Aksesori', quantity: '1.200 pcs', status: 'Tersedia', supplier: 'UD Kancing YKK' },
      { name: 'Kain Keras Kerah & Manset (Interlining)', category: 'Material Pendukung', quantity: '35 meter', status: 'Tersedia', supplier: 'CV Interlining Prima' },
      { name: 'Plastik Zipper Bag Custom ouruniform', category: 'Packaging', quantity: '900 pcs', status: 'Tersedia', supplier: 'Sentra Plastik Pack' },
    ],
    expenses: [
      { item: 'Belanja Kain Drill American Khaki 120m', vendor: 'PT Grand Textile Bandung', amount: 6240000, paymentStatus: 'Lunas', date: '02 Sep 2026' },
      { item: 'Jasa Bordir Komputer Logo Dada & Punggung', vendor: 'CV Mitra Bordir Komputer', amount: 4250000, paymentStatus: 'Lunas', date: '04 Sep 2026' },
      { item: 'DP Ongkos Jahit Makloon Line 1 & Line 2', vendor: 'Sentra Jahit Tailor Pro', amount: 8500000, paymentStatus: 'Belum Dibayar', date: '05 Sep 2026' },
      { item: 'Aksesori Kancing, Resleting & Kain Keras', vendor: 'UD Kancing YKK', amount: 1860000, paymentStatus: 'Lunas', date: '03 Sep 2026' },
      { item: 'Packaging Zipper Bag & Label Woven Custom', vendor: 'Sentra Plastik Pack', amount: 2000000, paymentStatus: 'Lunas', date: '04 Sep 2026' },
    ],
    orders: [
      { invoice: 'DEMO-3B/202608/019', customer: 'Yusuf Hidayat', company: 'Dinas Bina Marga & PU', product: 'Kemeja PDH Drill Khaki', quantity: 350, orderTotal: 41250000, paymentStatus: 'Lunas' },
      { invoice: 'DEMO-3B/202608/097', customer: 'Budi Santoso', company: 'PT Sentosa Logistik', product: 'Kemeja Lapangan Tactical', quantity: 280, orderTotal: 37491750, paymentStatus: 'DP Dibayar' },
      { invoice: 'DEMO-3B/202608/045', customer: 'Rizal Akbar', company: 'CV Prima Mandiri', product: 'Seragam Kerja Teknisi', quantity: 220, orderTotal: 17016300, paymentStatus: 'Lunas' },
    ],
  },
  'seragam-kantor-bumn': {
    id: 'seragam-kantor-bumn',
    code: 'BATCH-BUMN-04',
    name: 'Seragam Kantor BUMN & Korporat',
    category: 'Kemeja Formal & Batik Kombinasi',
    deadline: '28 September 2026',
    progress: 45,
    totalPcs: 420,
    totalBudget: 33600000,
    expensesRealized: 14200000,
    status: 'in_progress',
    currentStage: 'Pola Potong & Persiapan Sablon',
    description: 'Proyek batch seragam kerja formal perbankan dan BUMN energi dengan standar jahitan semi-butik.',
    stages: [
      { name: 'Pengukuran & Finalisasi Size Chart Pegawai', pic: 'Customer Relations', status: 'selesai', completionDate: '28 Agu 2026', notes: 'Daftar nama dan ukuran dada lengkap' },
      { name: 'Pengadaan Kain Tropical Deluxe', pic: 'Logistik', status: 'selesai', completionDate: '01 Sep 2026', notes: 'Kain Katun Tropical 75m warna Navy Blue' },
      { name: 'Pemotongan Bahan (Cutting)', pic: 'Divisi Potong', status: 'proses', notes: 'Sedang proses cutting pola kerah dan badan' },
      { name: 'Bordir Monogram & Logo Korporasi', pic: 'Mitra Bordir Digital', status: 'menunggu', notes: 'Jadwal masuk mesin bordir 08 September' },
      { name: 'Perakitan & Penjahitan Formal', pic: 'Line 3 Garment', status: 'menunggu', notes: 'Estimasi mulai jahit 10 September' },
      { name: 'QC, Kancing Lubang, & Packing', pic: 'QC Team', status: 'menunggu', notes: 'Pemasangan kancing berlogo' },
    ],
    materials: [
      { name: 'Kain Katun Tropical Deluxe Navy', category: 'Kain Utama', quantity: '75 meter', status: 'Sedang Digunakan', supplier: 'PT Danliris Solo' },
      { name: 'Kain Batik Katun Motif Eksklusif', category: 'Kombinasi', quantity: '25 meter', status: 'Tersedia', supplier: 'Batik Danar Hadi' },
      { name: 'Kancing Laser Engraved Custom', category: 'Aksesori', quantity: '600 pcs', status: 'Tersedia', supplier: 'UD Tombol Kancing' },
    ],
    expenses: [
      { item: 'Bahan Baku Kain Tropical Deluxe 75m', vendor: 'PT Danliris Solo', amount: 5625000, paymentStatus: 'Lunas', date: '01 Sep 2026' },
      { item: 'Kain Batik Motif Eksklusif 25m', vendor: 'Batik Danar Hadi', amount: 2250000, paymentStatus: 'Lunas', date: '02 Sep 2026' },
      { item: 'Uang Muka Penjahitan Kemeja Formal', vendor: 'Line 3 Garment', amount: 6325000, paymentStatus: 'Belum Dibayar', date: '04 Sep 2026' },
    ],
    orders: [
      { invoice: 'DEMO-3B/202608/071', customer: 'Andi Pratama', company: 'PT Bank Mandiri (Persero) Tbk', product: 'Kemeja Formal Tropical Navy', quantity: 240, orderTotal: 19200000, paymentStatus: 'Lunas' },
      { invoice: 'DEMO-3B/202608/004', customer: 'Dewi Lestari', company: 'PT PLN (Persero) Wilayah Sulsel', product: 'Kemeja Batik Kombinasi', quantity: 180, orderTotal: 14400000, paymentStatus: 'Menunggu Pelunasan' },
    ],
  },
  'kaos-polo-merchandise': {
    id: 'kaos-polo-merchandise',
    code: 'BATCH-MERCH-02',
    name: 'Kaos Polo & Event Merchandise',
    category: 'Kaos Polo Lacoste & Jersey Printing',
    deadline: '18 September 2026',
    progress: 88,
    totalPcs: 1200,
    totalBudget: 58000000,
    expensesRealized: 39500000,
    status: 'qc',
    currentStage: 'Quality Control, Finishing & Packing',
    description: 'Pesanan massal merchandise kegiatan organisasi kepemudaan, komunitas olahraga, dan gathering perusahaan.',
    stages: [
      { name: 'SPK & Approval Cetak Mockup', pic: 'Tim Desain', status: 'selesai', completionDate: '24 Agu 2026', notes: 'Desain sablon DTF dan bordir dada disetujui' },
      { name: 'Pengadaan Kain Lacoste CVC & Dryfit', pic: 'Logistik', status: 'selesai', completionDate: '26 Agu 2026', notes: 'Bahan baku 120 kg CVC dan 80 kg Dryfit' },
      { name: 'Cutting Bahan Massal', pic: 'Divisi Potong', status: 'selesai', completionDate: '29 Agu 2026', notes: 'Selesai 1.200 pola kaos polo dan jersey' },
      { name: 'Sablon DTF & Sublimasi Printing', pic: 'Divisi Sablon', status: 'selesai', completionDate: '02 Sep 2026', notes: 'Cetak sublim jersey dan bordir polo selesai' },
      { name: 'Penjahitan Kerah & Rib', pic: 'Line Jahit Kaos', status: 'selesai', completionDate: '05 Sep 2026', notes: '1.200 pcs selesai dirakit jahit rantai' },
      { name: 'Quality Control (QC) & Packing', pic: 'Finishing Team', status: 'proses', notes: '1.050 pcs telah lolos inspeksi dan diplastik' },
      { name: 'Ekspedisi Pengiriman', pic: 'Logistik', status: 'menunggu', notes: 'Jadwal jemput armada kargo 08 September' },
    ],
    materials: [
      { name: 'Kain Lacoste CVC Pique Hitam & Navy', category: 'Kain Polo', quantity: '120 kg', status: 'Sedang Digunakan', supplier: 'CV Knitto Textile' },
      { name: 'Kain Dryfit Milano Printing', category: 'Jersey', quantity: '80 kg', status: 'Tersedia', supplier: 'Sentra Dryfit Bandung' },
      { name: 'Kerah & Manset Rajut Custom', category: 'Aksesori', quantity: '800 pasang', status: 'Tersedia', supplier: 'Pabrik Rib Solo' },
    ],
    expenses: [
      { item: 'Kain Lacoste CVC Pique 120kg', vendor: 'CV Knitto Textile', amount: 16200000, paymentStatus: 'Lunas', date: '25 Agu 2026' },
      { item: 'Kain Dryfit Milano 80kg', vendor: 'Sentra Dryfit Bandung', amount: 7840000, paymentStatus: 'Lunas', date: '26 Agu 2026' },
      { item: 'Jasa Cetak Sublimasi Jersey 400 pcs', vendor: 'Toko Sablon & DTF Makassar', amount: 6000000, paymentStatus: 'Lunas', date: '30 Agu 2026' },
      { item: 'Ongkos Jahit Makloon Polo & Jersey', vendor: 'Konveksi Mitra Sejahtera', amount: 9460000, paymentStatus: 'Lunas', date: '04 Sep 2026' },
    ],
    orders: [
      { invoice: 'DEMO-3B/202608/030', customer: 'Nabila Putri', company: 'DPD KNPI Sulawesi Selatan', product: 'Jersey Printing Komunitas', quantity: 400, orderTotal: 28000000, paymentStatus: 'Lunas' },
      { invoice: 'DEMO-3B/202608/003', customer: 'Emra Sasmita', company: 'Komunitas Motor Makassar', product: 'Kaos Polo Lacoste CVC', quantity: 500, orderTotal: 42500000, paymentStatus: 'Lunas' },
      { invoice: 'DEMO-3B/202608/012', customer: 'Faizal Akbar', company: 'Event Organizer Celebes', product: 'Kaos Polo Gathering', quantity: 300, orderTotal: 24000000, paymentStatus: 'Lunas' },
    ],
  },
};

const formatIDR = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function AdminBatchDetail() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pipeline');

  const currentBatch = useMemo(() => {
    if (!batchId) return batchDataMap['batch-september-2026'];
    return batchDataMap[batchId] || batchDataMap['batch-september-2026'];
  }, [batchId]);

  const handlePrintSPK = () => {
    toast.success(`SPK Batch ${currentBatch.code} siap diunduh / dicetak`);
    window.print();
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 pb-6 w-full">
        {/* Navigation & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span>Batch Produksi</span>
            <span>/</span>
            <span className="font-semibold text-foreground">{currentBatch.code}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {currentBatch.name}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  <span className="size-1.5 rounded-full bg-violet-600 animate-pulse" />
                  {currentBatch.currentStage}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {currentBatch.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintSPK}
                className="h-9 text-xs rounded-lg border-border gap-1.5 font-medium"
              >
                <Download className="size-3.5 text-muted-foreground" />
                <span>Cetak SPK Batch</span>
              </Button>
              <Button
                size="sm"
                onClick={() => toast.success('Status tahapan batch berhasil diperbarui')}
                className="h-9 text-xs rounded-lg bg-foreground text-background hover:bg-foreground/90 font-medium gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Update Progress</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 4-Metric Divider Cards - Square UI Leads */}
        <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Package className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Target Total Produksi</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {currentBatch.totalPcs} <span className="text-xs font-normal text-muted-foreground">pcs</span>
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Calendar className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Deadline Pengiriman</p>
                <p className="text-sm sm:text-base font-bold tracking-tight text-foreground mt-0.5 truncate">
                  {currentBatch.deadline}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Wallet className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Realisasi Biaya Vendor</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {formatIDR(currentBatch.expensesRealized)}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <Button variant="outline" size="icon" className="size-9 rounded-lg shrink-0 border-border">
                <Building2 className="size-4 text-muted-foreground" />
              </Button>
              <div>
                <p className="text-xs font-medium text-muted-foreground">SPK Pelanggan Terkait</p>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {currentBatch.orders.length} <span className="text-xs font-normal text-muted-foreground">instansi</span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Bar Banner */}
        <Card className="rounded-xl border-border bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="text-muted-foreground">Kesiapan Batch Keseluruhan</span>
            <span className="font-bold text-foreground">{currentBatch.progress}% Selesai</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-500 rounded-full"
              style={{ width: `${currentBatch.progress}%` }}
            />
          </div>
        </Card>

        {/* Tab Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 rounded-xl border border-border">
            <TabsTrigger value="pipeline" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Factory className="size-3.5 mr-1.5" />
              Alur & Tahapan Produksi
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Layers className="size-3.5 mr-1.5" />
              Alokasi Bahan Baku
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <Wallet className="size-3.5 mr-1.5" />
              Beban & Biaya Vendor
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-2xs">
              <FileText className="size-3.5 mr-1.5" />
              Daftar SPK / Order Klien
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PIPELINE / TAHAPAN PRODUKSI */}
          <TabsContent value="pipeline" className="space-y-3">
            <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Timeline Tahapan Kerja Divisi</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Instruksi kerja dan tanggung jawab PIC dari pemotongan hingga packing.</p>
                </div>
              </div>
              <div className="divide-y divide-border/60">
                {currentBatch.stages.map((stage, idx) => {
                  const isDone = stage.status === 'selesai';
                  const isProcess = stage.status === 'proses';

                  return (
                    <div key={stage.name} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isDone
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300'
                              : isProcess
                              ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-300'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="size-4" /> : idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs sm:text-sm text-foreground">{stage.name}</p>
                            {stage.completionDate && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/60">
                                Selesai {stage.completionDate}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{stage.notes}</p>
                          <span className="text-[11px] font-medium text-foreground/80 mt-1 inline-block">
                            PIC: {stage.pic}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : isProcess
                            ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {isDone ? 'Selesai' : isProcess ? 'Sedang Pengerjaan' : 'Menunggu'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: BAHAN BAKU & MATERIAL */}
          <TabsContent value="materials" className="space-y-3">
            <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Alokasi Bahan Baku Gudang</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Bahan yang dialokasikan dari gudang stok untuk pengerjaan batch ini.</p>
                </div>
                <Link to="/admin/inventory">
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1 border-border">
                    <span>Lihat Gudang Stok</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nama Bahan Baku</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Kuantitas Dialokasikan</th>
                      <th className="px-4 py-3">Supplier Vendor</th>
                      <th className="px-4 py-3 text-right">Status Kesiapan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {currentBatch.materials.map((mat) => (
                      <tr key={mat.name} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{mat.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{mat.category}</td>
                        <td className="px-4 py-3 font-mono font-medium text-foreground">{mat.quantity}</td>
                        <td className="px-4 py-3 text-muted-foreground">{mat.supplier}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              mat.status === 'Tersedia'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : mat.status === 'Sedang Digunakan'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {mat.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: BIAYA & EXPENSES */}
          <TabsContent value="expenses" className="space-y-3">
            <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Realisasi Beban Produksi</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Biaya belanja kain, makloon jahit, bordir, dan aksesoris batch ini.</p>
                </div>
                <Link to="/admin/expenses">
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1 border-border">
                    <span>Ke Menu Pengeluaran</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Uraian Biaya / Item</th>
                      <th className="px-4 py-3">Vendor Penyedia</th>
                      <th className="px-4 py-3">Tanggal Catat</th>
                      <th className="px-4 py-3">Status Pembayaran</th>
                      <th className="px-4 py-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {currentBatch.expenses.map((exp) => (
                      <tr key={exp.item} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">{exp.item}</td>
                        <td className="px-4 py-3 text-muted-foreground">{exp.vendor}</td>
                        <td className="px-4 py-3 text-muted-foreground">{exp.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              exp.paymentStatus === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {exp.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold font-mono text-foreground">
                          {formatIDR(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t border-border font-semibold">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-foreground">Total Realisasi Beban</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-foreground">
                        {formatIDR(currentBatch.expensesRealized)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: DAFTAR ORDER KLIEN */}
          <TabsContent value="orders" className="space-y-3">
            <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border/70 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Order Klien Terkait Batch Ini</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Surat Perintah Kerja (SPK) dari klien yang digabungkan dalam antrean produksi batch ini.</p>
                </div>
                <Link to="/admin/orders">
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1 border-border">
                    <span>Semua Pesanan</span>
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </Button>
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Nomor Invoice</th>
                      <th className="px-4 py-3">Klien / Pemesan</th>
                      <th className="px-4 py-3">Produk & Spesifikasi</th>
                      <th className="px-4 py-3">Kuantitas</th>
                      <th className="px-4 py-3">Nilai Order</th>
                      <th className="px-4 py-3">Status Bayar</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {currentBatch.orders.map((ord) => (
                      <tr key={ord.invoice} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-foreground">{ord.invoice}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-foreground">{ord.customer}</p>
                          <p className="text-[11px] text-muted-foreground">{ord.company}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground">{ord.product}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{ord.quantity} pcs</td>
                        <td className="px-4 py-3 font-mono font-semibold text-foreground">{formatIDR(ord.orderTotal)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              ord.paymentStatus === 'Lunas'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to="/admin/orders">
                            <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg px-2 gap-1 border-border">
                              <span>Detail</span>
                              <ArrowRight className="size-3 text-muted-foreground" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
