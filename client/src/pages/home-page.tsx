import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/hero/hero-section";
import { CategoryGrid } from "@/components/product/category-grid";
import { ProductCard } from "@/components/product/product-card";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";

export default function HomePage() {
  const isMobile = useMobile();
  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        <HeroSection />
        <CategoryGrid />
        
        {/* Featured Products Section */}
        <section className="bg-gradient-to-b from-muted to-background py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">Featured Products</h2>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">Special offers and near-expiry discounts</p>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button asChild variant="default" size={isMobile ? "sm" : "default"} className="text-xs sm:text-sm" data-testid="button-filter-all">
                  <Link href="/products">All Products</Link>
                </Button>
                <Button asChild variant="outline" size={isMobile ? "sm" : "default"} className="text-xs sm:text-sm" data-testid="button-filter-near-expiry">
                  <Link href="/products?nearExpiry=true">Near Expiry</Link>
                </Button>
                <Button asChild variant="outline" size={isMobile ? "sm" : "default"} className="text-xs sm:text-sm" data-testid="button-filter-discounted">
                  <Link href="/products?discounted=true">Discounted</Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            
            <div className="text-center mt-10 sm:mt-12 lg:mt-16">
              <Button 
                asChild 
                size={isMobile ? "default" : "lg"}
                className="bg-gradient-to-r from-accent to-secondary hover:opacity-90 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                data-testid="button-view-all-products"
              >
                <Link href="/products" className="px-6 sm:px-8 py-2 sm:py-3">
                  View All Products
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
