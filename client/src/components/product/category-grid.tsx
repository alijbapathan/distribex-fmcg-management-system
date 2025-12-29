import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";

export function CategoryGrid() {
  const isMobile = useMobile();
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const categoryIcons: Record<string, string> = {
    "personal-care": "fas fa-pump-soap",
    "home-care": "fas fa-spray-can",
    "foods-beverages": "fas fa-utensils",
    "ice-cream": "fas fa-ice-cream",
    "health-wellness": "fas fa-heartbeat",
    "beauty": "fas fa-spa"
  };

  const categoryColors: Record<string, string> = {
    "personal-care": "from-primary/30 to-primary/10",
    "home-care": "from-secondary/30 to-secondary/10",
    "foods-beverages": "from-accent/30 to-accent/10",
    "ice-cream": "from-primary/30 to-secondary/10",
    "health-wellness": "from-accent/30 to-primary/10",
    "beauty": "from-secondary/30 to-accent/10"
  };

  const getIconColor = (slug: string) => {
    switch (slug) {
      case "personal-care": return "text-primary";
      case "home-care": return "text-secondary";
      case "foods-beverages": return "text-accent";
      default: return "text-primary";
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4">Product Categories</h2>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
          Explore our comprehensive range of products across multiple categories
        </p>
      </div>
      
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            {/* 🚨 FIX APPLIED: Changed 'category' to 'categoryId' and used 'category.id' */}
            <Link href={`/products?categoryId=${category.id}`} data-testid={`link-category-${category.slug}`}>
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-0 bg-gradient-to-br hover:bg-gradient-to-t">
                <CardContent className="p-3 sm:p-5 text-center flex flex-col items-center justify-center h-full">
                  <div className={`w-11 h-11 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gradient-to-br ${categoryColors[category.slug] || "from-primary/20 to-accent/20"} rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-shadow`}>
                    <i className={`${categoryIcons[category.slug] || "fas fa-box"} text-lg sm:text-2xl ${getIconColor(category.slug)}`}></i>
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 sm:mb-2 line-clamp-2" data-testid={`text-category-name-${category.slug}`}>
                    {category.name}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>  );
}