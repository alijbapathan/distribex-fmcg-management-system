import { parse } from 'csv-parse';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

interface CsvProduct {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  image_url: string;
  expiry_date: string;
  near_expiry: string;
  discount_percent: string;
}

// Convert empty or invalid strings to null
const getDbValue = (value: string | undefined): string | null => {
  if (!value || value.trim() === '' || value.trim().toLowerCase() === 'null') return null;
  return value.trim();
};

export async function bulkImportProductsFromBuffer(csvBuffer: Buffer): Promise<{ successfulInserts: number, skippedRecords: number }> {
  console.log("🚀 Starting API bulk product import...");

  let productsToInsert: CsvProduct[] = [];
  let client: Client | null = null;

  // 1️⃣ CSV Parsing
  try {
    productsToInsert = await new Promise((resolve, reject) => {
      parse(csvBuffer.toString(), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, records) => {
        if (err) return reject(err);
        resolve(records as CsvProduct[]);
      });
    });
  } catch (parseError) {
    console.error('❌ CSV Parsing failed:', parseError);
    throw new Error("CSV parsing failed. Check file encoding and headers.");
  }

  console.log(`✅ Read ${productsToInsert.length} potential products from CSV.`);

  if (!process.env.DATABASE_URL) throw new Error("Database connection configuration is missing (DATABASE_URL).");

  try {
    const connectionString = process.env.DATABASE_URL.trim();
    client = new Client({ connectionString });
    await client.connect();
    await client.query('BEGIN');

    const insertQuery = `
      INSERT INTO products 
      (name, description, price, stock, category_id, image_url, expiry_date, near_expiry, discount_percent, is_active, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,NOW(),NOW());
    `;

    let successfulInserts = 0;
    let skippedRecords = 0;

    for (const product of productsToInsert) {
      const priceValue = parseFloat(product.price);
      const stockQuantity = parseInt(product.stock, 10);
      const categoryId = getDbValue(product.category_id);
      const imageUrl = getDbValue(product.image_url);
      const expiryDate = getDbValue(product.expiry_date);
      const nearExpiry = getDbValue(product.near_expiry);
      const discountPercent = product.discount_percent ? parseFloat(product.discount_percent) : 0;

      // Validation
      if (!product.name || !categoryId || isNaN(priceValue) || isNaN(stockQuantity)) {
        console.warn(`[SKIP] Invalid product: "${product.name}"`);
        skippedRecords++;
        continue;
      }

      const values = [
        product.name,
        product.description || null,
        priceValue,
        stockQuantity,
        categoryId,
        imageUrl,
        expiryDate,
        nearExpiry,
        discountPercent
      ];

      try {
        await client.query(insertQuery, values);
        successfulInserts++;
      } catch (err) {
        console.error(`[DB ERROR] Product "${product.name}" not inserted:`, err.message);
        skippedRecords++;
      }
    }

    await client.query('COMMIT');
    console.log(`🎉 Bulk import finished. ${successfulInserts} inserted, ${skippedRecords} skipped.`);
    return { successfulInserts, skippedRecords };

  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(e => console.error('Rollback failed:', e));
    console.error('❌ FINAL DATABASE ERROR:', err.message);
    throw err;
  } finally {
    if (client) await client.end();
  }
}
