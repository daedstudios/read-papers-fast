import { PrismaClient } from "@/lib/generated/prisma";

// Create a global variable to store the PrismaClient instance
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create a PrismaClient instance with connection pooling configuration
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
