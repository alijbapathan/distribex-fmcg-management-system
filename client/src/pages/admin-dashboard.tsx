import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { MetricsCards } from "@/components/admin/metrics-cards";
import { ChartsSection } from "@/components/admin/charts-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/currency";
import { 
  Plus, 
  Tags, 
  List, 
  Users, 
  BarChart, 
  AlertTriangle,
  Clock
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrder: number;
  lowStockCount: number;
  nearExpiryCount: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    category?: { name: string };
  }>;
  nearExpiryProducts: Array<{
    id: string;
    name: string;
    expiryDate: string;
    discountPercent: string;
  }>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "agency_admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const { data: adminStats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "agency_admin",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "agency_admin") {
    return null; // Will redirect
  }

  const stats = adminStats || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    lowStockCount: 0,
    nearExpiryCount: 0,
    lowStockProducts: [],
    nearExpiryProducts: []
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your grocery distribution system</p>
        </div>

        {/* Key Metrics Cards */}
        <MetricsCards stats={stats} />

        {/* Charts Section */}
        <ChartsSection />

        {/* Quick Actions and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                asChild
                data-testid="button-add-product"
              >
                <Link href="/admin/products/new">
                  <Plus className="mr-3 h-4 w-4 text-primary" />
                  Add New Product
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                data-testid="button-manage-categories"
              >
                <Tags className="mr-3 h-4 w-4 text-accent" />
                Manage Categories
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                asChild
                data-testid="button-view-orders"
              >
                <Link href="/admin/orders">
                  <List className="mr-3 h-4 w-4 text-secondary" />
                  View All Orders
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                data-testid="button-manage-users"
              >
                <Users className="mr-3 h-4 w-4 text-primary" />
                Manage Users
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                data-testid="button-generate-reports"
              >
                <BarChart className="mr-3 h-4 w-4 text-accent" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No low stock items
                </p>
              ) : (
                stats.lowStockProducts.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg" data-testid={`low-stock-item-${item.id}`}>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category?.name || "Uncategorized"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive" data-testid={`stock-count-${item.id}`}>
                        {item.stock} left
                      </p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs text-primary p-0 h-auto"
                        data-testid={`button-restock-${item.id}`}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Near Expiry Items */}
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                <Clock className="mr-2 h-5 w-5 text-secondary" />
                Near Expiry Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.nearExpiryProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No near expiry items
                </p>
              ) : (
                stats.nearExpiryProducts.slice(0, 5).map((item) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg" data-testid={`near-expiry-item-${item.id}`}>
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires in {daysUntilExpiry} days
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {item.discountPercent}% OFF
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Auto-applied</p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
