"use client";

// The DM's Discovery tab: people, places, shops, monsters, mysteries and
// factions, each hidden -> rumored -> found -> known. Write entries up ahead of
// time; players see a rumor as a silhouette and a hint, a found entry with its
// name and picture, and each fact once you reveal it. Your notes and secrets
// never leave this screen.

import { featureOn } from "@/shared/features";
import { RoomFields } from "./Rooms";
import { AttitudeTracker } from "./AttitudeTracker";
import { bandInfo, relationOf, partyScore, signed } from "@/shared/attitude";
import { ask } from "./ask";
import { PlaceSceneFields } from "./OffScript";
import { useRef, useState } from "react";
import { entriesOf, entryTags, FACT_MAX, kindInfo, KINDS, stageLabel, STAGES, SUMMARY_MAX, isFound } from "@/shared/discovery";
import type { Entry, EntryKind, Relation, Stage } from "@/shared/types";
import { DownIcon, UpIcon } from "../ui/icons";
import { Portrait } from "../ui/Portrait";
import { PageHead } from "./PageHead";
import { PlusIcon } from "./navIcons";
import { PersonNotes, notesAbout } from "../ui/PersonNotes";
import { artSrc } from "../ui/SceneView";
import { Field } from "./Field";
import { useDm } from "./context";
import { Drawer } from "./Drawer";
import { BulkImport } from "./BulkImport";
import { MenuItem, RowMenu } from "./RowMenu";
import { uploadImage } from "./upload";
import { makeSilhouette } from "./silhouette";
import { ShowControls } from "./QuickBar";
import { entryRef } from "@/shared/assets";
import { penName } from "@/shared/chronicle";
import { presentIds, STAGE_NAMES, stageFor, whoKnows } from "@/shared/world";

const TV_KEY = "candlefair-discovery-tv";

function loadTv(): boolean {
  try {
    return localStorage.getItem(TV_KEY) !== "off";
  } catch {
    return true;
  }
}

export function DiscoveryPanel() {
  const { view, run } = useDm();
  const s = view.state;
  const all = entriesOf(s);
  const [kind, setKind] = useState<EntryKind | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<EntryKind>("person");
  const [tv, setTvState] = useState(loadTv);
  const setTv = (v: boolean) => {
    setTvState(v);
    try {
      localStorage.setItem(TV_KEY, v ? "on" : "off");
    } catch {}
  };
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const needle = q.trim().toLowerCase();
  const list = all.filter((e) => (kind === "all" || e.kind === kind) && (!needle || e.name.toLowerCase().includes(needle) || (e.nickname ?? "").toLowerCase().includes(needle)));
  const kinds = [...KINDS.map((k) => k.id), ...new Set(all.map((e) => e.kind).filter((k) => !KINDS.some((x) => x.id === k)))];

  const hidden = all.filter((e) => e.stage === "hidden").length;
  const rumored = all.filter((e) => e.stage === "rumored").length;

  return (
    <div className="people-panel pg">
      <PageHead
        title="Discovery"
        sub="People, places, shops and monsters the party can find."
        help={
          <>
            <p>Players never get hidden entries, locked facts, real names behind nicknames, your notes or secrets. A rumor shows as a silhouette with its nickname (or &ldquo;???&rdquo;) and hint.</p>
            <p>
              <b>Show</b> puts it on the TV (a person&rsquo;s picture, a place&rsquo;s spot on its map, a shop&rsquo;s storefront) and finds it if the party hadn&rsquo;t yet; <b>Announce</b> plays its card. Notes about an entry are Chronicle notes tagged with its name.
            </p>
          </>
        }
        actions={
          <>
            <button className="btn" type="button" onClick={() => setImporting(true)}>
              Import
            </button>
            <button className="btn primary" type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}>
              <PlusIcon size={16} /> Add
            </button>
          </>
        }
        stats={[
          { label: "Found", value: all.length - hidden - rumored, tone: "ok" },
          { label: "Rumored", value: rumored, tone: "gold" },
          { label: "Hidden", value: hidden, tone: "muted" },
        ]}
      />
      {importing ? (
        <Drawer title="Import into Discovery" subtitle="Paste several at once; they arrive hidden unless you say how they start" onClose={() => setImporting(false)} closeLabel="Cancel" wide>
          <BulkImport kind="entries" onDone={() => setImporting(false)} />
        </Drawer>
      ) : null}
      {adding ? (
        <form
          className="pg-inline-form wide"
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (!newName.trim()) return;
            const ok = await run({ type: "entry.add", entry: { name: newName, kind: newKind } }, "Added, hidden. Nobody sees it until you make it a rumor or reveal it.");
            if (ok) {
              setNewName("");
              setAdding(false);
            }
          }}
        >
          <select className="fld" value={newKind} onChange={(e) => setNewKind(e.target.value)} aria-label="Kind">
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <input className="fld" autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name, e.g. Old Hannet the smith" aria-label="Name" onKeyDown={(e) => e.key === "Escape" && setAdding(false)} />
          <button className="btn primary" type="submit" disabled={!newName.trim()}>
            Add (hidden)
          </button>
          <button className="btn ghost" type="button" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </form>
      ) : null}
      <div className="inline discovery-filters">
        <div className="tabs" role="tablist" aria-label="Kind">
          {(["all", ...kinds] as (EntryKind | "all")[]).map((k) => {
            const count = k === "all" ? all.length : all.filter((e) => e.kind === k).length;
            return (
              <button key={k} type="button" role="tab" aria-selected={kind === k} className={`btn small tab${kind === k ? " on" : ""}`} onClick={() => setKind(k)}>
                {k === "all" ? "All" : kindInfo(k).plural} <span className="note">{count}</span>
              </button>
            );
          })}
        </div>
        <input className="fld pg-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name" aria-label="Filter by name" />
        <span className="spacer" />
        <label className="check">
          <input type="checkbox" checked={tv} onChange={(e) => setTv(e.target.checked)} />
          Play stage changes on the TV
        </label>
        <label className="check" title="Phones show one slot per thing to find in each area, hidden ones too (as empty slots)">
          <input type="checkbox" checked={!!s.discoveryTotals} onChange={(e) => void run({ type: "discovery.totals", on: e.target.checked })} />
          Show how much is left to find
        </label>
      </div>
      <ol className="scene-list people-list">
        {list.map((e, i) => (
          <EntryRow key={e.id} entry={e} tv={tv} first={i === 0} last={i === list.length - 1} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />
        ))}
      </ol>
      {list.length === 0 ? <p className="pg-empty">{needle ? `Nothing called “${q.trim()}” here.` : "Nothing here yet."}</p> : null}
    </div>
  );
}

function EntryRow({ entry: e, tv, first, last, open, onToggle }: { entry: Entry; tv: boolean; first: boolean; last: boolean; open: boolean; onToggle: () => void }) {
  const { view, run, gated } = useDm();
  const s = view.state;
  const known = e.facts.filter((f) => f.revealedAt !== undefined).length;
  const notes = notesAbout(view.chronicle, entryTags(s, e)).length;
  const sc = e.sceneId ? s.scenes.find((x) => x.id === e.sceneId) : undefined;
  const sub = [e.nickname ? `“${e.nickname}”` : "", e.title ?? ""].filter(Boolean).join(" · ");
  // The shared world: someone at the table who knows this better than the table does.
  const aheadId = s.world ? presentIds(s).find((id) => STAGES.indexOf(stageFor(e, id)) > STAGES.indexOf(e.stage)) : undefined;
  const aheadP = aheadId ? s.players.find((p) => p.id === aheadId) : undefined;
  const ahead = aheadP ? penName(aheadP) : "";
  return (
    <li className={`scene-item list-row person-item stage-${e.stage}${open ? " selected" : ""}`}>
      <div className="scene-row">
        <Portrait art={sc?.art} gated={gated} name={e.name} kind={e.kind} silhouette={e.silhouette} rumored={!sc?.art?.url && !(sc?.art?.builtin && gated[sc.art.builtin]) && e.stage === "rumored"} className="person-face small" />
        <button type="button" className="row-main" onClick={onToggle} aria-expanded={open} title={`Edit ${e.name}`}>
          <span className="row-title">{e.name}</span>
          <span className="row-sub">
            {kindInfo(e.kind).label}
            {sub ? ` · ${sub}` : ""}
          </span>
        </button>
        <span className="row-meta">
          {e.facts.length ? (
            <span className="tag" title="Facts the party knows">
              {known}/{e.facts.length} facts
            </span>
          ) : null}
          {notes ? <span className="tag">{notes === 1 ? "1 note" : `${notes} notes`}</span> : null}
          {e.kind === "person" && (e.attitude !== undefined || e.relation) ? (
            <span className={`tag relation relation-${relationOf(e)}`} title="How they feel about the party">
              {bandInfo(relationOf(e)).label} {signed(partyScore(e))}
            </span>
          ) : null}
          {ahead ? <span className="tag" title="Someone at the table knows more than the rest: open it to tell the table">{ahead} knows more</span> : null}
        </span>
        <label className="stage-pick">
          <span className="sr-only">Stage of {e.name}</span>
          <select className={`fld stage-select stage-${e.stage}`} value={e.stage} onChange={(ev) => void run({ type: "entry.stage", entryId: e.id, stage: ev.target.value as Stage, announce: tv }, ev.target.value === "hidden" ? `${e.name} is hidden again.` : undefined)}>
            {STAGES.map((st) => (
              <option key={st} value={st}>
                {stageLabel(e.kind, st)}
              </option>
            ))}
          </select>
        </label>
        <ShowControls refName={entryRef(e)} label={e.name} title={isFound(e.stage) ? undefined : "Shows it and finds it"} />
        <RowMenu label={e.name}>
          <MenuItem disabled={e.stage === "hidden"} title="Play its card on the TV (New face, Rumor, a new fact)" onClick={() => run({ type: "entry.show", entryId: e.id }, "On the TV.")}>
            Announce on the TV
          </MenuItem>
          <MenuItem onClick={onToggle}>{open ? "Close the editor" : "Edit"}</MenuItem>
          <MenuItem disabled={first} onClick={() => run({ type: "entry.move", entryId: e.id, dir: -1 })}>
            Move up
          </MenuItem>
          <MenuItem disabled={last} onClick={() => run({ type: "entry.move", entryId: e.id, dir: 1 })}>
            Move down
          </MenuItem>
        </RowMenu>
      </div>
      {open ? (
        <Drawer title={e.name} subtitle={`${kindInfo(e.kind).label} · ${stageLabel(e.kind, e.stage)}`} onClose={onToggle}>
          <EntryEditor entry={e} tv={tv} />
        </Drawer>
      ) : null}
    </li>
  );
}

type Patch = { name?: string; kind?: string; slug?: string; title?: string; summary?: string; nickname?: string; hint?: string; sceneId?: string | null; pin?: { sceneId: string; pinId: string } | null; shopId?: string | null; templateId?: string | null; silhouette?: string | null; areas?: string[]; links?: string[]; relation?: Relation | null; start?: Stage; dmNote?: string; secrets?: string; wants?: string; knows?: string; voice?: string };

function EntryEditor({ entry: e, tv }: { entry: Entry; tv: boolean }) {
  const { view, run, call, ident, toast, gated } = useDm();
  const s = view.state;
  const patch = (p: Patch) => run({ type: "entry.update", entryId: e.id, patch: p });
  const others = entriesOf(s).filter((x) => x.id !== e.id);
  const [fact, setFact] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const tags = entryTags(s, e);
  const foundChapter = e.foundIn ? s.sessions.find((x) => x.id === e.foundIn)?.number : undefined;
  const sc = e.sceneId ? s.scenes.find((x) => x.id === e.sceneId) : undefined;
  const portraitSrc = artSrc(sc?.art, gated);
  const picFile = useRef<HTMLInputElement>(null);
  const setPicture = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadImage(ident, f);
      if (await run({ type: "entry.picture", entryId: e.id, art: { url } })) toast("Picture saved.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  };
  const players = s.players.filter((p) => !p.archived);

  const setSilhouette = async (blob: Blob) => {
    setBusy(true);
    try {
      const url = await uploadImage(ident, new File([blob], "silhouette.png", { type: blob.type || "image/png" }));
      await patch({ silhouette: url });
      toast("Silhouette saved.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="person-editor">
      {s.world ? <WhoKnows entry={e} tv={tv} /> : null}
      <div className="inline">
        <label>
          Kind
          <select className="fld" value={e.kind} onChange={(ev) => void patch({ kind: ev.target.value })}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <Field label="Real name" value={e.name} onCommit={(v) => (v.trim() ? patch({ name: v }) : false)} />
        <Field label="Title" value={e.title} placeholder="Keeper of the Flickering Candle" onCommit={(v) => patch({ title: v })} />
        <Field label="Run sheet name" value={e.slug} hint={`${e.kind}/${e.slug}`} onCommit={(v) => patch({ slug: v })} />
      </div>
      <Field label="Summary (players see this once found)" value={e.summary} multiline onCommit={(v) => patch({ summary: v.slice(0, SUMMARY_MAX) })} />

      {e.kind === "place" && (e.room || featureOn(s, "rooms")) ? <RoomFields entry={e} /> : null}

      <h4>While it&rsquo;s a rumor</h4>
      <div className="inline">
        <Field label="Nickname (empty: ???)" value={e.nickname} placeholder="The man with the lantern" onCommit={(v) => patch({ nickname: v })} />
        <Field label="Hint" value={e.hint} placeholder="Someone at the docks knows who he is" onCommit={(v) => patch({ hint: v })} />
      </div>

      <h4>Picture</h4>
      <div className="inline">
        <span className="silhouette-preview">
          <Portrait art={sc?.art} gated={gated} name={e.name} kind={e.kind} className="person-face" />
          <span className="note">{portraitSrc ? "Picture" : "No picture yet"}</span>
        </span>
        <button className="btn small" type="button" disabled={busy} onClick={() => picFile.current?.click()}>
          {portraitSrc ? "Replace picture" : "Upload a picture"}
        </button>
        {sc?.art?.url ? (
          <button className="btn small" type="button" onClick={() => run({ type: "entry.picture", entryId: e.id, art: {} })}>
            Remove picture
          </button>
        ) : null}
        <input ref={picFile} type="file" accept="image/*" hidden onChange={(ev) => void setPicture(ev.target.files?.[0])} />
        <span className="silhouette-preview">
          <Portrait name={e.name} kind={e.kind} silhouette={e.silhouette} rumored className="person-face" />
          <span className="note">{e.silhouette ? "Silhouette" : "Generic silhouette"}</span>
        </span>
        <button className="btn small" type="button" disabled={!portraitSrc || busy} onClick={async () => portraitSrc && setSilhouette(await makeSilhouette(portraitSrc).catch((err) => (toast(err.message), Promise.reject(err))))}>
          Make silhouette from portrait
        </button>
        <button className="btn small" type="button" disabled={busy} onClick={() => file.current?.click()}>
          Upload a silhouette
        </button>
        {e.silhouette ? (
          <button className="btn small" type="button" onClick={() => patch({ silhouette: null })}>
            Use the generic one
          </button>
        ) : null}
        <input ref={file} type="file" accept="image/*" hidden onChange={(ev) => ev.target.files?.[0] && void setSilhouette(ev.target.files[0])} />
      </div>

      <h4>Where and what it&rsquo;s tied to</h4>
      <div className="inline">
        <Field label="Areas (comma between)" value={e.areas.join(", ")} placeholder="The Docks, Old Town" onCommit={(v) => patch({ areas: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
        <label>
          Starts as (on a fresh start)
          <select className="fld" value={e.start ?? "hidden"} onChange={(ev) => void patch({ start: ev.target.value as Stage })}>
            {STAGES.map((st) => (
              <option key={st} value={st}>
                {stageLabel(e.kind, st)}
              </option>
            ))}
          </select>
        </label>
        {e.kind === "place" ? (
          <label>
            Its pin (shown, a ? seal, or hidden with the stage)
            <select
              className="fld"
              value={e.pin ? `${e.pin.sceneId}|${e.pin.pinId}` : ""}
              onChange={(ev) => {
                const [sceneId, pinId] = ev.target.value.split("|");
                void patch({ pin: pinId ? { sceneId, pinId } : null });
              }}
            >
              <option value="">No pin</option>
              {s.scenes
                .filter((x) => x.map)
                .flatMap((x) =>
                  x.map!.pins.map((p) => (
                    <option key={`${x.id}|${p.id}`} value={`${x.id}|${p.id}`}>
                      {x.label}: {p.name || `#${p.number}`}
                    </option>
                  )),
                )}
            </select>
          </label>
        ) : null}
        {e.kind === "place" ? (
          <PlaceSceneFields place={e} />
        ) : null}
        {e.kind === "shop" ? (
          <label>
            Its shop (opens when found)
            <select className="fld" value={e.shopId ?? ""} onChange={(ev) => void patch({ shopId: ev.target.value || null })}>
              {e.shopId ? null : <option value="">No storefront</option>}
              {s.shops.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {e.kind === "place" || s.jobsGate === e.id ? <JobsGateCheck entryId={e.id} name={e.name} /> : null}
        {e.kind === "monster" ? (
          <label>
            From the Monsters tab
            <select className="fld" value={e.templateId ?? ""} onChange={(ev) => void patch({ templateId: ev.target.value || null })}>
              <option value="">None</option>
              {(s.monsters ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <div className="entry-links">
        {e.links.map((id) => {
          const o = others.find((x) => x.id === id);
          return o ? (
            <span key={id} className="chron-tag">
              {o.name}{" "}
              <button type="button" className="linkish" aria-label={`Untie ${o.name}`} onClick={() => patch({ links: e.links.filter((x) => x !== id) })}>
                &times;
              </button>
            </span>
          ) : null;
        })}
        <select className="fld" value="" aria-label="Tie to" onChange={(ev) => ev.target.value && void patch({ links: [...e.links, ev.target.value] })}>
          <option value="">Tie to&hellip;</option>
          {others
            .filter((o) => !e.links.includes(o.id))
            .map((o) => (
              <option key={o.id} value={o.id}>
                {kindInfo(o.kind).label}: {o.name}
              </option>
            ))}
        </select>
        <span className="note">Players see a tie only when they can see both ends.</span>
      </div>

      {e.kind === "person" ? <AttitudeTracker entry={e} players={players} /> : null}

      <h4>Key facts</h4>
      <p className="note">Locked facts are only on your screen. Revealing one makes the entry Known: it shows on phones right away, and on the TV too if you pick that.</p>
      {e.facts.length ? (
        <ol className="person-fact-list">
          {e.facts.map((f, i) => {
            const shown = f.revealedAt !== undefined;
            return (
              <li key={f.id} className={shown ? "known" : "locked"}>
                <span className={`tag${shown ? "" : " wax"}`}>{shown ? "known" : "locked"}</span>
                <FactText entryId={e.id} factId={f.id} value={f.text} />
                <span className="note fact-ref" title="For the run sheet">
                  fact: {e.kind}/{e.slug}/{f.slug}
                </span>
                <span className="person-fact-actions">
                  {shown ? (
                    <>
                      <button className="btn small" type="button" onClick={() => run({ type: "entry.show", entryId: e.id, factId: f.id }, "On the TV.")}>
                        Show on TV
                      </button>
                      <button className="btn small" type="button" onClick={() => run({ type: "entry.factReveal", entryId: e.id, factId: f.id, revealed: false })}>
                        Lock again
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn small" type="button" onClick={() => run({ type: "entry.factReveal", entryId: e.id, factId: f.id, revealed: true }, isFound(e.stage) ? "Revealed on their phones." : `Revealed. ${e.name} is Known now.`)}>
                        Reveal
                      </button>
                      <button className="btn small primary" type="button" onClick={() => run({ type: "entry.factReveal", entryId: e.id, factId: f.id, revealed: true, tv: true }, "Revealed, and on the TV.")}>
                        Reveal on TV
                      </button>
                    </>
                  )}
                  <button className="btn small icon" type="button" aria-label="Move fact up" disabled={i === 0} onClick={() => run({ type: "entry.factMove", entryId: e.id, factId: f.id, dir: -1 })}>
                    <UpIcon />
                  </button>
                  <button className="btn small icon" type="button" aria-label="Move fact down" disabled={i === e.facts.length - 1} onClick={() => run({ type: "entry.factMove", entryId: e.id, factId: f.id, dir: 1 })}>
                    <DownIcon />
                  </button>
                  <button
                    className="btn small danger"
                    type="button"
                    onClick={() => {
                      void ask("Delete this fact?").then((ok) => {
                        if (ok) void run({ type: "entry.factRemove", entryId: e.id, factId: f.id });
                      });
                    }}
                  >
                    Delete
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="note">No facts yet.</p>
      )}
      <form
        className="inline"
        onSubmit={async (ev) => {
          ev.preventDefault();
          if (fact.trim() && (await run({ type: "entry.factAdd", entryId: e.id, text: fact }))) setFact("");
        }}
      >
        <label className="grow">
          New fact (starts locked)
          <input className="fld" value={fact} maxLength={FACT_MAX} onChange={(ev) => setFact(ev.target.value)} placeholder="Owes the baker money" />
        </label>
        <button className="btn" type="submit" disabled={!fact.trim()}>
          Add fact
        </button>
      </form>

      <div className="inline">
        <Field label={e.room ? "DM notes: the innkeeper's line when they take the key (only you)" : "DM notes (only you see this)"} value={e.dmNote} multiline onCommit={(v) => patch({ dmNote: v })} />
        <Field label={e.room ? "Secrets: the room's story hook (only you)" : "Secrets (only you see this)"} value={e.secrets} multiline onCommit={(v) => patch({ secrets: v })} />
        {e.kind === "person" ? (
          <>
            <Field label="Wants (only you see this)" value={e.wants ?? ""} multiline onCommit={(v) => patch({ wants: v })} />
            <Field label="Knows (only you see this)" value={e.knows ?? ""} multiline onCommit={(v) => patch({ knows: v })} />
            <Field label="Voice (only you see this)" value={e.voice ?? ""} placeholder="Slow and kind, never finishes a sentence" onCommit={(v) => patch({ voice: v })} />
          </>
        ) : null}
        {e.madeBy ? <p className="note">Drafted by {e.madeBy.label}, approved {new Date(e.madeBy.at).toLocaleDateString()}.</p> : null}
      </div>

      {isFound(e.stage) ? (
        <>
          <p className="note">
            {stageLabel(e.kind, "found")}
            {foundChapter ? ` in Chapter ${foundChapter}` : ""}
            {e.foundAt ? `, ${new Date(e.foundAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}.
          </p>
          <h4>Notes about {e.name}</h4>
          <PersonNotes view={view.chronicle} tags={tags} name={e.name} send={async (c) => (await call(c as never)).error} />
        </>
      ) : (
        <p className="note">{tv ? "Changing the stage plays it on the TV." : "Stage changes are quiet (TV is off above)."}</p>
      )}

      <button
        className="btn small danger"
        type="button"
        onClick={() => {
          void ask(e.shopId && s.shops.some((x) => x.id === e.shopId) ? `Delete ${e.name}? Its shop in Shops and all its items go too. Notes stay in the Chronicle.` : `Delete ${e.name}? Notes about it stay in the Chronicle.`).then((ok) => {
            if (ok) void run({ type: "entry.remove", entryId: e.id }, "Deleted.");
          });
        }}
      >
        Delete {e.name}
      </button>
    </div>
  );
}

function FactText({ entryId, factId, value }: { entryId: string; factId: string; value: string }) {
  const { run } = useDm();
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  if (!editing && v !== value) setV(value);
  return (
    <input
      className="fld person-fact-text"
      aria-label="Fact"
      value={v}
      maxLength={FACT_MAX}
      onFocus={() => setEditing(true)}
      onChange={(ev) => setV(ev.target.value)}
      onBlur={() => {
        setEditing(false);
        if (v.trim() && v.trim() !== value) void run({ type: "entry.factUpdate", entryId, factId, text: v });
        else setV(value);
      }}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") ev.currentTarget.blur();
      }}
    />
  );
}

/**
 * The shared world: who knows this entry and how well, and a character at the
 * table telling the others (the TV follows once everyone present knows).
 */
function WhoKnows({ entry: e, tv }: { entry: Entry; tv: boolean }) {
  const { view, run } = useDm();
  const s = view.state;
  const here = new Set(presentIds(s));
  const who = whoKnows(s, e);
  const name = (id: string) => {
    const p = s.players.find((x) => x.id === id);
    return p ? penName(p) : "someone";
  };
  // Tellers: people here who know it better than someone else here.
  const low = Math.min(...[...here].map((id) => STAGES.indexOf(stageFor(e, id))));
  const tellers = [...here].filter((id) => STAGES.indexOf(stageFor(e, id)) > low || e.facts.some((f) => f.knownBy?.[id] !== undefined && [...here].some((o) => f.knownBy?.[o] === undefined)));
  const [from, setFrom] = useState("");
  const [as, setAs] = useState<"rumored" | "found">("rumored");
  const teller = tellers.includes(from) ? from : tellers[0];
  const facts = teller ? e.facts.filter((f) => f.knownBy?.[teller] !== undefined) : [];
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <section className="who-knows" aria-label="Who knows">
      <div className="note">
        At this table: <b>{stageLabel(e.kind, e.stage)}</b>. The TV shows what everyone here knows.
      </div>
      <div className="who-knows-list">
        {who.length ? (
          who.map((w) => (
            <span key={w.id} className={`tag${here.has(w.id) ? " here" : ""}`} title={here.has(w.id) ? "At the table" : "Not at the table"}>
              {name(w.id)}: {STAGE_NAMES[w.stage]}
            </span>
          ))
        ) : (
          <span className="note">Nobody knows of {e.name} yet.</span>
        )}
      </div>
      {teller ? (
        <div className="tell-row">
          <select className="fld" aria-label="Who tells" value={teller} onChange={(ev) => setFrom(ev.target.value)}>
            {tellers.map((id) => (
              <option key={id} value={id}>
                {name(id)}
              </option>
            ))}
          </select>
          <span>tells the table, and they</span>
          <select className="fld" aria-label="How well" value={as} onChange={(ev) => setAs(ev.target.value as "rumored" | "found")}>
            <option value="rumored">hear of {e.kind === "person" ? "them" : "it"}</option>
            <option value="found">{e.kind === "person" ? "meet them" : "find it"}</option>
          </select>
          {facts.map((f) => (
            <label key={f.id} className="check" title={f.text}>
              <input type="checkbox" checked={picked.includes(f.id)} onChange={(ev) => setPicked(ev.target.checked ? [...picked, f.id] : picked.filter((x) => x !== f.id))} /> {f.text.length > 40 ? f.text.slice(0, 40) + "…" : f.text}
            </label>
          ))}
          <button className="btn small primary" type="button" onClick={() => run({ type: "entry.tell", entryId: e.id, playerId: teller, stage: as, factIds: picked, tv })}>
            Tell the table
          </button>
        </div>
      ) : null}
    </section>
  );
}

/** A place can be the notice board: jobs stay off phones and the TV until the party finds it. */
function JobsGateCheck({ entryId, name }: { entryId: string; name: string }) {
  const { view, run } = useDm();
  const gate = view.state.jobsGate;
  const on = gate === entryId;
  const other = !on && gate ? view.state.entries?.find((x) => x.id === gate) : undefined;
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={on}
        onChange={(ev) => void run({ type: "jobs.gate", entryId: ev.target.checked ? entryId : null }, ev.target.checked ? `Jobs now wait until the party finds ${name}.` : "Jobs show to players right away.")}
      />{" "}
      Finding this opens the Jobs tab{other ? <span className="note"> (instead of {other.name})</span> : null}
    </label>
  );
}
