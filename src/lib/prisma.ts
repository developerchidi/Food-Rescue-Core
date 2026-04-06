import "./load-env";
import { PrismaClient } from "@prisma/client";

/**
 * Pooler (Supabase :6543, PgBouncer transaction mode) + Prisma dễ gây
 * `42P05 prepared statement "s0" already exists` — cần `pgbouncer=true` trên URL.
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections#postgresql-extensions-for-using-prisma-with-pgbouncer
 */
function normalizeDatabaseUrlForPrisma(url: string | undefined): string | undefined {
  if (!url?.trim()) return url;
  let u = url.trim();
  if (u.includes("pgbouncer=true")) return u;
  const looksLikeTransactionPooler =
    /pooler\.supabase\.com|\.pooler\.|:6543(\/|$|\?)/i.test(u);
  if (looksLikeTransactionPooler) {
    const sep = u.includes("?") ? "&" : "?";
    u = `${u}${sep}pgbouncer=true`;
  }
  return u;
}

const prismaClientSingleton = () => {
  const raw = process.env.DATABASE_URL;
  const url = normalizeDatabaseUrlForPrisma(raw);
  if (url) {
    return new PrismaClient({
      datasources: { db: { url } },
    });
  }
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
