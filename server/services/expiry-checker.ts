import cron from "node-cron";
import { storage } from "../storage";

// MARK: teacher-review - Automatic expiry checking and discount application
export function startExpiryChecker() {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("Running expiry checker...");
      
      const nearExpiryDays = parseInt(process.env.NEAR_EXPIRY_DAYS || "7");
      const discountPercent = parseFloat(process.env.NEAR_EXPIRY_DISCOUNT_PERCENT || "20");
      
      await storage.updateNearExpiryProducts(nearExpiryDays, discountPercent);
      
      console.log("Expiry checker completed successfully");
    } catch (error) {
      console.error("Error in expiry checker:", error);
    }
  });

  console.log("Expiry checker scheduled to run daily at midnight");
}
