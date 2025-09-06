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

export default function HomePage() {
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
        <section className="bg-muted py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-4">Featured Products</h2>
                <p className="text-lg text-muted-foreground">Special offers and near-expiry discounts</p>
              </div>
              <div className="flex space-x-4">
                <Button asChild data-testid="button-filter-all">
                  <Link href="/products">All Products</Link>
                </Button>
                <Button variant="outline" asChild data-testid="button-filter-near-expiry">
                  <Link href="/products?nearExpiry=true">Near Expiry</Link>
                </Button>
                <Button variant="outline" asChild data-testid="button-filter-discounted">
                  <Link href="/products?discounted=true">Discounted</Link>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button 
                asChild 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3"
                data-testid="button-view-all-products"
              >
                <Link href="/products">
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
