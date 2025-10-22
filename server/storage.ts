import { 
  users, categories, products, carts, cartItems, orders,
  type User, type InsertUser, type Category, type InsertCategory,
  type Product, type InsertProduct, type Cart, type InsertCart,
  type CartItem, type InsertCartItem, type Order, type InsertOrder
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, sql, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { Store } from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser & { verificationToken?: string }): Promise<User>;
  verifyUser(id: string): Promise<void>;
  updateVerificationToken(id: string, token: string): Promise<void>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Product methods
  getProducts(filters?: { categoryId?: string; nearExpiry?: boolean; search?: string }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsWithCategory(): Promise<(Product & { category: Category | null })[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  getNearExpiryProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateNearExpiryProducts(nearExpiryDays: number, discountPercent: number): Promise<void>;

  // Cart methods
  getOrCreateCart(userId: string): Promise<Cart>;
  getCartWithItems(userId: string): Promise<{ cart: Cart; items: (CartItem & { product: Product })[] }>;
  addToCart(userId: string, productId: string, quantity: number): Promise<CartItem>;
  updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(userId: string, productId: string): Promise<boolean>;
  clearCart(userId: string): Promise<void>;

  // Order methods
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Analytics methods
  getOrderStats(): Promise<{ totalRevenue: number; totalOrders: number; averageOrder: number }>;
  getCategorySales(): Promise<{ categoryId: string; categoryName: string; totalSales: number }[]>;

  // Admin - users
  getUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<Pick<User, "name" | "email" | "role" | "password">>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Admin - reports
  generateReport(type: string, days: number): Promise<any>;
  exportReport(type: string, format: string, days: number): Promise<Buffer>;

  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: Store;

  constructor() {
    // connect-pg-simple expects a pg.Pool; our neon serverless Pool has a different shape.
    // Cast to any to satisfy the library typings at runtime it's compatible for session storage.
    this.sessionStore = new PostgresSessionStore({ 
      pool: pool as any, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async createUser(userData: InsertUser & { verificationToken?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async verifyUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(users.id, id));
  }

  async updateVerificationToken(id: string, token: string): Promise<void> {
    await db
      .update(users)
      .set({ verificationToken: token })
      .where(eq(users.id, id));
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Product methods
  async getProducts(filters?: { categoryId?: string; nearExpiry?: boolean; search?: string }): Promise<Product[]> {
    const conditions = [eq(products.isActive, true)];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.nearExpiry) {
      conditions.push(eq(products.nearExpiry, true));
    }

    if (filters?.search) {
      conditions.push(sql`${products.name} ILIKE ${`%${filters.search}%`}`);
    }

    return await db.select().from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsWithCategory(): Promise<(Product & { category: Category | null })[]> {
    const result = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    return result.map(row => ({
      ...row.products,
      category: row.categories
    }));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} > 0`))
      .orderBy(desc(products.createdAt))
      .limit(8);
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), sql`${products.stock} <= ${threshold}`))
      .orderBy(asc(products.stock));
  }

  async getNearExpiryProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.nearExpiry, true)))
      .orderBy(asc(products.expiryDate));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();

    // Immediately evaluate near-expiry status for newly created product
    try {
      // expiryDate from DB is Date | null
      await this.evaluateAndSetNearExpiry(newProduct.id, newProduct.expiryDate as unknown as Date | null);
    } catch (err) {
      console.error('Failed to evaluate near-expiry on product create:', err);
    }

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(products.id, id))
      .returning();
    if (product) {
      try {
        await this.evaluateAndSetNearExpiry(product.id, product.expiryDate as unknown as Date | null);
      } catch (err) {
        console.error('Failed to evaluate near-expiry on product update:', err);
      }
    }

    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const [product] = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id))
      .returning();
    return !!product;
  }

  // MARK: teacher-review - Automatic expiry detection and discount application
  async updateNearExpiryProducts(nearExpiryDays: number, discountPercent: number): Promise<void> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + nearExpiryDays);

    await db
      .update(products)
      .set({
        nearExpiry: true,
        discountPercent: discountPercent.toString(),
        updatedAt: sql`CURRENT_TIMESTAMP`
      })
      .where(
        and(
          eq(products.isActive, true),
          lt(products.expiryDate, expiryThreshold),
          eq(products.nearExpiry, false)
        )
      );
  }

  // Evaluate a single product's expiry and update nearExpiry/discount immediately.
  // This is used after manual create/update so products become "near expiry" without waiting for cron.
  private async evaluateAndSetNearExpiry(productId: string, expiryDate: Date | null): Promise<void> {
    try {
      const nearExpiryDays = parseInt(process.env.NEAR_EXPIRY_DAYS || "7");
      const discountPercent = parseFloat(process.env.NEAR_EXPIRY_DISCOUNT_PERCENT || "20");

      if (!expiryDate) {
        // If no expiry date, ensure flags are cleared
        await db.update(products).set({ nearExpiry: false, discountPercent: "0", updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(products.id, productId));
        return;
      }

      const now = new Date();
      // Only compare dates (ignore time) so that products expiring today are considered near-expiry
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const expiry = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());

      const diffMs = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= nearExpiryDays && diffDays >= 0) {
        // within window (including today)
        await db.update(products).set({ nearExpiry: true, discountPercent: discountPercent.toString(), updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(products.id, productId));
      } else if (diffDays < 0) {
        // already expired - still mark nearExpiry true? we'll keep it true but could be handled separately
        await db.update(products).set({ nearExpiry: true, discountPercent: discountPercent.toString(), updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(products.id, productId));
      } else {
        // not near expiry
        await db.update(products).set({ nearExpiry: false, discountPercent: "0", updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(products.id, productId));
      }
    } catch (err) {
      console.error('Error in evaluateAndSetNearExpiry:', err);
    }
  }

  // Cart methods
  async getOrCreateCart(userId: string): Promise<Cart> {
    let [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
    
    if (!cart) {
      [cart] = await db
        .insert(carts)
        .values({ userId })
        .returning();
    }
    
    return cart;
  }

  async getCartWithItems(userId: string): Promise<{ cart: Cart; items: (CartItem & { product: Product })[] }> {
    const cart = await this.getOrCreateCart(userId);
    
    const items = await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    return {
      cart,
      items: items.map(row => ({
        ...row.cart_items,
        product: row.products!
      }))
    };
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.getProduct(productId);
    
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if item already exists
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const currentPrice = product.nearExpiry && product.discountPercent 
        ? parseFloat(product.price) * (1 - parseFloat(product.discountPercent) / 100)
        : parseFloat(product.price);

      const [newItem] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          quantity,
          priceAtAdd: currentPrice.toString()
        })
        .returning();
      return newItem;
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem | undefined> {
    const cart = await this.getOrCreateCart(userId);
    
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      return undefined;
    }

    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
      .returning();
    
    return updatedItem || undefined;
  }

  async removeFromCart(userId: string, productId: string): Promise<boolean> {
    const cart = await this.getOrCreateCart(userId);
    
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)));
    
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  // Order methods
  async getOrders(userId?: string): Promise<Order[]> {
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(orders)
        .where(and(...conditions))
        .orderBy(desc(orders.createdAt));
    } else {
      return await db.select().from(orders)
        .orderBy(desc(orders.createdAt));
    }
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Analytics methods
  async getOrderStats(): Promise<{ totalRevenue: number; totalOrders: number; averageOrder: number }> {
    const [stats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        averageOrder: sql<number>`COALESCE(AVG(${orders.totalAmount}), 0)`
      })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid"));

    return {
      totalRevenue: parseFloat(stats.totalRevenue.toString()),
      totalOrders: stats.totalOrders,
      averageOrder: parseFloat(stats.averageOrder.toString())
    };
  }

  async getCategorySales(): Promise<{ categoryId: string; categoryName: string; totalSales: number }[]> {
    // This would require parsing the JSON items in orders
    // For now, return empty array - would need more complex SQL
    return [];
  }

  // MARK: Admin - users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<Pick<User, "name" | "email" | "role" | "password">>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      console.log(`Starting deletion process for user: ${id}`);
      
      // Use a transaction to ensure all deletions happen atomically
      const result = await db.transaction(async (tx) => {
        // First, get the user's cart to delete cart items
        const userCarts = await tx.select().from(carts).where(eq(carts.userId, id));
        console.log(`Found ${userCarts.length} carts for user`);
        
        // Delete cart items for each cart
        for (const cart of userCarts) {
          const cartItemsResult = await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
          console.log(`Deleted cart items for cart ${cart.id}: ${cartItemsResult.rowCount} items`);
        }
        
        // Delete user's carts
        const cartsResult = await tx.delete(carts).where(eq(carts.userId, id));
        console.log(`Deleted carts: ${cartsResult.rowCount} carts`);
        
        // Delete user's orders
        const ordersResult = await tx.delete(orders).where(eq(orders.userId, id));
        console.log(`Deleted orders: ${ordersResult.rowCount} orders`);
        
        // Finally, delete the user
        const userResult = await tx.delete(users).where(eq(users.id, id));
        console.log(`Deleted user: ${userResult.rowCount} users`);
        
        return userResult.rowCount ?? 0;
      });
      
      return result > 0;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        code: error?.code
      });
      return false;
    }
  }

  // MARK: Admin - reports (basic implementation backed by orders)
  async generateReport(type: string, days: number): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const recentOrders = await db
      .select()
      .from(orders)
      .where(sql`${orders.createdAt} >= ${since}`)
      .orderBy(asc(orders.createdAt));

    // Aggregate by month for simple charts
    const monthlyMap = new Map<string, { sales: number; orders: number }>();
    for (const o of recentOrders) {
      const d = new Date(o.createdAt as unknown as string);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const current = monthlyMap.get(key) || { sales: 0, orders: 0 };
      current.sales += parseFloat((o.totalAmount as any).toString());
      current.orders += 1;
      monthlyMap.set(key, current);
    }

    const salesData = Array.from(monthlyMap.entries()).map(([k, v]) => ({ month: k, sales: v.sales, orders: v.orders }));

    const orderStats = {
      totalOrders: recentOrders.length,
      pendingOrders: recentOrders.filter(o => o.status === "pending").length,
      completedOrders: recentOrders.filter(o => o.status === "delivered").length,
      totalRevenue: recentOrders.reduce((sum, o) => sum + parseFloat((o.totalAmount as any).toString()), 0),
    };

    // Minimal placeholders
    const categoryData = [
      { name: "Personal Care", value: 35, color: "hsl(var(--primary))" },
      { name: "Home Care", value: 25, color: "hsl(var(--secondary))" },
      { name: "Foods & Beverages", value: 20, color: "hsl(var(--accent))" },
      { name: "Ice Cream", value: 12, color: "hsl(var(--chart-4))" },
      { name: "Beauty", value: 8, color: "hsl(var(--chart-5))" },
    ];

    const topProducts = [] as Array<{ name: string; sales: number; revenue: number }>;

    const userStats = {
      totalUsers: (await db.select({ count: sql<number>`COUNT(*)` }).from(users))[0].count,
      newUsers: 0,
      activeUsers: 0,
    };

    return { salesData, categoryData, topProducts, userStats, orderStats };
  }

  async exportReport(type: string, format: string, days: number): Promise<Buffer> {
    const data = await this.generateReport(type, days);
    if (format === "csv") {
      const rows = [
        "month,sales,orders",
        ...data.salesData.map((r: any) => `${r.month},${r.sales},${r.orders}`),
      ];
      return Buffer.from(rows.join("\n"), "utf8");
    }
    // For pdf/xlsx, return csv as a fallback
    const rows = [
      "month,sales,orders",
      ...data.salesData.map((r: any) => `${r.month},${r.sales},${r.orders}`),
    ];
    return Buffer.from(rows.join("\n"), "utf8");
  }
}

export const storage = new DatabaseStorage();
