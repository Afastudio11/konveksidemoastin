import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const usePageHeader = !isHomePage;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (!isHomePage) {
      navigate(`/#${id}`);
      return;
    }
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setIsMenuOpen(false);
    }
  };

  const handleLogoClick = () => {
    if (!isHomePage) {
      navigate("/");
    } else {
      scrollToSection("home");
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        usePageHeader
          ? "bg-[#172c73]/95 backdrop-blur-xl shadow-lg py-3"
          : scrolled
          ? "glassmorphism-dark shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={handleLogoClick}
            data-testid="link-home"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg transition-transform duration-300 group-hover:scale-105">
                KI
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  KONVEKSI INDUSTRY
                </span>
                <span className="text-[9px] tracking-widest uppercase font-semibold text-gray-300">
                  Custom Apparel & Garment
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {["Beranda", "Tentang", "Pricelist", "Kontak"].map((item, index) => (
              <button
                key={item}
                onClick={() => scrollToSection(["home", "about", "products", "contact"][index])}
                className="px-4 py-2 text-sm font-semibold transition-all duration-300 relative group rounded-lg text-white/90 hover:text-white"
                data-testid={`nav-${["home", "about", "products", "contact"][index]}`}
              >
                <span className="relative z-10">{item}</span>
                <span className="absolute inset-0 bg-accent/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-3/4" />
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/tracking">
              <button 
                className="px-6 py-2 bg-[#CCFF00] text-blue-900 font-bold rounded-full transition-all duration-300 hover:scale-105 border-2 border-black"
                data-testid="button-cek-pesanan-header"
              >
                Cek Pesananmu
              </button>
            </Link>
            <a
              href="https://wa.me/6285754777068?text=Halo%20Konveksi%20Industry%2C%20saya%20tertarik%20dengan%20layanan%20konveksi%20Anda"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-[#CCFF00] text-blue-900 font-bold rounded-full transition-all duration-300 hover:scale-105 border-2 border-black"
              data-testid="button-pesan-header"
            >
              Pesan Sekarang
            </a>
          </div>

          <button
            className="lg:hidden p-2 rounded-lg text-white transition-all duration-300 hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="lg:hidden absolute top-full left-0 right-0 bg-primary/95 backdrop-blur-lg border-t border-white/10 px-4 py-6 flex flex-col gap-3 animate-slide-down shadow-2xl">
            {["Beranda", "Tentang", "Pricelist", "Kontak"].map((item, index) => (
              <button
                key={item}
                onClick={() => scrollToSection(["home", "about", "products", "contact"][index])}
                className="px-4 py-3 text-left font-semibold transition-all duration-300 rounded-lg text-white hover:bg-white/10 hover:text-accent"
                data-testid={`nav-mobile-${["home", "about", "services", "products", "contact"][index]}`}
              >
                {item}
              </button>
            ))}
            <div className="flex gap-3 mt-2">
              <Link to="/tracking" className="flex-1">
                <button 
                  className="btn-header-accent w-full text-center"
                  data-testid="button-cek-pesanan-mobile"
                >
                  Cek Pesananmu
                </button>
              </Link>
              <Link to="/order" className="flex-1">
                <button 
                  className="btn-header-accent w-full text-center"
                  data-testid="button-pesan-mobile"
                >
                  Pesan Sekarang
                </button>
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
