import { useEffect, useState } from "react";
import { api } from "../api";
import { useDm } from "./context";
import {
  costLines,
  dollars,
  freeDayFit,
  PAID,
  PRICES_CHECKED,
  projectMonthly,
  ZERO_USAGE,
  type UsageReport,
} from "@/shared/hosting";

const SIZES = [10, 100, 1000, 10000];

const pct = (f: number) => (f === 0 ? "0%" : f < 0.0001 ? "<0.01%" : f < 0.01 ? `${(f * 100).toFixed(2)}%` : `${(f * 100).toFixed(1)}%`);

const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Settings: what this campaign uses of Cloudflare, priced at the Workers Paid
 * rates. Nobody pays this; it shows where the cost would go if the free tier
 * ran out.
 */
export function HostingCosts() {
  const { ident, toast } = useDm();
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<UsageReport | null | undefined>(undefined);
  const [month, setMonth] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState(100);
  const [pings, setPings] = useState(false);

  const load = async () => {
    try {
      setReport((await api<{ usage: UsageReport | null }>("/api/usage", ident)).usage);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shown = report ? (month ?? report.month) : null;
  const counts = report ? (report.months.find((m) => m.month === shown)?.counts ?? (shown === report.month ? report.thisMonth : ZERO_USAGE)) : ZERO_USAGE;
  const lines = report ? costLines(counts, report.storageBytes, report.imageBytes, pings) : [];
  const share = lines.reduce((s, l) => s + l.share, 0);
  const biggest = [...lines].sort((a, b) => b.share - a.share)[0];
  const projection = report ? projectMonthly(counts, report.storageBytes, report.imageBytes, campaigns, pings) : null;
  const fit = report?.busiestDay ? freeDayFit(report.busiestDay.counts, report.storageBytes) : null;

  return (
    <section className="box hosting-costs">
      <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary>
          <h3>Hosting costs</h3>
        </summary>
        <p className="note">
          What this campaign uses of Cloudflare, priced at the paid plan&rsquo;s rates. Nobody is charged: the site runs on the free tier. This is so you can see where the money would go if it
          ever had to be paid for.
        </p>
        {report === undefined ? (
          <p className="note">Loading…</p>
        ) : report === null ? (
          <p className="note">Usage isn&rsquo;t counted on this server. It is on the live site.</p>
        ) : (
          <>
            <div className="hc-head">
              {report.months.length > 1 ? (
                <div className="seg" role="group" aria-label="Month">
                  {report.months.slice(-4).map((m) => (
                    <button key={m.month} type="button" className={`btn small${shown === m.month ? " on" : ""}`} aria-pressed={shown === m.month} onClick={() => setMonth(m.month)}>
                      {monthName(m.month)}
                    </button>
                  ))}
                </div>
              ) : (
                <b>{monthName(report.month)}</b>
              )}
              <button className="btn small" type="button" onClick={() => void load()}>
                Refresh
              </button>
            </div>
            <div className="hc-stats">
              <div>
                <span className="hc-big">{dollars(share)}</span>
                <span className="note">this campaign&rsquo;s share of a bill{shown === report.month ? " so far" : ""}</span>
              </div>
              <div>
                <span className="hc-big">{biggest && biggest.share > 0 ? biggest.label : "Nothing yet"}</span>
                <span className="note">costs the most</span>
              </div>
              <div>
                <span className="hc-big">{fit && Number.isFinite(fit.campaigns) ? fit.campaigns.toLocaleString() : "—"}</span>
                <span className="note">{fit && Number.isFinite(fit.campaigns) ? `campaigns this busy fit on the free tier in a day (${fit.limit} run out first)` : "campaigns this busy fit on the free tier"}</span>
              </div>
            </div>
            <div className="hc-table-wrap">
              <table className="hc-table">
                <thead>
                  <tr>
                    <th scope="col">What</th>
                    <th scope="col">Used</th>
                    <th scope="col">Share</th>
                    <th scope="col" title={`Of what the $${PAID.base} plan includes each month`}>
                      Of included
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <th scope="row">{l.label}</th>
                      <td>{l.amount}</td>
                      <td>{dollars(l.share)}</td>
                      <td>{pct(l.ofIncluded)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">
              <b>Share</b> is this usage at the overage rate, as if nothing were included. <b>Of included</b> is how much of the paid plan&rsquo;s monthly allowance it uses. Saved data and images are
              what&rsquo;s held right now.
            </p>

            <h4 className="hc-sub">If the site had more campaigns like this one</h4>
            <div className="hc-head">
              <div className="seg" role="group" aria-label="Campaigns">
                {SIZES.map((n) => (
                  <button key={n} type="button" className={`btn small${campaigns === n ? " on" : ""}`} aria-pressed={campaigns === n} onClick={() => setCampaigns(n)}>
                    {n.toLocaleString()}
                  </button>
                ))}
              </div>
              <label className="hc-count">
                <input
                  type="number"
                  min={1}
                  max={1_000_000}
                  value={campaigns}
                  aria-label="Number of campaigns"
                  onChange={(e) => setCampaigns(Math.max(1, Math.min(1_000_000, Math.floor(Number(e.target.value) || 1))))}
                />
                campaigns
              </label>
            </div>
            {projection && (
              <p className="hc-projection">
                <span className="hc-big">{dollars(projection.total)}</span> a month on Workers Paid
                {projection.lines.length === 0 ? (
                  <span className="note"> (just the ${PAID.base} base: everything fits in what it includes)</span>
                ) : (
                  <span className="note">
                    {" "}
                    (${PAID.base} base, plus {projection.lines.slice(0, 3).map((l) => `${l.label.toLowerCase()} ${dollars(l.cost)}`).join(", ")}
                    {projection.lines.length > 3 ? ", and a little more" : ""})
                  </span>
                )}
              </p>
            )}
            <label className="check">
              <input type="checkbox" checked={pings} onChange={(e) => setPings(e.target.checked)} /> Count keep-alive pings as billed (worst case: Cloudflare doesn&rsquo;t say)
            </label>
            <p className="note hc-small">
              Counted by the campaign itself since {report.since ? new Date(`${report.since}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: "medium", timeZone: "UTC" }) : "today"}, by UTC day.
              Close, not exact: room awake time is estimated (about 30 ms each time it does something), the last few seconds before a room sleeps can go uncounted, and image downloads aren&rsquo;t counted
              (browsers keep them for a year, and reads are cheap). Page loads are free. Prices checked {PRICES_CHECKED} on{" "}
              <a href="https://developers.cloudflare.com/workers/platform/pricing/" target="_blank" rel="noreferrer">
                Workers
              </a>
              ,{" "}
              <a href="https://developers.cloudflare.com/durable-objects/platform/pricing/" target="_blank" rel="noreferrer">
                Durable Objects
              </a>{" "}
              and{" "}
              <a href="https://developers.cloudflare.com/r2/pricing/" target="_blank" rel="noreferrer">
                R2
              </a>
              .
            </p>
          </>
        )}
      </details>
    </section>
  );
}
