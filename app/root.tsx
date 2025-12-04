// app/root.tsx
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
// 전역 스타일 있으면 여기서 가져오기 (없으면 이 부분 삭제해도 됨)
import globalStylesHref from "~/styles/global.css?url";

export const meta: MetaFunction = () => ([
  { title: "Mins Menu" },
  { name: "viewport", content: "width=device-width,initial-scale=1,viewport-fit=cover" },
]);

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStylesHref },
];

export default function App() {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" /> 
        <Meta />
        <Links />
      </head>
      <body>
        {/* 여기 위아래는 공통 레이아웃 */}
        <Outlet />

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}