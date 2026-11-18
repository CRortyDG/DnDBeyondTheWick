"use client";

import { useMemo, useState } from "react";
import type { DmCommand } from "@/shared/commands";
import type { DmPlayer } from "@/shared/projection";
import {
  ITEM_KIND_NAME,
  ITEM_KINDS,
  ITEM_NAME_MAX,
  ITEM_NOTE_MAX,
  type ItemKindSheet,
} from "@/shared/sheetGear";
import { moveText, stashOf, type StashItem } from "@/shared/stash";
import { partiesOf, worldOn } from "@/shared/world";
import { useDm } from "./context";
import { PageHead } from "./PageHead";
import { MenuItem, RowMenu } from "./RowMenu";
import { Switch } from "./FeaturesPanel";
import { PlusIcon } from "./navIcons";

const who = (p: Pick<DmPlayer, "name" | "character">) =>
  p.character?.trim() || p.name;

/** Send a stash command and show what the server said (or the error). */
function useStashRun() {
  const { call, toast } = useDm();
  return async (cmd: DmCommand, fallback = "Done.") => {
    const r = await call(cmd);
    toast(r.error ?? r.info ?? fallback);
    return !r.error;
  };
}

/** The DM's stash page: what nobody has claimed yet, who'd like it, and handing it out. */
export function StashPanel() {
  const { view } = useDm();
  const s = view.state;
  const go = useStashRun();
  const world = worldOn(s);
  const parties = partiesOf(s);
  const [party, setParty] = useState<string>(
    world && s.partyId ? s.partyId : "",
  );
  const [adding, setAdding] = useState(false);
  const all = stashOf(s);
  const list = party
    ? all.filter((x) => x.partyId === party || !x.partyId)
    : all;
  const asked = list.filter((x) => x.wants?.length).length;
  const log = (s.stashLog ?? []).slice(-12).reverse();

  return (
    <div className="stash-panel pg">
      <PageHead
        title="Party stash"
        sub="Loot nobody has claimed yet. Players see it on their phones and say what they'd like; you hand it out."
        help={
          <>
            <p>
              Things go in from a fight&rsquo;s loot step (any line you
              don&rsquo;t give to someone), or by hand here. Handing something
              out puts it in that character&rsquo;s inventory, next to what they
              bought in shops.
            </p>
            <p>
              A player who keeps no sheet in the app gets theirs at the table:
              it leaves the stash, and the log says who has it.
            </p>
            {world ? (
              <p>
                In a shared world each party has its own stash. Phones only see
                their own parties&rsquo; things.
              </p>
            ) : null}
          </>
        }
        actions={
          <button
            className="btn primary"
            type="button"
            onClick={() => setAdding((a) => !a)}
            aria-expanded={adding}
          >
            <PlusIcon size={16} /> Add things
          </button>
        }
        stats={[
          { label: "In the stash", value: list.length },
          ...(asked
            ? [{ label: "Asked for", value: asked, tone: "gold" as const }]
            : []),
        ]}
      />

      {adding ? (
        <AddForm partyId={party || undefined} onDone={() => setAdding(false)} />
      ) : null}

      <div className="pg-toolbar">
        <span className="stash-switch">
          <Switch
            on={!!s.stashTake}
            label="Players can take things themselves"
            onChange={(v) =>
              go(
                { type: "stash.settings", take: v },
                v
                  ? "Players can take things from the stash."
                  : "Players ask; you hand things out.",
              )
            }
          />
          <span>Players can take things themselves</span>
        </span>
        <span className="grow" />
        {world ? (
          <label className="pg-toolbar-field">
            Party
            <select
              className="fld"
              value={party}
              onChange={(e) => setParty(e.target.value)}
            >
              <option value="">Every party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <ol className="scene-list pg-list stash-list">
        {list.map((it) => (
          <StashRow key={it.id} it={it} />
        ))}
        {list.length === 0 ? (
          <li className="pg-empty">
            The stash is empty. At the end of a fight, loot you don&rsquo;t give
            to anyone waits here.
          </li>
        ) : null}
      </ol>

      {log.length ? (
        <section className="box stash-log" aria-label="Stash log">
          <div className="box-head">
            <h3>Lately</h3>
            <button
              className="btn small ghost"
              type="button"
              onClick={() => go({ type: "stash.clearLog" }, "Cleared.")}
            >
              Clear
            </button>
          </div>
          <ul>
            {log.map((m, i) => (
              <li key={`${m.at}-${i}`}>
                {moveText(s, m)}
                <span className="note">
                  {" "}
                  ·{" "}
                  {new Date(m.at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function AddForm({
  partyId,
  onDone,
}: {
  partyId?: string;
  onDone: () => void;
}) {
  const go = useStashRun();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [kind, setKind] = useState<"" | ItemKindSheet>("");
  const [note, setNote] = useState("");
  const n = Math.max(1, Math.min(999, Math.floor(Number(qty) || 1)));
  return (
    <form
      className="pg-inline-form stash-add"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (
          await go({
            type: "stash.add",
            items: [
              {
                name: name.trim(),
                qty: n,
                ...(kind ? { kind } : {}),
                ...(note.trim() ? { note: note.trim() } : {}),
              },
            ],
            ...(partyId ? { partyId } : {}),
          })
        ) {
          setName("");
          setQty("1");
          setNote("");
          setKind("");
        }
      }}
    >
      <input
        className="fld"
        autoFocus
        value={name}
        maxLength={ITEM_NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        placeholder="What is it? (Longsword, Potion of Healing)"
        aria-label="Item name"
        onKeyDown={(e) => e.key === "Escape" && onDone()}
      />
      <input
        className="fld stash-qty"
        inputMode="numeric"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        aria-label="How many"
      />
      <select
        className="fld"
        value={kind}
        onChange={(e) => setKind(e.target.value as "" | ItemKindSheet)}
        aria-label="Kind"
      >
        <option value="">Kind: from the name</option>
        {ITEM_KINDS.map((k) => (
          <option key={k} value={k}>
            {ITEM_KIND_NAME[k]}
          </option>
        ))}
      </select>
      <input
        className="fld"
        value={note}
        maxLength={ITEM_NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note players see (optional)"
        aria-label="Note"
      />
      <button className="btn primary" type="submit" disabled={!name.trim()}>
        Add
      </button>
      <button className="btn ghost" type="button" onClick={onDone}>
        Done
      </button>
    </form>
  );
}

function StashRow({ it }: { it: StashItem }) {
  const { view } = useDm();
  const s = view.state;
  const go = useStashRun();
  const players = useMemo(
    () => s.players.filter((p) => !p.archived) as DmPlayer[],
    [s.players],
  );
  const present = players.filter((p) => !p.away);
  const wanters = (it.wants ?? [])
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is DmPlayer => !!p);
  const [to, setTo] = useState<string>("");
  const [qty, setQty] = useState("1");
  const [editing, setEditing] = useState(false);
  const target = to || wanters[0]?.id || "";
  const n = Math.max(1, Math.min(it.qty, Math.floor(Number(qty) || 1)));
  const party = it.partyId
    ? partiesOf(s).find((p) => p.id === it.partyId)
    : undefined;
  const sub = [
    ITEM_KIND_NAME[it.kind] + (it.attune ? " (attunement)" : ""),
    it.source ? `from ${it.source}` : "added by you",
    party ? party.name : "",
    it.note ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
  const give = async (pid: string, q: number) => {
    if (
      await go({ type: "stash.give", stashId: it.id, playerId: pid, qty: q })
    ) {
      setTo("");
      setQty("1");
    }
  };
  return (
    <li className="scene-item list-row stash-row">
      <div className="scene-row">
        <span className="stash-qty-badge" aria-label={`${it.qty} of them`}>
          ×{it.qty}
        </span>
        <span className="row-main">
          <span className="row-title">{it.name}</span>
          <span className="row-sub">{sub}</span>
        </span>
        <span className="row-meta">
          {wanters.map((p) => (
            <button
              key={p.id}
              type="button"
              className="tag stash-want"
              title={`Give one to ${who(p)}`}
              onClick={() => void give(p.id, 1)}
            >
              {who(p)} wants it
            </button>
          ))}
        </span>
        <RowMenu label={it.name}>
          <MenuItem onClick={() => setEditing((e) => !e)}>Edit</MenuItem>
          {it.qty > 1 && present.length > 1 ? (
            <MenuItem
              onClick={() =>
                go({
                  type: "stash.split",
                  stashId: it.id,
                  playerIds: present.map((p) => p.id),
                })
              }
            >
              Split evenly ({present.length} at the table)
            </MenuItem>
          ) : null}
          {worldOn(s)
            ? partiesOf(s)
                .filter((p) => p.id !== it.partyId)
                .map((p) => (
                  <MenuItem
                    key={p.id}
                    onClick={() =>
                      go(
                        {
                          type: "stash.edit",
                          stashId: it.id,
                          patch: { partyId: p.id },
                        },
                        `Moved to ${p.name}'s stash.`,
                      )
                    }
                  >
                    Move to {p.name}
                  </MenuItem>
                ))
            : null}
          <MenuItem
            danger
            onClick={() =>
              go(
                { type: "stash.remove", stashId: it.id },
                `${it.name} is out of the stash.`,
              )
            }
          >
            Take out of the stash
          </MenuItem>
        </RowMenu>
      </div>
      <div className="stash-give">
        <span>Give</span>
        {it.qty > 1 ? (
          <input
            className="fld stash-qty"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            aria-label="How many to give"
          />
        ) : null}
        <span>to</span>
        <select
          className="fld"
          value={target}
          onChange={(e) => setTo(e.target.value)}
          aria-label={`Give ${it.name} to`}
        >
          <option value="">Pick a character</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {who(p)}
              {p.sheet && !p.sheetOff ? "" : " (no sheet: at the table)"}
              {p.away ? " · away" : ""}
            </option>
          ))}
        </select>
        <button
          className="btn small primary"
          type="button"
          disabled={!target}
          onClick={() => void give(target, n)}
        >
          Give
        </button>
      </div>
      {editing ? <EditItem it={it} onDone={() => setEditing(false)} /> : null}
    </li>
  );
}

function EditItem({ it, onDone }: { it: StashItem; onDone: () => void }) {
  const go = useStashRun();
  const [name, setName] = useState(it.name);
  const [qty, setQty] = useState(String(it.qty));
  const [kind, setKind] = useState<ItemKindSheet>(it.kind);
  const [attune, setAttune] = useState(!!it.attune);
  const [note, setNote] = useState(it.note ?? "");
  return (
    <form
      className="pg-inline-form stash-edit"
      onSubmit={async (e) => {
        e.preventDefault();
        const patch: Extract<DmCommand, { type: "stash.edit" }>["patch"] = {};
        if (name.trim() && name.trim() !== it.name) patch.name = name.trim();
        const q = Math.floor(Number(qty));
        if (q >= 1 && q <= 999 && q !== it.qty) patch.qty = q;
        if (kind !== it.kind) patch.kind = kind;
        if (attune !== !!it.attune) patch.attune = attune;
        if (note.trim() !== (it.note ?? "")) patch.note = note;
        if (
          !Object.keys(patch).length ||
          (await go({ type: "stash.edit", stashId: it.id, patch }, "Saved."))
        )
          onDone();
      }}
    >
      <input
        className="fld"
        value={name}
        maxLength={ITEM_NAME_MAX}
        onChange={(e) => setName(e.target.value)}
        aria-label="Name"
      />
      <input
        className="fld stash-qty"
        inputMode="numeric"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        aria-label="How many"
      />
      <select
        className="fld"
        value={kind}
        onChange={(e) => setKind(e.target.value as ItemKindSheet)}
        aria-label="Kind"
      >
        {ITEM_KINDS.map((k) => (
          <option key={k} value={k}>
            {ITEM_KIND_NAME[k]}
          </option>
        ))}
      </select>
      {kind === "magic" ? (
        <label className="check">
          <input
            type="checkbox"
            checked={attune}
            onChange={(e) => setAttune(e.target.checked)}
          />{" "}
          Needs attunement
        </label>
      ) : null}
      <input
        className="fld"
        value={note}
        maxLength={ITEM_NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note players see"
        aria-label="Note"
      />
      <button className="btn primary small" type="submit">
        Save
      </button>
      <button className="btn ghost small" type="button" onClick={onDone}>
        Cancel
      </button>
    </form>
  );
}
