import { NextResponse } from "next/server";
import { AUTH_COOKIE, authToken, checkPassword } from "@/lib/auth";

// Accepts JSON (from the login script) or a plain form post (works even before JS loads).
export async function POST(request: Request) {
  const isForm = !(request.headers.get("content-type") ?? "").includes("application/json");
  let password = "";
  if (isForm) {
    const form = await request.formData().catch(() => null);
    const value = form?.get("password");
    password = typeof value === "string" ? value : "";
  } else {
    const body = await request.json().catch(() => null);
    password = typeof body?.password === "string" ? body.password : "";
  }

  const ok = checkPassword(password);
  // Relative Location keeps the browser on whatever host it used (IP on a phone, domain on Vercel).
  const backHome = (path: string) => new NextResponse(null, { status: 303, headers: { Location: path } });

  if (!ok) {
    return isForm ? backHome("/?loi=1") : NextResponse.json({ ok: false, error: "Sai mật khẩu." }, { status: 401 });
  }

  const res = isForm ? backHome("/") : NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, authToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
