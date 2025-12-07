import { NavLink, Outlet } from "@remix-run/react";
import adminStyles from "~/styles/admin.css?url";

export const links = () => [
  { rel: "stylesheet", href: adminStyles }
];

export default function AdminLayout() {
  return (
    <main className="admin-page">
      <nav className="admin-top-nav">
        <NavLink
          to="inventory"
          className={({ isActive }) =>
            `admin-top-nav-item ${isActive ? "active" : ""}`
          }
        >
          재고관리
        </NavLink>

        <NavLink
          to="system"
          className={({ isActive }) =>
            `admin-top-nav-item ${isActive ? "active" : ""}`
          }
        >
          시스템
        </NavLink>
      </nav>

      <Outlet />
    </main>
  );
}