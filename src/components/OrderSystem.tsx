import { useState } from "react";
import { MessageCircle, Users, Handshake, FileText, Factory, CreditCard, Truck, Package, Clock, Wallet, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OrderSystem = () => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const processFlow = [
    { 
      icon: MessageCircle, 
      label: "Chat", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Chat dengan Tim Kami",
      description: "Mulai percakapan dengan tim kami melalui WhatsApp untuk memulai proses pemesanan. Kami siap membantu Anda kapan saja!"
    },
    { 
      icon: Users, 
      label: "Konsultasi", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Konsultasi Awal",
      description: "Costumer dapat memulai proses pemesanan dengan menghubungi kami melalui WhatsApp. Tim kami akan melakukan sesi konsultasi untuk memahami kebutuhan Anda, mulai dari jenis produk, bahan yang diinginkan, hingga estimasi kuantitas. Setelah spesifikasi disepakati, kami akan mengirimkan penawaran harga dalam bentuk invoice."
    },
    { 
      icon: Handshake, 
      label: "Deal", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Kesepakatan Deal",
      description: "Setelah konsultasi, kami akan menyepakati detail produk, harga, dan timeline. Kesepakatan ini akan menjadi dasar untuk proses selanjutnya."
    },
    { 
      icon: FileText, 
      label: "DP", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Down Payment (DP)",
      description: "Pembayaran DP sebesar 50% dari total nilai invoice sebagai konfirmasi pemesanan dan dasar dimulainya proses produksi."
    },
    { 
      icon: Factory, 
      label: "Produksi", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Proses Produksi",
      description: "Produksi akan dimulai setelah pembayaran DP diterima. Estimasi waktu produksi adalah antara 10 hingga 23 hari kerja, tergantung kompleksitas desain dan jumlah pesanan. Pelanggan akan mendapatkan update secara berkala mengenai progress produksi untuk memastikan transparansi dan kenyamanan selama proses berlangsung."
    },
    { 
      icon: CreditCard, 
      label: "Pelunasan", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Pelunasan",
      description: "Pelunasan sebesar 50% dilakukan setelah produksi selesai dan produk siap untuk dikirim. Tim kami akan menghubungi pelanggan untuk pemberitahuan pelunasan sebelum pengiriman dilakukan."
    },
    { 
      icon: Truck, 
      label: "Pengiriman", 
      color: "bg-accent", 
      iconColor: "text-black", 
      lineColor: "bg-accent",
      title: "Pengiriman Produk",
      description: "Setelah pelunasan, produk akan segera dikirim ke alamat tujuan. Kami akan memberikan informasi tracking untuk memantau pengiriman produk Anda."
    }
  ];

  return (
    <section id="order" className="py-12 md:py-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-10 max-w-3xl mx-auto animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4">
            Sistem <span style={{ color: '#343CCD' }}>Order</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Proses pemesanan yang mudah dan transparan untuk kenyamanan Anda
          </p>
        </div>

        {/* Process Flow - Horizontal */}
        <div className="mb-16 md:mb-20">
          <div className="overflow-x-auto pb-6 pt-6 -mx-4 px-4">
            <div className="flex gap-4 md:gap-6 min-w-max md:w-full md:max-w-6xl md:mx-auto md:justify-center">
              {processFlow.map((step, index) => {
                const Icon = step.icon;
                
                return (
                  <div key={index} className="relative flex flex-col items-center flex-shrink-0">
                    <button 
                      onClick={() => setSelectedStep(index)}
                      className="flex flex-col items-center group cursor-pointer transition-all duration-500 ease-out"
                    >
                      <div className="relative">
                        <div className={`${step.color} p-4 md:p-5 rounded-2xl shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 ease-out w-[80px] h-[70px] md:w-[90px] md:h-[80px] flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 md:w-9 md:h-9 ${step.iconColor} transition-transform duration-500 group-hover:scale-110`} />
                        </div>
                        {/* Number Badge */}
                        <div className="absolute -top-3 -right-3 bg-black text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-sm md:text-base font-black shadow-md">
                          {index + 1}
                        </div>
                      </div>
                      <span className="mt-3 text-xs md:text-base font-bold text-foreground text-center leading-snug max-w-[80px] md:max-w-none transition-colors duration-300 group-hover:text-primary">{step.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-16 md:mb-20">
          <div className="grid grid-cols-2 md:flex gap-4 md:gap-5 px-4 md:px-4 max-w-5xl mx-auto">
            <div className="bg-accent rounded-2xl p-4 md:p-6 text-center hover:shadow-2xl transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1 md:flex-1 min-h-[100px] md:min-h-[90px] flex flex-col items-center justify-center">
              <h4 className="text-xs md:text-sm font-bold text-black mb-2 leading-tight tracking-wide">MINIMUM ORDER</h4>
              <p className="text-lg md:text-2xl font-black text-black">1 PCS</p>
            </div>

            <div className="bg-accent rounded-2xl p-4 md:p-6 text-center hover:shadow-2xl transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1 md:flex-1 min-h-[100px] md:min-h-[90px] flex flex-col items-center justify-center">
              <h4 className="text-xs md:text-sm font-bold text-black mb-2 leading-tight tracking-wide">ESTIMASI PRODUKSI</h4>
              <p className="text-lg md:text-2xl font-black text-black">10-23 Hari</p>
            </div>

            <div className="bg-accent rounded-2xl p-4 md:p-6 text-center hover:shadow-2xl transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1 md:flex-1 min-h-[100px] md:min-h-[90px] flex flex-col items-center justify-center">
              <h4 className="text-xs md:text-sm font-bold text-black mb-2 leading-tight tracking-wide">SISTEM BAYAR</h4>
              <p className="text-base md:text-xl font-black text-black">DP 50% + 50%</p>
            </div>

            <div className="bg-accent rounded-2xl p-4 md:p-6 text-center hover:shadow-2xl transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1 md:flex-1 min-h-[100px] md:min-h-[90px] flex flex-col items-center justify-center">
              <h4 className="text-xs md:text-sm font-bold text-black mb-2 leading-tight tracking-wide">BONUS</h4>
              <p className="text-base md:text-xl font-black text-black">Konsultasi Gratis</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <a
            href="https://wa.me/6285754777068?text=Halo%20Sekala%20Industry,%20saya%20ingin%20konsultasi%20untuk%20pemesanan%20produk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 text-black font-black text-lg md:text-xl rounded-full shadow-2xl hover:shadow-xl transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1"
            style={{ backgroundColor: '#d4ff00' }}
          >
            <MessageCircle className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12" />
            Mulai Konsultasi Sekarang
          </a>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            Tim kami siap membantu mewujudkan kebutuhan konveksi Anda
          </p>
        </div>
      </div>

      {/* Dialog for Step Details */}
      <Dialog open={selectedStep !== null} onOpenChange={() => setSelectedStep(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {selectedStep !== null && (
                <>
                  <div className={`p-3 ${processFlow[selectedStep].color} rounded-xl`}>
                    {(() => {
                      const Icon = processFlow[selectedStep].icon;
                      return <Icon className={`w-6 h-6 ${processFlow[selectedStep].iconColor}`} />;
                    })()}
                  </div>
                  {processFlow[selectedStep].title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedStep !== null && (
            <div className="mt-4">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {processFlow[selectedStep].description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default OrderSystem;
