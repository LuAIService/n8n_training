# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js (App Router) on Vercel, one repo. Browser calls Next.js API routes only; they forward to n8n webhooks (see README.md).

## Users
Technicians on site using phones, and staff in a control room on desktop screens. Same team, same tool: check recent SPM gauge alerts and raise a manual alert. Mobile first, works well on desktop.

## Product Purpose
One place to see every SPM gauge alert (from email or entered by hand) and to send a manual alert that reaches the team's Telegram. Success: an alert is found or sent in seconds.

## Operating Context
Alerts arrive by email (subject `[Cảnh báo đồng hồ] SPM - <gauge>`), n8n saves them to a history table and posts to Telegram. Manual alerts go the same way. The app is a thin view over that history plus a send form.

## Capabilities and Constraints
- List latest 200 alerts (time, gauge, message, source email/manual).
- Send manual alert: gauge name + message, both required.
- Access protected by one shared team password.
- Vietnamese UI only.

## Brand Commitments
LUAI brand (Luai AI Service), assets in `../brand_assets/brand/`.
- Colors: navy #0C1752 and white only. Navy tints #555D86, #9EA2BA, #E7E8EE, #F3F3F6. No other colors.
- Font: Be Vietnam Pro (files in brand fonts, OFL).
- Logo: logo.svg on white, logo-white.svg on navy; icon.svg for favicon. Never stretch, recolor, or add effects.
- Tone: Vietnamese, short, direct. Write LUAI in caps. Avoid "toàn diện", "tối ưu hóa", "đột phá".
- Slogan: "Nối từng điểm, nắm toàn cục".

## Evidence on Hand
Real alert data only from the n8n table. No invented stats or gauges.

## Product Principles
- Speed over ornament: newest alert visible without scrolling.
- One clear action: send alert.
- Show truth: say clearly when sending or Telegram failed.

## Accessibility & Inclusion
Readable outdoors on phones: large tap targets, high contrast (navy on white).
