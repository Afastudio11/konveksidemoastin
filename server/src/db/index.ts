import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const getConnectionConfig = () => {
  if (process.env.PGHOST && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };
  }
  return {
    connectionString: process.env.DATABASE_URL,
  };
};

const pool = new Pool(getConnectionConfig());

export const db = drizzle(pool, { schema });
export { pool };
