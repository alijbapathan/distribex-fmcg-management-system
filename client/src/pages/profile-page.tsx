import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/currency";
import { Order } from "@shared/schema";
import { User, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
      case "shipped":
        return <Package className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalOrders = orders.length;
  const totalSpent = orders
    .filter(order => order.paymentStatus === "paid" || order.status === "delivered")
    .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and view order history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground" data-testid="text-user-name">
                    {user.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground" data-testid="text-user-email">
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="capitalize" data-testid="badge-user-role">
                    {user.role.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium text-foreground" data-testid="text-member-since">
                    {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span className="font-bold text-foreground" data-testid="text-total-orders">
                    {totalOrders}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Spent</span>
                  <span className="font-bold text-foreground" data-testid="text-total-spent">
                    {formatCurrency(totalSpent)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={user.isVerified ? "default" : "destructive"} data-testid="badge-verification-status">
                    {user.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="orders" data-testid="tab-orders">Order History</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
              </TabsList>
              
              {/* Order History */}
              <TabsContent value="orders" className="space-y-4">
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't placed any orders yet. Start shopping to see your order history here.
                      </p>
                      <Button asChild data-testid="button-start-shopping-profile">
                        <a href="/products">Start Shopping</a>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} data-testid={`order-card-${order.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-semibold text-foreground">
                                Order #{order.id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                className={`${getStatusColor(order.status)} flex items-center space-x-1`}
                                data-testid={`order-status-${order.id}`}
                              >
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </Badge>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="space-y-2 mb-4">
                            {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {item.productName} × {item.quantity}
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(item.totalPrice)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Shipping Address */}
                          <div className="bg-muted/50 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-foreground mb-1">Shipping Address:</p>
                            <p className="text-sm text-muted-foreground">
                              {typeof order.shippingAddress === 'object' && order.shippingAddress ? (
                                <>
                                  {(order.shippingAddress as any).fullName}<br />
                                  {(order.shippingAddress as any).addressLine1}
                                  {(order.shippingAddress as any).addressLine2 && `, ${(order.shippingAddress as any).addressLine2}`}<br />
                                  {(order.shippingAddress as any).city}, {(order.shippingAddress as any).state} - {(order.shippingAddress as any).pincode}
                                </>
                              ) : (
                                "Address information not available"
                              )}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Payment Status</p>
                                <Badge 
                                  variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                                  data-testid={`payment-status-${order.id}`}
                                >
                                  {order.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total Amount</p>
                              <p className="text-lg font-bold text-foreground" data-testid={`order-total-${order.id}`}>
                                {formatCurrency(order.totalAmount)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Email Preferences</h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Order updates</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Promotional offers</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Newsletter</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Security</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" data-testid="button-change-password">
                          Change Password
                        </Button>
                        <Button variant="outline" size="sm" data-testid="button-enable-2fa">
                          Enable Two-Factor Authentication
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">Data & Privacy</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" data-testid="button-download-data">
                          Download My Data
                        </Button>
                        <Button variant="destructive" size="sm" data-testid="button-delete-account">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
