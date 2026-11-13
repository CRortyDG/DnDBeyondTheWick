// Ported from the prototype's inline HTML. Rendered inside a fixed-size stage that scales to the screen.
// Player flyers are a layer on top, pinned over the printed notices.
import type { PublicFlyer } from "@/shared/projection";

/** Where player flyers get pinned: left, top, tilt. The newest go up first. */
const SLOTS: [number, number, number][] = [
  [1300, 290, -4],
  [110, 290, 3],
  [990, 600, -3],
  [1620, 250, 4],
  [1460, 640, 3],
  [330, 860, -2],
  [700, 520, 2],
  [1660, 700, -4],
];
export const MAX_FLYERS = SLOTS.length;

export function Flyers({ flyers }: { flyers: PublicFlyer[] }) {
  return (
    <>
      {flyers.slice(-MAX_FLYERS).map((f, i) => {
        const [left, top, tilt] = SLOTS[i];
        return (
          <div key={f.id} className={`flyer${i % 2 ? " alt" : ""}`} style={{ left: `${left}px`, top: `${top}px`, transform: `rotate(${tilt}deg)` }}>
            <div className="flyer-title">{f.title}</div>
            {f.body ? <div className="flyer-body">{f.body}</div> : null}
            <div className="flyer-sign">{f.signedBy}</div>
          </div>
        );
      })}
    </>
  );
}

/* eslint-disable */
export function NoticeBoard({ flyers = [] }: { flyers?: PublicFlyer[] }) {
  return (
    <>
<div style={{ width: "1920px", height: "1080px", boxSizing: "border-box", background: "#4a3020", padding: "36px", fontFamily: "'IM Fell English', Georgia, serif", color: "#2b2118" }}>
  <div style={{ position: "relative", width: "100%", height: "100%", backgroundColor: "#b98a55", backgroundImage: "radial-gradient(#9c6f3e 1.5px, transparent 1.6px), radial-gradient(#c99a63 1.5px, transparent 1.6px)", backgroundSize: "22px 22px, 31px 31px", backgroundPosition: "0 0, 11px 15px", border: "6px solid #3a2416", boxSizing: "border-box", overflow: "hidden" }}>
    <div style={{ position: "absolute", left: "60px", top: "50px", width: "300px", transform: "rotate(-3deg)", background: "#e9dcc0", padding: "26px 22px 22px", boxSizing: "border-box", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#7a2a1f" }}></div>
      <div style={{ fontFamily: "'Pirata One', Georgia, serif", fontSize: "54px", lineHeight: "1", color: "#7a2a1f" }}>Bounty</div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "24px" }}>Owlbear</div>
      <div style={{ fontSize: "18px", lineHeight: "1.3" }}>seen on the east road. Five gold a head, paid in coin.</div>
      <div style={{ fontSize: "15px", fontStyle: "italic" }}>Claim at The Sleeping Kraken</div>
    </div>
    <div style={{ position: "absolute", left: "390px", top: "40px", width: "270px", transform: "rotate(2deg)", background: "#f3ecdc", padding: "26px 20px 20px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "6px", borderTop: "6px solid #3a4a5c" }}>
      <div style={{ position: "absolute", top: "12px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#3a4a5c" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "22px", textAlign: "center" }}>By Order of the Council</div>
      <div style={{ fontSize: "17px", lineHeight: "1.35" }}>A new tax of one copper per measure of salt takes effect at the turning of the month.</div>
      <div style={{ fontSize: "14px", fontStyle: "italic", textAlign: "right" }}>The Council of Candlefair</div>
    </div>
    <div style={{ position: "absolute", left: "420px", top: "330px", width: "250px", transform: "rotate(-5deg)", background: "#f6f1e4", padding: "24px 18px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#2e5a3a" }}></div>
      <div style={{ fontFamily: "'Caveat', cursive", fontWeight: "700", fontSize: "40px", lineHeight: "1" }}>LOST: one ham</div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "24px", lineHeight: "1.15" }}>Taken by a brown dog near the square. Dog may keep the bone. Reward for the rest.</div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "22px", textAlign: "right" }}>Hobb, butcher</div>
    </div>
    <div style={{ position: "absolute", left: "70px", top: "470px", width: "320px", transform: "rotate(2deg)", background: "#e4d6b8", padding: "26px 22px 22px", boxSizing: "border-box", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#7a2a1f" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "30px", lineHeight: "1.05" }}>Have You Seen This Caravan?</div>
      <div style={{ fontSize: "18px", lineHeight: "1.35" }}>Four wagons, eastern traders, green canvas. Three weeks overdue. Reward for any news of them.</div>
      <div style={{ fontSize: "15px", fontStyle: "italic" }}>Ask at the harbormaster&#39;s office</div>
    </div>
    <div style={{ position: "absolute", left: "420px", top: "610px", width: "260px", transform: "rotate(3deg)", background: "#f3ecdc", padding: "24px 20px 20px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "6px", textAlign: "center" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#3a4a5c" }}></div>
      <div style={{ fontFamily: "'Pirata One', Georgia, serif", fontSize: "36px", lineHeight: "1" }}>Ferry Closed</div>
      <div style={{ fontSize: "20px" }}>after dark</div>
      <div style={{ fontSize: "16px", lineHeight: "1.3" }}>until further notice. Don&#39;t ask why.</div>
      <div style={{ fontSize: "14px", fontStyle: "italic" }}>The Ferryman</div>
    </div>
    <div style={{ position: "absolute", left: "90px", top: "790px", width: "280px", transform: "rotate(-2deg)", background: "#f6f1e4", padding: "24px 20px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "2px" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#2e5a3a" }}></div>
      <div style={{ fontFamily: "'Caveat', cursive", fontWeight: "700", fontSize: "36px", lineHeight: "1" }}>Boat for sale</div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "24px", lineHeight: "1.15" }}>Good fishing boat. Barely sank. Best offer.</div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "22px", textAlign: "right" }}>Fennick, at the docks</div>
    </div>
    <div style={{ position: "absolute", left: "690px", top: "70px", width: "520px", transform: "rotate(1deg)", background: "#efe3c8", padding: "18px", boxSizing: "border-box", zIndex: "5", boxShadow: "0 2px 0 #3a2416" }}>
      <div style={{ position: "absolute", top: "10px", left: "50%", width: "18px", height: "18px", marginLeft: "-9px", borderRadius: "50%", background: "#7a2a1f", zIndex: "6" }}></div>
      <div style={{ border: "2px solid #2b2118", padding: "26px 28px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px" }}>
        <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "14px", letterSpacing: "3px", color: "#5b4a3a" }}>Hear ye, good folk of Candlefair</div>
        <div style={{ margin: "0", fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "58px", lineHeight: "0.95" }}>Winterfest<br />Needs Hands!</div>
        <div style={{ fontSize: "17px", fontStyle: "italic", lineHeight: "1.3", color: "#3a2d22" }}>The Opening Feast is nigh, and your humble planner is in well over his head.</div>
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", color: "#7a2a1f" }}>
          <div style={{ flexGrow: "1", borderTop: "1px solid #2b2118" }}></div>
          <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "17px", letterSpacing: "3px" }}>Wanted</div>
          <div style={{ flexGrow: "1", borderTop: "1px solid #2b2118" }}></div>
        </div>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px 18px", textAlign: "left" }}>
          <div><div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "19px", color: "#7a2a1f" }}>Steady Climbers</div><div style={{ fontSize: "14px", lineHeight: "1.3" }}>to hang fir garlands from the high ceilings. Ladders mostly sturdy.</div></div>
          <div><div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "19px", color: "#7a2a1f" }}>Careful Hands</div><div style={{ fontSize: "14px", lineHeight: "1.3" }}>to find matching china in the scullery and wheel it to the hall unbroken</div></div>
          <div><div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "19px", color: "#7a2a1f" }}>Calm Handlers</div><div style={{ fontSize: "14px", lineHeight: "1.3" }}>to greet arriving guests and mind their carriage horses</div></div>
          <div><div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "19px", color: "#7a2a1f" }}>Brave Tongues</div><div style={{ fontSize: "14px", lineHeight: "1.3" }}>to taste the chef&#39;s marvelous new desserts</div></div>
        </div>
        <div style={{ width: "100%", borderTop: "1px solid #2b2118" }}></div>
        <div style={{ fontSize: "15px", lineHeight: "1.4" }}><span style={{ fontFamily: "'IM Fell English SC', Georgia, serif", color: "#7a2a1f" }}>Pay:</span> 25 gold a day, and a seat at the banquet for a job well done.<br /><span style={{ fontFamily: "'IM Fell English SC', Georgia, serif", color: "#7a2a1f" }}>Inquire:</span> at The Flickering Candle. Ask Mags where to find me.</div>
        <div style={{ fontSize: "26px", fontStyle: "italic", lineHeight: "1" }}>Artum</div>
        <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "13px", letterSpacing: "2px", color: "#5b4a3a" }}>Planner of Winterfest</div>
      </div>
    </div>
    <div style={{ position: "absolute", left: "760px", top: "790px", width: "400px", transform: "rotate(-2deg)", background: "#7a2a1f", color: "#f3ecdc", padding: "26px 24px 20px", boxSizing: "border-box", textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ position: "absolute", top: "9px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#e9dcc0" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "16px", letterSpacing: "3px" }}>All of Candlefair Welcome</div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "40px", lineHeight: "1" }}>Winterfest Opening Feast</div>
      <div style={{ fontSize: "18px", lineHeight: "1.35" }}>In the banquet hall, on the first night of Winterfest. Music, fir and firelight, and dessert by our own chef.</div>
    </div>
    <div style={{ position: "absolute", left: "1250px", top: "50px", width: "330px", transform: "rotate(2deg)", background: "#2b2118", color: "#efe3c8", padding: "28px 22px 22px", boxSizing: "border-box", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ position: "absolute", top: "9px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#c99a3a" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "18px", letterSpacing: "3px", color: "#c99a3a" }}>The Flickering Candle</div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "40px", lineHeight: "1" }}>Tale Night</div>
      <div style={{ fontSize: "18px", lineHeight: "1.35" }}>Every tenday by the hearth. Tell a true tale and your first drink is on the house. Best tale gets a candle on the shelf.</div>
      <div style={{ fontSize: "15px", fontStyle: "italic", color: "#c99a3a" }}>Mags Wick, proprietor</div>
    </div>
    <div style={{ position: "absolute", left: "1610px", top: "60px", width: "230px", transform: "rotate(-3deg)", background: "#dfe4e0", padding: "26px 18px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "6px", textAlign: "center" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#3a4a5c" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "22px", lineHeight: "1.1" }}>Hands Wanted on Orlumbor</div>
      <div style={{ fontSize: "16px", lineHeight: "1.3" }}>The shipwrights need workers before the harbor freezes. Good coin, no questions.</div>
      <div style={{ fontSize: "14px", fontStyle: "italic" }}>Boat leaves from the docks at first light</div>
    </div>
    <div style={{ position: "absolute", left: "1270px", top: "440px", width: "300px", transform: "rotate(-2deg)", background: "#f3ecdc", padding: "26px 22px 20px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "6px", borderTop: "6px solid #7a2a1f", textAlign: "center" }}>
      <div style={{ position: "absolute", top: "12px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#7a2a1f" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "26px", color: "#7a2a1f" }}>Warning</div>
      <div style={{ fontSize: "17px", lineHeight: "1.35" }}>Press gangs have been seen near the docks after dark. Walk in pairs. Do not accept free drinks from sailors.</div>
      <div style={{ fontSize: "14px", fontStyle: "italic" }}>The Watch</div>
    </div>
    <div style={{ position: "absolute", left: "1610px", top: "430px", width: "240px", transform: "rotate(3deg)", background: "#ece7dc", padding: "26px 18px 18px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "6px", textAlign: "center" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#2b2118" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "22px" }}>From the Temple</div>
      <div style={{ fontSize: "16px", lineHeight: "1.3" }}>The graveyard is closed after sundown until the disturbances are explained. Please pray for the restless.</div>
    </div>
    <div style={{ position: "absolute", left: "1250px", top: "750px", width: "310px", transform: "rotate(1deg)", background: "#e6eef2", padding: "26px 22px 20px", boxSizing: "border-box", textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#3a4a5c" }}></div>
      <div style={{ fontFamily: "'IM Fell English SC', Georgia, serif", fontSize: "30px", lineHeight: "1.05" }}>Winterfest Skating</div>
      <div style={{ fontSize: "17px", lineHeight: "1.35" }}>On the harbor, once the ice holds. Not before. We mean it this year.</div>
      <div style={{ fontSize: "14px", fontStyle: "italic" }}>The Winterfest Committee</div>
    </div>
    <div style={{ position: "absolute", left: "1610px", top: "780px", width: "230px", transform: "rotate(-5deg)", background: "#f6f1e4", padding: "24px 16px 16px", boxSizing: "border-box" }}>
      <div style={{ position: "absolute", top: "8px", left: "50%", width: "14px", height: "14px", marginLeft: "-7px", borderRadius: "50%", background: "#2e5a3a" }}></div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "27px", lineHeight: "1.1" }}>Whoever took the festival bunting: put it back and nobody gets hurt.</div>
      <div style={{ fontFamily: "'Caveat', cursive", fontSize: "24px", textAlign: "right" }}>A.</div>
    </div>
    <Flyers flyers={flyers} />
  </div>
</div>
    </>
  );
}
