import { useState } from "react";
import { dmLink, hrefFor } from "./api";
import { Notice } from "./ui/Notice";

/**
 * The front page, with no ?game=: start a new campaign, or join one with its code.
 * Starting one makes a new campaign and a DM key, and shows the DM's private link once.
 */
export function Home() {
  const [created, setCreated] = useState<{ game: string; key: string } | null>(null);
  if (created) return <SaveLink game={created.game} dmKey={created.key} />;
  return (
    <>
      <Notice title="Pull up a chair">
        <JoinForm />
        <StartForm onCreated={setCreated} />
      </Notice>
    </>
  );
}

function JoinForm() {
  const [code, setCode] = useState("");
  const clean = code.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "");
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (clean) window.location.href = hrefFor(clean);
      }}
    >
      <p>Joining a table? Enter the campaign code your DM gave you.</p>
      <label>
        Campaign code
        <input className="fld big" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={40} />
      </label>
      <button className="btn primary big" type="submit" disabled={!clean}>
        Join
      </button>
    </form>
  );
}

function StartForm({ onCreated }: { onCreated: (c: { game: string; key: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) {
    return (
      <p className="landing-links">
        <button className="btn" type="button" onClick={() => setOpen(true)}>
          I&rsquo;m a DM: start a new campaign
        </button>
      </p>
    );
  }
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
          const r = await fetch("/api/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...(name.trim() ? { name: name.trim() } : {}), ...(code.trim() ? { code: code.trim() } : {}) }),
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
      <h2>Start a campaign</h2>
      <p>You&rsquo;ll get a private DM link. Anyone with it can run this campaign, so keep it safe.</p>
      <label>
        Campaign name
        <input className="fld" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Tales from the Flickering Candle" />
      </label>
      <label>
        Campaign code (optional)
        <input className="fld" value={code} onChange={(e) => setCode(e.target.value)} maxLength={40} autoCapitalize="none" spellCheck={false} placeholder="Leave blank for a random one" />
      </label>
      {err ? <p className="error-text">{err}</p> : null}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Starting…" : "Start the campaign"}
      </button>
    </form>
  );
}

/** Shown once, right after a campaign is made: the DM link is the only way back in. */
function SaveLink({ game, dmKey }: { game: string; dmKey: string }) {
  const link = dmLink(game, dmKey);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <Notice title="Save your DM link">
      <p>
        This link opens the DM view of <b>{game}</b>. It&rsquo;s the only way in: there are no accounts and no password reset, so if you lose it, the campaign
        can&rsquo;t be run again. Save it somewhere safe, like your password manager or an email to yourself.
      </p>
      <p className="note" style={{ wordBreak: "break-all" }}>
        <code>{link}</code>
      </p>
      <div className="form">
        <button
          className="btn"
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
        <a className="btn" href={`mailto:?subject=${encodeURIComponent(`DM link for ${game}`)}&body=${encodeURIComponent(link)}`} onClick={() => setSaved(true)}>
          Email it to myself
        </a>
        <label className="check">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} /> I&rsquo;ve saved it
        </label>
        <a
          className={`btn primary${saved ? "" : " disabled"}`}
          aria-disabled={!saved}
          href={saved ? link : undefined}
          onClick={(e) => {
            if (!saved) e.preventDefault();
          }}
        >
          Open the DM view
        </a>
      </div>
      <p className="note">
        Players join at this site with the code <b>{game}</b>, or with the links in the DM view.
      </p>
    </Notice>
  );
}
