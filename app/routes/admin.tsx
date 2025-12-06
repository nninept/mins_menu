// app/routes/admin.tsx
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { useMemo, useState, useRef, useEffect } from "react";
import type { SerializeFrom } from "@remix-run/server-runtime";
import { Buffer } from "node:buffer";

import menuStyles from "~/styles/menu.css?url";
import adminStyles from "~/styles/admin.css?url";

import {
  createMenuItem,
  listAllMenuItems,
  updateMenuItem,
  updateMenuStock,
  deleteMenuItem,
  type Category,
} from "~/data/menuData";

import { AdminMenuEditModal } from "~/components/Admin/AdminMenuEditModal";

/* ---------------- meta / links ---------------- */

export const meta: MetaFunction = () => [{ title: "Admin 메뉴 관리" }];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: adminStyles },
  { rel: "stylesheet", href: menuStyles }, // 메뉴 카드/탭 스타일 재사용
];

/* ---------------- loader ---------------- */

export const loader = async (_args: LoaderFunctionArgs) => {
  const items = await listAllMenuItems();
  return json({ items });
};

type LoaderData = SerializeFrom<typeof loader>;
type AdminUIMenuItem = LoaderData["items"][number];

/* ---------------- action ---------------- */

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("_intent");

  /* 1) 새 메뉴 추가 ---------------------------------- */
  if (intent === "create") {
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const metaInfoDescription = String(
      formData.get("metaInfoDescription") ?? ""
    ).trim();
    const category = (formData.get("category") ?? "drink") as Category;
    const stock = Number(formData.get("stock") ?? "0");

    const rawSub = String(formData.get("subCategory") ?? "").trim();
    const subCategory = rawSub === "" ? null : rawSub;

    // 파일 업로드 → data URL
    let imageUrl = "/images/placeholder.jpg";
    const imageFile = formData.get("image") as File | null;

    if (imageFile && imageFile.size > 0) {
      const mime = imageFile.type || "image/jpeg";
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buf.toString("base64");
      imageUrl = `data:${mime};base64,${base64}`;
    }

    await createMenuItem({
      name,
      description,
      metaInfoDescription: metaInfoDescription || undefined,
      category,
      imageUrl,
      stock,
      subCategory,
    });

    return redirect("/admin");
  }

  /* 2) 재고 조절 ---------------------------------- */
  if (intent === "adjustStock") {
    const id = String(formData.get("id") ?? "");
    const direction = String(formData.get("direction") ?? "up");

    if (id) {
      const items = await listAllMenuItems();
      const item = items.find((i) => i.id === id);
      const current = item?.stock ?? 0;

      const delta = direction === "down" ? -1 : 1;
      const next = Math.max(0, current + delta);

      await updateMenuStock(id, next);
    }

    return redirect("/admin");
  }

  /* 3) 숨김 토글 ---------------------------------- */
  if (intent === "toggle-hide") {
    const id = String(formData.get("id") ?? "");
    const hideValue = String(formData.get("hide") ?? "false");
    const hide = hideValue === "true";

    if (id) {
      await updateMenuItem(id, { hide });
    }

    return redirect("/admin");
  }

  /* 4) 메뉴 정보 수정 (편집 모달) -------------------- */
  if (intent === "update-item") {
    const id = String(formData.get("id"));

    const name = formData.get("name");
    const description = formData.get("description");
    const metaInfoDescription = formData.get("metaInfoDescription");
    const category = formData.get("category");
    const subCategoryRaw = formData.get("subCategory");
    const stockRaw = formData.get("stock");
    const existingImageUrl = String(formData.get("existingImageUrl") ?? "");

    const updates: {
      name?: string;
      description?: string | null;
      metaInfoDescription?: string | null;
      category?: Category;
      subCategory?: string | null;
      imageUrl?: string;
      stock?: number;
    } = {};

    if (typeof name === "string") updates.name = name;
    if (typeof description === "string")
      updates.description = description || null;

    if (typeof metaInfoDescription === "string") {
      const trimmed = metaInfoDescription.trim();
      updates.metaInfoDescription = trimmed === "" ? null : trimmed;
    }

    if (category === "drink" || category === "food") {
      updates.category = category;
    }

    if (typeof subCategoryRaw === "string") {
      const trimmed = subCategoryRaw.trim();
      updates.subCategory = trimmed === "" ? null : trimmed;
    }

    if (typeof stockRaw === "string" && stockRaw !== "") {
      updates.stock = Math.max(0, Number(stockRaw) || 0);
    }

    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const mime = imageFile.type || "image/jpeg";
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buf.toString("base64");
      updates.imageUrl = `data:${mime};base64,${base64}`;
    } else if (existingImageUrl) {
      updates.imageUrl = existingImageUrl;
    }

    await updateMenuItem(id, updates);
    return redirect("/admin");
  }

  /* 5) 메뉴 삭제 ---------------------------------- */
  if (intent === "delete-item") {
    const id = String(formData.get("id") ?? "");
    if (id) {
      await deleteMenuItem(id);
    }
    return redirect("/admin");
  }

  return redirect("/admin");
};

/* ---------------- component ---------------- */

export default function AdminRoute() {
  const { items } = useLoaderData<typeof loader>();

  const [editingItem, setEditingItem] = useState<AdminUIMenuItem | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const navigation = useNavigation();
  const lastSubmittingIntentRef = useRef<string | null>(null);

  // textarea 자동 높이
  useEffect(() => {
    const textareas = document.querySelectorAll(".admin-textarea");
    textareas.forEach((ta) => {
      const el = ta as HTMLTextAreaElement;
      const resize = () => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      };
      resize();
      el.addEventListener("input", resize);
    });
  }, []);

  // update-item 저장 후 모달 닫기
  useEffect(() => {
    if (navigation.state === "submitting" && navigation.formData) {
      const intent = navigation.formData.get("_intent");
      if (typeof intent === "string") {
        lastSubmittingIntentRef.current = intent;
      }
    }

    if (
      navigation.state === "idle" &&
      lastSubmittingIntentRef.current === "update-item"
    ) {
      setEditingItem(null);
      lastSubmittingIntentRef.current = null;
    }
  }, [navigation.state, navigation.formData]);

  const subCategoryOptions = useMemo(() => {
    const drinkSet = new Set<string>();
    const foodSet = new Set<string>();

    for (const item of items) {
      if (!item.subCategory) continue;
      if (item.category === "drink") drinkSet.add(item.subCategory);
      if (item.category === "food") foodSet.add(item.subCategory);
    }

    return {
      drink: Array.from(drinkSet),
      food: Array.from(foodSet),
    } as Record<Category, string[]>;
  }, [items]);

  const [newCategory, setNewCategory] = useState<Category>("drink");
  const [newSubMode, setNewSubMode] = useState<"existing" | "new">("existing");
  const [newSubExisting, setNewSubExisting] = useState<string>("");
  const [newSubNew, setNewSubNew] = useState<string>("");

  const [activeCategory, setActiveCategory] = useState<Category>("drink");
  const [activeSubCategory, setActiveSubCategory] = useState<string | "all">(
    "all"
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (item.category !== activeCategory) return false;
      if (activeSubCategory === "all") return true;
      return item.subCategory === activeSubCategory;
    });
  }, [items, activeCategory, activeSubCategory]);

  return (
    <main className="admin-page">
      <h1 className="admin-title">Admin 메뉴 관리</h1>

      {/* 새 메뉴 추가 */}
      <section className="admin-section">
        <h2 className="admin-list-item-title">새 메뉴 추가</h2>

        <Form
          method="post"
          encType="multipart/form-data"
          className="admin-form"
          ref={formRef}
        >
          <input type="hidden" name="_intent" value="create" />

          <label className="admin-label">
            이름
            <input name="name" required className="admin-input" />
          </label>

          <label className="admin-label">
            메타 정보 설명 (옵션)
            <input
              name="metaInfoDescription"
              className="admin-input"
              placeholder="예: 오늘의 추천, 한정 수량 등"
            />
          </label>

          <label className="admin-label">
            설명
            <textarea name="description" className="admin-textarea" />
          </label>

          <label className="admin-label">
            카테고리
            <select
              name="category"
              className="admin-select"
              value={newCategory}
              onChange={(e) => {
                const cat = e.target.value as Category;
                setNewCategory(cat);
                setNewSubMode("existing");
                setNewSubExisting("");
                setNewSubNew("");
              }}
            >
              <option value="drink">Drink</option>
              <option value="food">Food</option>
            </select>
          </label>

          <label className="admin-label">
            하위 분류 (선택, 예: beer, wine)
            <select
              className="admin-select"
              value={newSubMode === "new" ? "__new__" : newSubExisting}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__new__") {
                  setNewSubMode("new");
                } else {
                  setNewSubMode("existing");
                  setNewSubExisting(value);
                }
              }}
            >
              <option value="">하위 분류 없음</option>
              {subCategoryOptions[newCategory].map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
              <option value="__new__">+ 새 분류 추가…</option>
            </select>

            {newSubMode === "new" && (
              <input
                className="admin-input"
                placeholder="새 하위 분류 이름 입력"
                value={newSubNew}
                onChange={(e) => setNewSubNew(e.target.value)}
              />
            )}

            <input
              type="hidden"
              name="subCategory"
              value={
                newSubMode === "new" ? newSubNew.trim() : newSubExisting || ""
              }
            />
          </label>

          <label className="admin-label admin-file-label">
            이미지 업로드
            <input
              type="file"
              name="image"
              accept="image/*"
              className="admin-file-input"
            />
            <span className="admin-file-button">파일 선택</span>
            <span className="admin-file-name">선택된 파일 없음</span>
          </label>

          <label className="admin-label">
            초기 재고
            <input
              type="number"
              name="stock"
              min={0}
              defaultValue={0}
              className="admin-input"
            />
          </label>

          <button type="submit" className="admin-button-primary">
            추가
          </button>
        </Form>
      </section>

      {/* 기존 메뉴 */}
      <section className="admin-section">
        <h2 className="admin-list-item-title">기존 메뉴</h2>

        <div className="menu-tabs">
          <button
            type="button"
            className={
              activeCategory === "drink"
                ? "menu-tab menu-tab--active"
                : "menu-tab"
            }
            onClick={() => {
              setActiveCategory("drink");
              setActiveSubCategory("all");
            }}
          >
            Drink
          </button>
          <button
            type="button"
            className={
              activeCategory === "food"
                ? "menu-tab menu-tab--active"
                : "menu-tab"
            }
            onClick={() => {
              setActiveCategory("food");
              setActiveSubCategory("all");
            }}
          >
            Food
          </button>
        </div>

        <div className="menu-subtabs">
          <button
            type="button"
            className={
              activeSubCategory === "all"
                ? "menu-subtab-button menu-subtab-button--active"
                : "menu-subtab-button"
            }
            onClick={() => setActiveSubCategory("all")}
          >
            전체
          </button>
          {subCategoryOptions[activeCategory].map((sub) => (
            <button
              key={sub}
              type="button"
              className={
                activeSubCategory === sub
                  ? "menu-subtab-button menu-subtab-button--active"
                  : "menu-subtab-button"
              }
              onClick={() => setActiveSubCategory(sub)}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="menu-card-button-wrapper"
              onClick={() => setEditingItem(item)}
            >
              <div className="menu-card admin-menu-card">
                <div className="menu-card-image-wrapper">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="menu-card-image"
                  />
                  {item.stock === 0 && (
                    <div className="menu-card-overlay">
                      <span className="menu-card-soldout-text">재고 없음</span>
                    </div>
                  )}
                  {item.hide && (
                    <div className="menu-card-overlay">
                      <span className="menu-card-soldout-text">
                        숨김 처리됨
                      </span>
                    </div>
                  )}
                </div>

                <div className="menu-card-content">
                  <div className="menu-card-text">
                    <p className="menu-card-name">{item.name}</p>
                    {item.metaInfoDescription && (
                      <p className="menu-card-meta">
                        {item.metaInfoDescription}
                      </p>
                    )}
                    {item.description && (
                      <p className="menu-card-description">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="admin-item-actions">
                    {/* 현재 재고 표시 */}
                    <div
                      className="admin-item-actions-stock"
                      style={{ color: item.stock === 0 ? "red" : "inherit" }}
                    >
                      현재 재고: <strong>{item.stock}</strong>
                    </div>

                    {/* 2x2 버튼 그리드 */}
                    <div className="admin-item-actions-grid">
                      {/* + 버튼 */}
                      <Form
                        method="post"
                        className="admin-action-form"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input type="hidden" name="_intent" value="adjustStock" />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          className="admin-action-button admin-action-button--plus"
                          aria-label="재고 1 증가"
                        >
                          +
                        </button>
                      </Form>

                      {/* - 버튼 */}
                      <Form
                        method="post"
                        className="admin-action-form"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input type="hidden" name="_intent" value="adjustStock" />
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          className="admin-action-button admin-action-button--minus"
                          aria-label="재고 1 감소"
                        >
                          −
                        </button>
                      </Form>

                      {/* 삭제 버튼 */}
                      <Form
                        method="post"
                        className="admin-action-form"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input type="hidden" name="_intent" value="delete-item" />
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="admin-action-button admin-action-button--delete"
                        >
                          삭제
                        </button>
                      </Form>

                      {/* 숨김 토글 버튼 */}
                      <Form
                        method="post"
                        className="admin-action-form"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input type="hidden" name="_intent" value="toggle-hide" />
                        <input type="hidden" name="id" value={item.id} />
                        <input
                          type="hidden"
                          name="hide"
                          value={(!item.hide).toString()}
                        />
                        <button
                          type="submit"
                          className="admin-action-button admin-action-button--hide"
                        >
                          {item.hide ? "숨김 해제" : "숨김 처리"}
                        </button>
                      </Form>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {editingItem && (
        <AdminMenuEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          subCategoryOptions={
            subCategoryOptions[editingItem.category as Category]
          }
        />
      )}
    </main>
  );
}