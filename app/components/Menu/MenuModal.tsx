// app/components/Menu/MenuModal.tsx
import type { FC } from "react";
import type { MenuUiItem } from "./MenuCard";

type Props = {
  item: MenuUiItem;
  onClose: () => void;
};

export const MenuModal: FC<Props> = ({ item, onClose }) => {
  return (
    <div className="menu-modal-backdrop" onClick={onClose}>
      <div
        className="menu-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* 닫기 버튼 (오른쪽 상단) */}
        <button
          type="button"
          className="menu-modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>

        <div className="menu-modal-image-wrapper">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="menu-modal-image"
          />
        </div>

        <div className="menu-modal-content">
        <h2 className="menu-modal-name">{item.name}</h2>

        {item.metaInfoDescription && (
          <p className="menu-modal-extra">{item.metaInfoDescription}</p>
        )}

        <p className="menu-modal-description">{item.description}</p>
        </div>
      </div>
    </div>
  );
};