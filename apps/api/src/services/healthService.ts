import { prisma } from "../../../../packages/database/index.js";

export async function checkDatabaseHealth() {
  await prisma.$queryRaw`SELECT 1`;

  return {
    database: "connected"
  };
}