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
          <p className="note">
            Game id: <code>{s.id}</code>. Sessions so far: {s.sessions.length}.
          </p>
        </div>
      </section>
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
    </div>
  );
}
