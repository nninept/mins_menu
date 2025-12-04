import { prisma } from "~/db.server";
import type { MenuItem as PrismaMenuItem } from "@prisma/client";
// import type { Category } from "./menuData"; // 이미 있을 거라 가
// 정
export type Category = "drink" | "food";
export type MenuItem = PrismaMenuItem;

/* ---------------------------------------------
   카테고리별 메뉴
----------------------------------------------*/
export async function listMenuByCategory(
  category: Category,
  opts?: { onlyAvailable?: boolean }
): Promise<MenuItem[]> {
  return prisma.menuItem.findMany({
    where: {
      category,
      ...(opts?.onlyAvailable ? { stock: { gt: 0 } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
}

/* ---------------------------------------------
   전체 메뉴 (Admin)
----------------------------------------------*/
export async function listAllMenuItems(): Promise<MenuItem[]> {
  return prisma.menuItem.findMany({
    orderBy: { createdAt: "asc" },
  });
}

/* ---------------------------------------------
   메뉴 생성
----------------------------------------------*/
export async function createMenuItem(input: {
  name: string;
  description?: string;
  metaInfoDescription?: string;   // ✅ string | undefined
  category: Category;
  imageUrl: string;
  stock: number;
  subCategory?: string | null;
}) {
  return prisma.menuItem.create({
    data: {
      name: input.name,
      description: input.description ?? undefined,
      metaInfoDescription: input.metaInfoDescription ?? undefined, // ✅ null 대신 undefined
      category: input.category,
      subCategory: input.subCategory ?? null,
      imageUrl: input.imageUrl,
      stock: Math.max(0, input.stock),
    },
  });
}

/* ---------------------------------------------
   재고 업데이트
----------------------------------------------*/
export async function updateMenuStock(
  id: string,
  stock: number
): Promise<MenuItem> {
  return prisma.menuItem.update({
    where: { id },
    data: { stock: Math.max(0, stock) },
  });
}

/* ---------------------------------------------
   메뉴 정보 전체 수정
----------------------------------------------*/
export async function updateMenuItem(
  id: string,
  updates: {
    name?: string | undefined;
    description?: string | null | undefined;
    metaInfoDescription?: string | null | undefined; // ✅ undefined 포함
    category?: Category | undefined;
    subCategory?: string | null | undefined;
    imageUrl?: string | undefined;
    stock?: number | undefined;
  }
): Promise<MenuItem> {
  return prisma.menuItem.update({
    where: { id },
    data: updates,
  });
}

export async function deleteMenuItem(id: string): Promise<void> {
  await prisma.menuItem.delete({
    where: { id },
  });
}