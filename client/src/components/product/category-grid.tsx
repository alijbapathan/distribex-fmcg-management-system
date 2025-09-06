import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";

export function CategoryGrid() {
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
    "personal-care": "from-primary/20 to-accent/20",
    "home-care": "from-secondary/20 to-primary/20",
    "foods-beverages": "from-accent/20 to-secondary/20",
    "ice-cream": "from-primary/20 to-secondary/20",
    "health-wellness": "from-accent/20 to-primary/20",
    "beauty": "from-secondary/20 to-accent/20"
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">Product Categories</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our comprehensive range of products across multiple categories
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={`/products?category=${category.slug}`} data-testid={`link-category-${category.slug}`}>
              <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${categoryColors[category.slug] || "from-primary/20 to-accent/20"} rounded-xl flex items-center justify-center`}>
                    <i className={`${categoryIcons[category.slug] || "fas fa-box"} text-2xl ${getIconColor(category.slug)}`}></i>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2" data-testid={`text-category-name-${category.slug}`}>
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
