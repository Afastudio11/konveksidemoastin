const ProductGallery = () => {
  const products = [
    {
      id: 1,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0016_1759648130417.jpg",
      title: "Celana Chino",
      category: "Casual"
    },
    {
      id: 2,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0018_1759648130418.jpg",
      title: "Varsity Jacket",
      category: "Streetwear"
    },
    {
      id: 3,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0024_1759648130419.jpg",
      title: "Seragam Formal",
      category: "Formal"
    },
    {
      id: 4,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0026_1759648130419.jpg",
      title: "Toga Wisuda",
      category: "Akademik"
    },
    {
      id: 5,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0028_1759648130419.jpg",
      title: "Dress Motif",
      category: "Fashion"
    },
    {
      id: 6,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0030_1759648130420.jpg",
      title: "Jumpsuit Custom",
      category: "Workwear"
    },
    {
      id: 7,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0014_1759648130420.jpg",
      title: "Coach Jacket",
      category: "Streetwear"
    },
    {
      id: 8,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0012_1759645213700.jpg",
      title: "Sweater Custom",
      category: "Streetwear"
    },
    {
      id: 9,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0004_1759645213702.jpg",
      title: "Jersey Olahraga",
      category: "Sport"
    },
    {
      id: 10,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0022_1759645213702.jpg",
      title: "Seragam Sekolah",
      category: "Formal"
    },
    {
      id: 11,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0020_1759645213702.jpg",
      title: "Vest Tactical",
      category: "Streetwear"
    },
    {
      id: 12,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0006_1759645213702.jpg",
      title: "Kemeja Bordir",
      category: "Casual"
    },
    {
      id: 13,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0008_1759645213703.jpg",
      title: "Polo Shirt",
      category: "Corporate"
    },
    {
      id: 14,
      image: "/products/SEKALA PRICELIST KONVEKSI_page-0010_1759645213703.jpg",
      title: "Hoodie Premium",
      category: "Streetwear"
    }
  ];

  return (
    <section className="py-10 md:py-16 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-3">
            Our <span className="text-primary">Product</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Lihat berbagai produk konveksi berkualitas yang telah kami buat untuk klien kami
          </p>
        </div>

        {/* Grid Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" style={{ perspective: '1000px' }}>
          {products.map((product, index) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-3 animate-scale-in"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                transformStyle: 'preserve-3d',
                transition: 'all 0.5s ease-in-out'
              }}
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-500" />
                
                <div className="absolute top-3 left-3">
                  <span className="inline-block px-2.5 py-1 bg-primary text-white text-xs font-bold uppercase rounded shadow-lg">
                    DETAILS
                  </span>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <span className="inline-block px-3 py-1 bg-accent text-foreground text-xs font-bold rounded-full mb-2 shadow-lg">
                    {product.category}
                  </span>
                  <h3 className="font-black text-white text-sm md:text-base drop-shadow-lg">
                    {product.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGallery;
