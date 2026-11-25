"use client";

// Settings: Worldbuilder keys, the "Builder access" switch, and Activity.
// A key is shown once, right after it's made; only its hash is kept.

import { ask } from "./ask";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useDm } from "./context";

interface KeyRow {
  id: string;
  label: string;
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  revokedAt: number | null;
  noSecrets: boolean;
}
interface AuditRow {
  id: string;
  at: number;
  keyId: string;
  label: string;
  op: string;
  ok: boolean;
  code?: string;
  entityType?: string;
  entityId?: string;
  country?: string;
}

const day = (at: number | null) => (at ? new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "never");
const time = (at: number) => new Date(at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const CODE_TEXT: Record<string, string> = {
  "bad-key": "wrong key",
  revoked: "revoked key",
  expired: "expired key",
  off: "builder access off",
  forbidden: "not allowed",
  limit: "over the limit",
  "pending-cap": "too many drafts waiting",
  invalid: "didn't fit the rules",
  "bad-ref": "unknown id",
  "not-yours": "not its draft",
  "wrong-door": "wrong key type",
  browser: "from a browser",
  "too-big": "too big",
};

export function BuilderSettings() {
  const { ident, toast } = useDm();
  const [status, setStatus] = useState<{ enabled: boolean; keys: KeyRow[] } | null>(null);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<string>("30");
  const [noSecrets, setNoSecrets] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [keyFilter, setKeyFilter] = useState("");
  const [from, setFrom] = useState("");
  const [openLog, setOpenLog] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await api<{ enabled: boolean; keys: KeyRow[] }>("/api/builder-admin/status", ident));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  }, [ident, toast]);
  useEffect(() => void load(), [load]);

  const loadLog = useCallback(async () => {
    try {
      setRows((await api<{ rows: AuditRow[] }>("/api/builder-admin/activity", ident)).rows);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  }, [ident, toast]);
  useEffect(() => {
    if (openLog) void loadLog();
  }, [openLog, loadLog]);

  const post = async (path: string, body: unknown) => {
    try {
      const r = await api<Record<string, unknown>>(`/api/builder-admin/${path}`, ident, { method: "POST", body: JSON.stringify(body) });
      await load();
      return r;
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
      return null;
    }
  };

  const make = async () => {
    const r = await post("key-create", { label: label.trim() || "Claude Desktop", days: days === "never" ? null : Number(days), noSecrets });
    if (r?.key) {
      setFresh(String(r.key));
      setLabel("");
    }
  };

  const copy = async (t: string) => {
    try {
      await navigator.clipboard.writeText(t);
      toast("Copied.");
    } catch {
      toast("Couldn't copy. Select the text and copy it by hand.");
    }
  };

  const fromAt = from ? new Date(`${from}T00:00:00`).getTime() : 0;
  const shown = rows?.filter((r) => (!keyFilter || r.keyId === keyFilter) && r.at >= fromAt) ?? null;
  const failures = shown?.filter((r) => !r.ok).length ?? 0;

  return (
    <section className="box builder-settings">
      <h3>Worldbuilder</h3>
      <p className="note">
        Builder keys let Claude Desktop or Claude Code read your campaign notes and write drafts for you to review on the Worldbuilder page. A key can never change game state, reveal, pin, delete,
        approve or read players&rsquo; details. Setup steps are in the repository&rsquo;s docs/worldbuilder.md.
      </p>
      {status === null ? (
        <p className="note">Loading&hellip;</p>
      ) : (
        <>
          <label className="check">
            <input type="checkbox" checked={status.enabled} onChange={(e) => void post("enabled", { on: e.target.checked })} />
            <b>Builder access {status.enabled ? "on" : "off"}</b>
            <span className="note"> {status.enabled ? "Turn off to stop every builder key at once." : "Every builder key is refused until you turn this on."}</span>
          </label>

          {fresh ? (
            <div className="box builder-fresh" role="status">
              <p>
                <b>Your new key. Copy it now: it won&rsquo;t be shown again.</b> Paste it into your Claude Desktop config as DUNGEON_GARDEN_BUILDER_KEY. Never put it in a file in the repository.
              </p>
              <code className="builder-key">{fresh}</code>
              <div className="inline">
                <button className="btn small primary" type="button" onClick={() => void copy(fresh)}>
                  Copy key
                </button>
                <button className="btn small" type="button" onClick={() => setFresh(null)}>
                  I&rsquo;ve saved it
                </button>
              </div>
            </div>
          ) : null}

          <div className="inline builder-new">
            <input className="fld" placeholder="Label, e.g. Claude Desktop laptop" maxLength={60} value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Key label" />
            <select className="fld" value={days} onChange={(e) => setDays(e.target.value)} aria-label="Expires">
              <option value="7">Expires in 7 days</option>
              <option value="30">Expires in 30 days</option>
              <option value="90">Expires in 90 days</option>
              <option value="never">Never expires</option>
            </select>
            <label className="check">
              <input type="checkbox" checked={noSecrets} onChange={(e) => setNoSecrets(e.target.checked)} /> No secrets or DM notes
            </label>
            <button className="btn small primary" type="button" onClick={() => void make()}>
              New key
            </button>
          </div>

          {status.keys.length ? (
            <table className="builder-keys">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Expires</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {status.keys.map((k) => {
                  const expired = k.expiresAt !== null && k.expiresAt < Date.now();
                  return (
                    <tr key={k.id} className={k.revokedAt || expired ? "muted" : undefined}>
                      <td>
                        {k.label}
                        {k.noSecrets ? <span className="tag">no secrets</span> : null}
                        {k.revokedAt ? <span className="tag">revoked</span> : expired ? <span className="tag">expired</span> : null}
                      </td>
                      <td>{day(k.createdAt)}</td>
                      <td>{k.lastUsedAt ? time(k.lastUsedAt) : "never"}</td>
                      <td>{k.expiresAt ? day(k.expiresAt) : "never"}</td>
                      <td>
                        {k.revokedAt ? (
                          <button className="btn small" type="button" onClick={() => void post("key-remove", { id: k.id })}>
                            Remove
                          </button>
                        ) : (
                          <button
                            className="btn small danger"
                            type="button"
                            onClick={() => {
                              void ask(`Revoke "${k.label}"? It stops working right away.`).then((ok) => {
                                if (ok) void post("key-revoke", { id: k.id });
                              });
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="note">No keys yet.</p>
          )}

          <details open={openLog} onToggle={(e) => setOpenLog((e.target as HTMLDetailsElement).open)}>
            <summary>
              <h4>Activity</h4>
            </summary>
            <p className="note">Every call a builder key made. Failed and refused calls are marked: lots of them could mean a key has leaked, so revoke it.</p>
            <div className="inline">
              <select className="fld" value={keyFilter} onChange={(e) => setKeyFilter(e.target.value)} aria-label="Key">
                <option value="">Every key</option>
                {status.keys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
              <label className="fld-row">
                <span>From</span>
                <input className="fld" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <button className="btn small" type="button" onClick={() => void loadLog()}>
                Refresh
              </button>
              {shown ? <span className={failures ? "warn" : "note"}>{failures ? `${failures} failed or refused` : "No failures"}</span> : null}
            </div>
            {shown === null ? null : shown.length === 0 ? (
              <p className="note">Nothing yet.</p>
            ) : (
              <table className="builder-log">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Key</th>
                    <th>Call</th>
                    <th>What</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id} className={r.ok ? undefined : "builder-fail"}>
                      <td>{time(r.at)}</td>
                      <td>
                        {r.label}
                        {r.country ? <span className="note"> ({r.country})</span> : null}
                      </td>
                      <td>{r.op}</td>
                      <td>{r.entityType ? `${r.entityType} ${r.entityId ?? ""}` : ""}</td>
                      <td>{r.ok ? "OK" : `Refused: ${CODE_TEXT[r.code ?? ""] ?? r.code ?? "failed"}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </details>
        </>
      )}
    </section>
  );
}
