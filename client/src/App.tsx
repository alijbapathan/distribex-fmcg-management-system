import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import VerifyEmailPage from "@/pages/verify-email-page";
import AdminDashboard from "@/pages/admin-dashboard";
import ProductsPage from "@/pages/products-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <HomePage />} />
      <ProtectedRoute path="/admin" component={() => <AdminDashboard />} />
      <ProtectedRoute path="/products" component={() => <ProductsPage />} />
      <ProtectedRoute path="/cart" component={() => <CartPage />} />
      <ProtectedRoute path="/checkout" component={() => <CheckoutPage />} />
      <ProtectedRoute path="/profile" component={() => <ProfilePage />} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/verify-email/:token" component={VerifyEmailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
