import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertOrderSchema } from "@shared/schema";
import { startExpiryChecker } from "./services/expiry-checker";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // MARK: teacher-review - Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const updates = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, updates);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // MARK: teacher-review - Products API with filtering
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId, nearExpiry, search } = req.query;
      const filters = {
        categoryId: categoryId as string,
        nearExpiry: nearExpiry === "true",
        search: search as string
      };

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/with-category", async (req, res) => {
    try {
      const products = await storage.getProductsWithCategory();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products with categories" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || !["agency_admin", "staff"].includes(req.user?.role || "")) {
      return res.status(403).json({ message: "Admin or staff access required" });
    }

    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !["agency_admin", "staff"].includes(req.user?.role || "")) {
      return res.status(403).json({ message: "Admin or staff access required" });
    }

    try {
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, updates);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // MARK: teacher-review - Cart API
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const cartData = await storage.getCartWithItems(req.user.id);
      res.json(cartData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart/add", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { productId, quantity = 1 } = req.body;
      const cartItem = await storage.addToCart(req.user.id, productId, quantity);
      res.json(cartItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to add to cart" });
    }
  });

  app.put("/api/cart/update", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const { productId, quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.user.id, productId, quantity);
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/remove/:productId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const success = await storage.removeFromCart(req.user.id, req.params.productId);
      if (!success) {
        return res.status(404).json({ message: "Item not found in cart" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete("/api/cart/clear", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      await storage.clearCart(req.user.id);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // MARK: teacher-review - Orders API
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const userId = req.user.role === "agency_admin" ? undefined : req.user.id;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const order = await storage.createOrder(orderData);
      
      // Clear cart after successful order
      await storage.clearCart(req.user.id);
      
      res.status(201).json(order);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !["agency_admin", "staff"].includes(req.user?.role || "")) {
      return res.status(403).json({ message: "Admin or staff access required" });
    }

    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // MARK: teacher-review - Admin Analytics API
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const stats = await storage.getOrderStats();
      const lowStockProducts = await storage.getLowStockProducts();
      const nearExpiryProducts = await storage.getNearExpiryProducts();

      res.json({
        ...stats,
        lowStockCount: lowStockProducts.length,
        nearExpiryCount: nearExpiryProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 10),
        nearExpiryProducts: nearExpiryProducts.slice(0, 10)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // MARK: teacher-review - User Management API
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { name, email, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password like in auth.ts
      const scryptAsync = promisify(scrypt);
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      const user = await storage.createUser({ 
        name, 
        email, 
        password: hashedPassword, 
        role: role || "customer",
        isVerified: true,
      } as any);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { name, email, role } = req.body;
      const user = await storage.updateUser(req.params.id, { name, email, role });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // MARK: teacher-review - Reports API
  app.get("/api/admin/reports", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { type, range } = req.query;
      const days = parseInt(range as string) || 30;
      
      // Generate sample report data based on type
      const reportData = await storage.generateReport(type as string, days);
      res.json(reportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/admin/reports/export", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { type, range, format } = req.query;
      const days = parseInt(range as string) || 30;
      
      // Generate and return report file
      const reportBuffer = await storage.exportReport(type as string, format as string, days);
      
      const contentType = format === "pdf" ? "application/pdf" : 
                         format === "csv" ? "text/csv" : 
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="report.${format}"`);
      res.send(reportBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export report" });
    }
  });

  // Start expiry checker background job
  startExpiryChecker();

  const httpServer = createServer(app);
  return httpServer;
}
