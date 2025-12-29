import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMobile } from "@/hooks/use-mobile";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Store, 
  Search, 
  ShoppingCart, 
  Bell, 
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMobile();

  // Fetch cart data for cart count
  const { data: cartData } = useQuery<{ cart: { id: string }; items: Array<{ id: string; quantity: number; priceAtAdd: string; product: any }> }>({
    queryKey: ["/api/cart"],
    enabled: !!user,
  });

  const cartItemCount = cartData && cartData.items ? cartData.items.reduce((total: number, item: any) => total + item.quantity, 0) : 0;

  const handleLogout = () => {
    logoutMutation.mutate();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-card border-b border-border shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 flex-shrink-0" data-testid="link-home">
            <div className="bg-gradient-to-br from-primary to-accent text-white rounded-lg p-2">
              <Store className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-foreground">HUL Distribution</h1>
              <p className="text-xs text-muted-foreground hidden md:block">Grocery Agency System</p>
            </div>
          </Link>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          {/* User Actions */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Cart */}
            <Link href="/cart" data-testid="link-cart">
              <Button variant="ghost" size="sm" className="relative p-2">
                <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                {cartItemCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    data-testid="badge-cart-count"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {/* Notifications - Hidden on mobile */}
            <Button variant="ghost" size="sm" className="relative p-2 hidden sm:flex" data-testid="button-notifications">
              <Bell className="h-5 w-5 md:h-6 md:w-6" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                2
              </Badge>
            </Button>
            
            {/* User Menu - Desktop */}
            {user && !isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 ml-2" data-testid="button-user-menu">
                    <span className="text-sm font-medium" data-testid="text-username">
                      {user.name}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center" data-testid="link-profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "agency_admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center" data-testid="link-admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Button */}
            {isMobile && user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 ml-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 px-1">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm w-full"
              data-testid="input-search-mobile"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && user && mobileMenuOpen && (
          <div className="pb-3 border-t border-border px-2 space-y-2">
            <Link href="/profile">
              <Button variant="ghost" className="w-full justify-start text-sm" data-testid="link-profile-mobile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            {user.role === "agency_admin" && (
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start text-sm" data-testid="link-admin-mobile">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              className="w-full justify-start text-sm text-destructive hover:text-destructive"
              onClick={handleLogout} 
              data-testid="button-logout-mobile"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
