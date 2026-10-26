// Shapes from the n8n "SPM App API" contract (see README.md).
export type Alert = {
  id: number;
  time: string;
  meter: string;
  message: string;
  source: "email" | "manual";
};

export type ListResponse = { ok: true; alerts: Alert[] } | { ok: false; error: string };

export type SendResponse =
  | { ok: true; notified: boolean; alert: Alert }
  | { ok: false; error: string };
