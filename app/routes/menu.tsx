// app/routes/menu.tsx
import type {
  LoaderFunctionArgs,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useMemo, useState, useEffect } from "react";
import type { SerializeFrom } from "@remix-run/server-runtime";

import type { Category } from "~/data/menuData";
import { listMenuByCategory } from "~/data/menuData";

import menuStyles from "~/styles/menu.css?url";
import { MenuTabs } from "~/components/Menu/MenuTabs";
import { MenuCard } from "~/components/Menu/MenuCard";
import { MenuModal } from "~/components/Menu/MenuModal";
import { MenuSubTabs } from "~/components/Menu/MenuSubTabs";
import fs from "fs";
import path from "path";

export const loader = async (_args: LoaderFunctionArgs) => {
  /* ---- 기존 메뉴 로딩 유지 ---- */
  const [drink, food] = await Promise.all([
    listMenuByCategory("drink"),
    listMenuByCategory("food"),
  ]);

  /* ---- 여기서 hero 이미지 로딩 ---- */
  const uploadDir = path.join(process.cwd(), "public/uploads/hero");
  let uploadedImages: string[] = [];

  try {
    const files = fs.readdirSync(uploadDir);

    uploadedImages = files
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .map((file) => `/uploads/hero/${file}`);
  } catch {
    uploadedImages = [];
  }

  const defaultImages = [
    "/images/menu-hero1.jpg",
    "/images/menu-hero2.jpg",
  ];

  const heroImages =
    uploadedImages.length > 0 ? uploadedImages : defaultImages;

  /* ---- 기존 return + heroImages 추가 ---- */
  return json({
    initialCategory: "drink" as Category,
    menu: { drink, food },

    heroImages, // ⭐ 여기만 추가됨
  });
};

type LoaderData = SerializeFrom<typeof loader>;
type UIMenuItem = LoaderData["menu"]["drink"][number];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: menuStyles },
];

export const meta: MetaFunction = () => [{ title: "Menu" }];

export default function MenuRoute() {
  const { initialCategory, menu, heroImages} = useLoaderData<typeof loader>();

  const [category, setCategory] = useState<Category>(initialCategory);
  const [subFilter, setSubFilter] = useState<{ drink: string; food: string }>({
    drink: "all",
    food: "all",
  });

  const currentSub = subFilter[category];
  const allItems = menu[category];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroImages.length);
        setIsFading(false);
      }, 1000);

    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const subOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of allItems) {
      if (item.subCategory) set.add(item.subCategory);
    }
    return ["all", ...Array.from(set)];
  }, [allItems]);

  const items: UIMenuItem[] =
    currentSub === "all"
      ? allItems
      : allItems.filter((item) => item.subCategory === currentSub);

  const sortedItems = [...items].sort((a, b) => {
    const aSold = a.stock === 0;
    const bSold = b.stock === 0;
    if (aSold !== bSold) return aSold ? 1 : -1;
    return a.name.localeCompare(b.name, "ko");
  });

  const [selectedItem, setSelectedItem] = useState<UIMenuItem | null>(null);

  return (
    <main className="menu-page">
      {/* ---------- HERO 섹션 ---------- */}
      <section className="menu-hero">
<div className="menu-hero-image-wrapper">
<div
  className={`menu-hero-img single ${isFading ? "fade-out" : "fade-in"}`}
  style={{ backgroundImage: `url(${heroImages[currentIndex]})` }}
></div>
</div>
      

        <div className="menu-hero-content">
          {/* 왼쪽 WELCOME 텍스트 */}
          <div className="menu-hero-heading">
            <span className="menu-hero-heading-line">Welcome</span>
            <span className="menu-hero-heading-line">to</span>
            <span className="menu-hero-heading-line">Min's place</span>
          </div>

          {/* 오른쪽 / 가운데 정보 카드 */}
          <div className="menu-hero-card">
            <p>
              Good Drink, Good Friends, Good Night!
              
            </p>
            <p>

              이곳은 여러분만을 위한 프라이빗 바, 
              즐거움을 찾으신다면 언제든 환영입니다!
            </p>
            <p>
              만일 여러분이 원하시는 음료가 없다면 언제든 말씀해주세요.
              다음번엔 잊지않고 준비해드리겠습니다
            </p>
          </div>
        </div>
      </section>

      {/* ---------- 메뉴 영역 (탭 + 리스트) ---------- */}
      <div className="menu-sticky-header">
        {/* 상단 탭 (스크롤 시 sticky) */}

        <MenuTabs category={category} onChange={setCategory} />

        {/* 서브 탭 */}
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

        </div>
        {/* 메뉴 리스트 */}
        <section className="menu-main">
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
      </section>

      {selectedItem && (
        <MenuModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </main>
  );
}