// app/components/Menu/MenuTabs.tsx
import type { FC } from "react";
import type { Category } from "~/data/menuData";

type MenuTabsProps = {
  category: Category;
  onChange: (category: Category) => void;
};

export const MenuTabs: FC<MenuTabsProps> = ({ category, onChange }) => {
  const handleClick = (next: Category) => {
    onChange(next);
  };

  return (
    <div className="menu-tabs">
      {/* 🔶 Drink 먼저 */}
      <button
        type="button"
        className={`menu-tab ${
          category === "drink" ? "menu-tab--active" : ""
        }`}
        onClick={() => handleClick("drink")}
      >
        Drink
      </button>

      <button
        type="button"
        className={`menu-tab ${
          category === "food" ? "menu-tab--active" : ""
        }`}
        onClick={() => handleClick("food")}
      >
        Food
      </button>
    </div>
  );
};