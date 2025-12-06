import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async (_args: LoaderFunctionArgs) => {
  return redirect("/menu");
};

export default function Index() {
  // 실제로는 렌더될 일이 없음 (무조건 redirect)
  return null;
}