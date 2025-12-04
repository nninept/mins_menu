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

import {
  createMenuItem,
  listAllMenuItems,
  updateMenuItem,
  updateMenuStock,
  deleteMenuItem,   // 🔥 이거 추가
  type Category,
} from "~/data/menuData";

import adminStyles from "~/styles/admin.css?url";
import { AdminMenuEditModal } from "~/components/Admin/AdminMenuEditModal";

/* ---------------- meta / links ---------------- */

export const meta: MetaFunction = () => [{ title: "Admin 메뉴 관리" }];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: adminStyles },
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

    // 하위분류(text hidden 하나에 모아서 보냄)
    const rawSub = String(formData.get("subCategory") ?? "").trim();
    const subCategory = rawSub === "" ? null : rawSub;

    // 🔥 파일 업로드 → data URL
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
      metaInfoDescription: metaInfoDescription || undefined, // ✅ undefined로
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
      // 현재 재고 가져오기
      const items = await listAllMenuItems();
      const item = items.find((i) => i.id === id);
      const current = item?.stock ?? 0;

      const delta = direction === "down" ? -1 : 1;
      const next = Math.max(0, current + delta);

      await updateMenuStock(id, next);
    }

    return redirect("/admin");
  }


  /* 3) 메뉴 정보 수정 (편집 모달) -------------------- */
  if (intent === "update-item") {
    const id = String(formData.get("id"));

    const name = formData.get("name");
    const description = formData.get("description");
    const metaInfoDescription = formData.get("metaInfoDescription");
    const category = formData.get("category");
    const subCategoryRaw = formData.get("subCategory");
    const stockRaw = formData.get("stock");
    const existingImageUrl = String(
      formData.get("existingImageUrl") ?? ""
    );

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

    // 🔥 모달에서 새 파일이 왔는지 확인
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const mime = imageFile.type || "image/jpeg";
      const buf = Buffer.from(await imageFile.arrayBuffer());
      const base64 = buf.toString("base64");
      updates.imageUrl = `data:${mime};base64,${base64}`;
    } else if (existingImageUrl) {
      // 파일 안 바꾸면 기존 이미지 유지
      updates.imageUrl = existingImageUrl;
    }

    await updateMenuItem(id, updates);
    return redirect("/admin");
  }

  /* 4) 메뉴 삭제 ---------------------------------- */
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
  // 카테고리별 subCategory 목록
  // 🔥 현재 진행 중인 폼 제출 상태
  const navigation = useNavigation();
  const lastSubmittingIntentRef = useRef<string | null>(null);

  useEffect(() => {
    // 1) 지금 뭔가 submit되고 있다면, 그 _intent 기억해두기
    if (navigation.state === "submitting" && navigation.formData) {
      const intent = navigation.formData.get("_intent");
      if (typeof intent === "string") {
        lastSubmittingIntentRef.current = intent;
      }
    }

    // 2) 다시 idle 상태가 되었고, 마지막 intent가 update-item 이면 모달 닫기
    if (
      navigation.state === "idle" &&
      lastSubmittingIntentRef.current === "update-item"
    ) {
      setEditingItem(null);              // ✅ 모달 닫기
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

  /** 🔥 새 메뉴 추가용 상태들 */
  const [newCategory, setNewCategory] = useState<Category>("drink");
  const [newSubMode, setNewSubMode] =
    useState<"existing" | "new">("existing");
  const [newSubExisting, setNewSubExisting] = useState<string>("");
  const [newSubNew, setNewSubNew] = useState<string>("");
  // 새 메뉴 추가에서 선택된 상위 카테고리

  return (
    <main className="admin-page">
      <h1 className="admin-title">Admin 메뉴 관리</h1>

      {/* 새 메뉴 추가 ------------------------------------ */}
    <section className="admin-section">
      <h2 className="admin-list-item-title">새 메뉴 추가</h2>

      <Form method="post" encType="multipart/form-data" className="admin-form" ref={formRef}>
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

        {/* 상위 카테고리 */}
        <label className="admin-label">
          카테고리
          <select
            name="category"
            className="admin-select"
            value={newCategory}
            onChange={(e) => {
              const cat = e.target.value as Category;
              setNewCategory(cat);
              // 카테고리 바꾸면 하위설정 리셋
              setNewSubMode("existing");
              setNewSubExisting("");
              setNewSubNew("");
            }}
          >
            <option value="drink">Drink</option>
            <option value="food">Food</option>
          </select>
        </label>

        {/* 🔥 하위 분류 select + '새 분류 추가' */}
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

          {/* 실제 서버로 보내는 값은 여기에만 담김 */}
          <input
            type="hidden"
            name="subCategory"
            value={
              newSubMode === "new"
                ? newSubNew.trim()
                : newSubExisting || ""
            }
          />
        </label>

        {/* 이미지 업로드 */}
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

        {/* 🔥 버튼 클래스 이름 수정: CSS와 일치시키기 */}
        <button type="submit" className="admin-button-primary">
          추가
        </button>
      </Form>
    </section>

      {/* 기존 메뉴 목록 ------------------------------- */}
      <section className="admin-section">
        <h2 className="admin-list-item-title">기존 메뉴</h2>

        <ul className="admin-list">
          {items.map((item) => (
            <li key={item.id} className="admin-card">
              <div className="admin-item-row">
                <div>
                  <div className="admin-list-item-title">
                    [{item.category}] {item.name}
                  </div>
                  <div className="admin-list-item-sub">
                    현재 재고: <strong>{item.stock}</strong>
                    {item.stock === 0 && (
                      <span style={{ marginLeft: 8, color: "red" }}>
                        (품절 → 메뉴에서 숨김)
                      </span>
                    )}
                  </div>
                  {item.metaInfoDescription && (
                    <div className="admin-list-item-sub">
                      {item.metaInfoDescription}
                    </div>
                  )}
                  {item.description && (
                    <div className="admin-list-item-sub">
                      {item.description}
                    </div>
                  )}
                </div>

                <div className="admin-item-actions">
                  <Form method="post" className="admin-stock-buttons">
                    <input type="hidden" name="_intent" value="adjustStock" />
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      name="direction"
                      value="up"
                      aria-label="재고 1 증가"
                      data-variant="up"
                    >
                      +
                    </button>
                    <button
                      type="submit"
                      name="direction"
                      value="down"
                      aria-label="재고 1 감소"
                      data-variant="down"
                    >
                      −
                    </button>
                  </Form>

                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() => setEditingItem(item)}
                  >
                    편집
                  </button>

                  <Form method="post" className="admin-delete-form">
                    <input type="hidden" name="_intent" value="delete-item" />
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="admin-delete-button">
                      삭제
                    </button>
                  </Form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 편집 모달 */}
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