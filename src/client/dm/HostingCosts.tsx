import { useEffect, useState } from "react";
import { api } from "../api";
import { useDm } from "./context";
import {
  costLines,
  dollars,
  freeDayFit,
  freeDayLines,
  nextUtcMidnight,
  nextUtcMonth,
  PAID,
  PRICES_CHECKED,
  projectMonthly,
  ZERO_USAGE,
  type UsageReport,
} from "@/shared/hosting";

const SIZES = [10, 100, 1000, 10000];

const pct = (f: number) => (f === 0 ? "0%" : f < 0.0001 ? "<0.01%" : f < 0.01 ? `${(f * 100).toFixed(2)}%` : `${(f * 100).toFixed(1)}%`);

/** "8:00 PM" today, or "Tue 8:00 PM" when it's another day where the DM is. */
const localTime = (t: number) => {
  const d = new Date(t);
  const sameDay = d.toDateString() === new Date().toDateString();
  return d.toLocaleString(undefined, sameDay ? { hour: "numeric", minute: "2-digit" } : { weekday: "short", hour: "numeric", minute: "2-digit" });
};

const dayName = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

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
  /** "today" (against the free tier's daily limits) or a UTC month (against the paid plan's monthly allowance). */
  const [month, setMonth] = useState<string>("today");
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

  const isToday = month === "today";
  const shown = report ? (isToday ? report.month : month) : null;
  const shownMonth = report?.months.find((m) => m.month === shown);
  const counts = report ? (shownMonth?.counts ?? (shown === report.month ? report.thisMonth : ZERO_USAGE)) : ZERO_USAGE;
  const lines = report ? costLines(counts, report.storageBytes, report.imageBytes, pings) : [];
  const share = lines.reduce((s, l) => s + l.share, 0);
  const biggest = [...lines].sort((a, b) => b.share - a.share)[0];
  const projection = report ? projectMonthly(counts, report.storageBytes, report.imageBytes, campaigns, pings) : null;
  // The free tier's limits are per day: check them against one day, never the month's running total.
  const busy = report ? (shown === report.month ? report.busiestDay : (shownMonth?.busiestDay ?? null)) : null;
  const fit = busy && report ? freeDayFit(busy.counts, report.storageBytes) : null;
  const todayLines = report ? freeDayLines(report.todayCounts, report.storageBytes) : [];
  const tightest = [...todayLines].sort((a, b) => b.used - a.used)[0];
  const todayFit = report ? freeDayFit(report.todayCounts, report.storageBytes) : null;
  const now = Date.now();

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
              <div className="seg" role="group" aria-label="Period">
                <button type="button" className={`btn small${isToday ? " on" : ""}`} aria-pressed={isToday} onClick={() => setMonth("today")}>
                  Today
                </button>
                {(report.months.length ? report.months : [{ month: report.month }]).slice(-4).map((m) => (
                  <button key={m.month} type="button" className={`btn small${!isToday && shown === m.month ? " on" : ""}`} aria-pressed={!isToday && shown === m.month} onClick={() => setMonth(m.month)}>
                    {monthName(m.month)}
                  </button>
                ))}
              </div>
              <button className="btn small" type="button" onClick={() => void load()}>
                Refresh
              </button>
            </div>
            {isToday ? (
              <>
                <div className="hc-stats">
                  <div>
                    <span className="hc-big">{tightest ? pct(tightest.used) : "0%"}</span>
                    <span className="note">of the free tier&rsquo;s daily {tightest && tightest.used > 0 ? `${tightest.label.toLowerCase()} ` : ""}limit used today by this campaign</span>
                  </div>
                  <div>
                    <span className="hc-big">{localTime(nextUtcMidnight(now))}</span>
                    <span className="note">when the daily limits start over (midnight UTC)</span>
                  </div>
                  <div>
                    <span className="hc-big">{todayFit && Number.isFinite(todayFit.campaigns) ? todayFit.campaigns.toLocaleString() : "—"}</span>
                    <span className="note">{todayFit && Number.isFinite(todayFit.campaigns) ? `campaigns as busy as this one today fit on the free tier (${todayFit.limit} run out first)` : "campaigns this busy fit on the free tier"}</span>
                  </div>
                </div>
                <div className="hc-table-wrap">
                  <table className="hc-table">
                    <thead>
                      <tr>
                        <th scope="col">What</th>
                        <th scope="col">Used today</th>
                        <th scope="col">Free tier</th>
                        <th scope="col">Of the limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayLines.map((l) => (
                        <tr key={l.id}>
                          <th scope="row">{l.label}</th>
                          <td>{l.amount}</td>
                          <td>{l.limit}</td>
                          <td>{pct(l.used)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="note">
                  Only today&rsquo;s use (UTC day {dayName(report.today)}) counts against the free tier&rsquo;s daily limits, and they start over at midnight UTC. The limits are shared by every campaign on
                  the site. Saved game data is the one total that doesn&rsquo;t reset. Pick a month for what it would cost on the paid plan.
                </p>
              </>
            ) : (
              <>
                <div className="hc-stats">
                  <div>
                    <span className="hc-big">{dollars(share)}</span>
                    <span className="note">
                      this campaign&rsquo;s share of a bill{shown === report.month ? ` so far (the month starts over ${new Date(nextUtcMonth(now)).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })})` : ""}
                    </span>
                  </div>
                  <div>
                    <span className="hc-big">{biggest && biggest.share > 0 ? biggest.label : "Nothing yet"}</span>
                    <span className="note">costs the most</span>
                  </div>
                  <div>
                    <span className="hc-big">{fit && Number.isFinite(fit.campaigns) ? fit.campaigns.toLocaleString() : "—"}</span>
                    <span className="note">{fit && Number.isFinite(fit.campaigns) && busy
                        ? `campaigns as busy as its busiest day (${dayName(busy.day)}) fit on the free tier in a day (${fit.limit} run out first)`
                        : "campaigns this busy fit on the free tier"}</span>
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
                  <b>Share</b> is this usage at the overage rate, as if nothing were included. <b>Of included</b> is how much of the paid plan&rsquo;s monthly allowance the month so far uses. Saved data and images are
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
              </>
            )}
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
