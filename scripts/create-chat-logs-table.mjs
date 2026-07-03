// Create the chat_logs table on Neon prod.
//
// Payload's push:true doesn't run during Vercel deploys (see comment in
// payload.config.ts), so new collections need their tables added by hand.
// This mirrors the column shape of other simple collections (see
// `reviews`): integer-serial id, varchar text, custom enum for selects,
// numeric for numbers, boolean for checkbox, jsonb for json, timestamptz
// for createdAt / updatedAt.
//
// Idempotent — uses IF NOT EXISTS so re-running is a no-op.
import pg from "pg";
const client = new pg.Client({ connectionString: process.env.PROD_DB, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(`
    DO $$ BEGIN
      CREATE TYPE enum_chat_logs_locale AS ENUM ('ge', 'en', 'ru');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id SERIAL PRIMARY KEY,
      summary VARCHAR,
      locale enum_chat_logs_locale,
      turns NUMERIC,
      escalated BOOLEAN DEFAULT false,
      transcript JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name='chat_logs' ORDER BY ordinal_position
  `);
  console.table(rows);
  console.log("chat_logs table is ready");
} finally {
  await client.end();
}
