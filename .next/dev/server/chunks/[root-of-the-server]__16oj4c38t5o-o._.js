module.exports = [
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[externals]/node:events [external] (node:events, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/app/api/stream/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "maxDuration",
    ()=>maxDuration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$http$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/http.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/store.ts [app-route] (ecmascript)");
;
;
const dynamic = "force-dynamic";
const maxDuration = 300;
const LIFETIME_MS = 270_000; // close before the function limit; EventSource reconnects by itself
async function GET(req) {
    const { game } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$http$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["params"])(req);
    const store = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getStore"])();
    const enc = new TextEncoder();
    let cleanup = ()=>{};
    const stream = new ReadableStream({
        async start (controller) {
            let closed = false;
            const send = (s)=>{
                if (!closed) controller.enqueue(enc.encode(s));
            };
            const unsubscribe = store.subscribe(game, (v)=>send(`event: v\ndata: ${v}\n\n`));
            const ping = setInterval(()=>send(`: ping\n\n`), 20_000);
            const end = setTimeout(()=>cleanup(), LIFETIME_MS);
            cleanup = ()=>{
                if (closed) return;
                closed = true;
                clearInterval(ping);
                clearTimeout(end);
                unsubscribe();
                try {
                    controller.close();
                } catch  {}
            };
            req.signal.addEventListener("abort", ()=>cleanup());
            send(`retry: 1500\n\n`);
            send(`event: v\ndata: ${await store.version(game)}\n\n`);
        },
        cancel () {
            cleanup();
        }
    });
    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-store, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no"
        }
    });
}
}),
"[project]/src/server/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "KEY_HEADER",
    ()=>KEY_HEADER,
    "isDmKey",
    ()=>isDmKey,
    "keyMatches",
    ()=>keyMatches,
    "sha256",
    ()=>sha256
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
;
;
const KEY_HEADER = "x-candlefair-key";
function sha256(s) {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(s, "utf8").digest("hex");
}
function sameHash(a, b) {
    const x = Buffer.from(a, "hex");
    const y = Buffer.from(b, "hex");
    return x.length === y.length && (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(x, y);
}
let warned = false;
function dmKey() {
    const key = process.env.DM_KEY;
    if (key) return key;
    if (process.env.VERCEL || ("TURBOPACK compile-time value", "development") === "production") return null; // refuse everyone
    if (!warned) {
        console.warn("[candlefair] DM_KEY isn't set. Using the local-only key \"dev\".");
        warned = true;
    }
    return "dev";
}
function isDmKey(key) {
    const real = dmKey();
    if (!real || !key) return false;
    return sameHash(sha256(key), sha256(real));
}
function keyMatches(key, hash) {
    if (!hash) return true; // unlocked name
    if (!key) return false;
    return sameHash(sha256(key), hash);
}
}),
"[project]/src/server/game.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HttpError",
    ()=>HttpError,
    "actorOf",
    ()=>actorOf,
    "createGame",
    ()=>createGame,
    "execute",
    ()=>execute,
    "hello",
    ()=>hello,
    "identify",
    ()=>identify,
    "parseClientCommand",
    ()=>parseClientCommand,
    "viewFor",
    ()=>viewFor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$commands$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/commands.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/handles.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/projection.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/reducer.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/seed.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/store.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
class HttpError extends Error {
    status;
    code;
    constructor(status, message, code){
        super(message), this.status = status, this.code = code;
    }
}
function identify(state, rawPlayer, key) {
    const raw = (rawPlayer ?? "").trim();
    const lower = raw.toLowerCase();
    if (lower === "dm") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isDmKey"])(key) ? {
        kind: "dm"
    } : {
        kind: "invalid"
    };
    if (lower === "tv") return {
        kind: "tv"
    };
    const handle = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseHandle"])(raw);
    if (!handle || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReservedHandle"])(handle)) return {
        kind: "invalid"
    };
    const p = state?.players.find((x)=>x.handle === handle);
    if (!p) return {
        kind: "unknown",
        handle,
        name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["displayNameFrom"])(raw)
    };
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keyMatches"])(key, p.keyHash)) return {
        kind: "taken",
        handle
    };
    return {
        kind: "player",
        playerId: p.id
    };
}
function actorOf(who) {
    if (who.kind === "dm") return {
        role: "dm"
    };
    if (who.kind === "tv") return {
        role: "tv"
    };
    if (who.kind === "player") return {
        role: "player",
        playerId: who.playerId
    };
    throw new HttpError(403, "Not allowed.");
}
async function execute(store, game, actor, cmd, now = Date.now()) {
    for(let attempt = 0; attempt < 6; attempt++){
        const { state, version } = await store.read(game);
        if (!state) throw new HttpError(404, "No game here yet.", "no-game");
        let result;
        try {
            result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apply"])(state, cmd, {
                now,
                actor
            });
        } catch (e) {
            if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CommandError"]) throw new HttpError(400, e.message, e.code);
            throw e;
        }
        const v = await store.commit(game, version, result.state, result.ledger);
        if (v !== null) {
            await store.publish(game, v);
            return {
                version: v,
                state: result.state,
                playerId: result.playerId,
                info: result.info
            };
        }
        await new Promise((r)=>setTimeout(r, 20 + Math.random() * 60 * (attempt + 1)));
    }
    throw new HttpError(409, "Too many changes at once. Try again.");
}
async function viewFor(store, game, actor) {
    const { state, version } = await store.read(game);
    if (!state) throw new HttpError(404, "No game here yet.", "no-game");
    if (actor.role === "dm") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["projectDm"])(state, version, await store.ledger(game));
    if (actor.role === "tv") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["projectTv"])(state, version);
    if (actor.role === "player") {
        if (!state.players.some((p)=>p.id === actor.playerId)) throw new HttpError(404, "You're not at this table.", "unknown");
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["projectPlayer"])(state, version, actor.playerId, await store.ledger(game));
    }
    throw new HttpError(403, "Not allowed.");
}
function parseClientCommand(actor, body) {
    if (actor.role === "dm") {
        const r = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$commands$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dmCommand"].safeParse(body);
        if (!r.success) throw new HttpError(400, "That request didn't make sense.");
        return r.data;
    }
    if (actor.role === "player") {
        const r = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$commands$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["playerCommand"].safeParse(body);
        if (!r.success) throw new HttpError(403, "Only the DM can do that.");
        return r.data;
    }
    throw new HttpError(403, "The TV can't change anything.");
}
async function hello(gameRaw, rawPlayer, key, store = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$store$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getStore"])()) {
    const game = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseGameId"])(gameRaw);
    let { state } = await store.read(game);
    const who = identify(state, rawPlayer, key);
    if (who.kind === "invalid") return {
        status: "invalid"
    }; // includes ?player=DM with a wrong key
    if (!state) return {
        status: "no-game"
    }; // the DM view then offers "Create the game"
    if (who.kind === "taken") return {
        status: "taken"
    };
    if (who.kind === "dm" || who.kind === "tv") return {
        status: "ok",
        view: await viewFor(store, game, actorOf(who))
    };
    const system = {
        role: "system"
    };
    if (who.kind === "unknown") {
        // A closed door, or a full table: knock and let the DM decide.
        const full = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seatedCount"])(state) >= (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seatsOf"])(state);
        if (state.doorClosed || full) {
            await execute(store, game, system, {
                type: "system.knock",
                handle: who.handle
            });
            return {
                status: state.doorClosed ? "knocking" : "full"
            };
        }
        try {
            const r = await execute(store, game, system, {
                type: "system.join",
                handle: who.handle,
                name: who.name,
                ...key ? {
                    keyHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sha256"])(key)
                } : {}
            });
            return {
                status: "ok",
                view: await viewFor(store, game, {
                    role: "player",
                    playerId: r.playerId
                }),
                handle: who.handle
            };
        } catch (e) {
            // Someone else grabbed the name a moment ago: re-identify.
            ({ state } = await store.read(game));
            const again = identify(state, rawPlayer, key);
            if (again.kind !== "player") return {
                status: again.kind === "taken" ? "taken" : "invalid"
            };
            return {
                status: "ok",
                view: await viewFor(store, game, actorOf(again))
            };
        }
    }
    await execute(store, game, system, {
        type: "system.hello",
        playerId: who.playerId
    });
    return {
        status: "ok",
        view: await viewFor(store, game, actorOf(who)),
        handle: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseHandle"])(rawPlayer ?? "")
    };
}
async function createGame(store, gameRaw) {
    const game = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseGameId"])(gameRaw);
    const { state } = await store.read(game);
    if (state) throw new HttpError(409, "That game already exists.");
    return store.overwrite(game, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seedGame"])(game), []);
}
;
}),
"[project]/src/server/http.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "guard",
    ()=>guard,
    "json",
    ()=>json,
    "params",
    ()=>params
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/handles.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$game$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/server/game.ts [app-route] (ecmascript) <locals>");
;
;
;
;
;
function params(req) {
    const url = new URL(req.url);
    return {
        game: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseGameId"])(url.searchParams.get("game")),
        player: url.searchParams.get("player"),
        key: req.headers.get(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["KEY_HEADER"])
    };
}
function json(data, status = 200) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data, {
        status,
        headers: {
            "Cache-Control": "no-store"
        }
    });
}
async function guard(fn) {
    try {
        return await fn();
    } catch (e) {
        if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$game$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["HttpError"]) return json({
            error: e.message,
            code: e.code
        }, e.status);
        console.error(e);
        return json({
            error: "Something went wrong on the server."
        }, 500);
    }
}
}),
"[project]/src/server/seed-episodes.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Seed run sheets. DM-only: never sent to the TV or players, and server-only so
// the text never ends up in the browser bundle that the TV and phones download.
__turbopack_context__.s([
    "JUST_DESSERTS_MD",
    ()=>JUST_DESSERTS_MD,
    "seedEpisodes",
    ()=>seedEpisodes,
    "seedSceneResolver",
    ()=>seedSceneResolver,
    "withSeedEpisodes",
    ()=>withSeedEpisodes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/runsheet.ts [app-route] (ecmascript)");
;
;
// The seed episode names scenes the way the DM says them. Pin those names to
// the seeded scene ids, so relabelling a scene later can't break the seed.
const SEED_SCENE_IDS = {
    "notice board": "s-board",
    artum: "s-artum",
    "mags wick": "s-mags",
    chef: "s-chef",
    "artum's notice": "s-notice",
    "town map": "s-map",
    "extra image": "s-extra",
    symbol: "s-symbol",
    black: "s-black"
};
const JUST_DESSERTS_MD = String.raw`# Just Desserts

## Locals at the Flickering Candle
- Two or three minutes. Narrate it: the locals are at a table chatting about what they'll do "someday." No in-character back-and-forth needed.
- Mags drops by and asks each local one question: "What would you do with a fortune, pet?" One answer each, then move on.
- Mags has poured them all drinks. None of them can pay; she's quietly running a tab.
- If anyone looks at the notice board, let them read it on the TV.
action: scene notice board

## Newcomers at the docks
- Two or three minutes. They step off the ship onto the cold docks.
- A quick word with the ship's captain. Throwaway, but the same captain returns later.
- Optional line from the captain: "Last time we carried a peddler, she paid in coin I'd never seen before."
- They head up to the Flickering Candle, sit at another table, order drinks they can't pay for.
- If everyone picked the same origin, skip whichever scene has nobody in it.
action: scene town map

## Artum bursts in
> "Where is everyone?!"
- The party are the only patrons. Mags shrugs.
- Why it's empty: his hired helpers quit this morning after someone fell off a ladder.
- Artum, to the party: "You. All of you. You're coming with me."
- The offer: 25 gp each for a day's work, plus a seat at the banquet for a job well done.
- Mags sells it: "Twenty-five gold? Duck, that's three months of tips."
- Artum slaps coins on the bar: "Their tab's paid. Now you owe me."
if: they still refuse → "Fine. Then at least come to the feast as guests. Free food." Either way they're in the banquet hall when the trouble starts.
action: scene Artum

## Hang the fir garlands
- The ceilings are high and the ladders are rickety. Start the breakage tally now: every failed check that breaks something costs a gold or two off their pay.
- Holding the ladder for someone needs no roll and gives the climber advantage.
check: Strength (Athletics) or Dexterity (Acrobatics) DC 12 | climb and keep balance | fail: fall (1d6 bludgeoning) or drop the garland on something breakable
check: Dexterity (Sleight of Hand) DC 10 | hang it so it looks good | fail: it's crooked and Artum notices

## The scullery china
- The scullery is a mess; matching sets are hard to find. Wheeling the crockery back takes strength and care.
check: Intelligence (Investigation) or Wisdom (Perception) DC 12 | find matching sets | fail: mismatched plates, takes twice as long
check: Strength (Athletics) DC 12 | push the heavy cart
check: Dexterity (Sleight of Hand) or Dexterity (Acrobatics) DC 12 | steer around corners | fail: a stack of plates hits the floor

## The horses
> Outside, it's carnage. One draft horse is dragging an entire fir garland down the street like a kite tail. The other has backed a fancy carriage into the fountain, and the carriage is tipping, with a very rich, very loud woman still inside. A mastiff is barking at both of them, delighted. And Bolla is in the middle of it, arms wide, yelling "EASY, EASY!" at no one in particular.
- Several problems at once so players split up. Ask "what do you do?" and pick the roll that fits; a clever idea gets advantage or just works.
- Failures make it worse: the runaway horse heads for the hall doors; the carriage tips; the dog steals a ham.
- Cut between players at the exciting moment instead of finishing one player at a time.
- Ends after 3 successes total (calm) or 3 failures (a guest gets splashed and storms in furious). About 10 minutes.
- Bolla shouts tips: "He likes his left ear scratched!"
check: Wisdom (Animal Handling) DC 13 | calm a horse
check: Strength (Athletics) DC 13 | grab and hold a bridle
check: Dexterity saving throw DC 12 | stay clear of a kick | fail: knocked prone in the snow, not hurt
check: Wisdom (Animal Handling) DC 10 | settle the dog | success: automatic if someone offers it food
- The first six guests arrive and enter the banquet.

## Seats or serving duty
- Great prep: a seat at the table. Okay: a seat, minus breakage. Bad: serving duty ("You're not sitting. You're carrying.").
- Either way, they're in the hall when the pudding attacks.

## Meet the guests
- About 3 minutes. Seat each player next to a named guest, especially the wealthy ones: a pompous merchant, a nervous young noble, a grandmother who won't stop talking. One quick exchange each.
- If there's a bard, Artum asks them to play during dinner. The attack can interrupt the song.

## Artum's toast and dessert
- Artum's toast, with a backhanded thanks to the "volunteers" depending on how prep went.
> "My new recipes, never served before!"
- The chef presents dessert proudly. Let it land.
action: scene the chef

## The pudding fight
- Pudding Gremlin: AC 11, HP 21, Claw +5 (1d4+3). Fire Breath (Recharge 6): 15 ft cone, Dex save DC 11, 2d6 fire, half on success; ready at the start, then roll a d6 at the start of each of its turns, 6 = ready. Death Burst: 5 ft around it, Dex save DC 11, 2d6 fire. Immune to fire. Can sit still and pass as an ordinary pudding.
- Create Gremlin (1/day): within 10 ft of an ordinary pudding, turns it into a new gremlin. Put ordinary puddings on the tables; that's the second wave.
- Wave 1: two gremlins. Wave 2: start of round 3 or when wave 1 drops, whichever comes first.
- Warn a round early: "On the next table, a trifle starts to tremble." Warn before Fire Breath: "Its custard starts bubbling and glowing orange."
- Give every round a stake: a pudding lunges at a guest, someone gets cornered.
- Scale: struggling party, wave 2 is one pudding; crushing it, add a third. Rough guide: start with two, let only one create a third.
- Improvised weapons everywhere (rolling pins, ladles, candelabras): 1d4.
action: initiative

## Celebration and payday
- Narrate the room for 30 seconds, then one quick question per player ("What's the first thing your character eats?").
- Pay: great 25 gp each and a seat; okay 20–25 gp minus breakage; bad 15–20 gp after deductions and serving duty. Artum docks it out loud, item by item: "minus three for the plates, two for the garland, and one for my dignity."
- Tips from wealthy guests they protected: great 5 gp each, okay 2–3 gp, bad 1 gp.
- Everyone gets a tin of Elias's spiced biscuits, no matter what.
action: bank

## The chef's confession
- Mortified, he explains he bought the recipes from a traveling merchant, and shows the pages: the same symbol on every one.
- Answer questions as him; don't push.
action: scene the chef

## The recipes won't burn
> Artum: "Throw the cursed things in the fire!" The chef tosses them in the hearth. The flames curl around the pages and won't take them. They come out cold. Not even singed.
- The chef pushes a page into the party's hands: "I don't want it in my kitchen."
- Make sure the party leaves with at least one page.
action: scene the symbol

## Level up
- "You're level 2."

## The stinger
- Tell them first: "This is for you, not your characters."
- Cut all sound before you start. Read slowly, pause on each "…", drop your voice on the last lantern line. About 45–60 seconds.
> Close your eyes.
>
> You're at the Flickering Candle. Warm. Full. Laughing with your new friends about the night you fought off a pudding.
>
> Now… let the view drift. Up, and away from your table. You see yourselves from above. Then the whole tavern: the fire, the music, the happy crowd.
>
> The view drifts toward the door… through it… and everything goes dark.
>
> Slowly, the dark gives way to moonlight. The edge of town, somewhere you don't know. A small cart, hung with tiny lanterns. An old woman beside it. And a child.
>
> The woman hands the child something small. You can't see what. The child jumps with joy.
>
> The woman smiles, waves, and walks her cart toward the Trollbark, into the dark.
>
> And as she goes… one more tiny lantern on her cart flickers to life.
>
> Open your eyes. End of episode one.
action: black
`;
function seedSceneResolver(scenes) {
    const byLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sceneResolver"])(scenes);
    return (name)=>{
        const pinned = SEED_SCENE_IDS[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sceneKey"])(name)];
        if (pinned && scenes.some((s)=>s.id === pinned)) return pinned;
        return byLabel(name);
    };
}
function seedEpisodes(scenes) {
    const p = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseEpisode"])(JUST_DESSERTS_MD, seedSceneResolver(scenes));
    return [
        {
            id: "ep1",
            title: p.title,
            beats: p.beats.map((b, i)=>({
                    id: `ep1-b${i + 1}`,
                    ...b
                }))
        }
    ];
}
function withSeedEpisodes(state) {
    if (state && !state.episodes) state.episodes = seedEpisodes(state.scenes);
    return state;
}
}),
"[project]/src/server/store.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createFileStore",
    ()=>createFileStore,
    "getStore",
    ()=>getStore
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$events__$5b$external$5d$__$28$node$3a$events$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:events [external] (node:events, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@upstash/redis/nodejs.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/migrate.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$seed$2d$episodes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/server/seed-episodes.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
const k = (game)=>({
        state: `cf:${game}:state`,
        ver: `cf:${game}:ver`,
        ledger: `cf:${game}:ledger`,
        channel: `cf:${game}:changes`
    });
// ---------------------------------------------------------------------------
// Upstash Redis (production)
const COMMIT_LUA = `
local v = tonumber(redis.call('GET', KEYS[1]) or '0')
if v ~= tonumber(ARGV[1]) then return -1 end
redis.call('SET', KEYS[2], ARGV[2])
for i = 3, #ARGV do redis.call('RPUSH', KEYS[3], ARGV[i]) end
return redis.call('INCR', KEYS[1])
`;
const OVERWRITE_LUA = `
redis.call('SET', KEYS[2], ARGV[1])
redis.call('DEL', KEYS[3])
for i = 2, #ARGV do redis.call('RPUSH', KEYS[3], ARGV[i]) end
return redis.call('INCR', KEYS[1])
`;
class UpstashStore {
    redis;
    kind;
    constructor(redis){
        this.redis = redis;
        this.kind = "upstash";
    }
    async read(game) {
        const key = k(game);
        const [ver, state] = await this.redis.mget(key.ver, key.state);
        return {
            state: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$seed$2d$episodes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withSeedEpisodes"])(state ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upgrade"])(JSON.parse(state)) : null),
            version: Number(ver ?? 0)
        };
    }
    async version(game) {
        return Number(await this.redis.get(k(game).ver) ?? 0);
    }
    async commit(game, expected, state, ledger) {
        const key = k(game);
        const args = [
            String(expected),
            JSON.stringify(state),
            ...ledger.map((l)=>JSON.stringify(l))
        ];
        const r = Number(await this.redis.eval(COMMIT_LUA, [
            key.ver,
            key.state,
            key.ledger
        ], args));
        return r < 0 ? null : r;
    }
    async ledger(game) {
        const rows = await this.redis.lrange(k(game).ledger, 0, -1);
        return rows.map((r)=>JSON.parse(r));
    }
    async overwrite(game, state, ledger) {
        const key = k(game);
        return Number(await this.redis.eval(OVERWRITE_LUA, [
            key.ver,
            key.state,
            key.ledger
        ], [
            JSON.stringify(state),
            ...ledger.map((l)=>JSON.stringify(l))
        ]));
    }
    async publish(game, version) {
        await this.redis.publish(k(game).channel, String(version));
    }
    subscribe(game, onVersion) {
        const sub = this.redis.subscribe([
            k(game).channel
        ]);
        sub.on("message", ({ message })=>{
            const v = Number(message);
            if (Number.isFinite(v)) onVersion(v);
        });
        sub.on("error", ()=>{
        /* the SSE route will time out and the client reconnects */ });
        return ()=>{
            sub.unsubscribe().catch(()=>{});
        };
    }
}
class FileStore {
    dir;
    kind;
    games;
    bus;
    constructor(dir){
        this.dir = dir;
        this.kind = "file";
        this.games = new Map();
        this.bus = new __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$events__$5b$external$5d$__$28$node$3a$events$2c$__cjs$29$__["EventEmitter"]();
        this.bus.setMaxListeners(200);
    }
    file(game) {
        return this.dir ? __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(this.dir, `${game}.json`) : null;
    }
    load(game) {
        let g = this.games.get(game);
        if (g) return g;
        g = {
            state: null,
            version: 0,
            ledger: []
        };
        const f = this.file(game);
        if (f && __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].existsSync(f)) g = JSON.parse(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].readFileSync(f, "utf8"));
        this.games.set(game, g);
        return g;
    }
    save(game, g) {
        const f = this.file(game);
        if (!f) return;
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].mkdirSync(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].dirname(f), {
            recursive: true
        });
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].writeFileSync(f + ".tmp", JSON.stringify(g));
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].renameSync(f + ".tmp", f);
    }
    async read(game) {
        const g = this.load(game);
        return {
            state: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$server$2f$seed$2d$episodes$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withSeedEpisodes"])(g.state ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$migrate$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["upgrade"])(structuredClone(g.state)) : null),
            version: g.version
        };
    }
    async version(game) {
        return this.load(game).version;
    }
    async commit(game, expected, state, ledger) {
        const g = this.load(game);
        if (g.version !== expected) return null;
        g.state = structuredClone(state);
        g.ledger.push(...structuredClone(ledger));
        g.version += 1;
        this.save(game, g);
        return g.version;
    }
    async ledger(game) {
        return structuredClone(this.load(game).ledger);
    }
    async overwrite(game, state, ledger) {
        const g = this.load(game);
        g.state = structuredClone(state);
        g.ledger = structuredClone(ledger);
        g.version += 1;
        this.save(game, g);
        return g.version;
    }
    async publish(game, version) {
        this.bus.emit(game, version);
    }
    subscribe(game, onVersion) {
        this.bus.on(game, onVersion);
        return ()=>{
            this.bus.off(game, onVersion);
        };
    }
}
function createFileStore(dir) {
    return new FileStore(dir);
}
const g = globalThis;
function getStore() {
    if (g.__candlefairStore) return g.__candlefairStore;
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
        g.__candlefairStore = new UpstashStore(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Redis"]({
            url,
            token,
            automaticDeserialization: false
        }));
    } else {
        if (process.env.VERCEL) throw new Error("Upstash Redis isn't configured. Connect it in the Vercel project's Storage tab.");
        g.__candlefairStore = new FileStore(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), ".data", "games"));
    }
    return g.__candlefairStore;
}
}),
"[project]/src/shared/commands.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "beatBody",
    ()=>beatBody,
    "dmCommand",
    ()=>dmCommand,
    "playerCommand",
    ()=>playerCommand
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .string>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .number>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .object>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .enum>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$discriminatedUnion$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .discriminatedUnion>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .literal>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .boolean>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .array>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$union$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v4/classic/external.js [app-route] (ecmascript) <export * as z .union>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-route] (ecmascript)");
;
;
const id = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().min(1).max(64);
const text = (max)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().max(max);
const cp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(1_000_000_000);
const hotkey = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(9).nullable();
const artSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    builtin: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum([
        "candlefair-board",
        "artum-notice",
        "artum",
        "mags-wick",
        "chef",
        "merchant-sigil"
    ]).optional(),
    url: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().max(2048).optional()
});
const SCENE_KINDS = [
    "notice",
    "portrait",
    "handout",
    "image",
    "black",
    "map"
];
const frac = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().min(0).max(1);
const pinId = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().regex(/^[A-Za-z0-9_-]{1,40}$/);
const pinLink = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$discriminatedUnion$3e$__["z"].discriminatedUnion("kind", [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("shop"),
        shopId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene"),
        sceneId: id
    })
]);
const pinFields = {
    showsAs: text(4),
    name: text(120),
    type: text(40),
    description: text(600),
    dmNotes: text(4000),
    x: frac,
    y: frac
};
const pinPatch = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    ...pinFields,
    link: pinLink.nullable()
}).partial();
/** A whole pin, for undoing a delete. */ const fullPin = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    id: pinId,
    number: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(1).max(999),
    discovered: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
    ...pinFields,
    link: pinLink.optional()
});
const scenePatch = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    label: text(80),
    kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum(SCENE_KINDS),
    hotkey,
    reveal: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
    art: artSchema,
    name: text(80),
    title: text(160),
    alt: text(300),
    dmNote: text(4000)
}).partial();
const category = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CATEGORY_IDS"]);
const effect = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$discriminatedUnion$3e$__["z"].discriminatedUnion("type", [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("unlock"),
        itemId: id.optional(),
        shopId: id.optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("discount"),
        pct: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(1).max(50),
        category: category.optional(),
        tag: text(40).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("income"),
        dice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().regex(/^\s*(\d*d\d+([+-]\d+)?|\d+)\s*$/i),
        unitCp: cp
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("credit"),
        limitCp: cp
    })
]);
const flyerText = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    title: text(60).min(1),
    body: text(400),
    signedBy: text(60)
});
const itemFields = {
    shopId: id,
    name: text(120).min(1),
    priceCp: cp,
    description: text(600),
    tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum([
        "sale",
        "locked",
        "rumored",
        "hidden"
    ]),
    reason: text(160),
    hint: text(200),
    hidePrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
    stock: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(9999).nullable(),
    restockNote: text(160),
    priceLabel: text(24),
    finePrint: text(300),
    arrivesInSessions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(20),
    oneAtATime: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
    dmNote: text(2000),
    category,
    kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["KIND_IDS"]),
    installments: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(1).max(20),
    prompt: text(120),
    flyer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(text(40)).max(10),
    keep: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
    effects: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(effect).max(6)
};
const itemPatch = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object(itemFields).partial();
// Run sheets (DM-only).
const beatAction = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$discriminatedUnion$3e$__["z"].discriminatedUnion("type", [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene"),
        sceneId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("black")
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("bank")
    })
]);
const beatBody = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
    title: text(160).min(1),
    readAloud: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(text(6000)).max(40).optional(),
    readAloudAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(200).optional(),
    notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(text(4000)).max(200),
    checks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        skill: text(200).min(1),
        dc: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(99),
        what: text(400),
        fail: text(1000).optional(),
        success: text(1000).optional()
    })).max(40),
    branches: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        when: text(1000),
        then: text(2000)
    })).max(40),
    actions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(beatAction).max(10)
});
const dmCommand = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$discriminatedUnion$3e$__["z"].discriminatedUnion("type", [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.show"),
        sceneId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.step"),
        dir: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$union$3e$__["z"].union([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal(1),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal(-1)
        ])
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.hotkey"),
        key: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(9)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.add"),
        kind: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum(SCENE_KINDS),
        label: text(80)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.update"),
        sceneId: id,
        patch: scenePatch
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.remove"),
        sceneId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("scene.move"),
        sceneId: id,
        dir: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$union$3e$__["z"].union([
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal(1),
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal(-1)
        ])
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("pin.add"),
        sceneId: id,
        pinId,
        x: frac,
        y: frac
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("pin.update"),
        sceneId: id,
        pinId: id,
        patch: pinPatch
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("pin.remove"),
        sceneId: id,
        pinId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("pin.restore"),
        sceneId: id,
        pin: fullPin
    }),
    /** announce: show "Discovered: …" on the TV. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("pin.discover"),
        sceneId: id,
        pinId: id,
        discovered: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
        announce: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("map.legend"),
        sceneId: id,
        on: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional(),
        style: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum([
            "numbers",
            "names"
        ]).optional()
    }),
    /** Zoom the TV toward a pin on the live map, or back out with null. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("live.focus"),
        pinId: id.nullable()
    }),
    /** Add the Candlefair and Sword Coast maps to a game created before maps existed. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("map.addSeedMaps")
    }),
    /** category: show a category on the TV instead of a storefront (null = back to storefronts). */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("live.shop"),
        open: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
        shopId: id.optional(),
        category: category.nullable().optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("live.purse"),
        visible: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("money.adjust"),
        playerId: id,
        amountCp: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(-1_000_000_000).max(1_000_000_000),
        note: text(200),
        allowDebt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("money.payAll"),
        amountCp: cp,
        note: text(200),
        playerIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(id).max(50)
    }),
    /** question: what a training is for ("Elvish"). */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("money.buy"),
        playerId: id,
        itemId: id,
        question: text(300).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("project.contribute"),
        playerId: id,
        itemId: id,
        amountCp: cp.min(1)
    }),
    /** Charge the rent and lessons due at the end of the running session (the ids the DM ticked). */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("dues.charge"),
        ids: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(id).max(200)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("rental.cancel"),
        rentalId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("training.cancel"),
        trainingId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("award.grant"),
        itemId: id,
        playerIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(id).min(1).max(50),
        note: text(200)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("award.revoke"),
        awardId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("task.done"),
        taskId: id,
        done: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("flyer.update"),
        flyerId: id,
        patch: flyerText.partial().extend({
            up: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional()
        })
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("flyer.remove"),
        flyerId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("player.add"),
        name: text(32)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("player.update"),
        playerId: id,
        patch: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
            name: text(32),
            dndbUrl: text(300),
            away: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
            dropIn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
            handle: text(40)
        }).partial()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("player.archive"),
        playerId: id,
        archived: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("player.remove"),
        playerId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("player.clearKey"),
        playerId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("player.inspire"),
        playerId: id,
        on: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("shop.add"),
        name: text(80),
        subtitle: text(160)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("shop.update"),
        shopId: id,
        patch: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
            name: text(80),
            subtitle: text(160),
            closed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean(),
            secretSales: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
        }).partial()
    }),
    /** Who can see a shop. quiet: no "Now open" banner on the TV. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("shop.visibility"),
        shopId: id,
        visibility: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum([
            "hidden",
            "all",
            "some"
        ]),
        playerIds: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(id).max(50).optional(),
        quiet: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("shop.remove"),
        shopId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("item.add"),
        item: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object(itemFields).partial().required({
            shopId: true,
            name: true,
            priceCp: true
        }),
        quiet: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional()
    }),
    /** quiet: no "New at …" banner when this reveals or unlocks the item. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("item.update"),
        itemId: id,
        patch: itemPatch,
        quiet: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("order.arrive"),
        orderId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("order.cancel"),
        orderId: id,
        refund: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    /** Replace every shop and item with the starter catalog (all hidden). Ledger untouched. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("catalog.reset")
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("item.remove"),
        itemId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("session.start"),
        title: text(120).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("session.end")
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("session.update"),
        sessionId: id,
        patch: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
            title: text(120),
            number: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(1).max(9999)
        }).partial()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("session.reopen"),
        sessionId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("session.remove"),
        sessionId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("episode.add"),
        title: text(160),
        beats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(beatBody).max(200).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("episode.update"),
        episodeId: id,
        title: text(160).min(1)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("episode.replaceBeats"),
        episodeId: id,
        beats: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(beatBody).max(200)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("episode.remove"),
        episodeId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("beat.add"),
        episodeId: id,
        at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(200).optional(),
        beat: beatBody.optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("beat.update"),
        episodeId: id,
        beatId: id,
        beat: beatBody
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("beat.move"),
        episodeId: id,
        beatId: id,
        to: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(200)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("beat.remove"),
        episodeId: id,
        beatId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.start"),
        episodeId: id
    }),
    /** Next and jump fire the landing beat's actions (minus any skipped); Back never fires. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.next"),
        skip: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$array$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(9)).max(10).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.back")
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.jump"),
        stage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$enum$3e$__["z"].enum([
            "start",
            "beat",
            "end"
        ]),
        beat: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(200).optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.fire"),
        beatId: id,
        index: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(0).max(9)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.note"),
        beatId: id,
        text: text(4000)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.recap"),
        sessionId: id,
        text: text(8000)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("run.attend"),
        playerId: id,
        here: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("live.recap"),
        sessionId: id.nullable()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("door.set"),
        closed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("table.seats"),
        max: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(1).max(12)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("knock.admit"),
        knockId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("knock.dismiss"),
        knockId: id
    }),
    // Phone requests (buy / send gold). totalCp: approve at a different price (haggling).
    // override: approve even though the player can no longer afford it (allows debt) or it's out of stock.
    // answer: a service's reply the player sees. flyer: the flyer as the DM edited it.
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("request.approve"),
        requestId: id,
        totalCp: cp.optional(),
        override: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean().optional(),
        answer: text(600).optional(),
        flyer: flyerText.optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("request.decline"),
        requestId: id,
        reason: text(120)
    }),
    /** Approve every pending request that still works; the rest stay pending. */ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("request.approveAll")
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("game.tvPurchases"),
        on: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$boolean$3e$__["z"].boolean()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("game.rename"),
        name: text(120).min(1)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("game.vtt"),
        url: text(300)
    })
]);
const playerCommand = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$discriminatedUnion$3e$__["z"].discriminatedUnion("type", [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.update"),
        patch: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
            name: text(32),
            dndbUrl: text(300)
        }).partial()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.lock"),
        key: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$string$3e$__["z"].string().min(4).max(128)
    }),
    /** expectedUnitCp: the price the phone showed; refused if it has changed since. */ // question: the answer to the item's prompt. flyer: "Post on the notice board".
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.requestBuy"),
        itemId: id,
        qty: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$number$3e$__["z"].number().int().min(1).max(99),
        note: text(120),
        expectedUnitCp: cp.optional(),
        question: text(300).optional(),
        flyer: flyerText.optional()
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.contribute"),
        itemId: id,
        amountCp: cp.min(1),
        note: text(120)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.cancelRental"),
        rentalId: id
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.requestGive"),
        toPlayerId: id,
        amountCp: cp.min(1),
        note: text(120)
    }),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$object$3e$__["z"].object({
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v4$2f$classic$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z__$2e$literal$3e$__["z"].literal("me.cancelRequest"),
        requestId: id
    })
]);
}),
"[project]/src/shared/handles.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// URL names: ?player=Player1, ?player=player 1 and ?player=PLAYER-1 are the same person.
__turbopack_context__.s([
    "RESERVED_HANDLES",
    ()=>RESERVED_HANDLES,
    "displayNameFrom",
    ()=>displayNameFrom,
    "isReservedHandle",
    ()=>isReservedHandle,
    "normaliseGameId",
    ()=>normaliseGameId,
    "normaliseHandle",
    ()=>normaliseHandle
]);
const RESERVED_HANDLES = new Set([
    "dm",
    "tv",
    "admin",
    "display",
    "everyone",
    "party"
]);
function normaliseHandle(raw) {
    return raw.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 24);
}
function isReservedHandle(handle) {
    return RESERVED_HANDLES.has(handle);
}
function displayNameFrom(raw) {
    const cleaned = raw.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ").slice(0, 32);
    const spaced = cleaned.replace(/([a-zA-Z])(\d)/g, "$1 $2");
    return spaced.replace(/\b\p{L}/gu, (c)=>c.toUpperCase()) || "Traveller";
}
function normaliseGameId(raw) {
    const id = (raw ?? "").toLowerCase().replace(/[^a-z0-9-]+/g, "").slice(0, 40);
    return id || "candlefair";
}
}),
"[project]/src/shared/migrate.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "upgrade",
    ()=>upgrade
]);
// Upgrades a stored game to the current shape the first time it's read.
// Safe to run on an already-current game.
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/seed.ts [app-route] (ecmascript)");
;
function upgrade(raw) {
    const g = raw;
    if (g.schema === 2) return withRequests(g);
    // 1 -> 2: shop visibility, item tiers, stock, special orders, banners.
    const shops = (g.shops ?? []).map((s)=>({
            id: String(s.id),
            name: String(s.name),
            subtitle: String(s.subtitle ?? ""),
            // Phase 2: every shop starts hidden; the DM opens them in play.
            visibility: "hidden",
            playerIds: []
        }));
    const items = (g.items ?? []).map((i)=>{
        const lock = String(i.lockReason ?? "");
        return {
            id: String(i.id),
            shopId: String(i.shopId),
            name: String(i.name),
            priceCp: Number(i.priceCp ?? 0),
            description: String(i.description ?? ""),
            tier: lock ? "locked" : "sale",
            reason: lock,
            hint: "",
            hidePrice: !!i.hidePrice,
            stock: null,
            restockNote: "",
            category: OLD_SHOP_CATEGORY[String(i.shopId)] ?? "gear",
            kind: "purchase"
        };
    });
    const live = {
        ...g.live,
        shopOpen: false
    };
    return withRequests({
        ...g,
        schema: 2,
        shops,
        items,
        live,
        orders: [],
        banner: null
    });
}
/** Phone purchase requests and the progression shop arrived after schema 2; older saves just have none. */ function withRequests(g) {
    const empty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyProgress"])();
    const current = Array.isArray(g.requests) && Object.keys(empty).every((k)=>g[k] !== undefined) && g.items.every((i)=>i.category && i.kind);
    if (current) return g;
    const out = Array.isArray(g.requests) ? {
        ...g
    } : {
        ...g,
        requests: []
    };
    for (const k of Object.keys(empty)){
        if (out[k] === undefined) out[k] = empty[k];
    }
    if (out.items.some((i)=>!i.category || !i.kind)) {
        out.items = out.items.map((i)=>i.category && i.kind ? i : {
                ...i,
                category: i.category ?? OLD_SHOP_CATEGORY[i.shopId] ?? "gear",
                kind: i.kind ?? (i.arrivesInSessions ? "order" : "purchase")
            });
    }
    return out;
}
/** Best guess for items made before categories (the old seed's shops). */ const OLD_SHOP_CATEGORY = {
    general: "gear",
    smith: "gear",
    apoth: "healing",
    candle: "services",
    docks: "travel",
    town: "building",
    bg: "magic",
    training: "services",
    peddler: "magic"
};
}),
"[project]/src/shared/money.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// All money is stored as integer copper pieces.
// 1 gp = 100 cp, 1 sp = 10 cp. pp and ep are accepted when parsing.
__turbopack_context__.s([
    "CP",
    ()=>CP,
    "EP",
    ()=>EP,
    "GP",
    ()=>GP,
    "PP",
    ()=>PP,
    "SP",
    ()=>SP,
    "canAfford",
    ()=>canAfford,
    "cpToGpInput",
    ()=>cpToGpInput,
    "formatCp",
    ()=>formatCp,
    "formatDelta",
    ()=>formatDelta,
    "parseAmount",
    ()=>parseAmount
]);
const CP = 1;
const SP = 10;
const EP = 50;
const GP = 100;
const PP = 1000;
const MINUS = "−"; // a real minus sign, not a hyphen
function formatCp(cp) {
    if (!Number.isFinite(cp)) return "0 gp";
    let n = Math.round(cp);
    const neg = n < 0;
    n = Math.abs(n);
    const g = Math.floor(n / GP);
    const s = Math.floor(n % GP / SP);
    const c = n % SP;
    const parts = [];
    if (g) parts.push(`${g.toLocaleString("en-US")} gp`);
    if (s) parts.push(`${s} sp`);
    if (c) parts.push(`${c} cp`);
    return (neg ? MINUS : "") + (parts.join(" ") || "0 gp");
}
function formatDelta(cp) {
    if (cp > 0) return "+" + formatCp(cp);
    return formatCp(cp);
}
const UNIT = {
    pp: PP,
    gp: GP,
    ep: EP,
    sp: SP,
    cp: CP,
    p: PP,
    g: GP,
    e: EP,
    s: SP,
    c: CP
};
function parseAmount(input) {
    const text = input.trim().toLowerCase().replace(/,/g, "");
    if (!text) return null;
    if (/^\d+(\.\d+)?$/.test(text)) {
        const v = Math.round(parseFloat(text) * GP);
        return Number.isSafeInteger(v) ? v : null;
    }
    const re = /(\d+(?:\.\d+)?)\s*(pp|gp|ep|sp|cp|p|g|e|s|c)\b/g;
    let total = 0;
    let consumed = "";
    let m;
    while(m = re.exec(text)){
        total += parseFloat(m[1]) * UNIT[m[2]];
        consumed += m[0];
    }
    // Everything that isn't whitespace must have been part of an amount.
    if (consumed.replace(/\s/g, "") !== text.replace(/\s/g, "")) return null;
    const v = Math.round(total);
    return Number.isSafeInteger(v) ? v : null;
}
function cpToGpInput(cp) {
    return String(Math.round(cp) / GP);
}
function canAfford(balanceCp, priceCp) {
    return balanceCp >= priceCp;
}
}),
"[project]/src/shared/progress.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// The shop as progression: categories, discounts, credit, shares, and what's
// due at session end. Pure helpers shared by the reducer, projection and UI.
__turbopack_context__.s([
    "CATEGORIES",
    ()=>CATEGORIES,
    "CATEGORY_IDS",
    ()=>CATEGORY_IDS,
    "KINDS",
    ()=>KINDS,
    "KIND_IDS",
    ()=>KIND_IDS,
    "MAX_DISCOUNT",
    ()=>MAX_DISCOUNT,
    "categoryLabel",
    ()=>categoryLabel,
    "creditCp",
    ()=>creditCp,
    "creditLines",
    ()=>creditLines,
    "discountPct",
    ()=>discountPct,
    "duesFor",
    ()=>duesFor,
    "firstChargeCp",
    ()=>firstChargeCp,
    "installmentCp",
    ()=>installmentCp,
    "keepsStake",
    ()=>keepsStake,
    "liveEffects",
    ()=>liveEffects,
    "parseDice",
    ()=>parseDice,
    "priceOf",
    ()=>priceOf,
    "raisedCp",
    ()=>raisedCp,
    "rollDice",
    ()=>rollDice,
    "sharesOf",
    ()=>sharesOf,
    "splitByShare",
    ()=>splitByShare,
    "stakeTotals",
    ()=>stakeTotals
]);
const CATEGORIES = [
    {
        id: "gear",
        label: "Gear"
    },
    {
        id: "healing",
        label: "Healing"
    },
    {
        id: "magic",
        label: "Magic"
    },
    {
        id: "travel",
        label: "Travel"
    },
    {
        id: "services",
        label: "Services"
    },
    {
        id: "building",
        label: "Building Candlefair"
    },
    {
        id: "trophies",
        label: "Trophies"
    }
];
const CATEGORY_IDS = CATEGORIES.map((c)=>c.id);
const KINDS = [
    {
        id: "purchase",
        label: "Purchase (pay, done)"
    },
    {
        id: "recurring",
        label: "Recurring (price per month)"
    },
    {
        id: "service",
        label: "Service (you answer it)"
    },
    {
        id: "order",
        label: "Special order (arrives later)"
    },
    {
        id: "training",
        label: "Training (paid in installments)"
    },
    {
        id: "project",
        label: "Project (pooled; price is the goal)"
    },
    {
        id: "earned",
        label: "Earned (you grant it)"
    }
];
const KIND_IDS = KINDS.map((k)=>k.id);
function categoryLabel(c) {
    return CATEGORIES.find((x)=>x.id === c)?.label ?? c;
}
const MAX_DISCOUNT = 50;
function liveEffects(s, type) {
    const out = [];
    for (const item of s.items){
        if (!s.effectsOn[item.id]) continue;
        for (const e of item.effects ?? [])if (e.type === type) out.push({
            item,
            effect: e
        });
    }
    return out;
}
function discountPct(s, item) {
    if (item.kind === "project" || item.kind === "earned") return 0;
    let pct = 0;
    for (const { effect } of liveEffects(s, "discount")){
        const hit = effect.category && effect.category === item.category || effect.tag && item.tags?.includes(effect.tag);
        if (hit) pct += effect.pct;
    }
    return Math.max(0, Math.min(MAX_DISCOUNT, pct));
}
function priceOf(s, item) {
    const pct = discountPct(s, item);
    return pct ? Math.round(item.priceCp * (100 - pct) / 100) : item.priceCp;
}
function installmentCp(totalCp, of, paid) {
    const n = Math.max(1, of);
    const each = Math.round(totalCp / n);
    return paid >= n - 1 ? totalCp - each * (n - 1) : each;
}
function firstChargeCp(s, item) {
    const price = priceOf(s, item);
    if (item.kind === "training") return installmentCp(price, item.installments ?? 1, 0);
    return price;
}
function creditCp(s, playerId, shopId) {
    if (!shopId) return 0;
    let limit = 0;
    for (const { item, effect } of liveEffects(s, "credit")){
        if (item.shopId !== shopId) continue;
        if (s.stakes.some((k)=>k.itemId === item.id && k.playerId === playerId)) limit += effect.limitCp;
    }
    return limit;
}
function creditLines(s, playerId) {
    const by = new Map();
    for (const { item, effect } of liveEffects(s, "credit")){
        if (s.stakes.some((k)=>k.itemId === item.id && k.playerId === playerId)) by.set(item.shopId, (by.get(item.shopId) ?? 0) + effect.limitCp);
    }
    return [
        ...by
    ].map(([shopId, limitCp])=>({
            shopId,
            limitCp
        }));
}
function sharesOf(s, itemId) {
    const m = new Map();
    for (const k of s.stakes)if (k.itemId === itemId) m.set(k.playerId, (m.get(k.playerId) ?? 0) + k.cp);
    return m;
}
function raisedCp(s, itemId) {
    let t = 0;
    for (const k of s.stakes)if (k.itemId === itemId) t += k.cp;
    return t;
}
function splitByShare(totalCp, shares) {
    const sum = shares.reduce((a, [, v])=>a + v, 0);
    if (sum <= 0 || totalCp <= 0) return shares.map(([id])=>[
            id,
            0
        ]);
    const raw = shares.map(([id, v], i)=>({
            id,
            i,
            exact: totalCp * v / sum
        }));
    const out = raw.map((r)=>({
            ...r,
            cp: Math.floor(r.exact)
        }));
    let left = totalCp - out.reduce((a, r)=>a + r.cp, 0);
    const order = [
        ...out
    ].sort((a, b)=>b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)) || a.i - b.i);
    for (const r of order){
        if (left <= 0) break;
        r.cp++;
        left--;
    }
    return out.map((r)=>[
            r.id,
            r.cp
        ]);
}
function parseDice(text) {
    const t = text.trim().toLowerCase().replace(/\s+/g, "");
    if (/^\d+$/.test(t)) return {
        n: 0,
        sides: 0,
        plus: Number(t)
    };
    const m = /^(\d*)d(\d+)([+-]\d+)?$/.exec(t);
    if (!m) return null;
    const n = m[1] ? Number(m[1]) : 1;
    const sides = Number(m[2]);
    if (n < 1 || n > 20 || sides < 2 || sides > 100) return null;
    return {
        n,
        sides,
        plus: m[3] ? Number(m[3]) : 0
    };
}
function rollDice(text, rand) {
    const d = parseDice(text);
    if (!d) return 0;
    let t = d.plus;
    for(let i = 0; i < d.n; i++)t += 1 + Math.floor(rand() * d.sides);
    return Math.max(0, t);
}
function duesFor(s, number) {
    const rent = s.rentals.filter((r)=>r.active && r.paidThrough < number).map((r)=>({
            id: r.id,
            kind: "rent",
            playerId: r.playerId,
            itemName: r.itemName,
            cp: r.monthlyCp
        }));
    const lessons = s.trainings.filter((t)=>!t.done && !t.cancelled && t.paidThrough < number).map((t)=>({
            id: t.id,
            kind: "lesson",
            playerId: t.playerId,
            itemName: t.itemName,
            cp: installmentCp(t.totalCp, t.of, t.paid),
            step: `${t.paid + 1} of ${t.of}`
        }));
    return [
        ...rent,
        ...lessons
    ];
}
function keepsStake(item) {
    return item.kind === "project" || !!item.keep || !!item.effects?.length;
}
function stakeTotals(stakes, playerId) {
    const m = new Map();
    for (const k of stakes)if (k.playerId === playerId) m.set(k.itemId, (m.get(k.itemId) ?? 0) + k.cp);
    return m;
}
}),
"[project]/src/shared/projection.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GATED_ART",
    ()=>GATED_ART,
    "artForPublic",
    ()=>artForPublic,
    "gatedArtIsLive",
    ()=>gatedArtIsLive,
    "projectDm",
    ()=>projectDm,
    "projectPlayer",
    ()=>projectPlayer,
    "projectTv",
    ()=>projectTv,
    "publicMap",
    ()=>publicMap,
    "sealText",
    ()=>sealText,
    "shopVisibleTo",
    ()=>shopVisibleTo
]);
// Spoiler safety lives here. Each role gets a view built field-by-field from
// an explicit allow-list, so a new DM-only field can't leak by accident.
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/requests.ts [app-route] (ecmascript)");
;
;
const GATED_ART = new Set([
    "merchant-sigil"
]);
function artForPublic(game, sc) {
    const builtin = sc.art?.builtin;
    if (builtin && GATED_ART.has(builtin)) {
        // Gated art is only described to the TV while live, via a route that re-checks.
        return {
            url: `/api/art/${builtin}?game=${encodeURIComponent(game.id)}`
        };
    }
    const art = {};
    if (builtin) art.builtin = builtin;
    if (sc.art?.url) art.url = sc.art.url;
    return art;
}
function publicScene(game, sc) {
    const out = {
        id: sc.id,
        kind: sc.kind,
        art: artForPublic(game, sc)
    };
    if (sc.name !== undefined) out.name = sc.name;
    if (sc.title !== undefined) out.title = sc.title;
    if (sc.alt !== undefined) out.alt = sc.alt;
    if (sc.kind === "map" && sc.map) out.map = publicMap(game, sc);
    return out;
}
function publicMap(game, sc) {
    const m = sc.map;
    const isLive = game.live.sceneId === sc.id;
    const shown = m.pins.filter((p)=>p.discovered);
    const focus = isLive && game.live.focus && shown.some((p)=>p.id === game.live.focus.pinId) ? game.live.focus : undefined;
    const out = {
        pins: shown.map((p)=>{
            const pin = {
                id: p.id,
                label: sealText(p),
                x: p.x,
                y: p.y
            };
            if (m.legendStyle === "names" || focus?.pinId === p.id) {
                pin.name = p.name;
                pin.type = p.type;
                pin.description = p.description;
            }
            return pin;
        }),
        legend: {
            on: m.legendOn,
            style: m.legendStyle
        }
    };
    if (focus) out.focus = {
        pinId: focus.pinId,
        n: focus.n
    };
    const b = isLive ? game.live.banner : undefined;
    const bannerPin = b && shown.find((p)=>p.id === b.pinId);
    if (b && bannerPin) out.banner = {
        n: b.n,
        name: bannerPin.name
    };
    return out;
}
function sealText(p) {
    return p.showsAs.trim() || String(p.number);
}
function shopVisibleTo(shop, viewer) {
    if (shop.visibility === "all") return true;
    if (shop.visibility === "some" && !viewer.tv) return shop.playerIds.includes(viewer.playerId);
    return false;
}
function publicItem(game, it) {
    if (it.tier === "hidden") return null;
    if (it.tier === "rumored") {
        // Name, price and description stay on the server; only the hint goes out.
        return {
            id: it.id,
            shopId: it.shopId,
            name: "???",
            priceCp: null,
            description: "",
            tier: "rumored",
            hint: it.hint,
            stock: null,
            category: it.category,
            kind: it.kind
        };
    }
    const hide = it.tier === "locked" && it.hidePrice;
    const out = {
        id: it.id,
        shopId: it.shopId,
        name: it.name,
        priceCp: hide ? null : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["priceOf"])(game, it),
        description: it.description,
        tier: it.tier,
        stock: it.stock,
        category: it.category,
        kind: it.kind
    };
    const pct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["discountPct"])(game, it);
    if (pct && !hide) {
        out.listCp = it.priceCp;
        out.discountPct = pct;
    }
    if (it.kind === "training") {
        out.installments = it.installments ?? 1;
        if (!hide) out.dueNowCp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["firstChargeCp"])(game, it);
    }
    if (it.prompt) out.prompt = it.prompt;
    if (it.flyer) out.flyer = true;
    if (it.kind === "project") {
        out.raisedCp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["raisedCp"])(game, it.id);
        if (game.effectsOn[it.id]) out.funded = true;
    }
    if (it.kind === "earned") {
        const ids = new Set(game.awards.filter((a)=>a.itemId === it.id).flatMap((a)=>a.playerIds));
        out.earnedBy = game.players.filter((p)=>ids.has(p.id)).map((p)=>p.name);
    }
    if (it.tier === "locked") out.reason = it.reason;
    if (it.priceLabel) out.priceLabel = it.priceLabel;
    if (it.finePrint) out.finePrint = it.finePrint;
    if (it.arrivesInSessions) out.arrivesInSessions = it.arrivesInSessions;
    if (it.stock === 0 && it.restockNote) out.restockNote = it.restockNote;
    if (it.oneAtATime || it.arrivesInSessions || it.kind !== "purchase") out.oneAtATime = true;
    if (it.stock !== null) {
        const held = Math.min(it.stock, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heldStock"])(game, it.id));
        if (held > 0) out.held = held;
    }
    return out;
}
function common(game, version, viewer) {
    const cur = game.sessions.find((x)=>x.id === game.currentSessionId);
    const shops = game.shops.filter((sh)=>shopVisibleTo(sh, viewer));
    const open = new Set(shops.filter((sh)=>!sh.closed).map((sh)=>sh.id));
    return {
        version,
        game: {
            id: game.id,
            name: game.name
        },
        purse: game.players.filter((p)=>!p.archived && !p.away).map((p)=>({
                id: p.id,
                name: p.name,
                balanceCp: p.balanceCp,
                inspired: !!p.inspired
            })),
        shops: shops.map((x)=>({
                id: x.id,
                name: x.name,
                subtitle: x.subtitle,
                closed: !!x.closed
            })),
        items: game.items.filter((it)=>open.has(it.shopId)).map((it)=>publicItem(game, it)).filter((x)=>x !== null),
        session: cur ? {
            number: cur.number,
            title: cur.title
        } : null,
        banner: game.banner ? {
            ...game.banner
        } : null
    };
}
/** The shop on the TV, but only if the viewer can see it (never leak a hidden shop's id). */ function liveShop(game, viewer) {
    const sh = game.shops.find((x)=>x.id === game.live.shopId);
    const ok = !!sh && shopVisibleTo(sh, {
        tv: true
    }) && shopVisibleTo(sh, viewer);
    return {
        shopOpen: ok && game.live.shopOpen,
        shopId: ok ? game.live.shopId : ""
    };
}
function projectTv(game, version) {
    return {
        ...common(game, version, {
            tv: true
        }),
        role: "tv",
        live: {
            sceneId: game.live.sceneId,
            ...liveShop(game, {
                tv: true
            }),
            purseVisible: game.live.purseVisible,
            ...game.live.shopCategory ? {
                shopCategory: game.live.shopCategory
            } : {}
        },
        flyers: game.flyers.filter((f)=>f.up).map((f)=>({
                id: f.id,
                title: f.title,
                body: f.body,
                signedBy: f.signedBy
            })),
        scenes: game.scenes.filter((sc)=>!sc.reveal || sc.id === game.live.sceneId).map((sc)=>publicScene(game, sc)),
        recap: publicRecap(game)
    };
}
function publicRecap(game) {
    const sess = game.live.recapSessionId ? game.sessions.find((x)=>x.id === game.live.recapSessionId) : undefined;
    return sess?.recap?.trim() ? {
        number: sess.number,
        title: sess.title,
        text: sess.recap
    } : null;
}
function projectPlayer(game, version, playerId, ledger) {
    const p = game.players.find((x)=>x.id === playerId);
    if (!p) throw new Error("No such player");
    return {
        ...common(game, version, {
            tv: false,
            playerId
        }),
        role: "player",
        ...game.vttUrl ? {
            vttUrl: game.vttUrl
        } : {},
        live: {
            ...liveShop(game, {
                tv: false,
                playerId
            }),
            purseVisible: game.live.purseVisible
        },
        myOrders: game.orders.filter((o)=>o.playerId === p.id).map((o)=>({
                id: o.id,
                itemName: o.itemName,
                arrivesAtSession: o.arrivesAtSession,
                arrived: o.arrived
            })),
        me: {
            id: p.id,
            handle: p.handle,
            name: p.name,
            balanceCp: p.balanceCp,
            ...p.dndbUrl ? {
                dndbUrl: p.dndbUrl
            } : {},
            locked: !!p.keyHash,
            archived: p.archived,
            heldCp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heldCp"])(game, p.id)
        },
        myRequests: game.requests.filter((r)=>r.playerId === p.id).slice(-50).reverse().map((r)=>{
            const out = {
                id: r.id,
                kind: r.kind,
                at: r.at,
                status: r.status,
                totalCp: r.totalCp,
                note: r.note,
                qty: r.qty
            };
            if (r.itemName !== undefined) out.itemName = r.itemName;
            if (r.toPlayerName !== undefined) out.toPlayerName = r.toPlayerName;
            if (r.decidedAt !== undefined) out.decidedAt = r.decidedAt;
            if (r.reason !== undefined) out.reason = r.reason;
            if (r.chargedCp !== undefined) out.chargedCp = r.chargedCp;
            if (r.question) out.question = r.question;
            if (r.answer) out.answer = r.answer;
            if (r.flyer) out.flyerTitle = r.flyer.title;
            return out;
        }),
        mine: myThings(game, p.id),
        table: game.players.filter((x)=>!x.archived && x.id !== p.id).map((x)=>({
                id: x.id,
                name: x.name
            })),
        myLedger: ledger.filter((l)=>l.playerId === p.id).slice(-100).reverse().map((l)=>({
                id: l.id,
                at: l.at,
                amountCp: l.amountCp,
                note: l.note
            }))
    };
}
function myThings(game, playerId) {
    const items = new Map(game.items.map((i)=>[
            i.id,
            i
        ]));
    return {
        rentals: game.rentals.filter((r)=>r.playerId === playerId && r.active).map((r)=>({
                id: r.id,
                itemName: r.itemName,
                monthlyCp: r.monthlyCp
            })),
        trainings: game.trainings.filter((t)=>t.playerId === playerId && !t.cancelled).map((t)=>({
                id: t.id,
                itemName: t.itemName,
                what: t.what,
                paid: t.paid,
                of: t.of,
                done: t.done
            })),
        stakes: [
            ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["stakeTotals"])(game.stakes, playerId)
        ].flatMap(([itemId, cp])=>{
            const it = items.get(itemId);
            if (!it) return [];
            const project = it.kind === "project";
            return [
                {
                    itemId,
                    itemName: it.name,
                    cp,
                    project,
                    ...project ? {
                        goalCp: it.priceCp,
                        raisedCp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["raisedCp"])(game, itemId),
                        funded: !!game.effectsOn[itemId]
                    } : {}
                }
            ];
        }),
        awards: game.awards.filter((a)=>a.playerIds.includes(playerId)).map((a)=>({
                id: a.id,
                itemName: a.itemName,
                at: a.at,
                note: a.note
            })),
        credit: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["creditLines"])(game, playerId).map((c)=>({
                shopId: c.shopId,
                shopName: game.shops.find((x)=>x.id === c.shopId)?.name ?? "the shop",
                limitCp: c.limitCp
            }))
    };
}
function projectDm(game, version, ledger) {
    const { players, ...rest } = structuredClone(game);
    return {
        role: "dm",
        version,
        state: {
            ...rest,
            players: players.map(({ keyHash, ...p })=>({
                    ...p,
                    hasKey: !!keyHash
                }))
        },
        ledger: [
            ...ledger
        ].reverse()
    };
}
function gatedArtIsLive(game, builtin) {
    const live = game.scenes.find((sc)=>sc.id === game.live.sceneId);
    return !!live && live.art?.builtin === builtin;
}
}),
"[project]/src/shared/reducer.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Pure game rules. Every write goes: validate actor -> apply() -> atomic save.
// apply() never mutates its input and never does I/O, so it's easy to test.
__turbopack_context__.s([
    "CommandError",
    ()=>CommandError,
    "apply",
    ()=>apply,
    "curRunEpisode",
    ()=>curRunEpisode,
    "emptyMap",
    ()=>emptyMap,
    "isDmCommand",
    ()=>isDmCommand,
    "lowestFreeNumber",
    ()=>lowestFreeNumber,
    "nextSessionNumber",
    ()=>nextSessionNumber,
    "previousRecap",
    ()=>previousRecap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/handles.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/requests.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/seed.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/projection.ts [app-route] (ecmascript)");
;
;
;
;
;
;
class CommandError extends Error {
    code;
    /** "recheck": a phone request no longer works at approval time; the DM may override or decline. */ constructor(message, code){
        super(message), this.code = code;
    }
}
function fail(msg, code) {
    throw new CommandError(msg, code);
}
function isDmCommand(type) {
    return !type.startsWith("me.") && !type.startsWith("system.");
}
function apply(input, cmd, ctx) {
    // Authorisation is checked again here so a wiring mistake can't let a player run DM commands.
    if (isDmCommand(cmd.type) && ctx.actor.role !== "dm") fail("Only the DM can do that.");
    if (cmd.type.startsWith("me.") && ctx.actor.role !== "player") fail("Only a player can do that.");
    if (cmd.type.startsWith("system.") && ctx.actor.role !== "system") fail("Not allowed.");
    const s = structuredClone(input);
    // The server fills in the seed episode when it reads an older game (see withSeedEpisodes on the server).
    const episodes = s.episodes ??= [];
    const ledger = [];
    const out = {
        state: s,
        ledger
    };
    const nextId = (prefix)=>prefix + (++s.seq).toString(36);
    const player = (id)=>s.players.find((p)=>p.id === id) ?? fail("That player isn't here.");
    const scene = (id)=>s.scenes.find((x)=>x.id === id) ?? fail("That scene doesn't exist.");
    const shop = (id)=>s.shops.find((x)=>x.id === id) ?? fail("That shop doesn't exist.");
    /** A short TV banner. Several in one command (an order arrives and income pays out) share it. */ const said = [];
    const announce = (text)=>{
        said.push(text);
        s.banner = {
            id: s.banner && said.length > 1 ? s.banner.id : nextId("bn"),
            text: said.join(" · "),
            at: ctx.now
        };
    };
    /** Announce only what the whole room may see: storefronts open to everyone, never secret ones. */ const announcePublic = (shopId, text)=>{
        const sh = s.shops.find((x)=>x.id === shopId);
        if (sh && sh.visibility === "all" && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSecretShop"])(sh)) announce(text);
    };
    const rand = ctx.rand ?? Math.random;
    const item = (id)=>s.items.find((x)=>x.id === id) ?? fail("That item doesn't exist.");
    /** The session a payment made now covers: the running one, or the next one between sessions. */ const coversSession = ()=>s.sessions.find((x)=>x.id === s.currentSessionId)?.number ?? nextSessionNumber(s);
    const task = (text, extra = {})=>{
        s.tasks.push({
            id: nextId("t"),
            at: ctx.now,
            text,
            done: false,
            ...extra
        });
        // Keep every open task and the latest 100 done ones.
        const done = s.tasks.filter((t)=>t.done);
        if (done.length > 100) {
            const drop = new Set(done.slice(0, done.length - 100).map((t)=>t.id));
            s.tasks = s.tasks.filter((t)=>!drop.has(t.id));
        }
    };
    const RANK = {
        hidden: 0,
        rumored: 1,
        locked: 2,
        sale: 3
    };
    /** Banner when an item becomes more visible in a shop the whole party can see. */ const announceItem = (it, was)=>{
        const sh = shop(it.shopId);
        if (sh.visibility !== "all" || sh.closed || RANK[it.tier] <= RANK[was]) return;
        if (it.tier === "rumored") announce(`A new rumor at ${sh.name}`);
        else announce(`New at ${sh.name}: ${it.name}`);
    };
    const move = (p, amountCp, note, kind, extra = {})=>{
        p.balanceCp += amountCp;
        ledger.push({
            id: nextId("l"),
            at: ctx.now,
            playerId: p.id,
            playerName: p.name,
            amountCp,
            note,
            kind,
            sessionId: s.currentSessionId,
            ...extra
        });
    };
    /** Effects apply once per item: unlocks and discounts the first time, credit and income for every stake. */ const turnOn = (it)=>{
        if (s.effectsOn[it.id]) return;
        s.effectsOn[it.id] = ctx.now;
        for (const e of it.effects ?? []){
            if (e.type !== "unlock") continue;
            const target = e.itemId ? s.items.find((x)=>x.id === e.itemId) : undefined;
            if (target && target.tier !== "sale") {
                const was = target.tier;
                target.tier = "sale";
                announceItem(target, was);
            }
            const sh = e.shopId ? s.shops.find((x)=>x.id === e.shopId) : undefined;
            if (sh && sh.visibility !== "all") {
                sh.visibility = "all";
                sh.playerIds = [];
                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSecretShop"])(sh)) announce(sh.closed ? `${sh.name} has come to town` : `Now open: ${sh.name}`);
            }
        }
    };
    const addStake = (it, p, cp)=>{
        const k = s.stakes.find((x)=>x.itemId === it.id && x.playerId === p.id);
        if (k) k.cp += cp;
        else s.stakes.push({
            itemId: it.id,
            playerId: p.id,
            cp,
            at: ctx.now
        });
    };
    /** Money toward a project. Funding it applies its effects, once. */ const contribute = (p, it, cp, extra = {})=>{
        move(p, -cp, `Put ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(cp)} toward ${it.name}`, "contribution", {
            itemId: it.id,
            ...extra
        });
        addStake(it, p, cp);
        if (!s.effectsOn[it.id] && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["raisedCp"])(s, it.id) >= it.priceCp) {
            announcePublic(it.shopId, `Funded: ${it.name}!`);
            turnOn(it);
            const who = [
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sharesOf"])(s, it.id).keys()
            ].map((id)=>s.players.find((x)=>x.id === id)?.name ?? "someone").join(", ");
            task(`Funded: ${it.name} (by ${who}).${it.dmNote ? ` Your note: ${it.dmNote}` : ""}`, {
                itemId: it.id
            });
        }
    };
    /** Fails unless a project can still take money; returns what's left to raise. */ const projectLeft = (it, recheck = false)=>{
        if (it.kind !== "project") fail(`${it.name} isn't a project.`);
        if (s.effectsOn[it.id]) fail(`${it.name} is already funded.`, recheck ? "recheck" : undefined);
        return Math.max(0, it.priceCp - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["raisedCp"])(s, it.id));
    };
    /** Can p pay this here? Credit (Mags's tab) only counts at its own storefront. */ const canPay = (p, cp, shopId)=>p.balanceCp - cp >= -(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["creditCp"])(s, p.id, shopId);
    /**
   * Take stock, write the ledger, and do whatever this kind of item does:
   * place an order, start a rental or lessons, post a flyer. Checks are the caller's job.
   */ const fulfil = (p, it, qty, chargeCp, extra = {}, more = {})=>{
        if (it.kind === "earned") fail(`${it.name} can't be bought. You grant it.`);
        if (it.kind === "project") fail(`${it.name} is a project: contribute to it instead.`);
        if (it.stock !== null) it.stock = Math.max(0, it.stock - qty);
        const listCp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["firstChargeCp"])(s, it) * qty;
        const haggled = chargeCp !== listCp ? ` (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(listCp)}, settled at ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(chargeCp)})` : "";
        const what = qty > 1 ? `${qty} × ${it.name}` : it.name;
        const ledgerExtra = {
            itemId: it.id,
            ...chargeCp !== listCp ? {
                listCp
            } : {},
            ...extra
        };
        const question = more.question?.trim();
        if (it.kind === "recurring") {
            move(p, -chargeCp, `Rented ${it.name} (first month)${haggled}`, "rent", ledgerExtra);
            s.rentals.push({
                id: nextId("rn"),
                itemId: it.id,
                itemName: it.name,
                playerId: p.id,
                monthlyCp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["priceOf"])(s, it),
                startedAt: ctx.now,
                paidThrough: coversSession(),
                active: true
            });
        } else if (it.kind === "training") {
            const of = it.installments ?? 1;
            const totalCp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["priceOf"])(s, it) - listCp + chargeCp;
            const t = {
                id: nextId("tr"),
                itemId: it.id,
                itemName: it.name,
                playerId: p.id,
                what: question ?? "",
                totalCp,
                of,
                paid: 1,
                paidCp: chargeCp,
                paidThrough: coversSession(),
                done: of <= 1
            };
            s.trainings.push(t);
            move(p, -chargeCp, `${it.name}${t.what ? ` (${t.what})` : ""}: lesson 1 of ${of}${haggled}`, "purchase", ledgerExtra);
            if (t.done) task(`Record a new proficiency: ${p.name} finished ${it.name}${t.what ? `: ${t.what}` : ""}.`, {
                playerId: p.id,
                itemId: it.id
            });
        } else if (it.arrivesInSessions) {
            const now = s.sessions.find((x)=>x.id === s.currentSessionId)?.number ?? nextSessionNumber(s) - 1;
            const arrivesAtSession = now + it.arrivesInSessions;
            for(let i = 0; i < qty; i++){
                s.orders.push({
                    id: nextId("o"),
                    playerId: p.id,
                    itemId: it.id,
                    itemName: it.name,
                    priceCp: Math.round(chargeCp / qty),
                    orderedAt: ctx.now,
                    arrivesAtSession,
                    arrived: false
                });
            }
            move(p, -chargeCp, `Ordered ${what} (arrives session ${arrivesAtSession})${haggled}`, "purchase", ledgerExtra);
        } else if (it.kind === "service") {
            move(p, -chargeCp, `${it.name}${question ? `: ${question}` : ""}${haggled}`, "purchase", ledgerExtra);
            if (more.flyer) s.flyers.push({
                id: nextId("fl"),
                playerId: p.id,
                ...cleanFlyer(more.flyer, p.name),
                postedAt: ctx.now,
                up: true
            });
        } else {
            move(p, -chargeCp, `Bought ${what}${haggled}`, "purchase", ledgerExtra);
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["keepsStake"])(it)) addStake(it, p, chargeCp);
        if (it.effects?.length) turnOn(it);
    };
    const request = (id)=>s.requests.find((r)=>r.id === id) ?? fail("That request doesn't exist.");
    /** Keep every pending request and the latest 150 decided ones. */ const pruneRequests = ()=>{
        const decided = s.requests.filter((r)=>r.status !== "pending");
        if (decided.length <= 150) return;
        const drop = new Set(decided.slice(0, decided.length - 150).map((r)=>r.id));
        s.requests = s.requests.filter((r)=>!drop.has(r.id));
    };
    /**
   * Approve one request. Every check runs before anything changes, so a
   * failed check leaves the state untouched (Approve all relies on that).
   */ const approve = (r, totalCp, override, more = {})=>{
        if (r.status !== "pending") fail(`That request was already ${r.status}.`);
        const p = player(r.playerId);
        if (r.kind === "contribute") {
            const it = s.items.find((x)=>x.id === r.itemId) ?? fail(`${r.itemName ?? "That project"} is no longer in the shop. Decline it instead.`);
            const left = projectLeft(it, true);
            // Never take more than the project still needs.
            const charge = Math.min(totalCp ?? r.totalCp, left);
            if (!override) {
                if (p.archived) fail(`${p.name} has left the table.`, "recheck");
                if (p.balanceCp < charge) fail(`${p.name} only has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)} now, not ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(charge)}.`, "recheck");
            }
            contribute(p, it, charge, {
                requestId: r.id
            });
            r.chargedCp = charge;
            r.status = "approved";
            r.decidedAt = ctx.now;
            return;
        }
        if (r.kind === "give") {
            const to = player(r.toPlayerId ?? "");
            if (!override && p.balanceCp < r.totalCp) fail(`${p.name} only has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)} now, not ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)}.`, "recheck");
            if (!override && to.archived) fail(`${to.name} has left the table.`, "recheck");
            const batchId = nextId("b");
            const note = r.note ? `: ${r.note}` : "";
            move(p, -r.totalCp, `Sent ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)} to ${to.name}${note}`, "transfer", {
                batchId,
                requestId: r.id
            });
            move(to, r.totalCp, `From ${p.name}${note}`, "transfer", {
                batchId,
                requestId: r.id
            });
            r.chargedCp = r.totalCp;
        } else {
            const item = s.items.find((x)=>x.id === r.itemId) ?? fail(`${r.itemName ?? "That item"} is no longer in the shop. Decline it instead.`);
            const charge = totalCp ?? r.totalCp;
            if (!override) {
                if (p.archived) fail(`${p.name} has left the table.`, "recheck");
                if (!canPay(p, charge, item.shopId)) fail(`${p.name} only has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)} now, not ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(charge)}.`, "recheck");
                if (item.kind === "recurring" && s.rentals.some((x)=>x.active && x.itemId === item.id && x.playerId === p.id)) fail(`${p.name} already rents ${item.name}.`, "recheck");
                if (item.stock !== null && item.stock - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["heldStock"])(s, item.id, r.id) < r.qty) {
                    fail(item.stock === 0 ? `${item.name} is sold out now.` : `Only ${item.stock} ${item.name} left now.`, "recheck");
                }
                if (item.tier !== "sale") fail(`${item.name} isn't for sale any more.`, "recheck");
            }
            const flyer = more.flyer ?? r.flyer;
            if (flyer) r.flyer = cleanFlyer(flyer, p.name);
            fulfil(p, item, r.qty, charge, {
                requestId: r.id
            }, {
                question: r.question,
                flyer: r.flyer
            });
            r.chargedCp = charge;
            const answer = more.answer?.trim();
            if (answer) r.answer = answer;
            if (s.tvPurchases !== false && !r.secret && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSecretShop"])(s.shops.find((x)=>x.id === item.shopId)) && (item.kind === "purchase" || item.kind === "order")) {
                announce(`${p.name} bought ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["boughtPhrase"])(item.name, r.qty)}`);
            }
        }
        r.status = "approved";
        r.decidedAt = ctx.now;
    };
    /** The player sending a me.* command. */ const me = ()=>{
        const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
        if (p.archived) fail("You've left the table. Ask the DM to bring you back.");
        return p;
    };
    const uniqueHandle = (base, exceptId)=>{
        let h = base || "player";
        let n = 2;
        while((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReservedHandle"])(h) || s.players.some((p)=>p.handle === h && p.id !== exceptId))h = `${base}${n++}`;
        return h;
    };
    const createPlayer = (handle, name, via, keyHash)=>{
        const p = {
            id: nextId("p"),
            handle: uniqueHandle(handle),
            name: name.trim().slice(0, 32) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["displayNameFrom"])(handle),
            away: false,
            archived: false,
            dropIn: via === "url",
            balanceCp: 0,
            createdAt: ctx.now,
            createdVia: via,
            ...keyHash ? {
                keyHash
            } : {}
        };
        s.players.push(p);
        out.playerId = p.id;
        markAttending(p.id);
        return p;
    };
    const markAttending = (playerId)=>{
        const cur = s.sessions.find((x)=>x.id === s.currentSessionId);
        if (cur && !cur.attendeeIds.includes(playerId)) cur.attendeeIds.push(playerId);
    };
    const homeScene = ()=>(s.scenes.find((x)=>x.kind === "notice" && !x.reveal) ?? s.scenes.find((x)=>!x.reveal) ?? s.scenes[0]).id;
    const showScene = (id)=>{
        s.live.sceneId = id;
        s.live.shopOpen = false;
        delete s.live.recapSessionId;
        delete s.live.focus;
        delete s.live.banner;
    };
    const startSession = (title)=>{
        const number = nextSessionNumber(s);
        const sess = {
            id: nextId("sess"),
            number,
            title: title?.trim() || `Session ${number}`,
            startedAt: ctx.now,
            endedAt: null,
            attendeeIds: s.players.filter((p)=>!p.archived && !p.away).map((p)=>p.id)
        };
        s.sessions.push(sess);
        s.currentSessionId = sess.id;
        showScene(homeScene());
        // Special orders due by this session arrive (whether started here or by run-game).
        const due = s.orders.filter((o)=>!o.arrived && o.arrivesAtSession <= number);
        for (const o of due)o.arrived = true;
        const log = due.map((o)=>`Arrived: ${o.itemName} for ${s.players.find((p)=>p.id === o.playerId)?.name ?? "someone"}`);
        if (due.length === 1) announce(`Arrived from Baldur\u2019s Gate: ${due[0].itemName} for ${s.players.find((p)=>p.id === due[0].playerId)?.name ?? "someone"}`);
        else if (due.length > 1) announce(`${due.length} special orders have arrived from Baldur\u2019s Gate`);
        // Income: roll for each live income effect and pay the owners by share.
        for (const { item: it, effect } of (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["liveEffects"])(s, "income")){
            const owners = [
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sharesOf"])(s, it.id)
            ].filter(([pid])=>s.players.some((p)=>p.id === pid && !p.archived));
            if (!owners.length) continue;
            const roll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rollDice"])(effect.dice, rand);
            const total = roll * effect.unitCp;
            for (const [pid, cp] of (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["splitByShare"])(total, owners)){
                if (cp > 0) move(player(pid), cp, `${it.name}: your share (rolled ${roll} on ${effect.dice})`, "income", {
                    itemId: it.id
                });
            }
            log.push(`${it.name}: rolled ${roll} on ${effect.dice}, paid ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(total)}`);
            if (total > 0) announcePublic(it.shopId, `${it.name} paid ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(total)}`);
        }
        if (log.length) sess.startLog = log;
        return sess;
    };
    // ---------- run-game helpers ----------
    const episode = (id)=>episodes.find((e)=>e.id === id) ?? fail("That episode doesn't exist.");
    const session = (id)=>s.sessions.find((x)=>x.id === id) ?? fail("That session doesn't exist.");
    const curSession = ()=>s.sessions.find((x)=>x.id === s.currentSessionId) ?? fail("No session is running.");
    const curRun = ()=>{
        const sess = curSession();
        const run = sess.run ?? fail("This session isn't running an episode. Start run-game mode first.");
        return {
            sess,
            run,
            ep: episode(run.episodeId)
        };
    };
    const makeBeat = (b)=>{
        const beat = {
            id: nextId("b"),
            title: b.title.trim() || "New beat",
            notes: b.notes,
            checks: b.checks,
            branches: b.branches,
            actions: b.actions
        };
        if (b.readAloud?.length) {
            beat.readAloud = b.readAloud;
            beat.readAloudAt = Math.min(b.readAloudAt ?? 0, b.notes.length);
        }
        return beat;
    };
    const fireAction = (a)=>{
        if (a.type === "scene") {
            if (s.scenes.some((x)=>x.id === a.sceneId)) showScene(a.sceneId);
        } else if (a.type === "black") {
            const black = s.scenes.find((x)=>x.kind === "black");
            if (black) showScene(black.id);
        } else if (a.type === "bank") {
            // The bank is the DM's screen; the TV shows the purse.
            s.live.purseVisible = true;
            s.live.shopOpen = false;
            delete s.live.recapSessionId;
        }
    };
    const land = (run, ep, i, skip = [])=>{
        run.stage = "beat";
        run.beat = i;
        ep.beats[i].actions.forEach((a, k)=>{
            if (!skip.includes(k)) fireAction(a);
        });
    };
    /** Runs of this episode in the current session, so edits keep pointing at the same beat. */ const keepCurrentBeat = (ep, edit)=>{
        const run = s.sessions.find((x)=>x.id === s.currentSessionId)?.run;
        const mine = run && run.episodeId === ep.id ? run : null;
        const beatId = mine ? ep.beats[mine.beat]?.id : undefined;
        edit();
        if (!mine) return;
        const i = beatId ? ep.beats.findIndex((b)=>b.id === beatId) : -1;
        mine.beat = i >= 0 ? i : Math.max(0, Math.min(mine.beat, ep.beats.length - 1));
        if (!ep.beats.length && mine.stage === "beat") mine.stage = "start";
    };
    /** Where a new session of this episode picks up: the beat the last unfinished run stopped on. */ const resumeBeat = (episodeId)=>{
        const last = s.sessions.filter((x)=>x.endedAt !== null && x.run?.episodeId === episodeId).sort((a, b)=>(b.endedAt ?? 0) - (a.endedAt ?? 0))[0];
        if (!last?.run || last.run.stage === "end") return 0;
        return last.run.beat;
    };
    const mapOf = (sceneId)=>{
        const sc = scene(sceneId);
        if (sc.kind !== "map") fail("That scene isn't a map.");
        return sc.map ??= emptyMap();
    };
    const pinOf = (m, pinId)=>m.pins.find((p)=>p.id === pinId) ?? fail("That location isn't on this map.");
    const checkLink = (link)=>{
        if (link.kind === "shop" && !s.shops.some((x)=>x.id === link.shopId)) fail("That shop doesn't exist.");
        if (link.kind === "scene" && !s.scenes.some((x)=>x.id === link.sceneId)) fail("That scene doesn't exist.");
    };
    /** Stop zooming the TV toward a pin that's gone or hidden. */ const dropFocus = (pinId)=>{
        if (s.live.focus?.pinId === pinId) delete s.live.focus;
        if (s.live.banner?.pinId === pinId) delete s.live.banner;
    };
    switch(cmd.type){
        // ---------- scenes ----------
        case "scene.show":
            showScene(scene(cmd.sceneId).id);
            break;
        case "scene.step":
            {
                const i = s.scenes.findIndex((x)=>x.id === s.live.sceneId);
                const n = s.scenes.length;
                showScene(s.scenes[(((i < 0 ? 0 : i) + cmd.dir) % n + n) % n].id);
                break;
            }
        case "scene.hotkey":
            {
                const sc = s.scenes.find((x)=>x.hotkey === cmd.key) ?? fail(`No scene on key ${cmd.key}.`);
                showScene(sc.id);
                break;
            }
        case "scene.add":
            {
                const used = new Set(s.scenes.map((x)=>x.hotkey));
                const free = [
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    0
                ].find((k)=>!used.has(k)) ?? null;
                const sc = {
                    id: nextId("s"),
                    label: cmd.label.trim() || "New scene",
                    kind: cmd.kind,
                    hotkey: free,
                    reveal: false,
                    art: {}
                };
                if (cmd.kind === "portrait") Object.assign(sc, {
                    name: sc.label,
                    title: ""
                });
                if (cmd.kind === "map") sc.map = emptyMap();
                s.scenes.push(sc);
                break;
            }
        case "scene.update":
            {
                const sc = scene(cmd.sceneId);
                const { patch } = cmd;
                if (patch.hotkey !== undefined && patch.hotkey !== null) {
                    for (const other of s.scenes)if (other.id !== sc.id && other.hotkey === patch.hotkey) other.hotkey = null;
                }
                if (patch.art?.url && !/^(https:\/\/|\/api\/files\/)/.test(patch.art.url)) fail("Images must be uploaded first.");
                Object.assign(sc, patch);
                if (patch.label !== undefined) sc.label = patch.label.trim() || sc.label;
                // Pins survive a kind change, so switching to Image and back loses nothing.
                if (sc.kind === "map") sc.map ??= emptyMap();
                break;
            }
        case "scene.remove":
            {
                if (s.scenes.length <= 1) fail("Keep at least one scene.");
                scene(cmd.sceneId);
                s.scenes = s.scenes.filter((x)=>x.id !== cmd.sceneId);
                if (s.live.sceneId === cmd.sceneId) {
                    s.live.sceneId = homeScene();
                    delete s.live.focus;
                    delete s.live.banner;
                }
                for (const sc of s.scenes)for (const p of sc.map?.pins ?? [])if (p.link?.kind === "scene" && p.link.sceneId === cmd.sceneId) delete p.link;
                break;
            }
        case "scene.move":
            {
                const i = s.scenes.findIndex((x)=>x.id === cmd.sceneId);
                if (i < 0) fail("That scene doesn't exist.");
                const j = i + cmd.dir;
                if (j >= 0 && j < s.scenes.length) [s.scenes[i], s.scenes[j]] = [
                    s.scenes[j],
                    s.scenes[i]
                ];
                break;
            }
        // ---------- maps ----------
        case "pin.add":
            {
                const m = mapOf(cmd.sceneId);
                if (m.pins.some((p)=>p.id === cmd.pinId)) fail("That location already exists.");
                m.pins.push({
                    id: cmd.pinId,
                    number: lowestFreeNumber(m.pins),
                    showsAs: "",
                    name: "",
                    type: "",
                    description: "",
                    dmNotes: "",
                    discovered: false,
                    x: cmd.x,
                    y: cmd.y
                });
                m.pins.sort((a, b)=>a.number - b.number);
                break;
            }
        case "pin.update":
            {
                const m = mapOf(cmd.sceneId);
                const p = pinOf(m, cmd.pinId);
                const { link, ...rest } = cmd.patch;
                Object.assign(p, rest);
                if (rest.showsAs !== undefined) p.showsAs = rest.showsAs.trim();
                if (rest.name !== undefined) p.name = rest.name.trim();
                if (rest.type !== undefined) p.type = rest.type.trim();
                if (link === null) delete p.link;
                else if (link) {
                    checkLink(link);
                    p.link = link;
                }
                break;
            }
        case "pin.remove":
            {
                const m = mapOf(cmd.sceneId);
                pinOf(m, cmd.pinId);
                m.pins = m.pins.filter((p)=>p.id !== cmd.pinId);
                dropFocus(cmd.pinId);
                break;
            }
        case "pin.restore":
            {
                const m = mapOf(cmd.sceneId);
                if (m.pins.some((p)=>p.id === cmd.pin.id)) fail("That location is already back.");
                const { link, ...rest } = cmd.pin;
                const number = m.pins.some((p)=>p.number === rest.number) ? lowestFreeNumber(m.pins) : rest.number;
                const pin = {
                    ...rest,
                    number
                };
                if (link && (link.kind === "shop" ? s.shops.some((x)=>x.id === link.shopId) : s.scenes.some((x)=>x.id === link.sceneId))) pin.link = link;
                m.pins.push(pin);
                m.pins.sort((a, b)=>a.number - b.number);
                break;
            }
        case "pin.discover":
            {
                const m = mapOf(cmd.sceneId);
                const p = pinOf(m, cmd.pinId);
                const was = p.discovered;
                p.discovered = cmd.discovered;
                if (!cmd.discovered) dropFocus(p.id);
                else if (!was && cmd.announce && s.live.sceneId === cmd.sceneId) s.live.banner = {
                    pinId: p.id,
                    n: ++s.seq
                };
                break;
            }
        case "map.legend":
            {
                const m = mapOf(cmd.sceneId);
                if (cmd.on !== undefined) m.legendOn = cmd.on;
                if (cmd.style !== undefined) m.legendStyle = cmd.style;
                break;
            }
        case "live.focus":
            {
                if (cmd.pinId === null) {
                    delete s.live.focus;
                    break;
                }
                const m = mapOf(s.live.sceneId);
                const p = pinOf(m, cmd.pinId);
                if (!p.discovered) fail("Discover that location first; the TV can't see it yet.");
                s.live.focus = {
                    pinId: p.id,
                    n: ++s.seq
                };
                break;
            }
        case "map.addSeedMaps":
            {
                // Turn the old empty "Town map" image scene into the Candlefair map (keeping any image), then add the Sword Coast.
                let cf = s.scenes.find((x)=>x.id === "s-map");
                if (cf && cf.kind === "image") {
                    cf.kind = "map";
                    if (cf.label === "Town map") cf.label = "Candlefair map";
                    cf.map = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["candlefairMap"])();
                } else if (!s.scenes.some((x)=>x.kind === "map" && x.label === "Candlefair map")) {
                    cf = {
                        id: nextId("s"),
                        label: "Candlefair map",
                        kind: "map",
                        hotkey: null,
                        reveal: false,
                        art: {},
                        alt: "Map of Candlefair",
                        map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["candlefairMap"])()
                    };
                    s.scenes.push(cf);
                } else cf = s.scenes.find((x)=>x.kind === "map" && x.label === "Candlefair map");
                if (!s.scenes.some((x)=>x.kind === "map" && x.label === "Sword Coast map")) {
                    const used = new Set(s.scenes.map((x)=>x.hotkey));
                    s.scenes.push({
                        id: s.scenes.some((x)=>x.id === "s-swordcoast") ? nextId("s") : "s-swordcoast",
                        label: "Sword Coast map",
                        kind: "map",
                        hotkey: used.has(9) ? null : 9,
                        reveal: false,
                        art: {},
                        alt: "Map of the Sword Coast",
                        map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["swordCoastMap"])(cf.id)
                    });
                }
                // Drop shop links to shops this game no longer has.
                for (const sc of s.scenes){
                    for (const p of sc.map?.pins ?? []){
                        const l = p.link;
                        if (l?.kind === "shop" && !s.shops.some((x)=>x.id === l.shopId)) delete p.link;
                    }
                }
                break;
            }
        // ---------- what the TV shows ----------
        case "live.shop":
            {
                if (cmd.category !== undefined) {
                    if (cmd.category) s.live.shopCategory = cmd.category;
                    else delete s.live.shopCategory;
                } else if (cmd.shopId) delete s.live.shopCategory;
                const target = shop(cmd.shopId ?? s.live.shopId);
                if (cmd.open && !s.live.shopCategory && target.visibility !== "all") fail(`${target.name} is hidden from the party. Open it to everyone first.`);
                if (cmd.open && s.live.shopCategory && !s.shops.some((x)=>x.visibility === "all" && !x.closed)) fail("No storefront is open to everyone yet.");
                s.live.shopId = target.id;
                s.live.shopOpen = cmd.open;
                if (cmd.open) delete s.live.recapSessionId;
                break;
            }
        case "live.purse":
            s.live.purseVisible = cmd.visible;
            break;
        // ---------- money ----------
        case "money.adjust":
            {
                const p = player(cmd.playerId);
                if (cmd.amountCp === 0) fail("Enter an amount.");
                if (cmd.amountCp < 0 && p.balanceCp + cmd.amountCp < 0 && !cmd.allowDebt) {
                    fail(`${p.name} only has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)}. Tick “allow debt” to take more.`);
                }
                move(p, cmd.amountCp, cmd.note.trim() || (cmd.amountCp > 0 ? "Reward" : "Spent"), cmd.amountCp > 0 ? "grant" : "charge");
                break;
            }
        case "money.payAll":
            {
                if (cmd.amountCp <= 0) fail("Enter an amount.");
                const ids = [
                    ...new Set(cmd.playerIds)
                ];
                if (!ids.length) fail("Pick at least one player.");
                const batchId = nextId("b");
                const note = cmd.note.trim() || "Party pay";
                for (const pid of ids){
                    const p = player(pid);
                    if (p.archived) fail(`${p.name} has left the table.`);
                    move(p, cmd.amountCp, note, "payAll", {
                        batchId
                    });
                }
                break;
            }
        case "money.buy":
            {
                const p = player(cmd.playerId);
                if (p.archived) fail(`${p.name} has left the table.`);
                const item = s.items.find((x)=>x.id === cmd.itemId) ?? fail("That item isn't for sale.");
                const where = shop(item.shopId);
                if (where.closed) fail(`${where.name} isn't open yet.`);
                if (item.tier === "locked") fail(`${item.name} is locked: ${item.reason || "not for sale yet"}.`);
                if (item.tier !== "sale") fail(`${item.name} isn't for sale.`);
                if (item.stock === 0) fail(`${item.name} is sold out.${item.restockNote ? " " + item.restockNote : ""}`);
                const cost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["firstChargeCp"])(s, item);
                if (!canPay(p, cost, item.shopId)) fail(`${p.name} can't afford ${item.name}.`);
                if (item.kind === "recurring" && s.rentals.some((x)=>x.active && x.itemId === item.id && x.playerId === p.id)) fail(`${p.name} already rents ${item.name}.`);
                fulfil(p, item, 1, cost, {}, {
                    question: cmd.question
                });
                break;
            }
        case "project.contribute":
            {
                const p = player(cmd.playerId);
                if (p.archived) fail(`${p.name} has left the table.`);
                const it = item(cmd.itemId);
                const left = projectLeft(it);
                const cp = Math.min(cmd.amountCp, left);
                if (p.balanceCp < cp) fail(`${p.name} only has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)}.`);
                contribute(p, it, cp);
                if (cp < cmd.amountCp) out.info = `${it.name} only needed ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(cp)}, so that's all ${p.name} paid.`;
                break;
            }
        // ---------- rent and lessons ----------
        case "dues.charge":
            {
                const sess = curSession();
                const want = new Set(cmd.ids);
                const due = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["duesFor"])(s, sess.number).filter((d)=>want.has(d.id));
                for (const d of due){
                    const p = player(d.playerId);
                    if (d.kind === "rent") {
                        const r = s.rentals.find((x)=>x.id === d.id);
                        move(p, -d.cp, `Rent: ${r.itemName}`, "rent", {
                            itemId: r.itemId
                        });
                        r.paidThrough = sess.number;
                    } else {
                        const t = s.trainings.find((x)=>x.id === d.id);
                        move(p, -d.cp, `${t.itemName}${t.what ? ` (${t.what})` : ""}: lesson ${t.paid + 1} of ${t.of}`, "purchase", {
                            itemId: t.itemId
                        });
                        t.paid++;
                        t.paidCp += d.cp;
                        t.paidThrough = sess.number;
                        if (t.paid >= t.of) {
                            t.done = true;
                            task(`Record a new proficiency: ${p.name} finished ${t.itemName}${t.what ? `: ${t.what}` : ""}.`, {
                                playerId: p.id,
                                itemId: t.itemId
                            });
                        }
                    }
                }
                sess.duesCharged = true;
                out.info = due.length ? `Charged ${due.length} ${due.length === 1 ? "payment" : "payments"}.` : "Nothing was due.";
                break;
            }
        case "rental.cancel":
            {
                const r = s.rentals.find((x)=>x.id === cmd.rentalId) ?? fail("That rental doesn't exist.");
                r.active = false;
                r.endedAt = ctx.now;
                break;
            }
        case "training.cancel":
            {
                const t = s.trainings.find((x)=>x.id === cmd.trainingId) ?? fail("That training doesn't exist.");
                if (t.done) fail("That training is already finished.");
                t.cancelled = true;
                break;
            }
        // ---------- earned ----------
        case "award.grant":
            {
                const it = item(cmd.itemId);
                if (it.kind !== "earned") fail(`${it.name} isn't an Earned item.`);
                const ps = [
                    ...new Set(cmd.playerIds)
                ].map(player);
                s.awards.push({
                    id: nextId("aw"),
                    itemId: it.id,
                    itemName: it.name,
                    playerIds: ps.map((p)=>p.id),
                    at: ctx.now,
                    note: cmd.note.trim()
                });
                announcePublic(it.shopId, `Earned: ${it.name} (${ps.map((p)=>p.name).join(", ")})`);
                break;
            }
        case "award.revoke":
            if (!s.awards.some((a)=>a.id === cmd.awardId)) fail("That award doesn't exist.");
            s.awards = s.awards.filter((a)=>a.id !== cmd.awardId);
            break;
        // ---------- the DM's to-do list and the flyers ----------
        case "task.done":
            {
                const t = s.tasks.find((x)=>x.id === cmd.taskId) ?? fail("That task doesn't exist.");
                t.done = cmd.done;
                break;
            }
        case "flyer.update":
            {
                const f = s.flyers.find((x)=>x.id === cmd.flyerId) ?? fail("That flyer doesn't exist.");
                const { up, ...text } = cmd.patch;
                Object.assign(f, cleanFlyer({
                    ...f,
                    ...text
                }, f.signedBy));
                if (up !== undefined) f.up = up;
                break;
            }
        case "flyer.remove":
            s.flyers = s.flyers.filter((x)=>x.id !== cmd.flyerId);
            break;
        // ---------- players ----------
        case "player.add":
            {
                const name = cmd.name.trim() || `Player ${s.players.length + 1}`;
                createPlayer((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseHandle"])(name), name, "dm");
                break;
            }
        case "player.update":
            {
                const p = player(cmd.playerId);
                const { patch } = cmd;
                if (patch.name !== undefined) p.name = patch.name.trim() || p.name;
                if (patch.dndbUrl !== undefined) p.dndbUrl = checkUrl(patch.dndbUrl);
                if (patch.away !== undefined) p.away = patch.away;
                if (patch.dropIn !== undefined) p.dropIn = patch.dropIn;
                if (patch.handle !== undefined) {
                    const h = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseHandle"])(patch.handle);
                    if (!h) fail("A URL name needs at least one letter or number.");
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReservedHandle"])(h)) fail(`“${h}” is reserved.`);
                    if (s.players.some((x)=>x.handle === h && x.id !== p.id)) fail(`Someone already uses “${h}”.`);
                    p.handle = h;
                }
                break;
            }
        case "player.archive":
            player(cmd.playerId).archived = cmd.archived;
            break;
        case "player.remove":
            {
                const p = player(cmd.playerId);
                if (p.balanceCp !== 0) fail(`${p.name} still has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)}. Archive them instead, or zero their purse first.`);
                s.players = s.players.filter((x)=>x.id !== p.id);
                break;
            }
        case "player.clearKey":
            delete player(cmd.playerId).keyHash;
            break;
        case "player.inspire":
            player(cmd.playerId).inspired = cmd.on;
            break;
        // ---------- shops ----------
        case "shop.add":
            s.shops.push({
                id: nextId("shop"),
                name: cmd.name.trim() || "New shop",
                subtitle: cmd.subtitle.trim(),
                visibility: "hidden",
                playerIds: []
            });
            break;
        case "shop.update":
            {
                const sh = shop(cmd.shopId);
                if (cmd.patch.name !== undefined) sh.name = cmd.patch.name.trim() || sh.name;
                if (cmd.patch.subtitle !== undefined) sh.subtitle = cmd.patch.subtitle.trim();
                if (cmd.patch.secretSales !== undefined) sh.secretSales = cmd.patch.secretSales || undefined;
                if (cmd.patch.closed !== undefined) {
                    const opening = sh.closed && !cmd.patch.closed;
                    sh.closed = cmd.patch.closed || undefined;
                    if (opening && sh.visibility === "all") announce(`${sh.name} is open for business`);
                }
                break;
            }
        case "shop.visibility":
            {
                const sh = shop(cmd.shopId);
                const ids = [
                    ...new Set(cmd.playerIds ?? sh.playerIds)
                ];
                for (const pid of ids)player(pid);
                if (cmd.visibility === "some" && !ids.length) fail("Pick at least one player.");
                const wasPublic = sh.visibility === "all";
                sh.visibility = cmd.visibility;
                sh.playerIds = cmd.visibility === "some" ? ids : [];
                if (cmd.visibility !== "all" && s.live.shopId === sh.id) s.live.shopOpen = false;
                if (cmd.visibility === "all" && !wasPublic && !cmd.quiet) announce(sh.closed ? `${sh.name} has come to town` : `Now open: ${sh.name}`);
                break;
            }
        case "shop.remove":
            {
                if (s.shops.length <= 1) fail("Keep at least one shop.");
                if (!s.shops.some((x)=>x.id === cmd.shopId)) fail("That shop doesn't exist.");
                s.shops = s.shops.filter((x)=>x.id !== cmd.shopId);
                s.items = s.items.filter((x)=>x.shopId !== cmd.shopId);
                for (const sc of s.scenes)for (const p of sc.map?.pins ?? [])if (p.link?.kind === "shop" && p.link.shopId === cmd.shopId) delete p.link;
                if (s.live.shopId === cmd.shopId) s.live.shopId = s.shops[0].id;
                break;
            }
        case "item.add":
            {
                shop(cmd.item.shopId);
                const it = tidyItem({
                    id: nextId("i"),
                    description: "",
                    tier: "sale",
                    reason: "",
                    hint: "",
                    hidePrice: false,
                    stock: null,
                    restockNote: "",
                    category: "gear",
                    kind: "purchase",
                    ...cmd.item
                });
                s.items.push(it);
                if (!cmd.quiet) announceItem(it, "hidden");
                break;
            }
        case "item.update":
            {
                const it = s.items.find((x)=>x.id === cmd.itemId) ?? fail("That item doesn't exist.");
                if (cmd.patch.shopId) shop(cmd.patch.shopId);
                const before = {
                    tier: it.tier,
                    stock: it.stock,
                    name: it.name
                };
                Object.assign(it, cmd.patch);
                if (cmd.patch.name !== undefined) it.name = cmd.patch.name.trim() || before.name;
                tidyItem(it);
                if (!cmd.quiet) {
                    announceItem(it, before.tier);
                    if (before.stock === 0 && it.stock !== null && it.stock > 0 && it.tier === "sale" && shop(it.shopId).visibility === "all") {
                        announce(`Back in stock at ${shop(it.shopId).name}: ${it.name}`);
                    }
                }
                break;
            }
        case "order.arrive":
            {
                const o = s.orders.find((x)=>x.id === cmd.orderId) ?? fail("That order doesn't exist.");
                if (!o.arrived) {
                    o.arrived = true;
                    announce(`Arrived from Baldur\u2019s Gate: ${o.itemName} for ${player(o.playerId).name}`);
                }
                break;
            }
        case "order.cancel":
            {
                const o = s.orders.find((x)=>x.id === cmd.orderId) ?? fail("That order doesn't exist.");
                if (o.arrived) fail("That order already arrived.");
                s.orders = s.orders.filter((x)=>x.id !== o.id);
                if (cmd.refund && o.priceCp > 0) move(player(o.playerId), o.priceCp, `Refund: ${o.itemName}`, "grant", {
                    itemId: o.itemId
                });
                break;
            }
        case "catalog.reset":
            s.shops = structuredClone(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SEED_SHOPS"]);
            s.items = structuredClone(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SEED_ITEMS"]);
            s.live.shopOpen = false;
            s.live.shopId = s.shops[0].id;
            delete s.live.shopCategory;
            // Shares, rentals and awards point at the old items. Flyers and your to-do list stay.
            Object.assign(s, {
                ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["emptyProgress"])(),
                flyers: s.flyers,
                tasks: s.tasks
            });
            for (const sc of s.scenes)for (const p of sc.map?.pins ?? [])if (p.link?.kind === "shop" && !s.shops.some((x)=>x.id === p.link.shopId)) delete p.link;
            break;
        case "item.remove":
            s.items = s.items.filter((x)=>x.id !== cmd.itemId);
            break;
        // ---------- sessions ----------
        case "session.start":
            {
                if (s.currentSessionId) fail("A session is already running. End it first.");
                startSession(cmd.title);
                break;
            }
        case "session.end":
            {
                const cur = s.sessions.find((x)=>x.id === s.currentSessionId) ?? fail("No session is running.");
                cur.endedAt = ctx.now;
                s.currentSessionId = null;
                showScene(homeScene());
                break;
            }
        case "session.update":
            {
                const sess = s.sessions.find((x)=>x.id === cmd.sessionId) ?? fail("That session doesn't exist.");
                if (cmd.patch.number !== undefined) {
                    const clash = s.sessions.find((x)=>x.number === cmd.patch.number && x.id !== sess.id);
                    if (clash) fail(`\u201c${clash.title}\u201d is already number ${clash.number}.`);
                    // Keep a default title in step with its number.
                    if (sess.title === `Session ${sess.number}`) sess.title = `Session ${cmd.patch.number}`;
                    sess.number = cmd.patch.number;
                }
                if (cmd.patch.title !== undefined) sess.title = cmd.patch.title.trim() || `Session ${sess.number}`;
                s.sessions.sort((a, b)=>a.number - b.number);
                break;
            }
        case "session.reopen":
            {
                if (s.currentSessionId) fail("Another session is running. End it first.");
                const sess = s.sessions.find((x)=>x.id === cmd.sessionId) ?? fail("That session doesn't exist.");
                sess.endedAt = null;
                s.currentSessionId = sess.id;
                break;
            }
        case "session.remove":
            {
                if (!s.sessions.some((x)=>x.id === cmd.sessionId)) fail("That session doesn't exist.");
                // Ledger lines keep their (now unknown) session id and read as "between sessions".
                s.sessions = s.sessions.filter((x)=>x.id !== cmd.sessionId);
                if (s.currentSessionId === cmd.sessionId) s.currentSessionId = null;
                if (s.live.recapSessionId === cmd.sessionId) delete s.live.recapSessionId;
                break;
            }
        // ---------- run sheets ----------
        case "episode.add":
            {
                const ep = {
                    id: nextId("ep"),
                    title: cmd.title.trim() || "New episode",
                    beats: (cmd.beats ?? []).map(makeBeat)
                };
                episodes.push(ep);
                out.episodeId = ep.id;
                break;
            }
        case "episode.update":
            episode(cmd.episodeId).title = cmd.title.trim() || episode(cmd.episodeId).title;
            break;
        case "episode.replaceBeats":
            {
                const ep = episode(cmd.episodeId);
                keepCurrentBeat(ep, ()=>ep.beats = cmd.beats.map(makeBeat));
                break;
            }
        case "episode.remove":
            {
                episode(cmd.episodeId);
                if (curRunEpisode(s) === cmd.episodeId) fail("That episode is running in this session. End the session first.");
                s.episodes = episodes.filter((e)=>e.id !== cmd.episodeId);
                break;
            }
        case "beat.add":
            {
                const ep = episode(cmd.episodeId);
                const b = makeBeat(cmd.beat ?? {
                    title: "New beat",
                    notes: [],
                    checks: [],
                    branches: [],
                    actions: []
                });
                keepCurrentBeat(ep, ()=>ep.beats.splice(Math.min(cmd.at ?? ep.beats.length, ep.beats.length), 0, b));
                out.beatId = b.id;
                break;
            }
        case "beat.update":
            {
                const ep = episode(cmd.episodeId);
                const i = ep.beats.findIndex((b)=>b.id === cmd.beatId);
                if (i < 0) fail("That beat doesn't exist.");
                ep.beats[i] = {
                    ...makeBeat(cmd.beat),
                    id: cmd.beatId
                };
                break;
            }
        case "beat.move":
            {
                const ep = episode(cmd.episodeId);
                const i = ep.beats.findIndex((b)=>b.id === cmd.beatId);
                if (i < 0) fail("That beat doesn't exist.");
                keepCurrentBeat(ep, ()=>{
                    const [b] = ep.beats.splice(i, 1);
                    ep.beats.splice(Math.min(cmd.to, ep.beats.length), 0, b);
                });
                break;
            }
        case "beat.remove":
            {
                const ep = episode(cmd.episodeId);
                if (!ep.beats.some((b)=>b.id === cmd.beatId)) fail("That beat doesn't exist.");
                keepCurrentBeat(ep, ()=>ep.beats = ep.beats.filter((b)=>b.id !== cmd.beatId));
                break;
            }
        // ---------- running a session from an episode ----------
        case "run.start":
            {
                const ep = episode(cmd.episodeId);
                const cur = s.sessions.find((x)=>x.id === s.currentSessionId);
                if (cur?.run) {
                    if (cur.run.episodeId === ep.id) break; // resume where we are
                    fail(`${cur.title} is running “${episode(cur.run.episodeId).title}”. End it first.`);
                }
                const sess = cur ?? startSession();
                sess.run = {
                    episodeId: ep.id,
                    stage: "start",
                    beat: Math.min(resumeBeat(ep.id), Math.max(0, ep.beats.length - 1)),
                    notes: {}
                };
                break;
            }
        case "run.next":
            {
                const { run, ep } = curRun();
                if (run.stage === "end") break;
                const i = run.stage === "start" ? run.beat : run.beat + 1;
                if (i < ep.beats.length) land(run, ep, i, cmd.skip);
                else run.stage = "end";
                break;
            }
        case "run.back":
            {
                // Never fires actions, so stepping back doesn't flash the TV.
                const { run, ep } = curRun();
                if (run.stage === "end") {
                    if (ep.beats.length) {
                        run.stage = "beat";
                        run.beat = ep.beats.length - 1;
                    } else run.stage = "start";
                } else if (run.stage === "beat") {
                    if (run.beat > 0) run.beat--;
                    else run.stage = "start";
                }
                break;
            }
        case "run.jump":
            {
                const { run, ep } = curRun();
                if (cmd.stage === "beat") {
                    const i = cmd.beat ?? fail("Which beat?");
                    if (i >= ep.beats.length) fail("That beat doesn't exist.");
                    land(run, ep, i);
                } else run.stage = cmd.stage;
                break;
            }
        case "run.fire":
            {
                const { ep } = curRun();
                const b = ep.beats.find((x)=>x.id === cmd.beatId) ?? fail("That beat doesn't exist.");
                fireAction(b.actions[cmd.index] ?? fail("That action doesn't exist."));
                break;
            }
        case "run.note":
            {
                const { run, ep } = curRun();
                if (!ep.beats.some((b)=>b.id === cmd.beatId)) fail("That beat doesn't exist.");
                if (cmd.text.trim()) run.notes[cmd.beatId] = cmd.text;
                else delete run.notes[cmd.beatId];
                break;
            }
        case "run.recap":
            {
                const sess = session(cmd.sessionId);
                if (cmd.text.trim()) sess.recap = cmd.text;
                else {
                    delete sess.recap;
                    if (s.live.recapSessionId === sess.id) delete s.live.recapSessionId;
                }
                break;
            }
        case "run.attend":
            {
                const sess = curSession();
                const p = player(cmd.playerId);
                // Ticked: here tonight. Unticked: away (off the TV purse and out of "pay everyone").
                p.away = !cmd.here;
                if (cmd.here) markAttending(p.id);
                else sess.attendeeIds = sess.attendeeIds.filter((x)=>x !== p.id);
                break;
            }
        case "live.recap":
            {
                if (cmd.sessionId === null) {
                    delete s.live.recapSessionId;
                    break;
                }
                const sess = session(cmd.sessionId);
                if (!sess.recap?.trim()) fail("That session has no recap yet.");
                s.live.recapSessionId = sess.id;
                s.live.shopOpen = false;
                break;
            }
        // ---------- the door ----------
        case "door.set":
            s.doorClosed = cmd.closed;
            break;
        case "table.seats":
            s.maxPlayers = cmd.max;
            break;
        case "knock.admit":
            {
                const k = s.knocks.find((x)=>x.id === cmd.knockId) ?? fail("Nobody's knocking.");
                s.knocks = s.knocks.filter((x)=>x.id !== k.id);
                if (!s.players.some((p)=>p.handle === k.handle)) createPlayer(k.handle, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["displayNameFrom"])(k.handle), "url");
                break;
            }
        case "knock.dismiss":
            s.knocks = s.knocks.filter((x)=>x.id !== cmd.knockId);
            break;
        case "game.rename":
            s.name = cmd.name.trim();
            break;
        case "game.vtt":
            {
                const url = checkUrl(cmd.url);
                if (url) s.vttUrl = url;
                else delete s.vttUrl;
                break;
            }
        // ---------- phone requests: the DM decides ----------
        case "request.approve":
            approve(request(cmd.requestId), cmd.totalCp, !!cmd.override, {
                answer: cmd.answer,
                flyer: cmd.flyer
            });
            pruneRequests();
            break;
        case "request.decline":
            {
                const r = request(cmd.requestId);
                if (r.status !== "pending") fail(`That request was already ${r.status}.`);
                r.status = "declined";
                r.decidedAt = ctx.now;
                const reason = cmd.reason.trim();
                if (reason) r.reason = reason;
                pruneRequests();
                break;
            }
        case "request.approveAll":
            {
                const pending = s.requests.filter((r)=>r.status === "pending");
                if (!pending.length) fail("Nothing is waiting.");
                let ok = 0;
                const stuck = [];
                let waiting = 0;
                for (const r of pending){
                    // Services (and flyers) need you to read and answer them.
                    if (r.kind === "buy" && s.items.find((x)=>x.id === r.itemId)?.kind === "service") {
                        waiting++;
                        continue;
                    }
                    try {
                        approve(r, undefined, false);
                        ok++;
                    } catch (e) {
                        if (!(e instanceof CommandError)) throw e;
                        stuck.push(`${r.playerName}: ${e.message}`);
                    }
                }
                const answer = waiting ? ` ${waiting} ${waiting === 1 ? "service needs" : "services need"} your answer.` : "";
                out.info = (stuck.length ? `Approved ${ok}. Still waiting on you: ${stuck.join(" ")}` : `Approved ${ok}.`) + answer;
                pruneRequests();
                break;
            }
        case "game.tvPurchases":
            if (cmd.on) delete s.tvPurchases;
            else s.tvPurchases = false;
            break;
        // ---------- phone requests: the player asks ----------
        case "me.requestBuy":
            {
                const p = me();
                // Anything this player can't see gets the same answer, so the API can't be used to probe for hidden goods.
                const unseen = "That item isn't available.";
                const item = s.items.find((x)=>x.id === cmd.itemId) ?? fail(unseen);
                const where = s.shops.find((x)=>x.id === item.shopId);
                if (!where || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["shopVisibleTo"])(where, {
                    tv: false,
                    playerId: p.id
                }) || item.tier === "hidden" || item.tier === "rumored") fail(unseen);
                if (where.closed) fail(`${where.name} isn't open yet.`);
                if (item.tier === "locked") fail(`${item.name} is locked: ${item.reason || "not for sale yet"}.`);
                if (item.kind === "earned") fail(`${item.name} can't be bought. It has to be earned.`);
                if (item.kind === "project") fail(`${item.name} is a project: put gold toward it instead.`);
                const unitCp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["firstChargeCp"])(s, item);
                if (cmd.expectedUnitCp !== undefined && cmd.expectedUnitCp !== unitCp) fail(`The price of ${item.name} just changed to ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(unitCp)}. Have another look.`);
                if (cmd.qty > 1 && (item.oneAtATime || item.arrivesInSessions || item.kind !== "purchase")) fail(`${item.name} is sold one at a time.`);
                const question = cmd.question?.trim() ?? "";
                if (item.prompt && !question) fail(`${item.prompt} Tell the DM first.`);
                if (item.flyer && !cmd.flyer?.title.trim()) fail("Give your flyer a title.");
                const mine = (r)=>r.status === "pending" && r.playerId === p.id && r.itemId === item.id;
                if (item.kind === "recurring" && (s.rentals.some((x)=>x.active && x.itemId === item.id && x.playerId === p.id) || s.requests.some(mine))) fail(`You already rent ${item.name}.`);
                if (item.kind === "training" && (s.trainings.some((x)=>!x.done && !x.cancelled && x.itemId === item.id && x.playerId === p.id) || s.requests.some(mine))) fail(`You're already taking ${item.name}.`);
                const left = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["availableStock"])(s, item);
                if (left !== null && left < cmd.qty) {
                    if (item.stock === 0) fail(`${item.name} is sold out.${item.restockNote ? " " + item.restockNote : ""}`);
                    fail(left === 0 ? `Someone has already asked for the last ${item.name}.` : `Only ${left} ${item.name} left.`);
                }
                const totalCp = unitCp * cmd.qty;
                const credit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["creditCp"])(s, p.id, where.id);
                const avail = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["availableCp"])(s, p.id) + credit;
                if (totalCp > avail) fail(`That costs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(totalCp)} and you have ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(Math.max(0, avail))} available${credit ? " (with your tab)" : ""}.`);
                if (s.requests.filter((r)=>r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
                s.requests.push({
                    id: nextId("rq"),
                    kind: "buy",
                    playerId: p.id,
                    playerName: p.name,
                    at: ctx.now,
                    status: "pending",
                    totalCp,
                    note: cmd.note.trim(),
                    secret: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSecretShop"])(where),
                    itemId: item.id,
                    itemName: item.name,
                    shopId: where.id,
                    qty: cmd.qty,
                    unitCp,
                    ...question ? {
                        question
                    } : {},
                    ...item.flyer && cmd.flyer ? {
                        flyer: cleanFlyer(cmd.flyer, p.name)
                    } : {}
                });
                break;
            }
        case "me.contribute":
            {
                const p = me();
                const unseen = "That item isn't available.";
                const it = s.items.find((x)=>x.id === cmd.itemId) ?? fail(unseen);
                const where = s.shops.find((x)=>x.id === it.shopId);
                if (!where || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["shopVisibleTo"])(where, {
                    tv: false,
                    playerId: p.id
                }) || it.tier === "hidden" || it.tier === "rumored") fail(unseen);
                if (where.closed) fail(`${where.name} isn't open yet.`);
                if (it.tier === "locked") fail(`${it.name} is locked: ${it.reason || "not open yet"}.`);
                const pledged = s.requests.reduce((a, r)=>r.status === "pending" && r.kind === "contribute" && r.itemId === it.id ? a + r.totalCp : a, 0);
                const left = projectLeft(it) - pledged;
                if (left <= 0) fail(`${it.name} has all the gold it needs waiting on the DM.`);
                if (cmd.amountCp > left) fail(`${it.name} only needs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(left)} more.`);
                const avail = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["availableCp"])(s, p.id);
                if (cmd.amountCp > avail) fail(`You have ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(Math.max(0, avail))} available.`);
                if (s.requests.filter((r)=>r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
                s.requests.push({
                    id: nextId("rq"),
                    kind: "contribute",
                    playerId: p.id,
                    playerName: p.name,
                    at: ctx.now,
                    status: "pending",
                    totalCp: cmd.amountCp,
                    note: cmd.note.trim(),
                    secret: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSecretShop"])(where),
                    itemId: it.id,
                    itemName: it.name,
                    shopId: where.id,
                    qty: 1,
                    unitCp: cmd.amountCp
                });
                break;
            }
        case "me.cancelRental":
            {
                const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
                const r = s.rentals.find((x)=>x.id === cmd.rentalId && x.playerId === p.id) ?? fail("That rental doesn't exist.");
                if (!r.active) fail("You already gave that up.");
                r.active = false;
                r.endedAt = ctx.now;
                break;
            }
        case "me.requestGive":
            {
                const p = me();
                const to = s.players.find((x)=>x.id === cmd.toPlayerId && !x.archived) ?? fail("That player isn't at the table.");
                if (to.id === p.id) fail("You can't send gold to yourself.");
                const avail = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["availableCp"])(s, p.id);
                if (cmd.amountCp > avail) fail(`You have ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatCp"])(Math.max(0, avail))} available.`);
                if (s.requests.filter((r)=>r.status === "pending" && r.playerId === p.id).length >= 20) fail("You have 20 requests waiting. Let the DM catch up.");
                s.requests.push({
                    id: nextId("rq"),
                    kind: "give",
                    playerId: p.id,
                    playerName: p.name,
                    at: ctx.now,
                    status: "pending",
                    totalCp: cmd.amountCp,
                    note: cmd.note.trim(),
                    secret: false,
                    qty: 1,
                    unitCp: cmd.amountCp,
                    toPlayerId: to.id,
                    toPlayerName: to.name
                });
                break;
            }
        case "me.cancelRequest":
            {
                const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
                const r = s.requests.find((x)=>x.id === cmd.requestId && x.playerId === p.id) ?? fail("That request doesn't exist.");
                if (r.status !== "pending") fail(`That request was already ${r.status}.`);
                r.status = "cancelled";
                r.decidedAt = ctx.now;
                pruneRequests();
                break;
            }
        // ---------- players acting on themselves ----------
        case "me.update":
            {
                const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
                if (cmd.patch.name !== undefined) p.name = cmd.patch.name.trim() || p.name;
                if (cmd.patch.dndbUrl !== undefined) p.dndbUrl = checkUrl(cmd.patch.dndbUrl);
                break;
            }
        case "me.lockHashed":
            {
                const p = player(ctx.actor.role === "player" ? ctx.actor.playerId : "");
                if (p.keyHash) fail("Your name is already locked. Ask the DM to reset it.");
                p.keyHash = cmd.keyHash;
                break;
            }
        // ---------- issued by the server ----------
        case "system.join":
            {
                const h = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseHandle"])(cmd.handle);
                if (!h || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReservedHandle"])(h)) fail("Pick a different name.");
                if (s.players.some((p)=>p.handle === h)) fail("That name is taken.");
                const p = createPlayer(h, cmd.name, "url", cmd.keyHash);
                p.lastSeenAt = ctx.now;
                s.knocks = s.knocks.filter((k)=>k.handle !== h);
                break;
            }
        case "system.hello":
            {
                const p = player(cmd.playerId);
                p.lastSeenAt = ctx.now;
                if (!p.archived) markAttending(p.id);
                break;
            }
        case "system.knock":
            {
                const h = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normaliseHandle"])(cmd.handle);
                if (!h || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isReservedHandle"])(h)) fail("Pick a different name.");
                if (!s.knocks.some((k)=>k.handle === h)) s.knocks.push({
                    id: nextId("k"),
                    handle: h,
                    at: ctx.now
                });
                s.knocks = s.knocks.slice(-20);
                break;
            }
        default:
            {
                const never = cmd;
                fail(`Unknown command ${never.type}`);
            }
    }
    return out;
}
function curRunEpisode(s) {
    return s.sessions.find((x)=>x.id === s.currentSessionId)?.run?.episodeId ?? null;
}
function previousRecap(s) {
    return s.sessions.filter((x)=>x.id !== s.currentSessionId && x.endedAt !== null && x.recap?.trim()).sort((a, b)=>(b.endedAt ?? 0) - (a.endedAt ?? 0))[0] ?? null;
}
function emptyMap() {
    return {
        pins: [],
        legendOn: false,
        legendStyle: "names"
    };
}
function lowestFreeNumber(pins) {
    const used = new Set(pins.map((p)=>p.number));
    let n = 1;
    while(used.has(n))n++;
    return n;
}
function nextSessionNumber(s) {
    return s.sessions.reduce((m, x)=>Math.max(m, x.number), 0) + 1;
}
function tidyItem(it) {
    it.name = it.name.trim();
    it.description = it.description.trim();
    it.reason = it.reason.trim();
    it.hint = it.hint.trim();
    it.restockNote = it.restockNote.trim();
    for (const k of [
        "priceLabel",
        "finePrint",
        "dmNote"
    ]){
        const v = it[k]?.trim();
        if (v) it[k] = v;
        else delete it[k];
    }
    // A special-order delay makes it an order; an order always has one.
    if (it.arrivesInSessions && (it.kind === "purchase" || !it.kind)) it.kind = "order";
    if (it.kind === "order" && !it.arrivesInSessions) it.arrivesInSessions = 2;
    if (it.kind !== "order") delete it.arrivesInSessions;
    if (!it.arrivesInSessions) delete it.arrivesInSessions;
    if (!it.oneAtATime) delete it.oneAtATime;
    if (it.kind !== "training") delete it.installments;
    const prompt = it.prompt?.trim();
    if (prompt && (it.kind === "service" || it.kind === "training")) it.prompt = prompt;
    else delete it.prompt;
    if (!it.flyer || it.kind !== "service") delete it.flyer;
    if (!it.keep) delete it.keep;
    const tags = (it.tags ?? []).map((t)=>t.trim()).filter(Boolean);
    if (tags.length) it.tags = tags;
    else delete it.tags;
    if (!it.effects?.length) delete it.effects;
    return it;
}
/** Trim a flyer, and sign it with the player's name if they left it blank. */ function cleanFlyer(f, fallbackName) {
    return {
        title: f.title.trim().slice(0, 60) || "Notice",
        body: f.body.trim().slice(0, 400),
        signedBy: f.signedBy.trim().slice(0, 60) || fallbackName
    };
}
function checkUrl(url) {
    const u = url.trim();
    if (!u) return undefined;
    if (!/^https:\/\/[^\s]+$/i.test(u)) fail("Links must start with https://");
    return u;
}
}),
"[project]/src/shared/requests.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Holds for phone requests. A pending request holds the player's gold and the
// item's stock until the DM approves or declines it, or the player cancels.
__turbopack_context__.s([
    "availableCp",
    ()=>availableCp,
    "availableStock",
    ()=>availableStock,
    "boughtPhrase",
    ()=>boughtPhrase,
    "heldCp",
    ()=>heldCp,
    "heldStock",
    ()=>heldStock,
    "isSecretShop",
    ()=>isSecretShop,
    "pendingRequests",
    ()=>pendingRequests
]);
function heldCp(s, playerId) {
    return s.requests.reduce((a, r)=>r.status === "pending" && r.playerId === playerId ? a + r.totalCp : a, 0);
}
function heldStock(s, itemId, exceptRequestId) {
    return s.requests.reduce((a, r)=>r.status === "pending" && r.kind === "buy" && r.itemId === itemId && r.id !== exceptRequestId ? a + r.qty : a, 0);
}
function availableCp(s, playerId) {
    const p = s.players.find((x)=>x.id === playerId);
    return (p?.balanceCp ?? 0) - heldCp(s, playerId);
}
function availableStock(s, item) {
    return item.stock === null ? null : Math.max(0, item.stock - heldStock(s, item.id));
}
function isSecretShop(shop) {
    return !!shop && (!!shop.secretSales || shop.visibility === "some");
}
function pendingRequests(s) {
    return s.requests.filter((r)=>r.status === "pending");
}
function boughtPhrase(name, qty) {
    if (qty > 1) return `${qty} × ${name}`;
    if (/^(a|an|the|some)\s/i.test(name)) return name.charAt(0).toLowerCase() + name.slice(1);
    if (/^\d/.test(name)) return name;
    return (/^[aeiou]/i.test(name) ? "an " : "a ") + name;
}
}),
"[project]/src/shared/runsheet.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Run sheets: episodes as Markdown, in and out. DM-only data (see types.ts).
//
// One beat per "##". Recognised line prefixes:
//   >        read-aloud (a bare ">" is a paragraph break)
//   -        DM note (also *, •, – bullets from pasted docs)
//   check:   <skill> DC <n> | <what> | fail: ... | success: ...
//   if:      <when> → <then>   (-> and => work too)
//   action:  scene <name> | black | bank | initiative
// Anything else becomes a note, so nothing pasted is silently lost.
__turbopack_context__.s([
    "actionMarkdown",
    ()=>actionMarkdown,
    "beatFirstLine",
    ()=>beatFirstLine,
    "beatMarkdown",
    ()=>beatMarkdown,
    "checkMarkdown",
    ()=>checkMarkdown,
    "episodeMarkdown",
    ()=>episodeMarkdown,
    "parseCheck",
    ()=>parseCheck,
    "parseEpisode",
    ()=>parseEpisode,
    "sceneKey",
    ()=>sceneKey,
    "sceneResolver",
    ()=>sceneResolver
]);
function sceneKey(name) {
    return name.normalize("NFKC").toLowerCase().replace(/[‘’ʼ`´]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ").trim().replace(/^the /, "");
}
function sceneResolver(scenes) {
    return (name)=>{
        const k = sceneKey(name);
        if (!k) return null;
        const hit = scenes.find((s)=>sceneKey(s.label) === k) ?? scenes.find((s)=>s.name && sceneKey(s.name) === k);
        return hit?.id ?? null;
    };
}
const BULLET = /^(?:[-*•–—]|\d+[.)])\s+/;
const ARROW = /\s*(?:→|->|=>|⇒)\s*/;
function clean(line) {
    return line.replace(/ /g, " ").replace(/[​﻿]/g, "").replace(/\s+$/, "");
}
function prefixed(line, word) {
    const m = new RegExp(`^${word}\\s*:\\s*`, "i").exec(line);
    return m ? line.slice(m[0].length).trim() : null;
}
function parseCheck(body) {
    const parts = body.split("|").map((x)=>x.trim());
    const head = /^(.*?)\s*\bDC\s*:?\s*(\d+)\s*$/i.exec(parts[0] ?? "");
    if (!head || !head[1]) return null;
    const check = {
        skill: head[1].trim(),
        dc: Number(head[2]),
        what: ""
    };
    for (const p of parts.slice(1)){
        if (!p) continue;
        const fail = prefixed(p, "fail(?:ure)?");
        const success = prefixed(p, "success");
        if (fail !== null) check.fail = fail;
        else if (success !== null) check.success = success;
        else check.what = check.what ? `${check.what} | ${p}` : p;
    }
    return check;
}
function parseEpisode(markdown, resolve, fallbackTitle = "New episode") {
    const warnings = [];
    const beats = [];
    let title = "";
    let cur = null;
    // Read-aloud lines collect into paragraphs; a bare ">" or a blank line ends one.
    let para = [];
    let inRead = false;
    let preamble = 0;
    const flushPara = ()=>{
        if (cur && para.length) {
            if (cur.readAloud === undefined) {
                cur.readAloud = [];
                cur.readAloudAt = cur.notes.length;
            }
            cur.readAloud.push(para.join(" "));
        }
        para = [];
    };
    for (const raw of markdown.replace(/\r\n?/g, "\n").split("\n")){
        const line = clean(raw).trim();
        const read = /^>\s?(.*)$/.exec(line);
        if (read) {
            if (!cur) {
                preamble++;
                continue;
            }
            inRead = true;
            const t = read[1].trim();
            if (t) para.push(t);
            else flushPara();
            continue;
        }
        if (inRead) {
            flushPara();
            inRead = false;
        }
        if (!line) continue;
        const h = /^(#{1,6})\s*(.*)$/.exec(line);
        if (h && h[1].length !== 2) {
            // "# Episode title" before the first beat; deeper headings are just notes.
            if (h[1].length === 1 && !cur && !title) title = h[2].trim();
            else if (cur && h[2].trim()) cur.notes.push(h[2].trim());
            continue;
        }
        if (h) {
            cur = {
                title: h[2].trim() || `Beat ${beats.length + 1}`,
                notes: [],
                checks: [],
                branches: [],
                actions: []
            };
            beats.push(cur);
            continue;
        }
        if (!cur) {
            preamble++;
            continue;
        }
        const where = `“${cur.title}”`;
        let v;
        if ((v = prefixed(line, "check")) !== null) {
            const c = parseCheck(v);
            if (c) cur.checks.push(c);
            else {
                warnings.push(`${where}: couldn't find a DC in “check: ${v}”, so it's kept as a note.`);
                cur.notes.push(`Check: ${v}`);
            }
        } else if ((v = prefixed(line, "if")) !== null) {
            const [when, ...rest] = v.split(ARROW);
            cur.branches.push({
                when: when.trim(),
                then: rest.join(" → ").trim()
            });
        } else if ((v = prefixed(line, "action")) !== null) {
            const a = parseAction(v, resolve);
            if ("action" in a) cur.actions.push(a.action);
            else warnings.push(`${where}: ${a.warning}`);
        } else if (BULLET.test(line)) {
            cur.notes.push(line.replace(BULLET, "").trim());
        } else {
            cur.notes.push(line);
        }
    }
    if (inRead) flushPara();
    if (preamble) warnings.push(`Skipped ${preamble} line${preamble === 1 ? "" : "s"} before the first “##” beat.`);
    if (!beats.length) warnings.push("No beats found. Start each beat with a line like “## Artum bursts in”.");
    return {
        title: title || fallbackTitle,
        beats,
        warnings
    };
}
function parseAction(v, resolve) {
    const [verb, ...rest] = v.trim().split(/\s+/);
    const arg = rest.join(" ");
    switch((verb ?? "").toLowerCase()){
        case "scene":
            {
                const id = resolve(arg);
                if (!id) return {
                    warning: `no scene called “${arg}”, so “action: ${v}” was left off.`
                };
                return {
                    action: {
                        type: "scene",
                        sceneId: id
                    }
                };
            }
        case "black":
            return {
                action: {
                    type: "black"
                }
            };
        case "bank":
            return {
                action: {
                    type: "bank"
                }
            };
        case "initiative":
            return {
                warning: "there's no initiative tracker yet, so “action: initiative” was left off."
            };
        default:
            return {
                warning: `didn't recognise “action: ${v}”, so it was left off.`
            };
    }
}
function actionMarkdown(a, scenes) {
    if (a.type === "black") return "action: black";
    if (a.type === "bank") return "action: bank";
    const sc = scenes.find((s)=>s.id === a.sceneId);
    return sc ? `action: scene ${sc.label}` : null;
}
function checkMarkdown(c) {
    const parts = [
        `${c.skill} DC ${c.dc}`
    ];
    if (c.what) parts.push(c.what);
    if (c.fail) parts.push(`fail: ${c.fail}`);
    if (c.success) parts.push(`success: ${c.success}`);
    return `check: ${parts.join(" | ")}`;
}
function beatMarkdown(b, scenes) {
    const out = [
        `## ${b.title}`
    ];
    const read = ()=>(b.readAloud ?? []).map((p)=>`> ${p}`).join("\n>\n");
    const at = Math.min(b.readAloudAt ?? 0, b.notes.length);
    b.notes.forEach((n, i)=>{
        if (i === at && b.readAloud?.length) out.push(read());
        out.push(`- ${n}`);
    });
    if (b.readAloud?.length && at >= b.notes.length) out.push(read());
    for (const c of b.checks)out.push(checkMarkdown(c));
    for (const br of b.branches)out.push(br.then ? `if: ${br.when} → ${br.then}` : `if: ${br.when}`);
    for (const a of b.actions){
        const m = actionMarkdown(a, scenes);
        if (m) out.push(m);
    }
    return out.join("\n");
}
function episodeMarkdown(ep, scenes) {
    return [
        `# ${ep.title}`,
        ...ep.beats.map((b)=>beatMarkdown(b, scenes))
    ].join("\n\n") + "\n";
}
function beatFirstLine(b) {
    if (b.readAloud?.length && (b.readAloudAt ?? 0) === 0) return b.readAloud[0];
    return b.notes[0] ?? b.readAloud?.[0] ?? (b.checks[0] ? `${b.checks[0].skill} DC ${b.checks[0].dc}` : "");
}
}),
"[project]/src/shared/seed.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_SEATS",
    ()=>DEFAULT_SEATS,
    "SEED_ITEMS",
    ()=>SEED_ITEMS,
    "SEED_SCENES",
    ()=>SEED_SCENES,
    "SEED_SHOPS",
    ()=>SEED_SHOPS,
    "candlefairMap",
    ()=>candlefairMap,
    "emptyProgress",
    ()=>emptyProgress,
    "freshStart",
    ()=>freshStart,
    "seatedCount",
    ()=>seatedCount,
    "seatsOf",
    ()=>seatsOf,
    "seedGame",
    ()=>seedGame,
    "swordCoastMap",
    ()=>swordCoastMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-route] (ecmascript)");
;
const DEFAULT_SEATS = 6;
function seatsOf(g) {
    return g.maxPlayers ?? DEFAULT_SEATS;
}
function seatedCount(g) {
    return g.players.filter((p)=>!p.archived).length;
}
// Spoiler-free starter catalog, organised by what things do. Every shop starts hidden.
const shop = (id, name, subtitle, extra = {})=>({
        id,
        name,
        subtitle,
        visibility: "hidden",
        playerIds: [],
        ...extra
    });
const SEED_SHOPS = [
    shop("general", "General Store", "Odds and ends for the road"),
    shop("smith", "The Smithy", "Steel, leather, and things that shoot"),
    shop("apoth", "Apothecary & Temple", "Healing, holy water, and prayers"),
    shop("candle", "The Flickering Candle", "Mags hears everything"),
    shop("docks", "The Docks", "Boats, horses, and passage down the coast"),
    shop("training", "Training", "Learn something new"),
    shop("bg", "Baldur’s Gate", "Special orders from the city. Pay now; it arrives in 2 sessions."),
    shop("peddler", "A Traveling Peddler", "Comes once a year. Sells exactly what you need.", {
        closed: true,
        secretSales: true
    })
];
const it = (id, category, shopId, name, priceCp, description, o = {})=>({
        id,
        shopId,
        name,
        priceCp,
        description,
        tier: "sale",
        reason: "",
        hint: "",
        hidePrice: false,
        stock: null,
        restockNote: "",
        category,
        kind: "purchase",
        ...o
    });
const locked = (reason, o = {})=>({
        tier: "locked",
        reason,
        ...o
    });
const rumored = (hint, o = {})=>({
        tier: "rumored",
        hint,
        ...o
    });
/** Gear you buy one of, not a stack. */ const ONE = {
    oneAtATime: true
};
const order = (o = {})=>({
        kind: "order",
        arrivesInSessions: 2,
        ...o
    });
const service = (o = {})=>({
        kind: "service",
        oneAtATime: true,
        ...o
    });
const rent = (o = {})=>({
        kind: "recurring",
        oneAtATime: true,
        ...o
    });
const project = (o = {})=>({
        kind: "project",
        ...o
    });
const earned = (o = {})=>({
        kind: "earned",
        ...o
    });
const FREE = {
    priceLabel: "Free*",
    oneAtATime: true
};
const LEVEL3 = "Orders open at level 3";
const SEED_ITEMS = [
    // ---------- Gear ----------
    it("i2", "gear", "general", "Rope, 50 ft", 1 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Hempen. Mostly unfrayed."),
    it("g-caltrops", "gear", "general", "Caltrops (bag)", 1 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "For whatever is chasing you."),
    it("g-oil", "gear", "general", "Oil Flask", 1 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SP"], "Thrown and lit: fire damage."),
    it("i6", "gear", "general", "Hooded Lantern", 5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Light you can hide in a hurry."),
    it("i8", "gear", "general", "Climber’s Kit", 25 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Pitons, harness, boot tips. Better than Artum’s ladders."),
    it("s-javelin", "gear", "smith", "Javelin", 5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SP"], "A thrown spear anyone can use."),
    it("i10", "gear", "smith", "Dagger", 2 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Every adventurer’s first friend."),
    it("i14", "gear", "smith", "Shield", 10 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Wood and iron. +2 AC.", ONE),
    it("i11", "gear", "smith", "Shortsword", 10 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Quick and light.", ONE),
    it("i12", "gear", "smith", "Longsword", 15 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "The classic.", ONE),
    it("i15", "gear", "smith", "Shortbow", 25 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Easy to carry, quick to draw.", ONE),
    it("i17", "gear", "smith", "Arrows (20)", 1 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Fletched with gull feathers. Locally sourced."),
    it("i16", "gear", "smith", "Longbow", 50 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Reaches farther than trouble does.", ONE),
    it("i18", "gear", "smith", "Chain Shirt", 50 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Medium armor, quiet enough. Your first armor upgrade.", ONE),
    it("i19", "gear", "smith", "Chain Mail", 75 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Heavy armor. You’ll hear yourself coming.", ONE),
    it("i20", "gear", "smith", "Splint Armor", 200 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Heavy plates on leather.", locked("The smith needs iron from Orlumbor", ONE)),
    it("i21", "gear", "smith", "Plate Armor", 1500 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "The dream. Every fighter in Candlefair stops to stare.", locked("Made to order, arrives at level 5", ONE)),
    // ---------- Healing ----------
    it("i7", "healing", "general", "Healer’s Kit", 5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Stabilize a dying friend without a roll. Ten uses."),
    it("a-tonic", "healing", "apoth", "Temple Tonic", 15 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Heals 1d4 + 1. The poor adventurer’s healing potion."),
    it("i24", "healing", "apoth", "Holy Water", 25 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Blessed at the temple. Hurts the restless dead."),
    it("i22", "healing", "apoth", "Potion of Healing", 50 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Red, warm, and tastes like cinnamon. Heals 2d4 + 2."),
    it("i27", "healing", "apoth", "Potion of Greater Healing", 150 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Deep crimson. Heals 4d4 + 4.", locked("The priestess needs moonpetal from the Trollbark")),
    it("a-revivify", "healing", "apoth", "Revivify", 300 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "The temple’s diamond and prayers for a fallen friend.", service({
        prompt: "Who has fallen?"
    })),
    // ---------- Magic (special orders from Baldur's Gate) ----------
    it("bg-climbing", "magic", "bg", "Potion of Climbing", 100 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Climb like a spider for an hour. Tastes of tar.", order()),
    it("i42", "magic", "bg", "Bag of Holding", 400 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Bigger on the inside.", locked(LEVEL3, order({
        oneAtATime: true
    }))),
    it("i44", "magic", "bg", "Cloak of Protection", 400 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Turns blows that should have landed. +1 AC and saves.", locked(LEVEL3, order({
        oneAtATime: true
    }))),
    it("i43", "magic", "bg", "+1 Weapon", 400 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Finer steel than any smith in Candlefair can make.", locked(LEVEL3, order({
        oneAtATime: true
    }))),
    it("bg-flametongue", "magic", "bg", "Flame Tongue", 4000 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A sword that bursts into flame on a word.", rumored("Only in the city itself", order({
        oneAtATime: true
    }))),
    it("bg-wand", "magic", "bg", "Sorcerous Sundries", 0, "The city’s famous magic shop.", rumored("Wands, scrolls, and things that hum")),
    // ---------- Travel ----------
    it("i37", "travel", "docks", "Riding Horse", 75 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Freedom to travel. For the long road south.", ONE),
    it("i34", "travel", "docks", "Rowboat", 50 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Two oars, one bucket for bailing.", ONE),
    it("i35", "travel", "docks", "Fennick’s Boat", 120 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Good fishing boat. Barely sank.", {
        ...ONE,
        stock: 1,
        restockNote: "Sold. Fennick is already building another."
    }),
    it("i36", "travel", "docks", "Passage to Baldur’s Gate (each)", 20 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "About four days by sea, weather permitting."),
    it("d-moonshae", "travel", "docks", "Passage to the Moonshae Isles", 0, "", rumored("No captain will sail there. Yet.")),
    it("d-keelboat", "travel", "docks", "Keelboat", 3000 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "River and coast, with room for a crew.", locked("Ask the shipwrights on Orlumbor", ONE)),
    it("d-ship", "travel", "docks", "A Sailing Ship", 10000 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Your own ship. Your own flag.", locked("Every captain on the coast would know your name", ONE)),
    // ---------- Services ----------
    it("c-drink", "services", "candle", "Buy Mags a drink", 4, "She tells you a rumor.", service()),
    it("c-ask", "services", "candle", "Ask Mags about…", 5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Name a person or place. She’ll tell you one thing that’s true.", service({
        prompt: "Who or what do you want to ask about?"
    })),
    it("c-intro", "services", "candle", "An introduction", 2 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Mags introduces you to someone useful.", service()),
    it("c-flyer", "services", "candle", "Post on the notice board", 1 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SP"], "Write a flyer. Mags pins it up if it’s decent.", service({
        flyer: true
    })),
    it("c-porter", "services", "candle", "Hire a porter (per day)", 2 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SP"], "Carries what you can’t."),
    it("i33", "services", "candle", "Hire a guide into the Trollbark (per day)", 2 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A local who knows which paths come back out."),
    it("c-sellsword", "services", "candle", "Hire a sellsword (per day)", 2 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Fights for coin. Mostly on your side."),
    it("c-safe", "services", "candle", "Safekeeping behind the bar", 1 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Mags keeps your valuables under the counter.", rent()),
    it("a-identify", "services", "apoth", "Identify an item", 20 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "The priestess tells you what it is, and what it does.", service({
        prompt: "Which item?"
    })),
    it("tr-lang", "services", "training", "Learn a language or tool", 250 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Five lessons, paid one per session. Proficiency when you finish.", {
        kind: "training",
        installments: 5,
        oneAtATime: true,
        prompt: "Which language or tool?"
    }),
    it("tr-watcher", "services", "training", "Lessons with ???", 0, "", rumored("Someone in town has been watching you.", {
        kind: "training",
        installments: 5,
        oneAtATime: true
    })),
    // ---------- Building Candlefair ----------
    it("i30", "building", "candle", "Room for the Night", 5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SP"], "Warm bed, roof that never leaks."),
    it("c-room", "building", "candle", "Rent a room", 3 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A room upstairs, and a stash for your gear.", rent()),
    it("c-tab", "building", "candle", "Open a tab", 0, "Mags lets you drink now and pay later, up to 10 gp.", locked("Once Mags thinks of you as regulars.", {
        priceLabel: "No charge",
        oneAtATime: true,
        effects: [
            {
                type: "credit",
                limitCp: 10 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"]
            }
        ]
    })),
    it("c-backroom", "building", "candle", "The Back Room", 10 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A private room behind the kitchen. Thick walls, one key. The party’s first headquarters.", locked("Mags only rents it to people she trusts.", rent({
        keep: true
    }))),
    it("g-house", "building", "general", "A house in town", 1000 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A door with your name on it.", locked("Available at level 4", {
        ...ONE,
        keep: true
    })),
    it("g-hall", "building", "general", "An adventurers’ hall", 2000 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A hall, a sign, and a reputation.", locked("Candlefair needs to know who you are first", {
        ...ONE,
        keep: true
    })),
    it("d-ferry", "building", "docks", "New rope and lantern for the ferry", 15 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "The ferry runs after dark again.", project()),
    it("d-fishing", "building", "docks", "A share in Fennick’s fishing", 150 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "1d6 gp every session, split by share.", project({
        effects: [
            {
                type: "income",
                dice: "1d6",
                unitCp: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"]
            }
        ]
    })),
    it("i39", "building", "general", "Lanterns for the watch", 100 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Safer streets at night.", project()),
    it("i40", "building", "apoth", "Repair the temple roof", 250 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "The priestess will remember this: 10% off Healing.", project({
        effects: [
            {
                type: "discount",
                pct: 10,
                category: "healing"
            }
        ]
    })),
    it("s-forge", "building", "smith", "A new forge", 300 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Hot enough for real armor. Unlocks Splint Armor.", project({
        effects: [
            {
                type: "unlock",
                itemId: "i20"
            }
        ]
    })),
    it("t-lighthouse", "building", "docks", "Rebuild the Lantern’s lighthouse", 500 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Ships return, and new stock comes to the Docks.", rumored("The old lamp across the river hasn’t been lit in years.", project())),
    // ---------- Trophies ----------
    it("i32", "trophies", "candle", "Round for the House", 5 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "Everyone drinks. Advantage on your next Charisma check at the Candle."),
    it("c-trophy", "trophies", "candle", "Mount a trophy at the Candle", 50 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A keepsake from a fight goes on the wall, with a little plaque.", {
        keep: true
    }),
    it("g-citizens", "trophies", "general", "Free Citizens of Candlefair", 500 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "A title on your page.", locked("The council must vote.", {
        ...ONE,
        keep: true
    })),
    it("i41", "trophies", "general", "A Statue of the Party", 1000 * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GP"], "In the square.", locked("Pigeons included", {
        ...ONE,
        keep: true
    })),
    it("c-tale", "trophies", "candle", "A candle on the tale shelf", 0, "For the best tale on Tale Night.", earned()),
    it("c-pudding", "trophies", "candle", "The Pudding Slayer", 0, "A drink named after the party.", earned()),
    // ---------- A Traveling Peddler (closed until the DM opens it, usually for one player) ----------
    it("p-coin", "magic", "peddler", "A Lucky Coin", 0, "Warm to the touch. Lands the way you need it to, once.", {
        ...FREE,
        finePrint: "*Must be returned to the Peddler before Winterfest ends."
    }),
    it("p-key", "magic", "peddler", "Exactly the Right Key", 0, "Opens one door you will very much need opened.", {
        ...FREE,
        finePrint: "*The Peddler chooses which door."
    }),
    it("p-wind", "magic", "peddler", "A Second Wind, Bottled", 0, "Uncork it when you’re down. You’ll get back up.", {
        ...FREE,
        finePrint: "*Payment will be collected later."
    })
];
/** Seed pins start in a loose grid so they're easy to grab and drag into place once the image is up. */ function pins(raw, prefix) {
    return raw.map(([name, type, description, discovered, link], i)=>({
            id: `${prefix}${i + 1}`,
            number: i + 1,
            showsAs: "",
            name,
            type,
            description,
            dmNotes: "",
            discovered: !!discovered,
            x: 0.2 + i % 4 * 0.2,
            y: 0.3 + Math.floor(i / 4) * 0.4,
            ...link ? {
                link
            } : {}
        }));
}
function mapData(p) {
    return {
        pins: p,
        legendOn: false,
        legendStyle: "names"
    };
}
function candlefairMap() {
    return mapData(pins([
        [
            "The Flickering Candle",
            "tavern",
            "The finest tavern this side of the Winding Water.",
            true
        ],
        [
            "The Banquet Hall",
            "hall",
            "Where the Winterfest feast is held.",
            true
        ],
        [
            "The Docks",
            "docks",
            "Fishing boats, the ferry, and the odd ship up from Baldur’s Gate.",
            true,
            {
                kind: "shop",
                shopId: "docks"
            }
        ],
        [
            "The Temple",
            "temple",
            "Quiet, cold, and always a candle lit."
        ],
        [
            "The Smithy",
            "shop",
            "Hammering from dawn to dusk.",
            false,
            {
                kind: "shop",
                shopId: "smith"
            }
        ],
        [
            "The Market Square",
            "square",
            "Winterfest’s heart."
        ],
        [
            "Lathtarl’s Lantern",
            "village",
            "The little fishing village across the river."
        ],
        [
            "Warlock’s Crypt",
            "danger",
            "The old crypt on the hill above town."
        ]
    ], "cf"));
}
function swordCoastMap(candlefairSceneId = "s-map") {
    return mapData(pins([
        [
            "Candlefair",
            "home",
            "Home.",
            true,
            {
                kind: "scene",
                sceneId: candlefairSceneId
            }
        ],
        [
            "Baldur’s Gate",
            "city",
            "A week south."
        ],
        [
            "Daggerford",
            "town",
            "A small river town up the road."
        ],
        [
            "Orlumbor",
            "island",
            "Shipwrights’ island offshore."
        ],
        [
            "The Trollbark Forest",
            "danger",
            "Locals don’t go in after dark."
        ]
    ], "sc"));
}
const SEED_SCENES = [
    {
        id: "s-board",
        label: "Notice board",
        kind: "notice",
        hotkey: 1,
        reveal: false,
        art: {
            builtin: "candlefair-board"
        }
    },
    {
        id: "s-artum",
        label: "Artum",
        kind: "portrait",
        hotkey: 2,
        reveal: false,
        art: {
            builtin: "artum"
        },
        name: "Artum",
        title: "Planner of Winterfest",
        alt: "Portrait of Artum, Winterfest’s harried planner: balding, spectacles, worried brows, a quill behind his ear and a scarf"
    },
    {
        id: "s-mags",
        label: "Mags Wick",
        kind: "portrait",
        hotkey: 3,
        reveal: false,
        art: {
            builtin: "mags-wick"
        },
        name: "Mags Wick",
        title: "Keeper of the Flickering Candle",
        alt: "Portrait of Mags Wick, the halfling who runs the Flickering Candle: gray hair in a bun, rosy cheeks, a wide smile and an apron"
    },
    {
        id: "s-chef",
        label: "The chef",
        kind: "portrait",
        hotkey: 4,
        reveal: false,
        art: {
            builtin: "chef"
        },
        name: "The Chef",
        title: "Head cook of the Winterfest feast",
        alt: "Portrait of the chef: a tall puffy chef’s hat, a big ginger beard, a proud smile, a flour smudge and a wooden spoon"
    },
    {
        id: "s-notice",
        label: "Artum’s notice",
        kind: "handout",
        hotkey: 5,
        reveal: false,
        art: {
            builtin: "artum-notice"
        },
        alt: "Artum’s handbill: Winterfest Needs Hands!"
    },
    {
        id: "s-map",
        label: "Candlefair map",
        kind: "map",
        hotkey: 6,
        reveal: false,
        art: {},
        alt: "Map of Candlefair",
        map: candlefairMap()
    },
    {
        id: "s-swordcoast",
        label: "Sword Coast map",
        kind: "map",
        hotkey: 9,
        reveal: false,
        art: {},
        alt: "Map of the Sword Coast",
        map: swordCoastMap()
    },
    {
        id: "s-extra",
        label: "Extra image",
        kind: "image",
        hotkey: 7,
        reveal: false,
        art: {},
        alt: "Scene image"
    },
    {
        id: "s-symbol",
        label: "The symbol",
        kind: "handout",
        hotkey: 8,
        reveal: true,
        art: {
            builtin: "merchant-sigil"
        },
        alt: "A symbol drawn on paper"
    },
    {
        id: "s-black",
        label: "Black screen",
        kind: "black",
        hotkey: 0,
        reveal: false
    }
];
function seedGame(id, name = "Tales from the Flickering Candle", now = Date.now()) {
    return {
        schema: 2,
        id,
        name,
        createdAt: now,
        live: {
            sceneId: "s-board",
            shopOpen: false,
            shopId: "general",
            purseVisible: true
        },
        doorClosed: false,
        maxPlayers: DEFAULT_SEATS,
        players: [
            1,
            2,
            3,
            4
        ].map((n)=>({
                id: "p" + n,
                handle: "player" + n,
                name: "Player " + n,
                away: false,
                archived: false,
                dropIn: false,
                balanceCp: 0,
                createdAt: now,
                createdVia: "seed"
            })),
        scenes: structuredClone(SEED_SCENES),
        shops: structuredClone(SEED_SHOPS),
        items: structuredClone(SEED_ITEMS),
        sessions: [],
        currentSessionId: null,
        knocks: [],
        orders: [],
        banner: null,
        requests: [],
        ...emptyProgress(),
        seq: 100
    };
}
function freshStart(g) {
    const s = structuredClone(g);
    for (const p of s.players)p.balanceCp = 0;
    s.sessions = [];
    s.currentSessionId = null;
    s.knocks = [];
    s.orders = [];
    s.banner = null;
    s.requests = [];
    Object.assign(s, emptyProgress());
    const home = s.scenes.find((x)=>x.kind === "notice" && !x.reveal) ?? s.scenes.find((x)=>!x.reveal) ?? s.scenes[0];
    if (home) s.live.sceneId = home.id;
    s.live.shopOpen = false;
    delete s.live.recapSessionId;
    return s;
}
function emptyProgress() {
    return {
        rentals: [],
        trainings: [],
        stakes: [],
        effectsOn: {},
        awards: [],
        tasks: [],
        flyers: []
    };
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__16oj4c38t5o-o._.js.map