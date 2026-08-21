import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGallery from "@/components/ProductGallery";
import About from "@/components/About";
import ClientLogos from "@/components/ClientLogos";
import Products from "@/components/Products";
import Testimonials from "@/components/Testimonials";
import OrderSystem from "@/components/OrderSystem";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <About />
      <ProductGallery />
      <ClientLogos />
      <Products />
      <Testimonials />
      <OrderSystem />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
