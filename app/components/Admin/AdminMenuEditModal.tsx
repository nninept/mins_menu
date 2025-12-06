// app/components/Admin/AdminMenuEditModal.tsx
import { useState } from "react";
import { Form } from "@remix-run/react";

export type AdminEditableItem = {
  id: string;
  name: string;
  description: string | null;
  metaInfoDescription: string | null;
  category: string;
  subCategory: string | null;
  imageUrl: string;
  stock: number;
};

type Props = {
  item: AdminEditableItem;
  onClose: () => void;
  subCategoryOptions: string[]; // 🔥 이 카테고리에 이미 존재하는 하위 분류들
};

export const AdminMenuEditModal = ({
  item,
  onClose,
  subCategoryOptions,
}: Props) => {
  // 현재 subCategory가 기존 옵션에 있으면 existing, 아니면 new 로 취급
  const initialIsExisting =
    item.subCategory && subCategoryOptions.includes(item.subCategory);

  const [subMode, setSubMode] = useState<"existing" | "new">(
    initialIsExisting ? "existing" : "new"
  );
  const [subExisting, setSubExisting] = useState<string>(
    initialIsExisting ? (item.subCategory as string) : ""
  );
  const [subNew, setSubNew] = useState<string>(
    !initialIsExisting ? item.subCategory ?? "" : ""
  );

  // 실제 서버로 보낼 값
  const hiddenSubValue = subMode === "new" ? subNew.trim() : subExisting || "";

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()} // 배경 클릭만 닫히게
      >
        <button
          type="button"
          className="admin-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <Form
          method="post"
          encType="multipart/form-data"
          className="admin-modal-form"
        >
          <input type="hidden" name="_intent" value="update-item" />
          <input type="hidden" name="id" value={item.id} />
          {/* 기존 이미지 URL 보존용 */}
          <input type="hidden" name="existingImageUrl" value={item.imageUrl} />
          {/* 하위 분류 실제 값 */}
          <input type="hidden" name="subCategory" value={hiddenSubValue} />

          <h2 className="admin-modal-title">메뉴 정보 수정</h2>

          {/* 이름 */}
          <label className="admin-label">
            이름
            <input
              name="name"
              defaultValue={item.name}
              className="admin-input"
              required
            />
          </label>

          {/* metaInfoDescription – 이름과 설명 사이에 들어가는 추가 설명 */}
          <label className="admin-label">
            추가 설명 (메뉴 이름과 설명 사이)
            <input
              name="metaInfoDescription"
              defaultValue={item.metaInfoDescription ?? ""}
              className="admin-input"
              placeholder="예: 아이스, 뜨거운 음료 선택 가능 등"
            />
          </label>

          {/* 설명 */}
          <label className="admin-label">
            설명
            <textarea
              name="description"
              defaultValue={item.description ?? ""}
              className="admin-textarea"
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = el.scrollHeight + "px";
              }}
              style={{ overflow: "hidden" }}   // 스크롤 없앰
            />
          </label>

          {/* 카테고리 */}
          <label className="admin-label">
            카테고리
            <select
              name="category"
              defaultValue={item.category}
              className="admin-select"
            >
              <option value="drink">Drink</option>
              <option value="food">Food</option>
            </select>
          </label>

          {/* 하위 분류 선택/신규 입력 */}
          <fieldset className="admin-label" style={{ border: "none", padding: 0 }}>
            <legend className="admin-label">
              하위 분류 (예: beer, wine, coffee)
            </legend>

            {/* 모드 선택: 기존 / 새로 입력 */}
            <div style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>
              <label style={{ marginRight: "1rem" }}>
                <input
                  type="radio"
                  name="subMode"
                  value="existing"
                  checked={subMode === "existing"}
                  onChange={() => setSubMode("existing")}
                />{" "}
                기존 분류에서 선택
              </label>
              <label>
                <input
                  type="radio"
                  name="subMode"
                  value="new"
                  checked={subMode === "new"}
                  onChange={() => setSubMode("new")}
                />{" "}
                새 하위 분류 직접 입력
              </label>
            </div>

            {/* 기존 분류 select */}
            {subMode === "existing" && (
              <select
                className="admin-select"
                value={subExisting}
                onChange={(e) => setSubExisting(e.target.value)}
              >
                <option value="">(선택 안 함)</option>
                {subCategoryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* 새 분류 text input */}
            {subMode === "new" && (
              <input
                className="admin-input"
                value={subNew}
                onChange={(e) => setSubNew(e.target.value)}
                placeholder="예: Beer, Wine, Coffee..."
              />
            )}
          </fieldset>

          {/* 이미지 업로드 (선택) */}
          <label className="admin-label admin-file-label">
            이미지 업로드 (선택)
            <input
              type="file"
              name="image"
              accept="image/*"
              className="admin-file-input"
            />
            <span className="admin-file-button">파일 선택</span>
            <span className="admin-file-name">선택된 파일 없음</span>
          </label>

          {/* 재고 */}
          <label className="admin-label">
            재고
            <input
              type="number"
              name="stock"
              min={0}
              defaultValue={item.stock}
              className="admin-input"
            />
          </label>
          <button
            type="submit"
            className="admin-button-primary"
          >
            저장
          </button>
        </Form>
      </div>
    </div>
  );
};