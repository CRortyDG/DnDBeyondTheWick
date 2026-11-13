"use client";

import { useRef } from "react";
import { absoluteHref, api, authHeaders } from "../api";
import { useDm } from "./context";
import { Field } from "./Field";

export function GamePanel() {
  const { view, run, ident, toast } = useDm();
  const file = useRef<HTMLInputElement>(null);
  const s = view.state;

  const download = async () => {
    try {
      const r = await fetch(`/api/export?game=${encodeURIComponent(ident.game)}`, { headers: authHeaders(ident), cache: "no-store" });
      if (!r.ok) throw new Error("Couldn't make a backup.");
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${ident.game}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast("Backup downloaded. Keep it somewhere safe.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  const reset = async (mode: "play" | "all") => {
    const msg =
      mode === "play"
        ? "Zero every purse, wipe the ledger and delete all sessions? Players, scenes and shops stay."
        : "Reset the whole game to the original Candlefair? Players, scenes, shops and items you added or changed will be gone.";
    if (!confirm(msg)) return;
    if (mode === "all" && prompt('Type RESET to confirm.') !== "RESET") return;
    try {
      await api("/api/reset", ident, { method: "POST", body: JSON.stringify({ mode }) });
      toast(mode === "play" ? "Fresh start: purses at 0 gp, ledger and sessions cleared." : "Back to the original Candlefair.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  const restore = async (f: File | undefined) => {
    if (!f) return;
    if (!confirm("Replace this whole game with the backup? Everything since the backup will be lost.")) return;
    try {
      await api("/api/import", ident, { method: "POST", body: await f.text() });
      toast("Backup restored.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="panel-grid">
      <section className="box">
        <h3>The campaign</h3>
        <div className="form">
          <Field label="Campaign name" value={s.name} onCommit={(v) => run({ type: "game.rename", name: v })} />
          <Field
            label="D&D Beyond game link (the Launch VTT button)"
            value={s.vttUrl ?? ""}
            placeholder="https://www.dndbeyond.com/games/..."
            hint="Shows as Launch VTT at the top of your view and on every player's phone."
            onCommit={(v) => run({ type: "game.vtt", url: v }, v.trim() ? "VTT link saved." : "VTT link removed.")}
          />
          <p className="note">
            Game id: <code>{s.id}</code>. Sessions so far: {s.sessions.length}.
          </p>
        </div>
      </section>
      <SessionsBox />
      <section className="box">
        <h3>Links</h3>
        <dl className="links">
          <dt>TV</dt>
          <dd>
            <code>{absoluteHref(s.id, "TV")}</code>
          </dd>
          <dt>Players</dt>
          <dd>
            <code>{absoluteHref(s.id, "their-name")}</code>
          </dd>
          <dt>You</dt>
          <dd>
            <code>{absoluteHref(s.id, "DM")}</code> plus <code>&amp;key=</code> your DM key. The key is saved on each device after the first visit.
          </dd>
        </dl>
      </section>
      <section className="box">
        <h3>Backup</h3>
        <p className="note">Everything is saved online automatically. A backup now and then is still a good idea.</p>
        <div className="inline">
          <button className="btn" type="button" onClick={download}>
            Download backup
          </button>
          <button className="btn" type="button" onClick={() => file.current?.click()}>
            Restore from a backup
          </button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => void restore(e.target.files?.[0])} />
        </div>
      </section>
      <section className="box danger-zone">
        <h3>Start fresh</h3>
        <p className="note">For after a test run. Neither can be undone, so download a backup first if you might want it.</p>
        <div className="form">
          <button className="btn danger" type="button" onClick={() => reset("play")}>
            Clear gold, ledger and sessions
          </button>
          <p className="note">Keeps your players, scenes, images, shops and items. Every purse goes back to 0 gp and the next session is Session 1.</p>
          <button className="btn danger" type="button" onClick={() => reset("all")}>
            Reset everything to the original Candlefair
          </button>
          <p className="note">Back to Players 1&ndash;4, the prototype&rsquo;s scenes, shops and items. Your own edits, players and uploads are dropped.</p>
        </div>
      </section>
    </div>
  );
}

function SessionsBox() {
  const { view, run } = useDm();
  const s = view.state;
  const counts = new Map<string, number>();
  for (const l of view.ledger) if (l.sessionId) counts.set(l.sessionId, (counts.get(l.sessionId) ?? 0) + 1);
  const names = new Map(s.players.map((p) => [p.id, p.name]));
  const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const list = [...s.sessions].sort((a, b) => b.number - a.number);
  return (
    <section className="box">
      <h3>Sessions</h3>
      {list.length === 0 ? <p className="note">No sessions yet. &ldquo;Start session 1&rdquo; is at the top of the page.</p> : null}
      <ol className="session-list">
        {list.map((x) => {
          const running = x.id === s.currentSessionId;
          return (
            <li key={x.id} className={running ? "running" : undefined}>
              <div className="inline">
                <Field
                  label="No."
                  type="number"
                  value={String(x.number)}
                  onCommit={(v) => {
                    const n = Number(v);
                    if (!Number.isInteger(n) || n < 1) return false;
                    void run({ type: "session.update", sessionId: x.id, patch: { number: n } });
                  }}
                />
                <Field label="Title" value={x.title} onCommit={(v) => run({ type: "session.update", sessionId: x.id, patch: { title: v } })} />
              </div>
              <p className="note">
                {when(x.startedAt)}
                {running ? " \u00b7 running now" : x.endedAt ? ` \u2013 ${when(x.endedAt)}` : ""} &middot; {counts.get(x.id) ?? 0} ledger lines
                {x.attendeeIds.length ? ` \u00b7 ${x.attendeeIds.map((id) => names.get(id) ?? "someone who left").join(", ")}` : ""}
              </p>
              <div className="inline">
                {running ? (
                  <button className="btn small" type="button" onClick={() => run({ type: "session.end" }, `${x.title} ended.`)}>
                    End it
                  </button>
                ) : !s.currentSessionId ? (
                  <button className="btn small" type="button" onClick={() => run({ type: "session.reopen", sessionId: x.id }, `${x.title} is running again.`)}>
                    Reopen
                  </button>
                ) : null}
                <button
                  className="btn small danger"
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete \u201c${x.title}\u201d? Its ledger lines stay, filed under \u201cbetween sessions\u201d.`)) void run({ type: "session.remove", sessionId: x.id }, `Deleted ${x.title}.`);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
