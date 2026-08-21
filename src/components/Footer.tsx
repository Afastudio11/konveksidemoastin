import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-primary text-white py-16 relative overflow-hidden">

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4 group cursor-pointer" onClick={() => scrollToSection("home")}>
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                  KI
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-amber-400 transition-colors">
                    KONVEKSI INDUSTRY
                  </span>
                  <span className="text-[10px] tracking-widest uppercase font-semibold text-gray-300">
                    Custom Apparel & Garment
                  </span>
                </div>
              </div>
            </div>
            <p className="text-white/70 leading-relaxed mb-4 font-medium">
              Solusi konveksi profesional dengan kualitas premium untuk kebutuhan bisnis dan organisasi Anda.
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full w-fit">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-accent font-semibold text-sm">We're Open</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h4 className="font-black mb-6 text-lg flex items-center gap-2">
              <span className="w-1 h-6 bg-accent rounded-full" />
              Menu
            </h4>
            <ul className="space-y-3">
              {["Beranda", "Tentang", "Layanan", "Produk", "Kontak"].map((item, index) => (
                <li key={item}>
                  <button
                    onClick={() => scrollToSection(["home", "about", "services", "products", "contact"][index])}
                    className="text-white/70 hover:text-accent transition-all duration-300 hover:translate-x-1 inline-block font-medium"
                    data-testid={`footer-nav-${["home", "about", "services", "products", "contact"][index]}`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h4 className="font-black mb-6 text-lg flex items-center gap-2">
              <span className="w-1 h-6 bg-accent rounded-full" />
              Layanan
            </h4>
            <ul className="space-y-3 text-white/70">
              {["Seragam Kantor", "Kaos Custom", "Jaket & Hoodie", "Polo Shirt", "Merchandise"].map((item) => (
                <li key={item} className="hover:text-accent transition-colors cursor-default font-medium">{item}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h4 className="font-black mb-6 text-lg flex items-center gap-2">
              <span className="w-1 h-6 bg-accent rounded-full" />
              Kontak
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/70 group">
                <div className="p-2 bg-white rounded-lg group-hover:bg-white/90 transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                </div>
                <a href="tel:085754777068" className="hover:text-accent transition-colors font-medium" data-testid="footer-phone">
                  0857-5477-7068
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/70 group">
                <div className="p-2 bg-white rounded-lg group-hover:bg-white/90 transition-colors">
                  <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                </div>
                <a href="mailto:konveksiindustry@gmail.com" className="hover:text-accent transition-colors font-medium" data-testid="footer-email">
                  konveksiindustry@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-white/70 group">
                <div className="p-2 bg-white rounded-lg group-hover:bg-white/90 transition-colors">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                </div>
                <span className="font-medium">Jl. Maccini Sawah No 48, Maccini, Kota Makassar, Sulawesi Selatan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-center items-center gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-white/60 text-sm font-medium">
            © 2024 Konveksi Industry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
