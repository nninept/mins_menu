import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async (_args: LoaderFunctionArgs) => {
  return redirect("/menu");
};

export default function CatchAll() {
  // 이 컴포넌트도 실제로는 안 쓰일 거야
  return null;
}