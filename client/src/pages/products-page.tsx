import { useState, useEffect } from "react";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { Product, Category } from "@shared/schema";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter"; // FIX: Import useLocation

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showNearExpiry, setShowNearExpiry] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock">("name");
  const [showFilters, setShowFilters] = useState(false);

  // FIX 1: Read the current location (URL)
  const [location] = useLocation();

  // FIX 2: Check URL query on initial load/location change
  // This reads the 'categoryId' from the URL (e.g., /products?categoryId=ID)
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const categoryIdFromUrl = params.get('categoryId'); 
    
    // If a category filter is found in the URL, set the state
    if (categoryIdFromUrl && categoryIdFromUrl !== selectedCategory) {
      setSelectedCategory(categoryIdFromUrl);
    }
    // IMPORTANT: When navigating to a product detail page like /products/ID, 
    // there is no '?' in the URL, so this logic ensures the filters are cleared 
    // when viewing a detail page.
    if (!location.includes('?') && selectedCategory !== 'all') {
        setSelectedCategory('all');
    }
  }, [location, selectedCategory]); 

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch products with filters
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { 
      // FIX 3: Use the selectedCategory state (which is updated from the URL)
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      nearExpiry: showNearExpiry || undefined,
      search: searchQuery || undefined 
    }],
  });

  // Filter and sort products on client side
  const filteredProducts = products
    .filter(product => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return parseFloat(a.price) - parseFloat(b.price);
        case "stock":
          return b.stock - a.stock;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Products</h1>
          <p className="text-muted-foreground">Browse our complete product catalog</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                    data-testid="button-toggle-filters"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
                  {/* Search */}
                  <div>
                    <Label htmlFor="search">Search Products</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-product-search"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <Label>Category</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="mt-2" data-testid="select-category-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Special Filters */}
                  <div>
                    <Label className="text-sm font-medium">Special Offers</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="near-expiry"
                          checked={showNearExpiry}
                          onCheckedChange={(checked) => setShowNearExpiry(checked === true)}
                          data-testid="checkbox-near-expiry"
                        />
                        <Label htmlFor="near-expiry" className="text-sm">
                          Near Expiry Items
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="mt-2" data-testid="select-sort">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                        <SelectItem value="price">Price (Low to High)</SelectItem>
                        <SelectItem value="stock">Stock (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setShowNearExpiry(false);
                      setSortBy("name");
                    }}
                    data-testid="button-clear-filters"
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <p className="text-muted-foreground" data-testid="text-results-count">
                  {filteredProducts.length} products found
                </p>
                {(searchQuery || selectedCategory !== "all" || showNearExpiry) && (
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filters applied</span>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg h-64 mb-4"></div>
                    <div className="bg-muted rounded h-4 mb-2"></div>
                    <div className="bg-muted rounded h-4 w-2/3"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {!isLoading && (
              <>
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or browse different categories.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setShowNearExpiry(false);
                      }}
                      data-testid="button-reset-search"
                    >
                      Reset Search
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <ProductCard product={product} index={index} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
