import { authHeaders, type Ident } from "../api";

/** Save the whole campaign (game and ledger) to this computer. True when it worked. */
export async function downloadBackup(ident: Ident, toast: (m: string) => void): Promise<boolean> {
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
    return true;
  } catch (e) {
    toast(e instanceof Error ? e.message : String(e));
    return false;
  }
}
