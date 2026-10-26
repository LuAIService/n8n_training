"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

export default function Login({ initialError = "" }: { initialError?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Không đăng nhập được. Thử lại.");
    } catch {
      setError("Mất kết nối. Kiểm tra mạng rồi thử lại.");
    }
    setBusy(false);
  }

  return (
    <main className="login">
      <div className="login-inner">
        <img src="/logo-white.svg" alt="LUAI" className="login-logo" width={143} height={45} />
        <h1 className="login-title">Cảnh báo đồng hồ SPM</h1>
        <form onSubmit={submit} action="/api/login" method="post" className="login-form">
          <label htmlFor="password" className="login-label">
            Mật khẩu nhóm
          </label>
          <div className="login-row">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "login-error" : undefined}
            />
            <button type="submit" disabled={busy} aria-label="Vào">
              {busy ? <LoaderCircle className="spin" size={20} /> : <ArrowRight size={20} />}
            </button>
          </div>
          <p id="login-error" className="login-error" role="alert">
            {error}
          </p>
        </form>
        <p className="login-slogan">Nối từng điểm, nắm toàn cục</p>
      </div>
    </main>
  );
}
