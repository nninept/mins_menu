// app/routes/admin.system.tsx
import { useLoaderData, Form } from "@remix-run/react";
import type { ActionFunctionArgs, LinksFunction, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import fs from "fs";
import path from "path";
import { useMemo, useState, useRef, useEffect } from "react";
import systemStyles from "~/styles/admin.system.css?url";
import type { LoaderFunctionArgs } from "@remix-run/node";
/* ---------------- links ---------------- */
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: systemStyles },
];

/* ---------------- loader: hero 이미지 불러오기 ---------------- */
export const loader = async () => {
  const heroDir = path.join(process.cwd(), "public/uploads/hero");
  const orderFile = path.join(heroDir, "order.json");

  // 폴더 읽기
  const files = fs.existsSync(heroDir)
    ? fs.readdirSync(heroDir).filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
    : [];

  // 기본 순서
  let ordered = files.map((f) => `/uploads/hero/${f}`);

  // order.json이 있으면 그것을 우선 반영
  if (fs.existsSync(orderFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(orderFile, "utf8")) as string[];

      // saved 순서 중 실제로 존재하는 파일만 남기고,
      // 새로 생긴 파일은 마지막에 붙임
      const remaining = ordered.filter((x) => !saved.includes(x));
      ordered = [...saved.filter((x) => ordered.includes(x)), ...remaining];
    } catch (e) {
      console.error("order.json parse error:", e);
    }
  }

  return json({ heroImages: ordered });
};

export const meta: MetaFunction = () => [{ title: "시스템 설정" }];

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const files = formData.getAll("heroImages") as File[];

  const uploadDir = path.join(process.cwd(), "public/uploads/hero");
  const intent = formData.get("_intent");

  /* 이미지 삭제 -------------------------------- */
  if (intent === "delete-hero-image") {
    const filePath = String(formData.get("filePath") ?? "");

    // filePath = "/uploads/hero/filename.jpg"
    const absolutePath = path.join(process.cwd(), "public", filePath);

    try {
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (err) {
      console.error("삭제 오류:", err);
    }

    return redirect("/admin/system");
  }

  /* 이미지 순서 저장 ---------------------------- */
  if (intent === "save-order") {
  const order = JSON.parse(String(formData.get("order")));
  const orderFile = path.join(process.cwd(), "public/uploads/hero/order.json");
  
  fs.writeFileSync(orderFile, JSON.stringify(order, null, 2));
  
  return json({ success: true });
  }

  /* 이미지 업로드 ------------------------------ */
  // 🔥 폴더 없으면 생성
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uploaded: string[] = [];

  for (const file of files) {
    if (file.size === 0) continue;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일명 정리 (공백 제거 + 소문자 확장자)
    const original = file.name.replace(/\s+/g, "_");
    const ext = path.extname(original).toLowerCase();
    const base = path.basename(original, ext);
    const finalName = `${base}${ext}`;

    const filePath = path.join(uploadDir, finalName);

    fs.writeFileSync(filePath, buffer);
    uploaded.push(`/uploads/hero/${finalName}`);
  }

  return json({
    success: true,
    uploaded,
  });
};

export default function AdminSystemPage() {
  const { heroImages } = useLoaderData<typeof loader>();
  const [images, setImages] = useState(heroImages);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, index: number) {
    e.dataTransfer.setData("drag-index", String(index));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, index: number) {
    const from = Number(e.dataTransfer.getData("drag-index"));
    const to = index;

    if (from === to) return;

    const newOrder = [...images];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);

    setImages(newOrder);

    // 서버에 순서 저장 요청
    fetch("/admin/system", {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        fd.append("_intent", "save-order");
        fd.append("order", JSON.stringify(newOrder));
        return fd;
      })(),
    });
  }

  return (
    <div className="admin-system-page">
      <h1 className="admin-system-title">시스템 설정</h1>


      <h2>현재 업로드된 Hero 이미지</h2>

      <div className="admin-system-gallery">
        {images.map((src, i) => (
          <div
            key={src}
            className="admin-system-img-box"
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, i)}
          >
            {/* 삭제 버튼 */}
            <Form method="post" className="admin-system-delete-form">
              <input type="hidden" name="_intent" value="delete-hero-image" />
              <input type="hidden" name="filePath" value={src} />
              <button type="submit" className="admin-system-delete-btn">×</button>
            </Form>

            <img src={src} alt="hero" />
          </div>
        ))}
      </div>


      <div className="admin-system-upload-box">
        <h2>Hero 이미지 업로드</h2>

        <Form method="post" encType="multipart/form-data">
          <input type="file" name="heroImages" multiple accept="image/*" />
          <button type="submit" className="admin-system-button">업로드</button>
        </Form>
      </div>
    </div>
  );
}