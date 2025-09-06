// MARK: teacher-review - INR currency formatting utility
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR" 
  }).format(numAmount);
}

export function formatPrice(amount: number | string): string {
  return formatCurrency(amount);
}

export function calculateDiscountedPrice(originalPrice: number | string, discountPercent: number | string): number {
  const price = typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  const discount = typeof discountPercent === "string" ? parseFloat(discountPercent) : discountPercent;
  return price * (1 - discount / 100);
}
