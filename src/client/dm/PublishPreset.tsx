"use client";

// "List in the library": share a preset this device saved, so any DM can
// browse it and start a campaign from it. Opt-in, one preset at a time. Only
// the setup goes (the same as the preset code gives); the author can take it
// out again, and the code keeps working either way.
import { useEffect, useState } from "react";
import { describeCounts } from "@/shared/presets";
import { libraryStatus, publishPreset, unpublishPreset, type DevicePreset, type LibraryListing, type PresetKind } from "../presets";
import { useDm } from "./context";
import { uploadImage } from "./upload";

export function PublishDialog({ preset, onClose, onChange }: { preset: DevicePreset; onClose: () => void; onChange: (listed: boolean) => void }) {
  const { ident, toast } = useDm();
  const [status, setStatus] = useState<{ listed: boolean; hidden: boolean; listing?: LibraryListing } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState(preset.name);
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<PresetKind>("one-shot");
  const [levels, setLevels] = useState("");
  const [length, setLength] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    libraryStatus(preset)
      .then((s) => {
        setStatus(s);
        const l = s.listing;
        if (l) {
          setTitle(l.title);
          setDescription(l.description);
          setKind(l.kind);
          setLevels(l.levels);
          setLength(l.length);
          setCover(l.cover ?? null);
        }
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [preset]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      setCover(await uploadImage(ident, file));
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!title.trim()) return toast("Give it a title.");
    setBusy(true);
    try {
      const l = await publishPreset(preset, { title, description, kind, levels, length, cover });
      setStatus({ listed: true, hidden: !!status?.hidden, listing: l });
      onChange(true);
      toast(status?.listed ? "Listing updated." : `“${l.title}” is in the library.`);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const unpublish = async () => {
    if (!confirm(`Take “${title}” out of the library? Its code keeps working for anyone who has it.`)) return;
    setBusy(true);
    try {
      await unpublishPreset(preset);
      onChange(false);
      toast("Taken out of the library.");
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inbox-backdrop" onClick={onClose}>
      <aside className="inbox-drawer wrapup publish-preset" role="dialog" aria-label="List in the library" onClick={(e) => e.stopPropagation()}>
        <div className="box-head">
          <h2>{status?.listed ? "In the library" : "List in the library"}</h2>
          <button type="button" className="btn small" onClick={onClose}>
            Close
          </button>
        </div>
        {err ? (
          <p className="error-text">{err}</p>
        ) : !status ? (
          <p className="note">Loading…</p>
        ) : (
          <>
            <p className="note">
              Any DM can find it in the <a href="/library" target="_blank" rel="noreferrer">preset library</a> and start a campaign from it. Only the setup goes, the same as sharing its code:
              no players, gold, ledger, sessions or Chronicle. You can take it out at any time.
            </p>
            {status.hidden ? <p className="error-text">The site owner hid this listing, so it isn&rsquo;t showing in the library. Its code still works.</p> : null}
            <label className="publish-field">
              Title
              <input className="fld" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
            </label>
            <label className="publish-field">
              What it&rsquo;s about
              <textarea className="fld" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} placeholder="A haunted lighthouse, a smuggler's debt and a storm that won't break." />
            </label>
            <fieldset className="publish-kind">
              <legend>It&rsquo;s a</legend>
              {(["one-shot", "campaign"] as const).map((k) => (
                <label key={k} className="check">
                  <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} /> {k === "one-shot" ? "One-shot" : "Campaign"}
                </label>
              ))}
            </fieldset>
            <div className="publish-row">
              <label className="publish-field">
                Levels
                <input className="fld" value={levels} onChange={(e) => setLevels(e.target.value)} maxLength={12} placeholder="1–3" />
              </label>
              <label className="publish-field">
                Length
                <input className="fld" value={length} onChange={(e) => setLength(e.target.value)} maxLength={30} placeholder="1 session" />
              </label>
            </div>
            <div className="publish-cover">
              {cover ? <img src={cover} alt="" /> : <span className="note">No cover picture (optional).</span>}
              <span className="inline">
                <label className="btn small">
                  {cover ? "Change cover" : "Add a cover"}
                  <input type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
                </label>
                {cover ? (
                  <button className="btn small" type="button" onClick={() => setCover(null)}>
                    Remove
                  </button>
                ) : null}
              </span>
            </div>
            {status.listing ? <p className="note">Inside: {describeCounts(status.listing.counts)}. &ldquo;Save over&rdquo; updates this.</p> : null}
            <div className="inline publish-actions">
              <button className="btn primary" type="button" disabled={busy || !title.trim()} onClick={() => void publish()}>
                {busy ? "Saving…" : status.listed ? "Update the listing" : "List it"}
              </button>
              {status.listed ? (
                <button className="btn danger" type="button" disabled={busy} onClick={() => void unpublish()}>
                  Take it out
                </button>
              ) : null}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
