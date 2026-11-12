import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function getPool(): Pool {
  if (globalForPrisma.pool) return globalForPrisma.pool;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 2,
    max: 10,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 5000,
    keepAlive: true,
    ssl: { rejectUnauthorized: false },
  });

  // Pre-warm connection in background
  pool.query("SELECT 1").catch((e) => console.error("Pool warmup notice:", e.message));

  if (process.env.NODE_ENV !== "production") globalForPrisma.pool = pool;
  return pool;
}

function createPrismaClient(): PrismaClient {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
