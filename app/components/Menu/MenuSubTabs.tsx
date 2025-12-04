// app/components/Menu/MenuSubTabs.tsx
import type { FC } from "react";

type Props = {
  options: string[];          // 예: ["all", "beer", "wine"]
  active: string;             // 현재 선택된 값
  onChange: (value: string) => void;
};

export const MenuSubTabs: FC<Props> = ({
  options,
  active,
  onChange,
}) => {
  return (
    <div className="menu-subtabs">
      {options.map((value) => {
        const isActive = value === active;

        const label =
          value === "all" ? "전체" : value; // label은 취향대로

        return (
          <button
            key={value}
            type="button"
            className={
              "menu-subtab-button" +
              (isActive ? " menu-subtab-button--active" : "")
            }
            onClick={() => onChange(value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};