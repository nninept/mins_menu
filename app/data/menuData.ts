// app/data/menuData.ts
import { prisma } from "~/db.server";
import type { MenuItem as PrismaMenuItem } from "@prisma/client";

export type Category = "drink" | "food";
export type MenuItem = PrismaMenuItem;

/* ---------------------------------------------
   카테고리별 메뉴 (일반 사용자용)
----------------------------------------------*/
export async function listMenuByCategory(
  category: Category,
  opts?: { onlyAvailable?: boolean }
): Promise<MenuItem[]> {
  return prisma.menuItem.findMany({
    where: {
      category,
      hide: false, // 🔥 메뉴 숨김 처리된 것은 무조건 제외
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
  metaInfoDescription?: string;
  category: Category;
  imageUrl: string;
  stock: number;
  subCategory?: string | null;
}) {
  return prisma.menuItem.create({
    data: {
      name: input.name,
      description: input.description ?? undefined,
      metaInfoDescription: input.metaInfoDescription ?? undefined,
      category: input.category,
      subCategory: input.subCategory ?? null,
      imageUrl: input.imageUrl,
      stock: Math.max(0, input.stock),
      hide: false, // 🔥 기본값 false
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
   hide 값 토글하기
----------------------------------------------*/
export async function toggleHideMenuItem(id: string, hide: boolean) {
  return prisma.menuItem.update({
    where: { id },
    data: { hide },
  });
}

/* ---------------------------------------------
   메뉴 정보 수정
----------------------------------------------*/
export async function updateMenuItem(
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    metaInfoDescription?: string | null;
    category?: Category;
    subCategory?: string | null;
    imageUrl?: string;
    stock?: number;
    hide?: boolean; // 🔥 추가됨
  }
): Promise<MenuItem> {
  return prisma.menuItem.update({
    where: { id },
    data: updates,
  });
}

/* ---------------------------------------------
   삭제
----------------------------------------------*/
export async function deleteMenuItem(id: string): Promise<void> {
  await prisma.menuItem.delete({
    where: { id },
  });
}