import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <section className="relative h-96 bg-gradient-to-r from-primary to-accent overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=600')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
        className="absolute inset-0 opacity-30"
      ></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white max-w-2xl"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold mb-4"
          >
            Premium Grocery Distribution
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl mb-8 text-white/90"
          >
            Quality products from Hindustan Unilever delivered fresh to retailers across India
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button 
              asChild
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3"
              data-testid="button-browse-products"
            >
              <Link href="/products">
                Browse Products
              </Link>
            </Button>
            
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
