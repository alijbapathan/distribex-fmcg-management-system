import { useState } from "react";
import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CreditCard, Truck, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";

const checkoutSchema = z.object({
  // Shipping Address
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Valid pincode is required"),
  
  // Payment
  paymentMethod: z.enum(["cod", "upi", "card"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CartItem {
  id: string;
  quantity: number;
  priceAtAdd: string;
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    nearExpiry: boolean;
    discountPercent?: string;
  };
}

interface CartData {
  cart: { id: string };
  items: CartItem[];
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      paymentMethod: "cod",
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return res.json();
    },
    onSuccess: () => {
      // Default: treat as completed (for COD and card in future)
      setOrderPlaced(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation email shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = (data: CheckoutFormData) => {
    if (!cartData?.items.length) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }

    const orderItems = cartData.items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      priceAtOrder: parseFloat(item.priceAtAdd),
      totalPrice: parseFloat(item.priceAtAdd) * item.quantity,
    }));

    const shippingAddress = {
      fullName: data.fullName,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    };

    const orderData = {
      items: orderItems,
      shippingAddress,
      // Start as pending for payment; include paymentMethod so server can
      // return a UPI payload when requested
      paymentStatus: data.paymentMethod === "cod" ? "pending" : "pending",
      paymentMethod: data.paymentMethod,
      totalAmount: total.toString(),
      discountAmount: discount.toString(),
      shippingAmount: shipping.toString(),
    };

    // When mutating, pass an onSuccess override to handle UPI specially using form values
    placeOrderMutation.mutate(orderData, {
      onSuccess: async (created) => {
        const payload = created as any;
        const order = payload.order || payload;
        const upi = payload.upi || (payload.order && payload.order.upi) || null;

        if (data.paymentMethod === "upi" && upi) {
          // If server returned a razorpay object, open Razorpay Checkout
          if ((upi as any).razorpay_order_id || (created as any).razorpay) {
            const rz = (created as any).razorpay || upi;
            // load razorpay script dynamically
            const loadScript = () => new Promise((resolve, reject) => {
              if ((window as any).Razorpay) return resolve(true);
              const script = document.createElement('script');
              script.src = 'https://checkout.razorpay.com/v1/checkout.js';
              script.onload = () => resolve(true);
              script.onerror = () => reject(new Error('Failed to load Razorpay script'));
              document.body.appendChild(script);
            });

            try {
              await loadScript();
              const options = {
                key: rz.key_id,
                amount: rz.amount,
                currency: rz.currency || 'INR',
                name: 'Merchant',
                description: 'Order Payment',
                order_id: rz.razorpay_order_id,
                handler: async (response: any) => {
                  // verify on server
                  try {
                    await apiRequest('POST', '/api/payments/razorpay/verify', {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      orderId: order.id,
                    });
                    toast({ title: 'Payment confirmed', description: 'Your payment was confirmed and order is complete.' });
                    setOrderPlaced(true);
                    queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
                  } catch (e: any) {
                    toast({ title: 'Payment verification failed', description: e?.message || 'Failed to verify payment', variant: 'destructive' });
                  }
                },
                prefill: {
                  name: form.getValues().fullName,
                  contact: form.getValues().phone,
                },
                notes: { order_id: order.id }
              } as any;

              const rzp = new (window as any).Razorpay(options);
              rzp.open();
              return;
            } catch (err: any) {
              console.error('Razorpay flow failed, falling back to QR', err);
            }
          }

          // fallback to existing QR/modal flow
          setUpiOrderId(order.id);
          setUpiPayload({ vpa: upi.vpa, upiUri: upi.upiUri, qrUrl: upi.qrUrl });
          setShowUpiModal(true);
          // do not mark orderPlaced or clear cart yet; wait for user to confirm
          return;
        }

        // Otherwise, fallback to default success behavior
        setOrderPlaced(true);
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        toast({
          title: "Order placed successfully!",
          description: "You will receive a confirmation email shortly.",
        });
      }
    });
  };

  // UPI flow state
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiOrderId, setUpiOrderId] = useState<string | null>(null);
  const [upiVpa, setUpiVpa] = useState("");
  const [isProcessingUpi, setIsProcessingUpi] = useState(false);
  // payload returned by server when client requests UPI payment
  const [upiPayload, setUpiPayload] = useState<{ vpa: string; upiUri: string; qrUrl: string } | null>(null);

  const handleConfirmUpiPayment = async () => {
    if (!upiOrderId) return;
    setIsProcessingUpi(true);
    try {
      const res = await apiRequest("PUT", `/api/orders/${upiOrderId}/payment-status`, { paymentStatus: "paid" });
      // response may not return JSON via apiRequest wrapper, attempt to parse
      try { await res.json(); } catch {}
      toast({ title: "Payment confirmed", description: "Your payment was confirmed and order is complete." });
      setShowUpiModal(false);
      setOrderPlaced(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    } catch (err: any) {
      toast({ title: "Payment failed", description: err?.message || "Failed to confirm payment", variant: "destructive" });
    } finally {
      setIsProcessingUpi(false);
    }
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

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some items to your cart before proceeding to checkout.
          </p>
          <Button asChild data-testid="button-continue-shopping">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Order Placed Successfully!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for your order. You will receive a confirmation email shortly with your order details.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" data-testid="button-view-orders">
                <Link href="/profile">View My Orders</Link>
              </Button>
              <Button variant="outline" asChild size="lg" data-testid="button-continue-shopping-success">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" size="sm" asChild data-testid="button-back-to-cart">
            <Link href="/cart">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground">Complete your order</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(handlePlaceOrder)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="h-5 w-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        {...form.register("fullName")}
                        data-testid="input-full-name"
                      />
                      {form.formState.errors.fullName && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...form.register("phone")}
                        data-testid="input-phone"
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="addressLine1">Address Line 1 *</Label>
                    <Input
                      id="addressLine1"
                      {...form.register("addressLine1")}
                      data-testid="input-address-line1"
                    />
                    {form.formState.errors.addressLine1 && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.addressLine1.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      {...form.register("addressLine2")}
                      data-testid="input-address-line2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        {...form.register("city")}
                        data-testid="input-city"
                      />
                      {form.formState.errors.city && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.city.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        {...form.register("state")}
                        data-testid="input-state"
                      />
                      {form.formState.errors.state && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode *</Label>
                      <Input
                        id="pincode"
                        {...form.register("pincode")}
                        data-testid="input-pincode"
                      />
                      {form.formState.errors.pincode && (
                        <p className="text-sm text-destructive mt-1">
                          {form.formState.errors.pincode.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={form.watch("paymentMethod")}
                    onValueChange={(value: any) => form.setValue("paymentMethod", value)}
                    data-testid="radio-payment-method"
                  >
                    <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1">
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border border-border rounded-lg">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1">
                        <div>
                          <p className="font-medium">UPI Payment</p>
                          <p className="text-sm text-muted-foreground">Pay using UPI (QR / VPA)</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border border-border rounded-lg opacity-50">
                      <RadioGroupItem value="card" id="card" disabled />
                      <Label htmlFor="card" className="flex-1">
                        <div>
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-muted-foreground">Coming soon</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={item.product.imageUrl || "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=60&h=60&fit=crop"}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × {formatCurrency(item.priceAtAdd)}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(parseFloat(item.priceAtAdd) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium" data-testid="text-checkout-subtotal">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium text-primary" data-testid="text-checkout-discount">
                          -{formatCurrency(discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium" data-testid="text-checkout-shipping">
                        {shipping === 0 ? "Free" : formatCurrency(shipping)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span data-testid="text-checkout-total">{formatCurrency(total)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={placeOrderMutation.isPending}
                    data-testid="button-place-order"
                  >
                    {placeOrderMutation.isPending ? "Placing Order..." : "Place Order"}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By placing this order, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
        {/* UPI Modal (simple overlay) */}
        {showUpiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-card p-6 rounded-lg w-full max-w-xl">
              <h3 className="text-lg font-semibold mb-2">Complete UPI Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">Scan the QR or pay to the merchant VPA shown below, then click Confirm Payment.</p>

              {/* Merchant info and QR */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Merchant VPA</p>
                  <div className="font-mono font-semibold text-lg">{upiPayload?.vpa ?? 'merchant@upi'}</div>
                  <p className="text-sm text-muted-foreground mt-2">Amount</p>
                  <div className="font-semibold text-lg">{formatCurrency(total)}</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  {/* Use server-provided QR if available, otherwise fallback to client-generated QR */}
                  {upiPayload ? (
                    <img src={upiPayload.qrUrl} alt="UPI QR" className="w-48 h-48 rounded-md shadow" />
                  ) : (
                    (() => {
                      const merchantVpa = 'merchant@upi';
                      const upiUri = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent('Merchant')}&am=${encodeURIComponent(total.toString())}&cu=INR`;
                      const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiUri)}`;
                      return (
                        <img src={qrUrl} alt="UPI QR" className="w-48 h-48 rounded-md shadow" />
                      );
                    })()
                  )}
                </div>
              </div>

              <div className="mt-4 mb-3">
                <Label htmlFor="upiVpa">Enter your UPI VPA (payer)</Label>
                <Input id="upiVpa" value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} placeholder="you@upi" />
                <p className="text-xs text-muted-foreground mt-1">After making payment from your UPI app, click Confirm Payment to complete the order.</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowUpiModal(false)}>Cancel</Button>
                <Button onClick={handleConfirmUpiPayment} disabled={isProcessingUpi || !upiVpa.includes('@')} data-testid="button-confirm-upi">
                  {isProcessingUpi ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
