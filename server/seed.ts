import "dotenv/config";
// MARK: teacher-review - Seed script for demo data
import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // Create admin user
    const adminPassword = await hashPassword("admin123");
    const admin = await storage.createUser({
      name: "Agency Admin",
      email: "admin@hulagency.com",
      password: adminPassword,
      role: "agency_admin",
      isVerified: true
    });
    console.log("Created admin user:", admin.email);

    // Create categories
    const categories = await Promise.all([
      storage.createCategory({
        name: "Personal Care",
        slug: "personal-care",
        description: "Skincare and personal hygiene products",
        icon: "fas fa-pump-soap"
      }),
      storage.createCategory({
        name: "Home Care",
        slug: "home-care", 
        description: "Cleaning and home maintenance products",
        icon: "fas fa-spray-can"
      }),
      storage.createCategory({
        name: "Foods & Beverages",
        slug: "foods-beverages",
        description: "Food items and beverages",
        icon: "fas fa-utensils"
      }),
      storage.createCategory({
        name: "Ice Cream",
        slug: "ice-cream",
        description: "Frozen desserts and ice cream",
        icon: "fas fa-ice-cream"
      }),
      storage.createCategory({
        name: "Health & Wellness",
        slug: "health-wellness",
        description: "Health and wellness products",
        icon: "fas fa-heartbeat"
      }),
      storage.createCategory({
        name: "Beauty",
        slug: "beauty",
        description: "Beauty and cosmetic products",
        icon: "fas fa-spa"
      })
    ]);
    console.log("Created categories:", categories.length);

    // Create products
    const personalCareCategory = categories.find(c => c.slug === "personal-care")!;
    const homeCareCategory = categories.find(c => c.slug === "home-care")!;
    const foodsCategory = categories.find(c => c.slug === "foods-beverages")!;
    const iceCreamCategory = categories.find(c => c.slug === "ice-cream")!;

    // Near expiry date (3 days from now)
    const nearExpiryDate = new Date();
    nearExpiryDate.setDate(nearExpiryDate.getDate() + 3);

    // Future expiry date (6 months from now)
    const futureExpiryDate = new Date();
    futureExpiryDate.setMonth(futureExpiryDate.getMonth() + 6);

    const products = await Promise.all([
      // Personal Care Products
      storage.createProduct({
        name: "Dove Beauty Soap (125g)",
        description: "Moisturizing beauty soap with 1/4 moisturizing cream",
        price: "60.00",
        stock: 5, // Low stock
        categoryId: personalCareCategory.id,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0FLv3Zd018zH8cV2OHBTHHbB8AlGe7N1LIg&s",
        expiryDate: nearExpiryDate,
        discountPercent: "20.00"
      }),
      storage.createProduct({
        name: "Sunsilk Stunning Black Shine (180ml)",
        description: "Shampoo for gorgeous black hair with amla",
        price: "120.00",
        stock: 45,
        categoryId: personalCareCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
        expiryDate: futureExpiryDate
      }),
      storage.createProduct({
        name: "Lakme Absolute Perfect Radiance Foundation",
        description: "Lightweight foundation for perfect radiance",
        price: "850.00",
        stock: 25,
        categoryId: personalCareCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
        expiryDate: futureExpiryDate
      }),

      // Home Care Products
      storage.createProduct({
        name: "Surf Excel Easy Wash (1kg)",
        description: "Detergent powder for easy washing",
        price: "180.00",
        stock: 30,
        categoryId: homeCareCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400",
        expiryDate: futureExpiryDate
      }),
      storage.createProduct({
        name: "Vim Dishwash Gel (750ml)",
        description: "Powerful dishwashing gel with lemon fragrance",
        price: "95.00",
        stock: 8, // Low stock
        categoryId: homeCareCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
        expiryDate: futureExpiryDate
      }),

      // Foods & Beverages
      storage.createProduct({
        name: "Lipton Yellow Label Tea (100 bags)",
        description: "Premium black tea with rich flavor",
        price: "180.00",
        stock: 120,
        categoryId: foodsCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
        expiryDate: futureExpiryDate
      }),
      storage.createProduct({
        name: "Bru Instant Coffee (50g)",
        description: "Rich and aromatic instant coffee",
        price: "120.00",
        stock: 75,
        categoryId: foodsCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400",
        expiryDate: futureExpiryDate
      }),

      // Ice Cream Products
      storage.createProduct({
        name: "Kwality Wall's Vanilla (700ml)",
        description: "Premium vanilla ice cream with real vanilla beans",
        price: "300.00",
        stock: 15,
        categoryId: iceCreamCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400",
        expiryDate: nearExpiryDate,
        discountPercent: "15.00"
      }),
      storage.createProduct({
        name: "Magnum Classic (110ml)",
        description: "Premium ice cream with chocolate coating",
        price: "150.00",
        stock: 40,
        categoryId: iceCreamCategory.id,
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
        expiryDate: futureExpiryDate
      })
    ]);

    console.log("Created products:", products.length);
    console.log("Database seeding completed successfully!");
    
    // Log admin credentials
    console.log("\n=== ADMIN CREDENTIALS ===");
    console.log("Email: admin@hulagency.com");
    console.log("Password: admin123");
    console.log("========================\n");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
seedDatabase()
  .then(() => {
    console.log("✅ Seeding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });