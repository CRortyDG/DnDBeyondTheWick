import { useCallback, useEffect, useMemo, useState } from "react";
import { ADMIN_BATCH, ADMIN_HEADER, guess, lastActiveOf, type AdminTag, type CampaignStory, type CampaignSummary, type Guess, type ListedRow, type StorageStatus } from "@/shared/admin";

/**
 * The site owner's console: every campaign the registry knows, whether anyone
 * is using it, and its story, read-only. The key lives in this tab (or on this
 * device, if asked) and goes in a header, never the address bar.
 */

const KEY_SLOT = "cf-admin-key";

function storedKey(): string {
  try {
    return sessionStorage.getItem(KEY_SLOT) ?? localStorage.getItem(KEY_SLOT) ?? "";
  } catch {
    return "";
  }
}
function storeKey(key: string | null, remember: boolean) {
  try {
    sessionStorage.removeItem(KEY_SLOT);
    localStorage.removeItem(KEY_SLOT);
    if (key) (remember ? localStorage : sessionStorage).setItem(KEY_SLOT, key);
  } catch {}
}

/** Campaigns this browser holds a DM key for (the main app saves them as cf-key:<code>:dm). */
function deviceCodes(): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const m = /^cf-key:([a-z0-9-]+):dm$/.exec(localStorage.key(i) ?? "");
      if (m) out.push(m[1]);
    }
  } catch {}
  return out.sort();
}

class AuthError extends Error {}

async function call<T>(key: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { [ADMIN_HEADER]: key, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (res.status === 401 || (res.status === 404 && path === "/api/admin/campaigns")) throw new AuthError(data.error ?? "That admin key isn't right.");
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data as T;
}

type Summary = CampaignSummary & { error?: string };
interface Row extends ListedRow {
  summary?: Summary;
  onDevice: boolean;
}
type Kind = Guess;

function kindOf(r: Row): { kind: Kind; tagged: boolean; reasons: string[] } {
  if (r.tag === "mine") return { kind: "yours", tagged: true, reasons: ["You marked it as yours"] };
  if (r.tag === "test") return { kind: "test", tagged: true, reasons: ["You marked it as a test"] };
  if (r.tag === "real") return { kind: "real", tagged: true, reasons: ["You marked it as a real game"] };
  if (!r.summary || r.summary.error) return { kind: "unsure", tagged: false, reasons: [] };
  const g = guess(r.summary, { onDevice: r.onDevice, sameNetwork: r.sameNetwork });
  return { kind: g.guess, tagged: false, reasons: g.reasons };
}

const KIND_LABEL: Record<Kind, string> = { yours: "Yours", test: "Test", real: "Real", idle: "Idle", unsure: "Unsure" };

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

const DAY = 24 * 60 * 60 * 1000;
function ago(t: number | null | undefined, now = Date.now()): string {
  if (!t) return "never";
  const d = now - t;
  if (d < 2 * 60 * 1000) return "just now";
  if (d < 60 * 60 * 1000) return `${Math.round(d / 60000)} min ago`;
  if (d < DAY) return `${Math.round(d / 3600000)} h ago`;
  if (d < 60 * DAY) return `${Math.round(d / DAY)} d ago`;
  return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
const dateOf = (t: number | null | undefined) => (t ? new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "");

type View = "others" | "yours" | "all";

export function AdminApp() {
  const [key, setKey] = useState(storedKey);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [scanOk, setScanOk] = useState({ images: false, cloudflare: false });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState("");
  const [view, setView] = useState<View>("others");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const device = useMemo(deviceCodes, []);

  const signOut = useCallback((msg = "") => {
    storeKey(null, false);
    setKey("");
    setRows(null);
    setErr(msg);
  }, []);

  const load = useCallback(async () => {
    if (!key) return;
    setErr("");
    setLoading("Loading the list…");
    try {
      const list = await call<{ rows: ListedRow[]; scan: { images: boolean; cloudflare: boolean } }>(key, "/api/admin/campaigns");
      setScanOk(list.scan);
      const base: Row[] = list.rows.map((r) => ({ ...r, onDevice: device.includes(r.code) }));
      setRows(base);
      const codes = base.map((r) => r.code);
      const got = new Map<string, Summary>();
      for (let i = 0; i < codes.length; i += ADMIN_BATCH) {
        setLoading(`Asking each campaign… ${Math.min(codes.length, i + ADMIN_BATCH)} of ${codes.length}`);
        const part = await call<{ summaries: Summary[] }>(key, "/api/admin/summaries", { codes: codes.slice(i, i + ADMIN_BATCH) });
        for (const s of part.summaries) got.set(s.code, s);
        setRows((prev) => prev?.map((r) => (got.has(r.code) ? { ...r, summary: got.get(r.code) } : r)) ?? prev);
      }
      setLoading("");
    } catch (e) {
      setLoading("");
      if (e instanceof AuthError) signOut(e.message);
      else setErr((e as Error).message);
    }
  }, [key, device, signOut]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!key) return <KeyGate error={err} onKey={(k, remember) => (storeKey(k, remember), setKey(k))} />;

  const label = async (code: string, tag: AdminTag | null, note?: string) => {
    setRows((prev) => prev?.map((r) => (r.code === code ? { ...r, tag, ...(note !== undefined ? { note } : {}) } : r)) ?? prev);
    try {
      await call(key, "/api/admin/label", { code, tag, ...(note !== undefined ? { note } : {}) });
    } catch (e) {
      setErr((e as Error).message);
      void load();
    }
  };

  const all = rows ?? [];
  const kinds = new Map(all.map((r) => [r.code, kindOf(r)]));
  const isYoursOrTest = (r: Row) => {
    const k = kinds.get(r.code)!.kind;
    return k === "yours" || k === "test";
  };
  const others = all.filter((r) => !isYoursOrTest(r));
  const shown = (view === "others" ? others : view === "yours" ? all.filter(isYoursOrTest) : all)
    .filter((r) => {
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return [r.code, r.summary?.name, r.summary?.town, r.note, ...(r.summary?.playerNames ?? [])].some((x) => x?.toLowerCase().includes(s));
    })
    .sort((a, b) => (b.summary ? lastActiveOf(b.summary) : b.addedAt) - (a.summary ? lastActiveOf(a.summary) : a.addedAt));

  const now = Date.now();
  const week = (r: Row) => !!r.summary && now - lastActiveOf(r.summary) < 7 * DAY;
  const openNow = others.reduce((n, r) => n + (r.summary?.openScreens ?? 0), 0);
  const unknownDevice = device.filter((c) => !all.some((r) => r.code === c));
  const deviceUnmarked = all.filter((r) => r.onDevice && r.tag !== "mine");

  return (
    <div className="ad">
      <header className="ad-top">
        <div>
          <h1>Candlefair admin</h1>
          <p className="ad-sub">Read-only. Nothing here changes a game.</p>
        </div>
        <div className="ad-top-actions">
          <button className="ad-btn" onClick={() => void load()} disabled={!!loading}>
            Refresh
          </button>
          <button className="ad-btn ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {err && <p className="ad-error" role="alert">{err}</p>}

      <section className="ad-stats" aria-label="Totals">
        <Stat n={others.length} label="Other people's campaigns" hint="Not marked or guessed as yours or a test" />
        <Stat n={others.filter(week).length} label="Active this week" hint="Other people's, last 7 days" />
        <Stat n={others.reduce((n, r) => n + (r.summary?.playersSeen ?? 0), 0)} label="Players who joined" hint="Other people's campaigns" />
        <Stat n={openNow} label="Screens open now" hint="Other people's campaigns" live={openNow > 0} />
        <Stat n={all.length} label="Campaigns in the list" hint="Yours and tests included" />
      </section>

      <StoragePanel adminKey={key} onError={setErr} />

      {(unknownDevice.length > 0 || deviceUnmarked.length > 0) && (
        <section className="ad-note">
          <p>
            This browser is the DM of <b>{device.length}</b> campaign{device.length === 1 ? "" : "s"}
            {unknownDevice.length ? `, ${unknownDevice.length} of them not in the list yet` : ""}.
          </p>
          <button
            className="ad-btn"
            onClick={async () => {
              try {
                for (let i = 0; i < unknownDevice.length; i += ADMIN_BATCH) await call(key, "/api/admin/add", { codes: unknownDevice.slice(i, i + ADMIN_BATCH), foundBy: "device" });
                for (const c of device) await call(key, "/api/admin/label", { code: c, tag: "mine" }).catch(() => null);
                void load();
              } catch (e) {
                setErr((e as Error).message);
              }
            }}
          >
            Add them and mark all as mine
          </button>
        </section>
      )}

      <div className="ad-bar">
        <div className="ad-tabs" role="tablist" aria-label="Which campaigns">
          {(
            [
              ["others", `Other people's (${others.length})`],
              ["yours", `Yours & tests (${all.length - others.length})`],
              ["all", `All (${all.length})`],
            ] as [View, string][]
          ).map(([v, l]) => (
            <button key={v} role="tab" aria-selected={view === v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
              {l}
            </button>
          ))}
        </div>
        <input className="ad-search" type="search" placeholder="Search name, code, player" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </div>
      {loading && <p className="ad-loading">{loading}</p>}

      {rows && !shown.length && !loading && (
        <p className="ad-empty">
          {all.length
            ? "Nothing here."
            : "The list is empty. New campaigns add themselves from now on; use Find older campaigns below for the ones made before."}
        </p>
      )}

      <ul className="ad-list">
        {shown.map((r) => (
          <CampaignRow key={r.code} row={r} kind={kinds.get(r.code)!} onOpen={() => setOpen(r.code)} onLabel={label} />
        ))}
      </ul>

      <Backfill adminKey={key} scanOk={scanOk} onDone={() => void load()} />

      {open && (
        <StoryDrawer
          adminKey={key}
          row={all.find((r) => r.code === open)!}
          kind={kinds.get(open)!}
          onLabel={label}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

function Stat({ n, label, hint, live }: { n: number; label: string; hint: string; live?: boolean }) {
  return (
    <div className="ad-stat" title={hint}>
      <span className={live ? "ad-stat-n live" : "ad-stat-n"}>{n}</span>
      <span className="ad-stat-l">{label}</span>
    </div>
  );
}

function KeyGate({ error, onKey }: { error: string; onKey: (k: string, remember: boolean) => void }) {
  const [k, setK] = useState("");
  const [remember, setRemember] = useState(false);
  return (
    <div className="ad ad-gate">
      <form
        className="ad-card"
        onSubmit={(e) => {
          e.preventDefault();
          if (k.trim()) onKey(k.trim(), remember);
        }}
      >
        <h1>Candlefair admin</h1>
        <p className="ad-sub">For the site owner. Paste the admin key you set as the Worker secret ADMIN_KEY.</p>
        {error && <p className="ad-error" role="alert">{error}</p>}
        <label className="ad-field">
          <span>Admin key</span>
          <input type="password" autoComplete="current-password" value={k} onChange={(e) => setK(e.target.value)} autoFocus />
        </label>
        <label className="ad-check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Remember on this device</span>
        </label>
        <button className="ad-btn primary" type="submit" disabled={!k.trim()}>
          Open
        </button>
      </form>
    </div>
  );
}

function TagButtons({ row, onLabel }: { row: Row; onLabel: (code: string, tag: AdminTag | null) => void }) {
  const opts: [AdminTag, string][] = [
    ["mine", "Mine"],
    ["test", "Test"],
    ["real", "Real"],
  ];
  return (
    <div className="ad-tags" role="group" aria-label="Mark as">
      {opts.map(([t, l]) => (
        <button key={t} className={row.tag === t ? "on" : ""} aria-pressed={row.tag === t} onClick={() => onLabel(row.code, row.tag === t ? null : t)}>
          {l}
        </button>
      ))}
    </div>
  );
}

function Pill({ kind, tagged }: { kind: Kind; tagged: boolean }) {
  return (
    <span className={`ad-pill k-${kind}`} title={tagged ? "You marked it" : "A guess"}>
      {KIND_LABEL[kind]}
      {!tagged && kind !== "unsure" ? "?" : ""}
    </span>
  );
}

function CampaignRow({ row, kind, onOpen, onLabel }: { row: Row; kind: ReturnType<typeof kindOf>; onOpen: () => void; onLabel: (code: string, tag: AdminTag | null) => void }) {
  const s = row.summary;
  return (
    <li className="ad-row">
      <button className="ad-row-main" onClick={onOpen} disabled={!s?.exists}>
        <span className="ad-row-head">
          <Pill kind={kind.kind} tagged={kind.tagged} />
          <span className="ad-row-name">{s ? s.name || (s.exists ? "Untitled" : "Nothing saved") : "…"}</span>
          {s && s.openScreens > 0 && <span className="ad-live">{s.openScreens} open now</span>}
        </span>
        <span className="ad-row-meta">
          <code>{row.code}</code>
          {s?.exists && (
            <>
              <span>Last active {ago(lastActiveOf(s))}</span>
              <span>{s.players ? `${s.playersSeen} of ${plural(s.players, "player")} seen` : "No players"}</span>
              <span>{plural(s.sessions, "session")}</span>
              {s.notes > 0 && <span>{plural(s.notes, "note")}</span>}
              {s.activeDayCount > 0 && <span>{plural(s.activeDayCount, "active day")}</span>}
            </>
          )}
        </span>
        {s?.exists && s.playerNames.length > 0 && <span className="ad-row-players">{s.playerNames.join(", ")}</span>}
        {!kind.tagged && kind.reasons.length > 0 && <span className="ad-row-why">{kind.reasons.join(" · ")}</span>}
        {row.note && <span className="ad-row-note">{row.note}</span>}
      </button>
      <TagButtons row={row} onLabel={onLabel} />
    </li>
  );
}

function StoryDrawer({ adminKey, row, kind, onLabel, onClose }: { adminKey: string; row: Row; kind: ReturnType<typeof kindOf>; onLabel: (code: string, tag: AdminTag | null, note?: string) => void; onClose: () => void }) {
  const [story, setStory] = useState<CampaignStory | null>(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState(row.note ?? "");
  useEffect(() => {
    let live = true;
    call<{ story: CampaignStory }>(adminKey, `/api/admin/story?code=${encodeURIComponent(row.code)}`)
      .then((r) => live && setStory(r.story))
      .catch((e) => live && setErr((e as Error).message));
    return () => {
      live = false;
    };
  }, [adminKey, row.code]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const s = story?.summary;
  const byChapter = useMemo(() => {
    const m = new Map<number | null, CampaignStory["notes"]>();
    for (const n of story?.notes ?? []) m.set(n.chapter, [...(m.get(n.chapter) ?? []), n]);
    return [...m].sort((a, b) => (a[0] ?? 1e9) - (b[0] ?? 1e9));
  }, [story]);
  const found = story?.entries.filter((e) => e.stage === "found" || e.stage === "known") ?? [];

  return (
    <div className="ad-drawer-wrap" onClick={onClose}>
      <aside className="ad-drawer" role="dialog" aria-modal="true" aria-label={`Story of ${s?.name ?? row.code}`} onClick={(e) => e.stopPropagation()}>
        <header className="ad-drawer-head">
          <div>
            <Pill kind={kind.kind} tagged={kind.tagged} />
            <h2>{s?.name || row.code}</h2>
            <p className="ad-sub">
              <code>{row.code}</code>
              {s?.town ? ` · ${s.town}` : ""}
              {s ? ` · from ${s.origin}` : ""}
              {row.country ? ` · made in ${row.country}` : ""}
            </p>
          </div>
          <button className="ad-btn ghost" onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>
        <div className="ad-drawer-tools">
          <TagButtons row={row} onLabel={onLabel} />
          <input
            className="ad-search"
            placeholder="Your note (only you see it)"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (row.note ?? "") && onLabel(row.code, row.tag ?? null, note)}
          />
        </div>
        {err && <p className="ad-error">{err}</p>}
        {!story && !err && <p className="ad-loading">Opening…</p>}
        {story && s && (
          <div className="ad-story">
            <dl className="ad-facts">
              <div><dt>Created</dt><dd>{dateOf(s.createdAt)}</dd></div>
              <div><dt>Last change</dt><dd>{dateOf(s.touchedAt) || "never"}</dd></div>
              <div><dt>Last player seen</dt><dd>{ago(s.lastSeenAt)}</dd></div>
              <div><dt>Open now</dt><dd>{s.openScreens} screens</dd></div>
              <div><dt>Fights / rolls</dt><dd>{s.fights} / {s.rolls}</dd></div>
              <div><dt>Found in Discover</dt><dd>{s.found} of {s.entries}</dd></div>
              <div><dt>Images</dt><dd>{s.imageFiles}</dd></div>
              <div><dt>Invites</dt><dd>{s.invites}</dd></div>
            </dl>
            <Activity days={s.activeDays} />
            {!kind.tagged && kind.reasons.length > 0 && <p className="ad-row-why">Guess: {KIND_LABEL[kind.kind]}. {kind.reasons.join(" · ")}</p>}

            <h3>Players ({story.players.length})</h3>
            {story.players.length ? (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr><th>Player</th><th>Character</th><th>Joined</th><th>Last seen</th></tr>
                  </thead>
                  <tbody>
                    {story.players.map((p, i) => (
                      <tr key={i} className={p.archived ? "dim" : ""}>
                        <td>{p.name}{p.archived ? " (left)" : ""}</td>
                        <td>{[p.character, p.className, p.level ? `level ${p.level}` : ""].filter(Boolean).join(", ") || "—"}</td>
                        <td>{ago(p.joinedAt)}</td>
                        <td>{ago(p.lastSeenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="ad-empty">Nobody joined.</p>}

            <h3>Sessions ({story.sessions.length})</h3>
            {story.sessions.length ? (
              <ol className="ad-sessions">
                {story.sessions.map((x) => (
                  <li key={x.number}>
                    <div className="ad-session-head">
                      <b>{x.number}. {x.title || "Untitled"}</b>
                      <span>{dateOf(x.startedAt)}{x.endedAt ? "" : " · still running"}</span>
                    </div>
                    {x.attendees.length > 0 && <p className="ad-dim">With {x.attendees.join(", ")}</p>}
                    {x.recap && <p className="ad-recap">{x.recap}</p>}
                  </li>
                ))}
              </ol>
            ) : <p className="ad-empty">No sessions yet.</p>}

            <h3>Chronicle ({story.notes.length})</h3>
            {byChapter.length ? byChapter.map(([ch, notes]) => (
              <div key={String(ch)} className="ad-chapter">
                <h4>{ch === null ? "Next chapter" : `Chapter ${ch}`}</h4>
                <ul>
                  {notes.map((n, i) => (
                    <li key={i} className={n.hidden ? "dim" : ""}>
                      <p>{n.starred ? "★ " : ""}{n.text}</p>
                      <span className="ad-dim">
                        {n.author} · {dateOf(n.createdAt)}
                        {n.tags.length ? ` · ${n.tags.join(", ")}` : ""}
                        {n.hidden ? " · hidden by the DM" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )) : <p className="ad-empty">No notes.</p>}

            <h3>Discovered ({found.length})</h3>
            {found.length ? (
              <ul className="ad-entries">
                {found.map((e, i) => (
                  <li key={i}>
                    <b>{e.name}</b> <span className="ad-dim">{e.kind}{e.title ? ` · ${e.title}` : ""}</span>
                    {e.summary && <p>{e.summary}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="ad-empty">Nothing found yet.</p>}

            {(story.episodes.length > 0 || story.threads.length > 0 || story.jobs.length > 0) && (
              <>
                <h3>Prep</h3>
                {story.episodes.length > 0 && <p><b>Run sheets:</b> {story.episodes.join(" · ")}</p>}
                {story.threads.length > 0 && <p><b>Story threads:</b> {story.threads.join(" · ")}</p>}
                {story.jobs.length > 0 && <p><b>Jobs:</b> {story.jobs.map((j) => `${j.title} (${j.status})`).join(" · ")}</p>}
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

/** The last 60 days, one square each. Usage counting began on 2026-11-15, so older days are blank. */
function Activity({ days }: { days: string[] }) {
  const set = new Set(days);
  const today = new Date();
  const cells = Array.from({ length: 60 }, (_, i) => {
    const d = new Date(today.getTime() - (59 - i) * DAY).toISOString().slice(0, 10);
    return { d, on: set.has(d) };
  });
  return (
    <div className="ad-activity" aria-label={`Used on ${days.length} days`}>
      <span className="ad-dim">Last 60 days</span>
      <div className="ad-cells">
        {cells.map((c) => (
          <span key={c.d} className={c.on ? "on" : ""} title={c.d} />
        ))}
      </div>
    </div>
  );
}

function Backfill({ adminKey, scanOk, onDone }: { adminKey: string; scanOk: { images: boolean; cloudflare: boolean }; onDone: () => void }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const scan = async (source: "images" | "cloudflare") => {
    setBusy(true);
    let cursor: string | null | undefined;
    let checked = 0;
    let added = 0;
    try {
      do {
        const r = await call<{ checked: number; added: number; cursor: string | null }>(adminKey, "/api/admin/scan", { source, ...(cursor ? { cursor } : {}) });
        checked += r.checked;
        added += r.added;
        cursor = r.cursor;
        setStatus(`Checked ${checked}, added ${added} new…`);
      } while (cursor);
      setStatus(`Done. Checked ${checked}, added ${added} new campaign${added === 1 ? "" : "s"}.`);
      onDone();
    } catch (e) {
      setStatus((e as Error).message);
    }
    setBusy(false);
  };
  return (
    <section className="ad-backfill">
      <h2>Find older campaigns</h2>
      <p className="ad-sub">
        Campaigns made from now on add themselves. Ones made before this console can be found two ways: by their uploaded images (only campaigns that uploaded
        something), or with a Cloudflare API token, which finds every one (see docs/admin.md).
      </p>
      <div className="ad-top-actions">
        <button className="ad-btn" disabled={busy || !scanOk.images} onClick={() => void scan("images")}>
          Scan uploaded images
        </button>
        <button className="ad-btn" disabled={busy || !scanOk.cloudflare} onClick={() => void scan("cloudflare")} title={scanOk.cloudflare ? "" : "Needs CF_API_TOKEN and CF_ACCOUNT_ID"}>
          Scan everything (Cloudflare)
        </button>
      </div>
      {!scanOk.cloudflare && <p className="ad-dim">The full scan is off until the Worker has CF_API_TOKEN and CF_ACCOUNT_ID secrets.</p>}
      {status && <p className="ad-loading">{status}</p>}
    </section>
  );
}

const gb = (b: number) => `${(b / 1024 / 1024 / 1024).toFixed(b < 1024 ** 3 ? 2 : 1)} GB`;

/** The site's image storage (R2): how full, today's writes, and the switch that stops uploads everywhere. */
function StoragePanel({ adminKey, onError }: { adminKey: string; onError: (m: string) => void }) {
  const [s, setS] = useState<StorageStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async (body?: unknown) => {
      setBusy(true);
      try {
        setS((await call<{ storage: StorageStatus }>(adminKey, "/api/admin/storage", body)).storage);
      } catch (e) {
        if (!(e instanceof AuthError)) onError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [adminKey, onError],
  );
  useEffect(() => {
    void run();
  }, [run]);
  if (!s) return null;
  const pct = Math.min(100, Math.round((s.bytes / s.ceilingBytes) * 100));
  return (
    <section className="ad-note" aria-label="Image storage">
      <p>
        Image storage: <b>{gb(s.bytes)}</b> of {gb(s.ceilingBytes)} ({pct}%), {s.files.toLocaleString()} files. Stored today: {s.writes.toLocaleString()} of{" "}
        {s.writesPerDay.toLocaleString()}. {s.off ? <b>Uploads are off for everyone.</b> : pct >= 100 ? <b>Full: uploads are paused.</b> : "Uploads are on."}
        {s.countedAt ? ` Counted ${new Date(s.countedAt).toLocaleString()}.` : ""}
      </p>
      <span className="ad-top-actions">
        <button className="ad-btn" disabled={busy} onClick={() => void run({ recount: true })}>
          Count again
        </button>
        <button className={s.off ? "ad-btn primary" : "ad-btn"} disabled={busy} onClick={() => void run({ uploads: s.off ? "on" : "off" })}>
          {s.off ? "Turn uploads on" : "Turn uploads off"}
        </button>
      </span>
    </section>
  );
}
