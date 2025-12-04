// app/routes/menu.tsx
import type {
  LoaderFunctionArgs,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo, useState } from "react";
import type { SerializeFrom } from "@remix-run/server-runtime";

import type { Category } from "~/data/menuData";
import { listMenuByCategory } from "~/data/menuData";

import menuStyles from "~/styles/menu.css?url";
import { MenuTabs } from "~/components/Menu/MenuTabs";
import { MenuCard } from "~/components/Menu/MenuCard";
import { MenuModal } from "~/components/Menu/MenuModal";
import { MenuSubTabs } from "~/components/Menu/MenuSubTabs";

/* ---------- loader ---------- */

export const loader = async (_args: LoaderFunctionArgs) => {
  const [drink, food] = await Promise.all([
    // 🔥 모든 메뉴 가져오기 (stock 0 포함)
    listMenuByCategory("drink"),
    listMenuByCategory("food"),
  ]);

  return json({
    initialCategory: "drink" as Category,
    menu: { drink, food },
  });
};

type LoaderData = SerializeFrom<typeof loader>;
type UIMenuItem = LoaderData["menu"]["drink"][number];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: menuStyles },
];

export const meta: MetaFunction = () => [{ title: "Menu" }];

export default function MenuRoute() {
  const { initialCategory, menu } = useLoaderData<typeof loader>();

  const [category, setCategory] = useState<Category>(initialCategory);

  // 🔥 각 카테고리별 subCategory 상태 저장 (기본값: "all")
  const [subFilter, setSubFilter] = useState<{ drink: string; food: string }>({
    drink: "all",
    food: "all",
  });

  const currentSub = subFilter[category];

  // 현재 카테고리 기준 전체 아이템
  const allItems = menu[category];

  // 현재 카테고리의 subCategory 목록 계산
  const subOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of allItems) {
      if (item.subCategory) {
        set.add(item.subCategory);
      }
    }
    // "전체" 탭 포함
    return ["all", ...Array.from(set)];
  }, [allItems]);

// subCategory 적용 후
const items: UIMenuItem[] =
  currentSub === "all"
    ? allItems
    : allItems.filter((item) => item.subCategory === currentSub);

// 🔥 정렬: 재고 있는 것 → 이름순 / 재고 없는 것 → 맨 뒤 + 이름순
const sortedItems = [...items].sort((a, b) => {
  const aSold = a.stock === 0;
  const bSold = b.stock === 0;

  if (aSold !== bSold) {
    return aSold ? 1 : -1;
  }

  return a.name.localeCompare(b.name, "ko");
});
  const [selectedItem, setSelectedItem] = useState<UIMenuItem | null>(null);

  return (
    <main className="menu-page">
      {/* 상단 고정 탭 (Drink / Food) */}
      <MenuTabs category={category} onChange={setCategory} />

      {/* 메인/서브 탭 사이 회색 줄은 기존 그대로 */}

      {/* 🔥 현재 카테고리용 서브 탭 (beer, wine...) */}
      <MenuSubTabs
        options={subOptions}
        active={currentSub}
        onChange={(value) =>
          setSubFilter((prev) => ({
            ...prev,
            [category]: value,
          }))
        }
      />

      <div className="menu-scroll-area">
        <section className="menu-grid">
          {sortedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="menu-card-button-wrapper"
              onClick={() => setSelectedItem(item)}
            >
              <MenuCard item={item} />
            </button>
          ))}
        </section>
      </div>

      {selectedItem && (
        <MenuModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </main>
  );
}