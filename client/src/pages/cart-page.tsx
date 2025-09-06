import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { ShoppingCart, Plus, Minus, X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface CartItem {
  id: string;
  quantity: number;
  priceAtAdd: string;
  product: {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    nearExpiry: boolean;
    discountPercent?: string;
    stock: number;
  };
}

interface CartData {
  cart: { id: string };
  items: CartItem[];
}

export default function CartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartData, isLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await apiRequest("PUT", "/api/cart/update", { productId, quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/cart/remove/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/cart/clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to clear cart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    updateQuantityMutation.mutate({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: string) => {
    removeItemMutation.mutate(productId);
  };

  const items = cartData?.items || [];
  
  const subtotal = items.reduce((total, item) => {
    return total + (parseFloat(item.priceAtAdd) * item.quantity);
  }, 0);

  const discount = items.reduce((total, item) => {
    if (item.product.nearExpiry && item.product.discountPercent) {
      const originalPrice = parseFloat(item.priceAtAdd) / (1 - parseFloat(item.product.discountPercent) / 100);
      return total + ((originalPrice - parseFloat(item.priceAtAdd)) * item.quantity);
    }
    return total;
  }, 0);

  const shipping = subtotal > 500 ? 0 : 40;
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild data-testid="button-back-to-products">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
              data-testid="button-clear-cart"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Looks like you haven't added any items to your cart yet. Browse our products and find something you like.
            </p>
            <Button asChild size="lg" data-testid="button-start-shopping">
              <Link href="/products">
                Start Shopping
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 border border-border rounded-lg"
                      data-testid={`cart-item-${item.product.id}`}
                    >
                      <img
                        src={item.product.imageUrl || "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=120&h=120&fit=crop"}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground" data-testid={`text-item-name-${item.product.id}`}>
                          {item.product.name}
                        </h3>
                        {item.product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.product.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <p className="text-sm font-medium">
                            {formatCurrency(item.priceAtAdd)} each
                          </p>
                          {item.product.nearExpiry && (
                            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                              Near Expiry - {item.product.discountPercent}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          disabled={updateQuantityMutation.isPending}
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 1;
                            if (newQuantity !== item.quantity) {
                              handleQuantityChange(item.product.id, newQuantity);
                            }
                          }}
                          className="w-16 text-center"
                          data-testid={`input-quantity-${item.product.id}`}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          disabled={updateQuantityMutation.isPending || item.quantity >= item.product.stock}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Item Total and Remove */}
                      <div className="text-right">
                        <p className="font-semibold text-foreground" data-testid={`text-item-total-${item.product.id}`}>
                          {formatCurrency(parseFloat(item.priceAtAdd) * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive mt-1"
                          onClick={() => handleRemoveItem(item.product.id)}
                          disabled={removeItemMutation.isPending}
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium" data-testid="text-subtotal">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium text-primary" data-testid="text-discount">
                            -{formatCurrency(discount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="font-medium" data-testid="text-shipping">
                          {shipping === 0 ? "Free" : formatCurrency(shipping)}
                        </span>
                      </div>
                      {shipping > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Free shipping on orders over ₹500
                        </p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span data-testid="text-total">{formatCurrency(total)}</span>
                    </div>

                    <Button 
                      className="w-full" 
                      size="lg"
                      asChild
                      data-testid="button-proceed-checkout"
                    >
                      <Link href="/checkout">
                        Proceed to Checkout
                      </Link>
                    </Button>

                    <div className="text-center">
                      <Button variant="link" asChild data-testid="button-continue-shopping">
                        <Link href="/products">
                          Continue Shopping
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
