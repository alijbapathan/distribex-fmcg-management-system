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
import AddProductPage from "@/pages/add-product-page";
import ManageCategoriesPage from "@/pages/manage-categories-page";
import ViewOrdersPage from "@/pages/view-orders-page";
import ManageUsersPage from "@/pages/manage-users-page";
import GenerateReportsPage from "@/pages/generate-reports-page";
import ProductsPage from "@/pages/products-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <HomePage />} />
      {/* 🚨 FIX: Add dynamic route for single product viewing */}
      <ProtectedRoute path="/products/:id" component={() => <ProductsPage />} /> 
      <ProtectedRoute path="/products" component={() => <ProductsPage />} />
      <ProtectedRoute path="/admin" component={() => <AdminDashboard />} />
      <ProtectedRoute path="/admin/add-product" component={() => <AddProductPage />} />
      <ProtectedRoute path="/admin/manage-categories" component={() => <ManageCategoriesPage />} />
      <ProtectedRoute path="/admin/view-orders" component={() => <ViewOrdersPage />} />
      <ProtectedRoute path="/admin/manage-users" component={() => <ManageUsersPage />} />
      <ProtectedRoute path="/admin/generate-reports" component={() => <GenerateReportsPage />} />
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
