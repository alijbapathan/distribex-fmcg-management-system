import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useMobile } from "@/hooks/use-mobile";

export function HeroSection() {
  const isMobile = useMobile();
  const heroHeight = isMobile ? "h-72 sm:h-80" : "h-96";
  
  return (
    <section className={`relative ${heroHeight} bg-gradient-to-br from-primary via-accent to-secondary overflow-hidden`}>
      <div className="absolute inset-0 bg-black/15"></div>
      <div 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=600')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        className="absolute inset-0 opacity-25"
      ></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center sm:justify-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white max-w-2xl text-center sm:text-left"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight"
          >
            Premium Grocery Distribution
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/95 leading-relaxed"
          >
            Quality products from Hindustan Unilever delivered fresh to retailers across India
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <Button 
              asChild
              size={isMobile ? "default" : "lg"}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
              data-testid="button-browse-products"
            >
              <Link href="/products" className="w-full sm:w-auto text-center">
                Browse Products
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className="border-2 border-white text-white hover:bg-white/10 font-semibold"
            >
              <Link href="/products?nearExpiry=true" className="w-full sm:w-auto text-center">
                Expiry Deals
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
