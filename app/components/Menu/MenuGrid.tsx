// app/components/Menu/MenuGrid.tsx
import type { FC } from "react";
import type { MenuItem } from "~/data/menuData";
import { MenuCard } from "./MenuCard";

type Props = {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
};

export const MenuGrid: FC<Props> = ({ items, onSelect }) => {
  return (
    <section className="menu-grid">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="menu-card-button-wrapper"
          onClick={() => onSelect(item)}
        >
          <MenuCard item={item} />
        </button>
      ))}
    </section>
  );
};