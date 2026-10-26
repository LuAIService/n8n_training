# SPM Alerts App

Web app for the SPM gauge alerts: view alert history and send a manual alert.

- n8n workflows: `Cảnh báo đồng hồ SPM` (email → history → Telegram) and `SPM App API` (the two webhooks below).
- Storage: n8n data table `spm_alerts` (`meter`, `message`, `source`, plus `id` and `createdAt`).
- The browser calls Next.js API routes only. The n8n base URL is in `N8N_WEBHOOK_BASE` (`.env.local` locally, Vercel env in production).

## API contract

### GET `{N8N_WEBHOOK_BASE}/spm-alerts`
Latest 200 alerts, newest first.

```json
200 {
  "ok": true,
  "alerts": [
    { "id": 3, "time": "2026-10-26T07:06:37.282Z", "meter": "Đồng hồ 01", "message": "Áp suất cao", "source": "manual" }
  ]
}
```
`source` is `"email"` or `"manual"`. An empty history returns `"alerts": []`.

### POST `{N8N_WEBHOOK_BASE}/spm-alert`
Request (JSON, UTF-8). Both fields required, non-empty after trimming:
```json
{ "meter": "Đồng hồ 01", "message": "Áp suất cao" }
```

```json
201 { "ok": true, "notified": true, "alert": { "id": 4, "time": "...", "meter": "Đồng hồ 01", "message": "Áp suất cao", "source": "manual" } }
400 { "ok": false, "error": "Thiếu tên đồng hồ (meter) hoặc nội dung (message)." }
```
`notified: false` means the alert was saved but the Telegram message failed.

## Run locally

1. Copy `.env.example` to `.env.local` and set `N8N_WEBHOOK_BASE` and `APP_PASSWORD`.
2. `npm install`
3. `npm run dev`, then open http://localhost:3000 and enter the team password.

On Vercel, set the same two env vars in Project Settings → Environment Variables.
