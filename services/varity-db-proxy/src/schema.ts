import pool from './pool';
import { quoteIdent } from './utils';

// Cache of created schemas, tables, and the shared trigger function
const schemaCache = new Set<string>();
const tableCache = new Set<string>();
let triggerFunctionCreated = false;

/**
 * Ensure the shared updated_at trigger function exists (created once per DB).
 */
const ensureTriggerFunction = async (): Promise<void> => {
  if (triggerFunctionCreated) return;

  await pool.query(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  triggerFunctionCreated = true;
};

/**
 * Ensure schema exists for an app.
 * No explicit GRANT needed — the connection user (postgres) is the superuser.
 */
export const ensureSchema = async (schema: string): Promise<void> => {
  if (schemaCache.has(schema)) {
    return;
  }

  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdent(schema)}`);
    await ensureTriggerFunction();

    schemaCache.add(schema);
    console.log(`Schema ready: ${schema}`);
  } catch (error) {
    console.error(`Error creating schema ${schema}:`, error);
    throw error;
  }
};

/**
 * Ensure table exists in a schema
 */
export const ensureTable = async (
  schema: string,
  tableName: string
): Promise<void> => {
  const fullTableName = `${schema}.${tableName}`;

  if (tableCache.has(fullTableName)) {
    return;
  }

  try {
    const s = quoteIdent(schema);
    const t = quoteIdent(tableName);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${s}.${t} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE ${s}.${t} ENABLE ROW LEVEL SECURITY
    `);

    // Create RLS policy — use parameterized values in the DO block
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE schemaname = $1
          AND tablename = $2
          AND policyname = 'app_isolation'
        ) THEN
          EXECUTE format('CREATE POLICY app_isolation ON %I.%I FOR ALL USING (true)', $1, $2);
        END IF;
      END $$;
    `.replace(/\$1/g, `'${schema.replace(/'/g, "''")}'`).replace(/\$2/g, `'${tableName.replace(/'/g, "''")}'`));

    await pool.query(`
      CREATE INDEX IF NOT EXISTS ${quoteIdent('idx_' + tableName + '_data')}
      ON ${s}.${t} USING gin(data)
    `);

    const triggerName = quoteIdent('update_' + tableName + '_updated_at');
    await pool.query(`
      DROP TRIGGER IF EXISTS ${triggerName} ON ${s}.${t};
      CREATE TRIGGER ${triggerName}
        BEFORE UPDATE ON ${s}.${t}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `);

    tableCache.add(fullTableName);
    console.log(`Table ready: ${fullTableName}`);
  } catch (error) {
    console.error(`Error creating table ${fullTableName}:`, error);
    throw error;
  }
};

/**
 * Close database pool
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
};
