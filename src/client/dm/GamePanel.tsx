
import { useEffect, useRef, useState } from "react";
import { originOf, PRESET_NAME_MAX, townOf } from "@/shared/presets";
import { deletePresetOnline, devicePresets, forgetPreset, libraryStatus, refreshListing, rememberPreset, renamePresetOnline, unpublishPreset, type DevicePreset } from "../presets";
import { PublishDialog } from "./PublishPreset";
import { absoluteHref, api, authHeaders, dmLink, rememberKey } from "../api";
import { useDm } from "./context";
import { downloadBackup, restoreBackup } from "./backup";
import { EndSessionDialog } from "./Dues";
import { PageHead } from "./PageHead";
import { LinkIcon } from "../ui/icons";
import { Field } from "./Field";
import { HostingCosts } from "./HostingCosts";

export function GamePanel() {
  const { view, run, ident, toast } = useDm();
  const file = useRef<HTMLInputElement>(null);
  const s = view.state;

  const download = () => downloadBackup(ident, toast);

  const origin = originOf(s);
  const startLabel = origin.kind === "blank" ? "a blank campaign" : origin.kind === "candlefair" ? "the original Candlefair" : `the preset \u201c${origin.name}\u201d`;
  const reset = async (mode: "play" | "all") => {
    const msg =
      mode === "play"
        ? "Zero every purse, wipe the ledger and delete all sessions? Players, scenes and shops stay."
        : `Reset the whole game to ${startLabel}? Players, scenes, shops and items you added or changed will be gone.`;
    if (!confirm(msg)) return;
    if (mode === "all" && prompt('Type RESET to confirm.') !== "RESET") return;
    try {
      await api("/api/reset", ident, { method: "POST", body: JSON.stringify({ mode }) });
      toast(mode === "play" ? "Fresh start: purses at 0 gp, ledger and sessions cleared." : `Back to ${startLabel}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  const restore = async (f: File | undefined) => {
    if (!f) return;
    if (!confirm("Replace this whole game with the backup? A safety snapshot of right now is kept first.")) return;
    try {
      await restoreBackup(ident, f, toast);
      toast("Backup restored.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  const copyDmLink = async () => {
    if (!ident.key) return toast("This device has no DM key saved.");
    try {
      await navigator.clipboard.writeText(dmLink(ident.game, ident.key));
      toast("DM link copied. Keep it private.");
    } catch {
      toast("Couldn't copy. Your browser blocked it.");
    }
  };

  const rekey = async () => {
    if (!confirm("Make a new DM key? Your old DM link stops working on every device, including ones you've already opened it on.")) return;
    try {
      const r = await api<{ key: string }>("/api/rekey", ident, { method: "POST" });
      rememberKey(ident, r.key);
      window.location.href = dmLink(ident.game, r.key);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="pg settings-page">
      <PageHead
        title="Settings"
        sub="The campaign, sessions, links, presets and backups."
        actions={
          <>
            <button className="btn" type="button" onClick={download}>
              Download a backup
            </button>
            <button className="btn" type="button" onClick={copyDmLink}>
              <LinkIcon size={16} /> Copy my DM link
            </button>
          </>
        }
        stats={[
          { label: "Campaign code", value: s.id, tone: "gold" },
          { label: "Sessions", value: s.sessions.length },
          { label: "Players", value: s.players.filter((p) => !p.archived).length },
        ]}
      />
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
          <Field
            label="Town name"
            value={townOf(s)}
            placeholder="Where the party is based"
            hint="Titles the shop on the TV and phones (“Candlefair Market”) and the players’ Renown line."
            onCommit={(v) => run({ type: "game.town", town: v }, v.trim() ? "Town name saved." : "Town name cleared.")}
          />
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
            <code>{absoluteHref(s.id)}</code> (they type their name), or <code>{absoluteHref(s.id, "their-name")}</code>. They can also enter the code <code>{s.id}</code> on the front page.
          </dd>
          <dt>You</dt>
          <dd>
            Your private DM link has the key in it. It&rsquo;s saved on each device after the first visit.
            <div className="inline">
              <button className="btn" type="button" onClick={copyDmLink}>
                Copy my DM link
              </button>
              <button className="btn" type="button" onClick={rekey}>
                Change DM key
              </button>
            </div>
          </dd>
        </dl>
      </section>
      <PresetsBox />
      <section className="box">
        <h3>Backup</h3>
        <p className="note">Everything is saved online automatically. A backup now and then is still a good idea: it&rsquo;s a zip with the game, the ledger and every image you uploaded.</p>
        <div className="inline">
          <button className="btn" type="button" onClick={download}>
            Download backup
          </button>
          <button className="btn" type="button" onClick={() => file.current?.click()}>
            Restore from a backup
          </button>
          <input ref={file} type="file" accept="application/json,.json,application/zip,.zip" hidden onChange={(e) => void restore(e.target.files?.[0])} />
        </div>
        <p className="note">Your DM link is the only way into this campaign as the DM. Keep a copy in a password manager. A campaign nobody opens for six months is deleted, images and all.</p>
        <Snapshots />
      </section>
      <HostingCosts />
      <section className="box danger-zone">
        <h3>Start fresh</h3>
        <p className="note">For after a test run. A safety snapshot is kept first, so you can go back from Backup above.</p>
        <div className="form">
          <button className="btn danger" type="button" onClick={() => reset("play")}>
            Clear gold, ledger and sessions
          </button>
          <p className="note">Keeps your players, their seats, scenes, images, shops and items. Every purse goes back to 0 gp, HP and inspiration are cleared, fights and the fight history go, the party&rsquo;s map tokens come off and fog covers every map again, shops follow Discover, the Chronicle starts again on an empty Chapter 1, and the next session is Session 1.</p>
          <button className="btn danger" type="button" onClick={() => reset("all")}>
            Reset everything to {startLabel}
          </button>
          <p className="note">Back to Players 1&ndash;4 and how this campaign started. Your own edits, players and uploads are dropped.</p>
          <button
            className="btn danger"
            type="button"
            onClick={() => {
              if (confirm("Replace every shop and item with the starter catalog? All shops start hidden. Gold, the ledger and special orders stay as they are."))
                void run({ type: "catalog.reset" }, "Starter catalog loaded. Every shop is hidden until you open it.");
            }}
          >
            Load the starter catalog
          </button>
          <p className="note">
            Swaps your shops and items for the latest starter catalog: Temple Tonic and the other Candlefair goods, special orders from Baldur&rsquo;s Gate, Training and the Traveling Peddler. Your edits to shops and items are replaced; gold and history aren&rsquo;t touched.
          </p>
        </div>
      </section>
    </div>
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
  const [ending, setEnding] = useState(false);
  const current = s.sessions.find((x) => x.id === s.currentSessionId);
  return (
    <section className="box">
      {ending && current ? <EndSessionDialog session={current} onClose={() => setEnding(false)} /> : null}
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
                  <button className="btn small" type="button" onClick={() => setEnding(true)}>
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

/**
 * Save this campaign's setup to start new campaigns from. The list of presets
 * (and the right to save over, rename or delete them) is kept on this device.
 */
function PresetsBox() {
  const { view, ident, toast } = useDm();
  const s = view.state;
  const [list, setList] = useState<DevicePreset[]>(() => devicePresets());
  const [name, setName] = useState(s.name);
  const [busy, setBusy] = useState(false);
  const refresh = () => setList(devicePresets());
  // Which of them are in the shared library (checked once; a missing answer just shows no tag).
  const [listed, setListed] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState<DevicePreset | null>(null);
  useEffect(() => {
    let live = true;
    for (const p of devicePresets()) {
      libraryStatus(p)
        .then((st) => live && setListed((m) => ({ ...m, [p.code]: st.listed })))
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, []);

  const save = async (over?: DevicePreset) => {
    const n = (over ? over.name : name).trim();
    if (!n) return toast("Give the preset a name.");
    if (over && !confirm(`Save this campaign's setup over \u201c${over.name}\u201d? Campaigns already started from it don't change.`)) return;
    setBusy(true);
    try {
      const r = await api<{ code: string; token: string; name: string; savedAt: number }>("/api/preset/save", ident, {
        method: "POST",
        body: JSON.stringify({ name: n, ...(over ? { code: over.code, token: over.token } : {}) }),
      });
      rememberPreset({ code: r.code, token: r.token, name: r.name, savedAt: r.savedAt });
      refresh();
      // A listed preset's card (what's inside, the first episode) follows the new setup.
      if (over && listed[over.code]) await refreshListing(over).catch(() => {});
      toast(over ? `Saved over \u201c${r.name}\u201d.` : `Saved \u201c${r.name}\u201d. Pick it when you start your next campaign.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const rename = async (p: DevicePreset) => {
    const n = prompt("Rename the preset", p.name)?.trim();
    if (!n || n === p.name) return;
    try {
      const r = await renamePresetOnline(p, n);
      rememberPreset({ ...p, name: r.name });
      refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  const remove = async (p: DevicePreset) => {
    if (!confirm(`Delete the preset \u201c${p.name}\u201d? Its code stops working${listed[p.code] ? " and it leaves the library" : ""}. Campaigns already started from it keep everything.`)) return;
    try {
      await unpublishPreset(p).catch(() => {});
      await deletePresetOnline(p);
      forgetPreset(p.code);
      refresh();
      toast("Preset deleted.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };

  const copy = async (p: DevicePreset) => {
    try {
      await navigator.clipboard.writeText(p.code);
      toast(`Code ${p.code} copied.`);
    } catch {
      toast(`The code is ${p.code}.`);
    }
  };

  return (
    <section className="box">
      <h3>Presets</h3>
      <p className="note">
        Save this campaign&rsquo;s setup to start new campaigns from: scenes and maps, shops and items, Discovery, episodes, monsters, the board and the storyboard.
        Players, gold, the ledger, sessions and the Chronicle are left out.
      </p>
      <div className="inline">
        <input className="fld" value={name} onChange={(e) => setName(e.target.value)} maxLength={PRESET_NAME_MAX} aria-label="Preset name" placeholder="Preset name" />
        <button className="btn" type="button" disabled={busy || !name.trim()} onClick={() => void save()}>
          {busy ? "Saving\u2026" : "Save as a new preset"}
        </button>
      </div>
      {list.length ? (
        <ul className="preset-list">
          {list.map((p) => (
            <li key={p.code}>
              <span>
                <b>{p.name}</b>
                {listed[p.code] ? <span className="tag wax">In the library</span> : null}
                <span className="note">
                  {" "}
                  · code <code>{p.code}</code> · saved {new Date(p.savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </span>
              </span>
              <span className="inline">
                <button className="btn small" type="button" disabled={busy} onClick={() => void save(p)}>
                  Save over
                </button>
                <button className="btn small" type="button" onClick={() => void copy(p)}>
                  Copy code
                </button>
                <button className="btn small" type="button" onClick={() => void rename(p)}>
                  Rename
                </button>
                <button className="btn small" type="button" onClick={() => setPublishing(p)} title="Share it in the preset library, so any DM can start a campaign from it">
                  {listed[p.code] ? "Library listing" : "List in library"}
                </button>
                <button className="btn small danger" type="button" onClick={() => void remove(p)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">No presets saved on this device yet.</p>
      )}
      <p className="note">
        Your presets are listed on this device. Share a code to start a campaign from it anywhere, or list one in the{" "}
        <a href="/library" target="_blank" rel="noreferrer">
          preset library
        </a>
        .
      </p>
      {publishing ? <PublishDialog preset={publishing} onClose={() => setPublishing(null)} onChange={(on) => setListed((m) => ({ ...m, [publishing.code]: on }))} /> : null}
    </section>
  );
}

/** Safety snapshots the campaign keeps by itself: before a reset or restore, and at each session's end. */
function Snapshots() {
  const { view, ident, toast } = useDm();
  const [list, setList] = useState<{ id: number; at: number; reason: string }[] | null>(null);
  const [open, setOpen] = useState(false);
  const load = async () => {
    try {
      setList((await api<{ snapshots: { id: number; at: number; reason: string }[] }>("/api/snapshots", ident)).snapshots);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };
  // Refresh while open, when the game changes (a new snapshot may have been taken).
  const version = view.version;
  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, version]);
  const back = async (x: { id: number; at: number; reason: string }) => {
    if (!confirm(`Put the whole game back to ${new Date(x.at).toLocaleString()} (${x.reason})? A snapshot of right now is kept first.`)) return;
    try {
      await api("/api/snapshots/restore", ident, { method: "POST", body: JSON.stringify({ id: x.id }) });
      toast("Back to that snapshot.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <details className="snapshots" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>Safety snapshots</summary>
      <p className="note">Kept by themselves before a reset, a restore or removing ledger lines, and at the end of each session. The newest 10 stay.</p>
      {list === null ? (
        <p className="note">Loading…</p>
      ) : list.length === 0 ? (
        <p className="note">None yet.</p>
      ) : (
        <ul className="snapshot-list">
          {list.map((x) => (
            <li key={x.id}>
              <span>
                <b>{x.reason}</b> <span className="note">{new Date(x.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
              </span>
              <button className="btn small" type="button" onClick={() => void back(x)}>
                Go back to this
              </button>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
