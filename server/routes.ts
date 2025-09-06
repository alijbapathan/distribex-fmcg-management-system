import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertOrderSchema } from "@shared/schema";
import { startExpiryChecker } from "./services/expiry-checker";

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

  // Start expiry checker background job
  startExpiryChecker();

  const httpServer = createServer(app);
  return httpServer;
}
