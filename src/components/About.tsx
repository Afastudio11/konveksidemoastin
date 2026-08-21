import { CheckCircle2 } from "lucide-react";

const features = [
  "Kualitas bahan premium dan tahan lama",
  "Proses produksi cepat dan tepat waktu",
  "Harga kompetitif untuk semua kalangan",
  "Customisasi design sesuai kebutuhan",
  "Layanan konsultasi gratis",
  "After-sales support terpercaya",
];

const About = () => {
  return (
    <section id="about" className="py-12 md:py-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Kolom Kiri - Judul dan Body Text */}
            <div className="animate-slide-up">
              <div className="inline-block mb-3">
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                  Tentang Kami
                </span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4 text-balance">
                Mitra Terpercaya untuk Kebutuhan <span className="gradient-text">Konveksi Anda</span>
              </h2>
              
              <p className="text-base text-muted-foreground leading-relaxed">
                Sekala Industry adalah One Stop Convection yang memudahkan setiap kebutuhan konveksi perusahaan Anda. 
                Dari desain hingga hasil jadi, semua kami tangani dalam satu alur terpadu yang efisien dan presisi. 
                Sebagai konveksi terpercaya di Indonesia Timur, Sekala hadir menghadirkan solusi produksi dari seragam kerja, PDH, PDL, 
                hingga apparel custom dengan berbagai gaya terbaru dan kualitas yang menjahit kepercayaan di setiap detailnya.
              </p>
            </div>

            {/* Kolom Kanan - Bullet Points */}
            <div className="grid gap-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 group"
                  data-testid={`about-feature-${index}`}
                >
                  <div className="p-1.5 bg-accent rounded-md group-hover:bg-accent transition-all duration-300 group-hover:scale-110 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0" />
                  </div>
                  <span className="text-base md:text-lg text-foreground group-hover:text-primary transition-colors">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
