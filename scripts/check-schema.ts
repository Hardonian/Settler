import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL!;

async function checkSchema() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Check billing_accounts columns
    const billingCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'billing_accounts' 
      ORDER BY ordinal_position
    `);

    console.log("billing_accounts columns:");
    console.log(JSON.stringify(billingCols.rows, null, 2));

    // Check if metadata column exists
    const hasMetadata = billingCols.rows.some((r: any) => r.column_name === "metadata");
    console.log(`\nHas metadata column: ${hasMetadata}`);

    await client.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkSchema();
