import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@shared/schema";
import { formatCurrency, calculateDiscountedPrice } from "@/lib/currency";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ShoppingCart } from "lucide-react";
// Removed all conflicting routing imports (useLocation, useNavigate)

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/cart/add", { productId, quantity });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    // Stop event propagation to prevent the card link from being triggered
    e.stopPropagation(); 
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to cart",
        variant: "destructive",
      });
      return;
    }
    
    addToCartMutation.mutate({ productId: product.id, quantity: 1 });
  };
  
  const currentPrice = product.nearExpiry && product.discountPercent 
    ? calculateDiscountedPrice(product.price, product.discountPercent)
    : parseFloat(product.price);

  const originalPrice = parseFloat(product.price);
  const isDiscounted = product.nearExpiry && product.discountPercent && parseFloat(product.discountPercent) > 0;

  // Calculate days until expiry
  const daysUntilExpiry = product.expiryDate 
    ? Math.ceil((new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative" data-testid={`card-product-${product.id}`}>
        {/* 🚨 FINAL FIX: Using a simple HTML anchor tag for navigation */}
        <a href={`/products/${product.id}`} className="block">
          {/* Near Expiry Badge */}
          {product.nearExpiry && daysUntilExpiry && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground px-2 py-1 rounded text-xs font-semibold z-10 animate-pulse">
              Expires in {daysUntilExpiry} days
            </div>
          )}
          
          {/* Discount Ribbon */}
          {isDiscounted && (
            <div className="absolute top-3 right-0 bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground px-3 py-1 text-xs font-semibold transform rotate-3 shadow-lg z-10">
              {product.discountPercent}% OFF
            </div>
          )}
          
          {/* Best Seller Badge */}
          {product.stock > 100 && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-2 py-1 rounded text-xs font-semibold z-10">
              Best Seller
            </div>
          )}

          <div className="aspect-square overflow-hidden">
            <img 
              src={product.imageUrl || "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop"} 
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid={`img-product-${product.id}`}
            />
          </div>
          
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-product-description-${product.id}`}>
              {product.description}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-lg font-bold text-foreground" data-testid={`text-product-price-${product.id}`}>
                  {formatCurrency(currentPrice)}
                </span>
                {isDiscounted && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {product.nearExpiry ? (
                  <Badge variant="destructive" className="text-xs">
                    Near Expiry
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    In Stock: {product.stock}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </a> {/* Closing the Anchor Tag */}
        
        {/* Button is outside the anchor tag so clicking it only adds to cart */}
        <div className="px-6 pb-6 pt-0">
          <Button 
            className="w-full" 
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || product.stock === 0}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            {addToCartMutation.isPending ? (
              "Adding..."
            ) : product.stock === 0 ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
