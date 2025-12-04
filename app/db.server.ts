import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // hot-reload 시 PrismaClient 여러 번 안 만들려고 global에 저장
  // (Remix dev 서버용)
  var __prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 환경변수가 설정되어 있지 않습니다.");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}