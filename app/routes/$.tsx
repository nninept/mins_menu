import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const pathname = url.pathname; // ← 안전하게 전체 경로 사용

  if (pathname.startsWith("/admin")) {
    return null; // admin은 모두 통과
  }

  return redirect("/menu");
};

export default function CatchAll() {
  return null;
}