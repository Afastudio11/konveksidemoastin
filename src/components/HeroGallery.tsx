import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const HeroGallery = () => {
  const products = [
    {
      id: 1,
      image: "/products/rompi-tiga-rasa.png",
      alt: "Rompi Tiga Rasa - Konveksi Rompi Custom",
    },
    {
      id: 2,
      image: "/products/jersey-knpi.png",
      alt: "Jersey KNPI - Konveksi Jersey Olahraga",
    },
    {
      id: 3,
      image: "/products/jaket-planologi.png",
      alt: "Jaket Planologi Unhas - Konveksi Jaket Custom",
    },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 4000,
            stopOnInteraction: false,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {products.map((product, index) => (
            <CarouselItem key={product.id}>
              <div className="relative w-full h-[450px] lg:h-[550px] overflow-hidden rounded-2xl">
                <img
                  src={product.image}
                  alt={product.alt}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding={index === 0 ? "auto" : "async"}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-4 bg-accent/90 text-foreground border-0 hover:bg-accent shadow-lg" />
        <CarouselNext className="right-4 bg-accent/90 text-foreground border-0 hover:bg-accent shadow-lg" />
      </Carousel>
    </div>
  );
};

export default HeroGallery;
