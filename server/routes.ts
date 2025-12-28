import type { Express } from "express";
import { createServer, type Server } from "http";
// --- NEW IMPORT ---
import multer from 'multer'; 
import { bulkImportProductsFromBuffer } from "./services/bulk-import.service"; // Ensure this path is correct
// --- END NEW IMPORT ---

import { setupAuth } from "./auth";
import { storage } from "./storage";
import { sendOrderConfirmationEmail } from "./services/email";
import { insertProductSchema, insertCategorySchema, insertOrderSchema } from "@shared/schema";
import { startExpiryChecker } from "./services/expiry-checker";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

// --- NEW: MULTER SETUP (Stores files in memory for immediate processing) ---
const upload = multer({ storage: multer.memoryStorage() });
// --- END NEW: MULTER SETUP ---


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

// --- START NEW: BULK IMPORT API ROUTE (TEMP: NO AUTH FOR DEMO) ---
app.post(
  "/api/products/bulk-import", // This is the new endpoint
  upload.single("product_csv_file"), // Must match the key in your frontend's FormData
  async (req, res) => {
    // ⚠️ WARNING: AUTHENTICATION CHECK IS TEMPORARILY REMOVED FOR QUICK DEMO/SUBMISSION ⚠️

    // 1. File Check
    if (!req.file || req.file.mimetype !== 'text/csv' || !req.file.buffer) {
      return res.status(400).json({ message: "No valid CSV file uploaded. Please upload a .csv file." });
    }

    try {
      // 2. Process the file buffer
      const result = await bulkImportProductsFromBuffer(req.file.buffer); 

      // 3. Send success response
      return res.status(200).json({ 
        message: `Bulk import successful! ${result.successfulInserts} products inserted.`,
        summary: result,
      });
    } catch (error) {
      console.error('Bulk import server error:', error);
      // 4. Send generic 500 JSON error if service fails
      res.status(500).json({ message: 'Server error during bulk import. Please check your CSV data format.' });
    }
  }
);
// --- END NEW: BULK IMPORT API ROUTE ---

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
      // Allow callers to optionally request a UPI payment payload by passing
      // `paymentMethod: 'upi'` in the request body. We still validate the order
      // shape using `insertOrderSchema` and attach the server-calculated userId.
      const paymentMethod = (req.body && (req.body as any).paymentMethod) || undefined;

      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id
      });

      const order = await storage.createOrder(orderData);

      // Clear cart after successful order
      await storage.clearCart(req.user.id);

      // Send order confirmation email (do not block the response)
      (async () => {
        try {
          if (req.user && req.user.email) {
            await sendOrderConfirmationEmail(req.user.email, req.user.name || req.user.email, {
              id: (order as any).id,
              totalAmount: (order as any).totalAmount,
              items: (order as any).items || []
            });
          }
        } catch (err) {
          console.error('Error sending order confirmation email:', err);
        }
      })();

      // If the client requested UPI, return an extra `upi` object containing
      // merchant VPA, an encoded UPI URI and a QR image URL (Google Chart API).
      if (paymentMethod === 'upi') {
        try {
          const provider = process.env.PAYMENT_PROVIDER || 'razorpay';
          // If razorpay is configured, create a razorpay order and return its details
          if (provider === 'razorpay' && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            const amount = Math.round(parseFloat((order as any).totalAmount || '0') * 100); // paise

            // call razorpay orders API
            const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
            const resp = await fetch('https://api.razorpay.com/v1/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
              },
              body: JSON.stringify({
                amount,
                currency: 'INR',
                receipt: (order as any).id,
                notes: { order_id: (order as any).id }
              })
            });

            if (!resp.ok) {
              const txt = await resp.text().catch(() => '');
              console.error('Razorpay order create failed', resp.status, txt);
              // fall back to simple UPI QR payload
            } else {
              const body = await resp.json();
              // return order with razorpay payload for client-side checkout
              return res.status(201).json({ order, razorpay: { key_id: keyId, razorpay_order_id: body.id, amount: body.amount, currency: body.currency } });
            }
          }

          // Fallback: return a simple UPI payload (existing behavior)
          const merchantVpa = process.env.MERCHANT_VPA || 'merchant@upi';
          const amountStr = (order as any).totalAmount?.toString() || '';
          const upiUri = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent('Merchant')}&am=${encodeURIComponent(amountStr)}&cu=INR&tr=${encodeURIComponent((order as any).id)}`;
          const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiUri)}`;
          return res.status(201).json({ order, upi: { vpa: merchantVpa, upiUri, qrUrl } });
        } catch (err) {
          console.error('Failed to build payment payload:', err);
          // Fallthrough to returning the order only
        }
      }

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

  // Update payment status (paid, pending, failed)
  app.put("/api/orders/:id/payment-status", async (req, res) => {
    if (!req.isAuthenticated() || !["agency_admin", "staff"].includes(req.user?.role || "")) {
      return res.status(403).json({ message: "Admin or staff access required" });
    }

    try {
      // Defensive logging for debugging invalid JSON/body issues
      console.log(`PUT /api/orders/${req.params.id}/payment-status body:`, req.body);

      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ message: 'Invalid request body: expected JSON' });
      }

      const { paymentStatus } = req.body as { paymentStatus?: any };
      const allowed = ['pending', 'paid', 'failed'];
      if (typeof paymentStatus !== 'string' || !allowed.includes(paymentStatus)) {
        return res.status(400).json({ message: `Invalid paymentStatus. Allowed values: ${allowed.join(', ')}` });
      }

      const order = await storage.updateOrderPaymentStatus(req.params.id, paymentStatus);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Always return JSON on error
      res.status(500).json({ message: "Failed to update payment status" });
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

  // Charts data endpoint: sales by month and category distribution
  app.get("/api/admin/charts", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "agency_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      // Use storage.generateReport to get order data then transform
      const report = await storage.generateReport('sales', 365);

      // report.salesData is [{ month, sales, orders }]
      const salesData = report.salesData.map((r: any) => ({ month: r.month.split('-')[1] || r.month, sales: r.sales }));

      // Simple category distribution based on orders (placeholder implementation)
      // We'll sum product categories from orders' items if present
      const orders = await storage.getOrders();
      const catMap = new Map<string, number>();
      for (const o of orders) {
        try {
          const items = (o.items as any[]) || [];
          for (const it of items) {
            const catName = it.categoryName || it.category || 'Uncategorized';
            catMap.set(catName, (catMap.get(catName) || 0) + (parseFloat((it.quantity || 1).toString()) * parseFloat((it.price || 0).toString())));
          }
        } catch (e) {
          // ignore
        }
      }

      const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

      res.json({ salesData, categoryData });
    } catch (error) {
      console.error('Failed to build charts data:', error);
      res.status(500).json({ message: 'Failed to build charts data' });
    }
  });

  // MARK: Payment provider webhooks
  // This endpoint accepts webhook notifications from payment providers
  // (e.g., Razorpay) and updates order payment status accordingly.
  // For Razorpay we verify the X-Razorpay-Signature using the RAZORPAY_WEBHOOK_SECRET.
  app.post("/api/payments/webhook", async (req, res) => {
    const provider = process.env.PAYMENT_PROVIDER || 'razorpay';
    try {
      if (provider === 'razorpay') {
        const signature = req.headers['x-razorpay-signature'] as string | undefined;
        const body = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
        if (!signature || !secret) {
          console.warn('Missing razorpay signature or secret');
          return res.status(400).json({ message: 'Missing signature or secret' });
        }

        // verify signature
        const crypto = await import('crypto');
        const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (expected !== signature) {
          console.warn('Razorpay webhook signature mismatch');
          return res.status(400).json({ message: 'Invalid signature' });
        }

        const payload = req.body;
        // Example: when payment captured event comes in, update order
        if (payload && payload.event === 'payment.captured') {
          // Razorpay allows sending an "order_id" (our own id) in the notes when creating payment.
          const razorpayPayment = payload.payload?.payment?.entity;
          const ourOrderId = razorpayPayment?.notes?.order_id || razorpayPayment?.notes?.orderId || razorpayPayment?.notes?.order || null;

          if (ourOrderId) {
            try {
              const updated = await storage.updateOrderPaymentStatus(ourOrderId, 'paid');
              if (updated) return res.status(200).json({ ok: true });
            } catch (err) {
              console.error('Failed to update order from webhook:', err);
            }
          }
        }

        return res.status(200).json({ ok: true });
      }

      // Other providers can be added here similarly (Cashfree, Paytm)
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ message: 'Webhook handling error' });
    }
  });

  // Verify Razorpay payment signature sent from client after checkout
  app.post('/api/payments/razorpay/verify', async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body || {};
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        return res.status(400).json({ message: 'Missing parameters' });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const crypto = await import('crypto');
      const generated = crypto.createHmac('sha256', secret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
      if (generated !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }

      // signature valid — mark order paid
      await storage.updateOrderPaymentStatus(orderId, 'paid');
      return res.json({ ok: true });
    } catch (error) {
      console.error('Razorpay verify error:', error);
      return res.status(500).json({ message: 'Verification failed' });
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
