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

const ClientLogos = () => {
  const duplicatedLogos = [...logos, ...logos];
  
  return (
    <section className="py-3 bg-white overflow-hidden">
      <div className="relative">
        <div className="inline-flex animate-marquee-seamless whitespace-nowrap items-center">
          {duplicatedLogos.map((logo, index) => {
            return (
              <div
                key={index}
                className="mx-6 md:mx-8 inline-flex items-center justify-center flex-shrink-0 w-32 md:w-40 h-20 md:h-24"
              >
                <img 
                  src={logo.image} 
                  alt={logo.name}
                  className="object-contain mix-blend-multiply max-w-full max-h-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ClientLogos;
