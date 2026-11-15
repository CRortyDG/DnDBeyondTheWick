// The preset library: presets other DMs chose to share. Browse, search, filter
// by one-shot or campaign, open one to see what's inside and its first episode,
// then start a campaign from it (the front page's Start form, with the code filled in).
import { useEffect, useMemo, useState } from "react";
import { describeCounts } from "@/shared/presets";
import { browseLibrary, reportListing, type LibraryListing } from "../presets";
import { CandleIcon } from "../ui/icons";

type Filter = "all" | "one-shot" | "campaign";

export function LibraryPage() {
  const [list, setList] = useState<LibraryListing[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<LibraryListing | null>(null);

  useEffect(() => {
    document.title = "Preset library · Candlefair";
    browseLibrary()
      .then((l) => {
        setList(l);
        const want = new URLSearchParams(window.location.search).get("code");
        if (want) setOpen(l.find((x) => x.code === want) ?? null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return (list ?? []).filter((l) => {
      if (filter !== "all" && l.kind !== filter) return false;
      const hay = `${l.title} ${l.description} ${l.levels} ${l.length} ${l.firstEpisode?.title ?? ""}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [list, q, filter]);

  return (
    <main className="library-page">
      <header className="library-head">
        <a className="library-home" href="/">
          <CandleIcon size={26} /> Candlefair
        </a>
        <h1>Preset library</h1>
        <p>Campaigns and one-shots other DMs shared. Open one to see what&rsquo;s inside, then start your own campaign from it.</p>
        <div className="library-tools">
          <input className="fld" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and descriptions" aria-label="Search the library" />
          <div className="library-filters" role="group" aria-label="Show">
            {(
              [
                ["all", "All"],
                ["one-shot", "One-shots"],
                ["campaign", "Campaigns"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" className={`btn small${filter === k ? " on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      {err ? (
        <p className="library-empty">{err}</p>
      ) : !list ? (
        <p className="library-empty">Loading…</p>
      ) : !shown.length ? (
        <p className="library-empty">
          {list.length ? "Nothing matches that." : "Nothing here yet. Save a preset on your campaign's Game page and press List in library to be the first."}
        </p>
      ) : (
        <ul className="library-grid">
          {shown.map((l) => (
            <li key={l.code}>
              <button type="button" className="library-card" onClick={() => setOpen(l)}>
                {l.cover ? <img className="library-cover" src={l.cover} alt="" loading="lazy" /> : null}
                <span className="library-card-body">
                  <Tags l={l} />
                  <b className="library-title">{l.title}</b>
                  {l.description ? <span className="library-desc">{l.description}</span> : null}
                  <span className="library-counts">{describeCounts(l.counts)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open ? <Preview l={open} onClose={() => setOpen(null)} /> : null}
    </main>
  );
}

function Tags({ l }: { l: LibraryListing }) {
  return (
    <span className="library-tags">
      <span className="tag wax">{l.kind === "one-shot" ? "One-shot" : "Campaign"}</span>
      {l.levels ? <span className="tag">Levels {l.levels}</span> : null}
      {l.length ? <span className="tag">{l.length}</span> : null}
    </span>
  );
}

function Preview({ l, onClose }: { l: LibraryListing; onClose: () => void }) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  const send = async () => {
    setErr(null);
    try {
      await reportListing(l.code, reason);
      setReported(true);
      setReporting(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <div className="library-backdrop" onClick={onClose}>
      <article className="library-preview" role="dialog" aria-label={l.title} onClick={(e) => e.stopPropagation()}>
        <div className="card-pin" aria-hidden="true" />
        {l.cover ? <img className="library-preview-cover" src={l.cover} alt="" /> : null}
        <Tags l={l} />
        <h2>{l.title}</h2>
        {l.description ? <p className="library-preview-desc">{l.description}</p> : null}
        <p className="note">
          <b>Inside:</b> {describeCounts(l.counts)}.
        </p>
        {l.firstEpisode ? (
          <div className="library-beats">
            <b>First episode: {l.firstEpisode.title}</b>
            {l.firstEpisode.beats.length ? (
              <ol>
                {l.firstEpisode.beats.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ol>
            ) : (
              <p className="note">No beats yet.</p>
            )}
          </div>
        ) : null}
        <p className="note">Shared {new Date(l.publishedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · code <code>{l.code}</code></p>
        <div className="library-actions">
          <a className="btn primary" href={`/?preset=${encodeURIComponent(l.code)}`}>
            Start a campaign from it
          </a>
          <button className="btn" type="button" onClick={onClose}>
            Back to the library
          </button>
        </div>
        {reported ? (
          <p className="note">Thanks. The site owner will take a look.</p>
        ) : reporting ? (
          <div className="library-report">
            <label>
              What&rsquo;s wrong with it?
              <textarea className="fld" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Offensive, someone else's work, spam…" />
            </label>
            {err ? <p className="error-text">{err}</p> : null}
            <span className="inline">
              <button className="btn small danger" type="button" onClick={() => void send()}>
                Send report
              </button>
              <button className="btn small" type="button" onClick={() => setReporting(false)}>
                Cancel
              </button>
            </span>
          </div>
        ) : (
          <button className="library-report-link" type="button" onClick={() => setReporting(true)}>
            Report this preset
          </button>
        )}
      </article>
    </div>
  );
}
