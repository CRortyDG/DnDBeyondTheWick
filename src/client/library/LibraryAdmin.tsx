// /library/admin: the site owner's page. Everything listed (hidden too), reported
// first. Hide takes a listing off the library (its code keeps working, and it can
// come back); Take down also deletes the preset and its pictures for good.
// The key is LIBRARY_ADMIN_KEY, a secret set in the Cloudflare dashboard; it's kept
// for this tab only.
import { useEffect, useState } from "react";
import { describeCounts } from "@/shared/presets";
import { adminAct, adminListings, type AdminListing } from "../presets";

const SLOT = "cf-library-admin";

function savedKey(): string {
  try {
    return sessionStorage.getItem(SLOT) ?? "";
  } catch {
    return "";
  }
}

export function LibraryAdmin() {
  const [key, setKey] = useState(savedKey);
  const [typed, setTyped] = useState("");
  const [list, setList] = useState<AdminListing[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (k: string) => {
    setErr(null);
    try {
      setList(await adminListings(k));
      try {
        sessionStorage.setItem(SLOT, k);
      } catch {}
    } catch (e) {
      setList(null);
      setKey("");
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    document.title = "Library admin · Candlefair";
    if (key) void load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const act = async (l: AdminListing, action: "hide" | "show" | "clear-reports" | "takedown") => {
    if (action === "takedown" && !confirm(`Take down “${l.title}”? Its preset and pictures are deleted for good, so its code stops working. Campaigns already started from it keep their text but lose those pictures.`)) return;
    setBusy(true);
    try {
      await adminAct(key, l.code, action);
      await load(key);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="library-page">
      <header className="library-head">
        <a className="library-home" href="/library">
          ← Preset library
        </a>
        <h1>Library admin</h1>
      </header>
      {!key ? (
        <form
          className="library-admin-key"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim()) setKey(typed.trim());
          }}
        >
          <label>
            Admin key
            <input className="fld" type="password" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
          <button className="btn primary" type="submit" disabled={!typed.trim()}>
            Open
          </button>
          {err ? <p className="error-text">{err}</p> : null}
        </form>
      ) : !list ? (
        <p className="library-empty">{err ?? "Loading…"}</p>
      ) : (
        <>
          {err ? <p className="error-text">{err}</p> : null}
          <p className="library-empty">
            {list.length} listing{list.length === 1 ? "" : "s"}, {list.filter((l) => !l.hidden).length} showing, {list.filter((l) => l.reports.length).length} reported.
          </p>
          <ul className="library-admin-list">
            {list.map((l) => (
              <li key={l.code} className={l.hidden ? "is-hidden" : ""}>
                <div className="library-admin-main">
                  <b>{l.title}</b> {l.takenDown ? <span className="tag warn">Taken down</span> : l.hidden ? <span className="tag">Hidden</span> : <span className="tag wax">Showing</span>}{" "}
                  {l.reports.length ? <span className="tag warn">{l.reports.length} report{l.reports.length === 1 ? "" : "s"}</span> : null}
                  <div className="note">
                    code <code>{l.code}</code> · {l.kind} · {describeCounts(l.counts)} · updated {new Date(l.updatedAt).toLocaleString()}
                  </div>
                  {l.description ? <div className="note">{l.description}</div> : null}
                  {l.reports.length ? (
                    <ul className="library-admin-reports">
                      {l.reports.map((r, i) => (
                        <li key={i}>
                          <span className="note">{new Date(r.at).toLocaleString()}:</span> {r.reason}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                {!l.takenDown ? (
                  <div className="inline">
                    {l.hidden ? (
                      <button className="btn small" type="button" disabled={busy} onClick={() => void act(l, "show")}>
                        Show again
                      </button>
                    ) : (
                      <button className="btn small" type="button" disabled={busy} onClick={() => void act(l, "hide")}>
                        Hide
                      </button>
                    )}
                    {l.reports.length ? (
                      <button className="btn small" type="button" disabled={busy} onClick={() => void act(l, "clear-reports")}>
                        Clear reports
                      </button>
                    ) : null}
                    <button className="btn small danger" type="button" disabled={busy} onClick={() => void act(l, "takedown")}>
                      Take down
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="note">
            <button
              className="btn small"
              type="button"
              onClick={() => {
                try {
                  sessionStorage.removeItem(SLOT);
                } catch {}
                setKey("");
                setList(null);
              }}
            >
              Lock
            </button>
          </p>
        </>
      )}
    </main>
  );
}
