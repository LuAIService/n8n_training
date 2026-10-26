import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const AUTH_COOKIE = "spm_auth";

// Cookie value is a hash of the shared password, so changing APP_PASSWORD logs everyone out.
export function authToken(): string {
  const password = process.env.APP_PASSWORD ?? "";
  return createHash("sha256").update(`spm-alerts:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string): boolean {
  const password = process.env.APP_PASSWORD;
  if (!password) return false;
  return safeEqual(input, password);
}

export async function isAuthed(): Promise<boolean> {
  if (!process.env.APP_PASSWORD) return false;
  const value = (await cookies()).get(AUTH_COOKIE)?.value ?? "";
  return safeEqual(value, authToken());
}
