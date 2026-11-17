"use client";

import { formatCp } from "@/shared/money";
import type { MyRoom } from "@/shared/rooms";

/** My room at the inn: like the paper tag on the key, plus who I share with and how far my rent is paid. */
export function MyRoomCard({ room }: { room: MyRoom }) {
  return (
    <section className={`box my-room${room.type === "good" ? " good" : ""}`} aria-label="My room">
      <div className="my-room-tag">
        <div className="my-room-kicker">My room</div>
        <h2 className="my-room-name">{room.name}</h2>
        {room.tag ? <p className="my-room-line">{room.tag}</p> : null}
      </div>
      <dl className="my-room-facts">
        {room.key ? (
          <>
            <dt>Key</dt>
            <dd>{room.key}</dd>
          </>
        ) : null}
        {room.perk ? (
          <>
            <dt>Perk</dt>
            <dd>{room.perk}</dd>
          </>
        ) : null}
        <dt>Sharing with</dt>
        <dd>{room.roommates.length ? room.roommates.join(", ") : "Nobody (yet)"}</dd>
        <dt>Rent</dt>
        <dd>
          {formatCp(room.monthlyCp)} a month, paid through session {room.paidThrough}
          {room.behind ? <span className="my-room-behind"> · behind: the DM will want a word</span> : null}
        </dd>
      </dl>
    </section>
  );
}
