import { useState, useEffect, useRef } from "react";
import HeroGallery from "./HeroGallery";

const stats = [
  { value: 500, suffix: "+", label: "Klien Puas" },
  { value: 1000, suffix: "+", label: "Produk Terjual" },
  { value: 5, suffix: "+", label: "Tahun Pengalaman" },
  { value: 100, suffix: "%", label: "Kepuasan Pelanggan" },
];

const logos = [
  { name: "Universitas Hasanuddin", image: "/unhas.png" },
  { name: "Tiga Rasa", image: "/tiga-rasa.png" },
  { name: "SD Telkom Makassar", image: "/sd-telkom.png" },
  { name: "Universitas Ciputra", image: "/uc.png" },
  { name: "PLN", image: "/pln.png" },
  { name: "Kabupaten Bantaeng", image: "/bantaeng.png" },
  { name: "Universitas Tadulako", image: "/untad.png" },
  { name: "Kota Makassar", image: "/kota-makassar.png" },
  { name: "KNPI", image: "/knpi.png" },
  { name: "Universitas Muhammadiyah Makassar", image: "/unismuh.png" },
  { name: "BPJS Kesehatan", image: "/bpjs.png" },
  { name: "Bank Mandiri", image: "/mandiri.png" },
  { name: "Universitas Muslim Indonesia", image: "/umi.png" },
];


const useCountAnimation = (end: number, duration: number = 2000, shouldStart: boolean) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * (end - startValue) + startValue);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration, shouldStart]);

  return count;
};

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: '#343CCD' }}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src="/hero-background.png" 
          alt="Sekala Industry Products" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#343CCD] via-[#343CCD] to-[#2a32a8]" />
      
      {/* Background Lines Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 50px,
          rgba(255, 255, 255, 0.1) 50px,
          rgba(255, 255, 255, 0.1) 51px
        )`
      }} />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 md:py-32">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6 md:space-y-8 animate-slide-up overflow-hidden">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight">
              <span className="text-white">Wujudkan</span><br />
              <span className="text-white">Brand Identity</span><br />
              <span className="bg-accent text-foreground px-2 sm:px-2.5 inline-block shadow-glow-accent border-4 border-black mt-3 md:mt-4 break-words leading-[0.9]" style={{ paddingTop: '2px', paddingBottom: '2px', maxWidth: 'calc(100vw - 2rem)' }}>Premium Kamu.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl">
              Sekala Industry adalah mitra terpercaya untuk kebutuhan konveksi profesional. Dari seragam perusahaan hingga merchandise custom dengan kualitas terbaik.
            </p>

            {/* Stats - 4 kotak dengan border tebal */}
            <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 -mx-1 sm:mx-0">
              {stats.map((stat, index) => {
                const count = useCountAnimation(stat.value, 2000, isVisible);
                
                return (
                  <div
                    key={index}
                    className="p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center text-center border-2 sm:border-4 border-black min-w-0"
                    style={{ backgroundColor: '#d4ff00' }}
                  >
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-black">
                      {count}{stat.suffix}
                    </div>
                    <div className="text-[10px] sm:text-xs md:text-sm text-black font-bold mt-1 leading-tight">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Client Logos */}
            <div className="relative overflow-hidden w-full">
              <div className="inline-flex animate-marquee-seamless whitespace-nowrap items-center">
                {[...logos, ...logos, ...logos, ...logos, ...logos].map((logo, index) => {
                  const isMandiri = logo.name === "Bank Mandiri";
                  const isTelkom = logo.name === "SD Telkom Makassar";
                  
                  return (
                    <img 
                      key={index}
                      src={logo.image} 
                      alt={logo.name}
                      className={`object-contain flex-shrink-0 mx-3 sm:mx-6 ${
                        isMandiri ? 'h-6 sm:h-7' : 
                        isTelkom ? 'h-6 sm:h-7' : 
                        'h-8 sm:h-10'
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Product Gallery */}
          <div className="hidden lg:block animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <HeroGallery />
          </div>
        </div>

        {/* Mobile Gallery - Below text on small screens */}
        <div className="lg:hidden mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <HeroGallery />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-accent rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
