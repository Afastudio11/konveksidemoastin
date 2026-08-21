import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const customerPhotos = [
  {
    id: 1,
    image: "/galeri-customer/IMG-20251008-WA0020_1759894910497.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 2,
    image: "/galeri-customer/IMG-20251008-WA0002_1759894910497.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 3,
    image: "/galeri-customer/IMG-20251008-WA0003_1759894910497.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 4,
    image: "/galeri-customer/IMG-20251008-WA0004_1759894910498.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 5,
    image: "/galeri-customer/IMG-20251008-WA0005_1759894910498.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 6,
    image: "/galeri-customer/IMG-20251008-WA0006_1759894910499.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 7,
    image: "/galeri-customer/IMG-20251008-WA0007_1759894910499.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 8,
    image: "/galeri-customer/IMG-20251008-WA0008_1759894910499.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 9,
    image: "/galeri-customer/IMG-20251008-WA0009_1759894910500.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 10,
    image: "/galeri-customer/IMG-20251008-WA0010_1759894910500.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 11,
    image: "/galeri-customer/IMG-20251008-WA0011_1759894910500.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 12,
    image: "/galeri-customer/IMG-20251008-WA0012_1759894910501.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 13,
    image: "/galeri-customer/IMG-20251008-WA0013_1759894910501.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 14,
    image: "/galeri-customer/IMG-20251008-WA0014_1759894910501.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 15,
    image: "/galeri-customer/IMG-20251008-WA0015_1759894910502.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 16,
    image: "/galeri-customer/IMG-20251008-WA0016_1759894910502.jpg",
    alt: "Pelanggan Sekala Industry"
  },
  {
    id: 17,
    image: "/galeri-customer/IMG-20251008-WA0018_1759894910502.jpg",
    alt: "Pelanggan Sekala Industry"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-3">
            Galeri <span className="text-primary">Costumer</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Kepuasan pelanggan adalah prioritas kami
          </p>
        </div>

        {/* Carousel Gallery - Bisa digeser otomatis & manual */}
        <div className="relative">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: 3000,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {customerPhotos.map((photo, index) => (
                <CarouselItem key={photo.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <img
                      src={photo.image}
                      alt={photo.alt}
                      className="w-full h-[350px] md:h-[480px] object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:left-4 bg-primary/90 text-white border-0 hover:bg-primary shadow-lg" />
            <CarouselNext className="right-2 md:right-4 bg-primary/90 text-white border-0 hover:bg-primary shadow-lg" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
