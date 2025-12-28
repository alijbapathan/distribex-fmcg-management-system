import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { TrendingUp, ShoppingCart, AlertTriangle, Clock } from "lucide-react";

interface MetricsCardsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    lowStockCount: number;
    nearExpiryCount: number;
  };
}

export function MetricsCards({ stats }: MetricsCardsProps) {
  // Optional click handler for cards (index)
  const onCardClick = (typeof (stats as any).onCardClick === 'function') ? (stats as any).onCardClick : undefined;

  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: "+12.5% from last month",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      changeColor: "text-primary"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      change: "+8.2% from last month",
      icon: ShoppingCart,
      color: "text-accent",
      bgColor: "bg-accent/10",
      changeColor: "text-primary"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockCount.toString(),
      change: "Requires attention",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      changeColor: "text-destructive"
    },
    {
      title: "Near Expiry",
      value: stats.nearExpiryCount.toString(),
      change: "Auto-discounted",
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      changeColor: "text-secondary"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <Card
          key={index}
          className={`border border-border ${onCardClick ? 'cursor-pointer hover:shadow-md' : ''}`}
          data-testid={`card-metric-${index}`}
          onClick={onCardClick ? (() => onCardClick(index)) : undefined}
          role={onCardClick ? 'button' : undefined}
          tabIndex={onCardClick ? 0 : undefined}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-foreground" data-testid={`text-metric-value-${index}`}>
                  {metric.value}
                </p>
                <p className={`text-sm ${metric.changeColor}`}>
                  {metric.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                <metric.icon className={`${metric.color} text-lg`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
