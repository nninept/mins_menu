import { redirect } from "@remix-run/node";

export const loader = () => redirect("/admin/inventory");

export default function AdminIndex() {
  return null;
}