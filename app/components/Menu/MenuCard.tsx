// app/components/Menu/MenuCard.tsx
import type { FC } from "react";

export type MenuUiItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subCategory: string | null;   // 🔥 추가
  imageUrl: string;
  stock: number;
  metaInfoDescription: string | null;  // 🔥 추가
};

type Props = {
  item: MenuUiItem;
};


export const MenuCard: FC<Props> = ({ item }) => {
  const isSoldOut = item.stock === 0;

  return (
    <div className="menu-card">
      <div className="menu-card-image-wrapper">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="menu-card-image"
        />

        {isSoldOut && (
          <div className="menu-card-overlay">
            <span className="menu-card-soldout-text">재고 없음</span>
          </div>
        )}
      </div>

      {/* 🔥 텍스트 영역 전체를 하나의 래퍼로 묶기 */}
      <div className="menu-card-text">
        <p className="menu-card-name">{item.name}</p>

        {/* meta 줄 : 있으면 내용, 없으면 빈 줄 + 숨김 클래스 */}
        <p
          className={
            item.metaInfoDescription
              ? "menu-card-meta"
              : "menu-card-meta menu-card-meta--empty"
          }
        >
          {item.metaInfoDescription ?? ""}
        </p>

        <p className="menu-card-description">{item.description}</p>
      </div>
    </div>
  );
};