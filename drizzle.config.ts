import { defineConfig } from 'drizzle-kit';

const getDbUrl = () => {
  if (process.env.PGHOST && process.env.PGDATABASE) {
    return `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE}`;
  }
  return process.env.DATABASE_URL!;
};

export default defineConfig({
  schema: './server/src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDbUrl(),
  },
});
