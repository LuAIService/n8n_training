import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";

// Forwards to the n8n webhooks. The webhook URL never reaches the browser.
const BASE = process.env.N8N_WEBHOOK_BASE?.replace(/\/+$/, "");

const unauthorized = () =>
  NextResponse.json({ ok: false, error: "Phiên đăng nhập đã hết. Tải lại trang và nhập mật khẩu." }, { status: 401 });

const n8nDown = () =>
  NextResponse.json({ ok: false, error: "Không kết nối được n8n. Thử lại sau ít phút." }, { status: 502 });

async function forward(path: string, init?: RequestInit) {
  if (!BASE) return n8nDown();
  try {
    const res = await fetch(`${BASE}/${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(20000) });
    const data = await res.json().catch(() => null);
    if (!data || typeof data.ok !== "boolean") return n8nDown();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return n8nDown();
  }
}

export async function GET() {
  if (!(await isAuthed())) return unauthorized();
  return forward("spm-alerts");
}

export async function POST(request: Request) {
  if (!(await isAuthed())) return unauthorized();

  const body = await request.json().catch(() => null);
  const meter = typeof body?.meter === "string" ? body.meter.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!meter || !message) {
    return NextResponse.json({ ok: false, error: "Nhập tên đồng hồ và nội dung cảnh báo." }, { status: 400 });
  }

  return forward("spm-alert", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ meter, message }),
  });
}
