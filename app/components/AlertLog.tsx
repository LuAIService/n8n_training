"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Hand, LoaderCircle, Mail, RefreshCw, SendHorizontal, TriangleAlert } from "lucide-react";
import type { Alert, ListResponse, SendResponse } from "@/lib/types";

const TZ = "Asia/Ho_Chi_Minh";
const POLL_MS = 60_000;

type Pending = {
  key: string;
  meter: string;
  message: string;
  state: "sending" | "failed";
  error?: string;
};

// Telegram result for alerts sent from this screen, keyed by alert id.
type Delivery = Record<number, boolean>;

const fmtDate = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });

export default function AlertLog() {
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const [delivery, setDelivery] = useState<Delivery>({});
  const [meter, setMeter] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const meterRef = useRef<HTMLInputElement>(null);
  const pendingSeq = useRef(0);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data: ListResponse = await res.json();
      if (!data.ok) throw new Error(data.error);
      setAlerts(data.alerts);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error && e.message ? e.message : "Không tải được lịch sử.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Newest first.
  const rows = useMemo(() => (alerts ? [...alerts].sort((a, b) => b.time.localeCompare(a.time)) : []), [alerts]);
  const meters = useMemo(() => [...new Set(rows.map((a) => a.meter))].slice(0, 30), [rows]);

  async function send(item: Pending) {
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meter: item.meter, message: item.message }),
      });
      if (res.status === 401) {
        window.location.reload();
        return;
      }
      const data: SendResponse = await res.json();
      if (!data.ok) throw new Error(data.error);
      setAlerts((prev) => [...(prev ?? []).filter((a) => a.id !== data.alert.id), data.alert]);
      setDelivery((prev) => ({ ...prev, [data.alert.id]: data.notified }));
      setPending((prev) => prev.filter((p) => p.key !== item.key));
    } catch (e) {
      const error = e instanceof Error && e.message ? e.message : "Gửi không được.";
      setPending((prev) => prev.map((p) => (p.key === item.key ? { ...p, state: "failed", error } : p)));
    }
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const m = meter.trim();
    const msg = message.trim();
    if (!m || !msg) {
      setFormError(!m ? "Nhập tên đồng hồ." : "Nhập nội dung cảnh báo.");
      (!m ? meterRef : messageRef).current?.focus();
      return;
    }
    // Not crypto.randomUUID(): it is missing on plain-http pages (phone testing on the LAN).
    const item: Pending = { key: `p${Date.now()}-${++pendingSeq.current}`, meter: m, message: msg, state: "sending" };
    setPending((prev) => [item, ...prev]);
    setMessage("");
    setFormError("");
    messageRef.current?.focus();
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    send(item);
  }

  function retry(item: Pending) {
    const next = { ...item, state: "sending" as const, error: undefined };
    setPending((prev) => prev.map((p) => (p.key === item.key ? next : p)));
    send(next);
  }

  function onMessageKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  const hasRows = rows.length > 0 || pending.length > 0;

  return (
    <div className="app">
      <header className="bar">
        <img src="/logo-white.svg" alt="LUAI" className="bar-logo" width={76} height={24} />
        <h1 className="bar-title">Cảnh báo đồng hồ SPM</h1>
        {alerts !== null && <span className="bar-count">{rows.length} cảnh báo</span>}
        <button className="bar-refresh" onClick={load} disabled={refreshing} aria-label="Tải lại lịch sử" title="Tải lại">
          <RefreshCw size={18} className={refreshing ? "spin" : undefined} />
        </button>
      </header>

      <div className="log" ref={scrollRef} aria-busy={alerts === null}>
        {alerts !== null && loadError && <p className="log-stale">Chưa cập nhật được: {loadError}</p>}

        {(alerts !== null || pending.length > 0) && hasRows && (
          <table className="grid">
            <thead>
              <tr>
                <th className="c-time">Thời gian</th>
                <th className="c-meter">Đồng hồ</th>
                <th className="c-msg">Nội dung</th>
                <th className="c-src">Nguồn</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p) => (
                <PendingRow key={p.key} item={p} onRetry={() => retry(p)} />
              ))}
              {rows.map((a) => (
                <Row key={a.id} alert={a} notified={delivery[a.id]} />
              ))}
            </tbody>
          </table>
        )}

        {alerts === null && !loadError && <Skeleton />}

        {alerts === null && loadError && (
          <div className="notice">
            <TriangleAlert size={22} aria-hidden />
            <p>{loadError}</p>
            <button className="btn-ghost" onClick={load} disabled={refreshing}>
              Thử lại
            </button>
          </div>
        )}

        {alerts !== null && !hasRows && (
          <div className="notice">
            <p className="notice-title">Chưa có cảnh báo nào</p>
            <p>Email có tiêu đề “[Cảnh báo đồng hồ] SPM” sẽ tự hiện ở đây. Cần báo ngay thì gửi ở ô bên dưới.</p>
          </div>
        )}
      </div>

      <form className="composer" onSubmit={submit} noValidate>
        <div className="composer-inner">
          <label className="sr-only" htmlFor="meter">
            Đồng hồ
          </label>
          <input
            id="meter"
            ref={meterRef}
            className="composer-meter"
            placeholder="Tên đồng hồ"
            list="meter-list"
            autoComplete="off"
            value={meter}
            onChange={(e) => {
              setMeter(e.target.value);
              if (formError) setFormError("");
            }}
            aria-invalid={formError === "Nhập tên đồng hồ."}
          />
          <datalist id="meter-list">
            {meters.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <div className="composer-row">
            <label className="sr-only" htmlFor="message">
              Nội dung cảnh báo
            </label>
            <textarea
              id="message"
              ref={messageRef}
              className="composer-message"
              placeholder="Nội dung cảnh báo"
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (formError) setFormError("");
              }}
              onKeyDown={onMessageKey}
              aria-invalid={formError === "Nhập nội dung cảnh báo."}
              aria-describedby="composer-hint"
            />
            <button type="submit" className="composer-send" aria-label="Gửi cảnh báo">
              <SendHorizontal size={20} aria-hidden />
              <span>Gửi</span>
            </button>
          </div>
          <p id="composer-hint" className={formError ? "composer-hint is-error" : "composer-hint"} role={formError ? "alert" : undefined}>
            {formError || "Cảnh báo được lưu vào lịch sử và báo ngay qua Telegram."}
          </p>
        </div>
      </form>
    </div>
  );
}

function TimeCell({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <td className="c-time">
      <time dateTime={iso}>
        <span className="t-clock">{fmtTime.format(d)}</span>
        <span className="t-date">{fmtDate.format(d)}</span>
      </time>
    </td>
  );
}

function Source({ manual }: { manual: boolean }) {
  return (
    <span className="src">
      {manual ? <Hand size={14} aria-hidden /> : <Mail size={14} aria-hidden />}
      <span className="src-label">{manual ? "Gửi tay" : "Email"}</span>
    </span>
  );
}

function Row({ alert, notified }: { alert: Alert; notified?: boolean }) {
  const manual = alert.source === "manual";
  return (
    <tr>
      <TimeCell iso={alert.time} />
      <td className="c-meter">
        <span className="r-meter">{alert.meter}</span>
        {/* Message repeats under the gauge name on phones, where the message column is hidden. */}
        <span className="r-msg-inline">{alert.message}</span>
      </td>
      <td className="c-msg">{alert.message}</td>
      <td className="c-src">
        <Source manual={manual} />
        {notified === true && (
          <span className="note">
            <Check size={13} aria-hidden /> Đã báo Telegram
          </span>
        )}
        {notified === false && (
          <strong className="note note-warn">
            <TriangleAlert size={13} aria-hidden /> Chưa báo được Telegram
          </strong>
        )}
      </td>
    </tr>
  );
}

function PendingRow({ item, onRetry }: { item: Pending; onRetry: () => void }) {
  const failed = item.state === "failed";
  return (
    <tr className={failed ? "is-failed" : "is-sending"}>
      <td className="c-time">
        <span className="t-clock">—</span>
      </td>
      <td className="c-meter">
        <span className="r-meter">{item.meter}</span>
        <span className="r-msg-inline">{item.message}</span>
      </td>
      <td className="c-msg">{item.message}</td>
      <td className="c-src" role={failed ? "alert" : "status"}>
        {failed ? (
          <>
            <strong className="note note-warn">
              <TriangleAlert size={13} aria-hidden /> {item.error}
            </strong>
            <button type="button" className="row-retry" onClick={onRetry}>
              Gửi lại
            </button>
          </>
        ) : (
          <span className="note">
            <LoaderCircle size={13} className="spin" aria-hidden /> Đang gửi…
          </span>
        )}
      </td>
    </tr>
  );
}

function Skeleton() {
  return (
    <div className="skeleton" aria-label="Đang tải lịch sử">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="sk" />
      ))}
    </div>
  );
}
