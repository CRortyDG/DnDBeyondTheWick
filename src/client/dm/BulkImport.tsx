"use client";

// Paste several monsters, Discovery entries or shop items at once. The same box
// as the episode importer: an example in the placeholder, a live preview of
// what will be made (and what each is called in run sheets), problems flagged
// by line, then one Import that adds them all or nothing.
import { useMemo, useState } from "react";
import { IMPORT_EXAMPLES, IMPORT_MAX, parseEntries, parseItems, parseMonsters, readyCount, type ImportKind, type ImportPlan } from "@/shared/bulkImport";
import { formatCp } from "@/shared/money";
import type { DmCommand } from "@/shared/commands";
import { useDm } from "./context";

const WORDS: Record<ImportKind, { one: string; many: string; refLabel: string; fields: string }> = {
  monsters: {
    one: "monster",
    many: "monsters",
    refLabel: "Name in fight: lines",
    fields: "tv · ac · hp (7 or 2d6) · init · speed · attack: Name | +4 | 1d6+2 · ability: Name | text (add “(recharge 5)”, “(1/day)” or “(on death)” to the name) · resist · immune · notes · dm. Stat-block lines like “Armor Class 15 (leather armor)” and “Hit Points 7 (2d6)” work too.",
  },
  entries: {
    one: "Discovery entry",
    many: "Discovery entries",
    refLabel: "Run sheet name",
    fields: "## kind: Name (person, place, faction, mystery or item) · title · summary · rumor: nickname | hint · hint · start: hidden, rumored, found or known · area (commas for several) · fact (one per line) · secret · dm.",
  },
  items: {
    one: "item",
    many: "items",
    refLabel: "Shop",
    fields: "shop (or a “# Shop name” line above several) · category (gear, healing, magic, travel, services, building, trophies) · kind (purchase, recurring, service, order, training, project, earned) · price or goal (50 gp, 5 sp) · description · availability (sale, locked, rumored, hidden) · stock · reason · hint · dm.",
  },
};

export function BulkImport({ kind, defaultShop, onDone }: { kind: ImportKind; defaultShop?: string; onDone: () => void }) {
  const { view, run } = useDm();
  const s = view.state;
  const [text, setText] = useState("");
  const w = WORDS[kind];
  const plan: ImportPlan<unknown> | null = useMemo(() => {
    if (!text.trim()) return null;
    if (kind === "monsters") return parseMonsters(text, s.monsters ?? []);
    if (kind === "entries") return parseEntries(text, s.entries ?? []);
    return parseItems(text, s.shops, s.items, defaultShop);
  }, [text, kind, s.monsters, s.entries, s.shops, s.items, defaultShop]);
  const ready = plan ? readyCount(plan) : 0;

  const go = async () => {
    if (!plan || !ready) return;
    const bodies = plan.rows.flatMap((r) => (r.body ? [r.body] : []));
    const cmd = { type: "import.bulk", [kind]: bodies } as unknown as DmCommand;
    if (await run(cmd, `Imported ${ready} ${ready === 1 ? w.one : w.many}.`)) onDone();
  };

  return (
    <div className="import-box bulk-import">
      <label className="form">
        Paste {w.many}: one per &ldquo;##&rdquo;
        <textarea className="fld mono" rows={12} value={text} placeholder={IMPORT_EXAMPLES[kind]} onChange={(e) => setText(e.target.value)} />
      </label>
      <p className="note">
        Lines: {w.fields} Anything else is kept as a note, so nothing pasted is lost. Up to {IMPORT_MAX} at a time.
        {kind === "items" && defaultShop ? ` Items that don't name a shop go in ${defaultShop}.` : ""}
      </p>
      {plan ? (
        <div className="import-preview">
          <p>
            <b>
              {ready} {ready === 1 ? w.one : w.many}
            </b>{" "}
            ready to import
            {plan.rows.length > ready ? `, ${plan.rows.length - ready} skipped` : ""}.
            {plan.newShops.length ? ` New shop${plan.newShops.length === 1 ? "" : "s"}, hidden until you open ${plan.newShops.length === 1 ? "it" : "them"}: ${plan.newShops.join(", ")}.` : ""}
          </p>
          {plan.rows.length ? (
            <table className="bulk-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Name</th>
                  <th>{w.refLabel}</th>
                  <th>What it gets</th>
                </tr>
              </thead>
              <tbody>
                {plan.rows.map((r) => (
                  <tr key={r.line} className={r.errors.length ? "bad" : r.duplicate ? "skip" : "ok"}>
                    <td>{r.line}</td>
                    <td>{r.name || "?"}</td>
                    <td>
                      <code className="ref-code">{r.ref}</code>
                    </td>
                    <td>
                      {r.errors.length ? (
                        <ul className="bulk-errors">
                          {r.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      ) : r.duplicate ? (
                        <span className="note">Already there, skipped.</span>
                      ) : (
                        <Summary kind={kind} body={r.body} />
                      )}
                      {r.warnings.length && !r.duplicate ? (
                        <ul className="import-warnings">
                          {r.warnings.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="note">No &ldquo;## Name&rdquo; headings yet: each {w.one} starts with one.</p>
          )}
          {plan.stray.length ? (
            <ul className="import-warnings">
              {plan.stray.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : null}
          <div className="inline">
            <button className="btn primary" type="button" disabled={!ready} onClick={() => void go()}>
              Import {ready} {ready === 1 ? w.one : w.many}
            </button>
            <button className="btn" type="button" onClick={onDone}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Summary({ kind, body }: { kind: ImportKind; body: unknown }) {
  if (kind === "monsters") {
    const m = body as import("@/shared/bulkImport").MonsterBody;
    const bits = [`AC ${m.ac}`, `HP ${m.hp}`, `init ${m.initBonus >= 0 ? "+" : ""}${m.initBonus}`, m.attacks.length ? `${m.attacks.length} attack${m.attacks.length === 1 ? "" : "s"}` : "", m.abilities.length ? `${m.abilities.length} abilit${m.abilities.length === 1 ? "y" : "ies"}` : "", m.displayName ? `TV: “${m.displayName}”` : ""];
    return <span>{bits.filter(Boolean).join(" · ")}</span>;
  }
  if (kind === "entries") {
    const e = body as import("@/shared/bulkImport").EntryBody;
    const bits = [e.entry.kind, e.entry.start && e.entry.start !== "hidden" ? `starts ${e.entry.start}` : "starts hidden", e.entry.title, e.facts.length ? `${e.facts.length} fact${e.facts.length === 1 ? "" : "s"}` : "", e.entry.secrets ? "secret" : ""];
    return <span>{bits.filter(Boolean).join(" · ")}</span>;
  }
  const it = (body as import("@/shared/bulkImport").ItemBody).item;
  const bits = [it.kind === "earned" ? "earned" : `${it.kind === "project" ? "goal " : ""}${formatCp(it.priceCp)}`, it.category, it.kind, it.tier, it.stock !== undefined && it.stock !== null ? `${it.stock} in stock` : ""];
  return <span>{bits.filter(Boolean).join(" · ")}</span>;
}
