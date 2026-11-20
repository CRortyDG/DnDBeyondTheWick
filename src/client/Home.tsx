import { useEffect, useState, type ReactNode } from "react";
import { describeCounts } from "@/shared/presets";
import { PRESETS, type PresetId } from "@/shared/features";
import { devicePresets, presetInfo, type PresetInfo } from "./presets";
import { dmLink, hrefFor } from "./api";
import { CandleIcon } from "./ui/icons";

/** A DM-picked campaign code needs this many letters or numbers (the server checks too: limits.ts pickedCodeProblem). */
const PICKED_CODE_MIN = 8;

/**
 * The front page, with no ?game=: join a campaign with its code, or start one as the DM.
 * Starting one makes a new campaign and a DM key, and shows the DM's private link once.
 * Styles: landing-theme.css (html[data-view="landing"]).
 */
export function Home() {
  const [created, setCreated] = useState<{ game: string; key: string } | null>(null);
  const [starting, setStarting] = useState(false);
  if (created) {
    return (
      <HomeShell>
        <SaveLink game={created.game} dmKey={created.key} />
      </HomeShell>
    );
  }
  if (starting) {
    return (
      <HomeShell>
        <StartForm onCreated={setCreated} onBack={() => setStarting(false)} />
      </HomeShell>
    );
  }
  return (
    <HomeShell intro>
      <div className="hm-grid">
        <JoinCard />
        <DmCard onStart={() => setStarting(true)} />
      </div>
      <ol className="hm-steps" aria-label="How a game night works">
        <li>
          <b>1</b>
          <span>The DM starts a campaign and gets a private link.</span>
        </li>
        <li>
          <b>2</b>
          <span>A TV or laptop shows the table for everyone.</span>
        </li>
        <li>
          <b>3</b>
          <span>Players join on their phones with the code.</span>
        </li>
      </ol>
      <Tour />
    </HomeShell>
  );
}

/**
 * "See it at the table": what the app looks like before anyone commits to a campaign.
 * One fight from the Marrowmere starter on the TV, a player's phone and the DM's screen, plus the 1-minute demo.
 * Images and video live in public/tour/ (stills shot from a local Marrowmere campaign; video is the 60 s demo cut).
 */
function Tour() {
  return (
    <section className="hm-tour" aria-labelledby="hm-tour-title">
      <div className="hm-tour-head">
        <span className="hm-kicker">See it at the table</span>
        <h2 id="hm-tour-title">One fight, three screens</h2>
        <p>From The Bell under Marrowmere, the ready-to-run starter you can pick when you start a campaign.</p>
      </div>
      <div className="hm-tour-stage">
        <figure className="hm-shot hm-shot-tv">
          <img
            src="/tour/tv.webp"
            width={1440}
            height={810}
            loading="lazy"
            decoding="async"
            alt="The TV during a fight: the turn order across the top, Wren Ashby's turn in the middle with her hit points, and who is up next."
          />
        </figure>
        <figure className="hm-shot hm-shot-phone">
          <img
            src="/tour/phone.webp"
            width={600}
            height={1140}
            loading="lazy"
            decoding="async"
            alt="Wren's phone at the same moment: Your turn, her hit points, the turn order and an End my turn button."
          />
        </figure>
      </div>
      <ul className="hm-tour-points">
        <li>
          <b>On the TV</b>
          <span>Turn order, maps, handouts and dice the whole table watches land.</span>
        </li>
        <li>
          <b>On every phone</b>
          <span>Your turn, your hit points, your character sheet and your own dice.</span>
        </li>
        <li>
          <b>On the DM&rsquo;s screen</b>
          <span>Run the fight, the episode and the world, and choose what the TV shows.</span>
        </li>
      </ul>
      <div className="hm-tour-more">
        <figure className="hm-shot hm-shot-dm">
          <img
            src="/tour/dm.webp"
            width={1280}
            height={800}
            loading="lazy"
            decoding="async"
            alt="The DM's fight screen: every combatant's initiative, hit points and armour class, with damage, heal and conditions to the side."
          />
          <figcaption>The DM&rsquo;s side of the same fight.</figcaption>
        </figure>
        <figure className="hm-shot hm-shot-video">
          <video controls playsInline preload="none" poster="/tour/tour-poster.webp" width={1280} height={720}>
            <source src="/tour/tour.mp4" type="video/mp4" />
          </video>
          <figcaption>A whole game night in one minute (sound on).</figcaption>
        </figure>
      </div>
    </section>
  );
}

/** The page frame: the candle and name on top, the content below. Also used by the "Who's at the table?" page. */
export function HomeShell({ intro, children }: { intro?: boolean; children: ReactNode }) {
  return (
    <main className="hm-page">
      <header className={`hm-brand${intro ? " big" : ""}`}>
        <span className="hm-mark" aria-hidden="true">
          <CandleIcon size={intro ? 30 : 22} />
        </span>
        <span className="hm-name">Candlefair</span>
        {intro ? <p className="hm-tagline">A table companion for D&amp;D played in person: phones in hand, the world on the TV.</p> : null}
      </header>
      {children}
    </main>
  );
}

function JoinCard() {
  const [code, setCode] = useState("");
  const clean = code.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "");
  return (
    <section className="hm-card hm-join" aria-labelledby="hm-join-title">
      <div className="hm-card-head">
        <span className="hm-kicker">Players</span>
        <h1 id="hm-join-title">Join a table</h1>
        <p>Enter the campaign code your DM gave you.</p>
      </div>
      <form
        className="hm-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (clean) window.location.href = hrefFor(clean);
        }}
      >
        <label className="hm-field">
          <span className="hm-label">Campaign code</span>
          <input
            className="hm-input hm-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            maxLength={40}
            placeholder="e.g. misty-harbor-42"
          />
        </label>
        <button className="hm-btn primary" type="submit" disabled={!clean}>
          Join
        </button>
      </form>
    </section>
  );
}

/** Campaigns this device holds a DM key for, newest code last. Read from the slots readIdent saves. */
function deviceCampaigns(): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? "";
      const m = /^cf-key:([a-z0-9-]+):dm$/.exec(k);
      if (m && localStorage.getItem(k)) out.push(m[1]);
    }
  } catch {}
  return out.sort();
}

function DmCard({ onStart }: { onStart: () => void }) {
  const [mine] = useState(deviceCampaigns);
  return (
    <section className="hm-card hm-dm" aria-labelledby="hm-dm-title">
      <div className="hm-card-head">
        <span className="hm-kicker">Dungeon Master</span>
        <h2 id="hm-dm-title">Run a game</h2>
        <p>Start a campaign in a minute. No accounts: you get a private DM link instead.</p>
      </div>
      {mine.length ? (
        <div className="hm-mine">
          <span className="hm-label">Your campaigns on this device</span>
          <ul>
            {mine.map((g) => (
              <li key={g}>
                <a href={hrefFor(g, "DM")}>
                  <span className="hm-mine-code">{g}</span>
                  <span className="hm-mine-go">Open DM view</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button className={`hm-btn${mine.length ? "" : " primary"}`} type="button" onClick={onStart}>
        Start a new campaign
      </button>
    </section>
  );
}

function StartForm({ onCreated, onBack }: { onCreated: (c: { game: string; key: string }) => void; onBack: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // "blank", "marrowmere" (the premade starter), or a preset code.
  const [from, setFrom] = useState("blank");
  const [mine] = useState(devicePresets);
  // Which features it starts with. A saved preset keeps its own switches.
  const [features, setFeatures] = useState<PresetId>("standard");
  const pickFeatures = from === "blank" || from === "marrowmere";
  // The premade uses every feature, so it starts with them all; a blank campaign starts on Standard.
  useEffect(() => {
    if (from === "marrowmere") setFeatures("everything");
    else if (from === "blank") setFeatures("standard");
  }, [from]);
  const codeChars = code.trim().replace(/[^a-z0-9]/gi, "").length;
  const codeShort = code.trim() !== "" && codeChars < PICKED_CODE_MIN;
  return (
    <section className="hm-card hm-start" aria-labelledby="hm-start-title">
      <button className="hm-back" type="button" onClick={onBack}>
        <span aria-hidden="true">&larr;</span> Back
      </button>
      <div className="hm-card-head">
        <span className="hm-kicker">Dungeon Master</span>
        <h1 id="hm-start-title">Start a campaign</h1>
        <p>You&rsquo;ll get a private DM link. Anyone with it can run this campaign, so keep it safe.</p>
      </div>
      <form
        className="hm-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          try {
            const r = await fetch("/api/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                from: from === "blank" || from === "marrowmere" ? from : `preset:${from}`,
                ...(name.trim() ? { name: name.trim() } : {}),
                ...(code.trim() ? { code: code.trim() } : {}),
                ...(pickFeatures ? { features } : {}),
              }),
            });
            const data = (await r.json().catch(() => ({}))) as { game?: string; key?: string; error?: string };
            if (!r.ok || !data.game || !data.key) throw new Error(data.error ?? "Couldn't start the campaign. Try again.");
            onCreated({ game: data.game, key: data.key });
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : String(e2));
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="hm-field">
          <span className="hm-label">Campaign name</span>
          <input
            className="hm-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder={from === "marrowmere" ? "The Bell under Marrowmere" : "A new campaign"}
          />
        </label>
        <StartFrom from={from} onFrom={setFrom} mine={mine} />
        {pickFeatures ? (
          <fieldset className="hm-from hm-features">
            <legend className="hm-label">Features</legend>
            {PRESETS.map((p) => (
              <label className={`hm-opt${features === p.id ? " on" : ""}`} key={p.id}>
                <input type="radio" name="features" value={p.id} checked={features === p.id} onChange={() => setFeatures(p.id)} />
                <span className="hm-opt-text">
                  <b>{p.name}</b>
                  <span>{p.blurb}</span>
                </span>
              </label>
            ))}
            <span className="hm-hint">Change any of it later on the Features page.</span>
          </fieldset>
        ) : null}
        <details className="hm-more" open={code !== "" || undefined}>
          <summary>Pick your own campaign code</summary>
          <label className="hm-field">
            <span className="hm-label">Campaign code (optional)</span>
            <input
              className="hm-input hm-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={40}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Leave blank for a random one"
              aria-describedby="hm-code-hint"
            />
            <span id="hm-code-hint" className={`hm-hint${codeShort ? " warn" : ""}`}>
              {codeShort
                ? `${codeChars} of ${PICKED_CODE_MIN} letters or numbers: a code you pick needs ${PICKED_CODE_MIN}+ so it can’t be guessed.`
                : `Players type this to join. ${PICKED_CODE_MIN}+ letters or numbers; dashes are fine.`}
            </span>
          </label>
        </details>
        {err ? (
          <p className="hm-error" role="alert">
            {err}
          </p>
        ) : null}
        <button className="hm-btn primary" type="submit" disabled={busy || from === ""}>
          {busy ? "Starting…" : "Start the campaign"}
        </button>
      </form>
    </section>
  );
}

/**
 * What the campaign starts with: nothing (the default), the premade Marrowmere
 * setup, a preset this device saved, or a preset code someone gave you.
 */
function StartFrom({ from, onFrom, mine }: { from: string; onFrom: (f: string) => void; mine: { code: string; name: string }[] }) {
  const [typed, setTyped] = useState("");
  const [found, setFound] = useState<PresetInfo | null>(null);
  const [lookErr, setLookErr] = useState<string | null>(null);
  const clean = typed.trim().toLowerCase();
  const usingTyped = from !== "blank" && from !== "marrowmere" && !mine.some((p) => p.code === from);
  useEffect(() => {
    setFound(null);
    setLookErr(null);
    if (!/^[a-z0-9]{10}$/.test(clean)) return;
    let live = true;
    presetInfo(clean)
      .then((info) => live && setFound(info))
      .catch((e) => live && setLookErr(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [clean]);
  useEffect(() => {
    if (usingTyped) onFrom(found ? found.code : "");
  }, [found, usingTyped]);
  const option = (value: string, title: string, note: string) => (
    <label className={`hm-opt${from === value ? " on" : ""}`} key={value}>
      <input type="radio" name="from" value={value} checked={from === value} onChange={() => onFrom(value)} />
      <span className="hm-opt-text">
        <b>{title}</b>
        <span>{note}</span>
      </span>
    </label>
  );
  return (
    <fieldset className="hm-from">
      <legend className="hm-label">Start from</legend>
      {option("blank", "A blank campaign", "Nothing set up: no shops, people, maps or episodes. Build it your way.")}
      {option("marrowmere", "The Bell under Marrowmere", "A ready-to-run starter: a lake town on stilts, a missing bellringer, shops, a map, people to discover, monsters and the episode-one run sheet.")}
      {mine.map((p) => option(p.code, p.name, `Your preset · code ${p.code}`))}
      <label className={`hm-opt${usingTyped ? " on" : ""}`}>
        <input type="radio" name="from" checked={usingTyped} onChange={() => onFrom(found ? found.code : "")} />
        <span className="hm-opt-text">
          <b>A preset code</b>
          <span>Someone gave you one, or you saved it on another device.</span>
          {usingTyped ? (
            <>
              <input
                className="hm-input hm-code"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                maxLength={10}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="10 letters and numbers"
                aria-label="Preset code"
              />
              {found ? (
                <span className="hm-found">
                  <b>{found.name}</b>: {describeCounts(found.counts)}.
                </span>
              ) : lookErr ? (
                <span className="hm-error">{lookErr}</span>
              ) : null}
            </>
          ) : null}
        </span>
      </label>
    </fieldset>
  );
}

/** Shown once, right after a campaign is made: the DM link is the only way back in. */
function SaveLink({ game, dmKey }: { game: string; dmKey: string }) {
  const link = dmLink(game, dmKey);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <section className="hm-card hm-save" aria-labelledby="hm-save-title">
      <div className="hm-card-head">
        <span className="hm-kicker ok">Campaign ready</span>
        <h1 id="hm-save-title">Save your DM link</h1>
        <p>
          It&rsquo;s the only way into the DM view: there are no accounts and no password reset. Keep it in your password manager or email it to yourself.
        </p>
      </div>
      <div className="hm-link">
        <code>{link}</code>
      </div>
      <div className="hm-row">
        <button
          className="hm-btn"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
              setSaved(true);
            } catch {}
          }}
        >
          {copied ? "Copied" : "Copy the link"}
        </button>
        <a className="hm-btn" href={`mailto:?subject=${encodeURIComponent(`DM link for ${game}`)}&body=${encodeURIComponent(link)}`} onClick={() => setSaved(true)}>
          Email it to myself
        </a>
      </div>
      <label className="hm-check">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I&rsquo;ve saved it somewhere safe
      </label>
      <a
        className={`hm-btn primary${saved ? "" : " disabled"}`}
        aria-disabled={!saved}
        href={saved ? link : undefined}
        onClick={(e) => {
          if (!saved) e.preventDefault();
        }}
      >
        Open the DM view
      </a>
      <p className="hm-foot">
        Players join on this site with the code <b className="hm-pill">{game}</b>
      </p>
    </section>
  );
}
