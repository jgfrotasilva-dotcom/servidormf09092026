import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: ReturnType<typeof drizzle>;
};

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required. Please set it in your .env file.");
    }

    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
    });
  }

  return globalForDb.__arenaNextJsPostgresqlPool;
}

function getDb() {
  if (!globalForDb.__arenaNextJsDrizzle) {
    globalForDb.__arenaNextJsDrizzle = drizzle(getPool());
  }

  return globalForDb.__arenaNextJsDrizzle;
}

// Exporta um proxy que só inicializa a conexão quando realmente usado
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return (getDb() as any)[prop];
  },
});

export const pool = new Proxy({} as Pool, {
  get(target, prop) {
    return (getPool() as any)[prop];
  },
});
