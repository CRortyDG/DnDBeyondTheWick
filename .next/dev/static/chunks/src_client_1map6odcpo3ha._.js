(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/client/App.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "App",
    ()=>App
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$DmApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/DmApp.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$Landing$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/Landing.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$PlayerApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/player/PlayerApp.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$tv$2f$TvApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/tv/TvApp.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function App() {
    _s();
    const [ident, setIdent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "App.useEffect": ()=>{
            const i = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readIdent"])();
            setIdent(i);
            const role = (i.player ?? "").toLowerCase();
            document.documentElement.dataset.view = !i.player ? "landing" : role === "tv" ? "tv" : role === "dm" ? "dm" : "player";
        }
    }["App.useEffect"], []);
    if (!ident) return null;
    const role = (ident.player ?? "").trim().toLowerCase();
    if (!role) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$Landing$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Landing"], {
        game: ident.game
    }, void 0, false, {
        fileName: "[project]/src/client/App.tsx",
        lineNumber: 22,
        columnNumber: 21
    }, this);
    if (role === "tv") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$tv$2f$TvApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TvApp"], {
        ident: ident
    }, void 0, false, {
        fileName: "[project]/src/client/App.tsx",
        lineNumber: 23,
        columnNumber: 29
    }, this);
    if (role === "dm") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$DmApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DmApp"], {
        ident: ident
    }, void 0, false, {
        fileName: "[project]/src/client/App.tsx",
        lineNumber: 24,
        columnNumber: 29
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$PlayerApp$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlayerApp"], {
        ident: ident
    }, void 0, false, {
        fileName: "[project]/src/client/App.tsx",
        lineNumber: 25,
        columnNumber: 10
    }, this);
}
_s(App, "aYOD2+06c4kZAmCACW+wk2JHd3g=");
_c = App;
var _c;
__turbopack_context__.k.register(_c, "App");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/Landing.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Landing",
    ()=>Landing
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Notice.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function Landing({ game }) {
    _s();
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
        title: "Who\u2019s at the table?",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Write your name to pull up a chair. It’s the same name every week."
            }, void 0, false, {
                fileName: "[project]/src/client/Landing.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "form",
                onSubmit: (e)=>{
                    e.preventDefault();
                    const n = name.trim();
                    if (n) window.location.href = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hrefFor"])(game, n);
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Your name",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld big",
                                value: name,
                                onChange: (e)=>setName(e.target.value),
                                autoComplete: "nickname",
                                autoCapitalize: "words",
                                autoFocus: true,
                                maxLength: 32
                            }, void 0, false, {
                                fileName: "[project]/src/client/Landing.tsx",
                                lineNumber: 23,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/Landing.tsx",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary big",
                        type: "submit",
                        disabled: !name.trim(),
                        children: "Take a seat"
                    }, void 0, false, {
                        fileName: "[project]/src/client/Landing.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/Landing.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "landing-links",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hrefFor"])(game, "TV"),
                        children: "This is the TV"
                    }, void 0, false, {
                        fileName: "[project]/src/client/Landing.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: " · "
                    }, void 0, false, {
                        fileName: "[project]/src/client/Landing.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hrefFor"])(game, "DM"),
                        children: "I’m the DM"
                    }, void 0, false, {
                        fileName: "[project]/src/client/Landing.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/Landing.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/Landing.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
_s(Landing, "gFPpQ6rgfiGkmgRsh4q2nIO1W+Q=");
_c = Landing;
var _c;
__turbopack_context__.k.register(_c, "Landing");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ApiError",
    ()=>ApiError,
    "KEY_HEADER",
    ()=>KEY_HEADER,
    "absoluteHref",
    ()=>absoluteHref,
    "api",
    ()=>api,
    "authHeaders",
    ()=>authHeaders,
    "hrefFor",
    ()=>hrefFor,
    "readIdent",
    ()=>readIdent,
    "rememberKey",
    ()=>rememberKey,
    "streamUrl",
    ()=>streamUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/handles.ts [app-client] (ecmascript)");
"use client";
;
const KEY_HEADER = "x-candlefair-key";
function keySlot(game, player) {
    return `cf-key:${game}:${player.trim().toLowerCase()}`;
}
function safeGet(k) {
    try {
        return localStorage.getItem(k);
    } catch  {
        return null;
    }
}
function safeSet(k, v) {
    try {
        if (v === null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
    } catch  {}
}
function readIdent() {
    const url = new URL(window.location.href);
    const game = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$handles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["normaliseGameId"])(url.searchParams.get("game"));
    const player = url.searchParams.get("player");
    const urlKey = url.searchParams.get("key");
    let key = null;
    if (player) {
        if (urlKey) {
            safeSet(keySlot(game, player), urlKey);
            url.searchParams.delete("key");
            window.history.replaceState(null, "", url.pathname + (url.search ? url.search : "") + url.hash);
        }
        key = urlKey ?? safeGet(keySlot(game, player));
    }
    return {
        game,
        player,
        key
    };
}
function rememberKey(ident, key) {
    if (ident.player) safeSet(keySlot(ident.game, ident.player), key);
}
function hrefFor(game, player, extra = {}) {
    const q = new URLSearchParams();
    if (game !== "candlefair") q.set("game", game);
    if (player) q.set("player", player);
    for (const [k, v] of Object.entries(extra))q.set(k, v);
    const s = q.toString();
    return "/" + (s ? "?" + s : "");
}
function absoluteHref(game, player, extra = {}) {
    return window.location.origin + hrefFor(game, player, extra);
}
function apiUrl(path, ident) {
    const q = new URLSearchParams({
        game: ident.game
    });
    if (ident.player) q.set("player", ident.player);
    return `${path}?${q}`;
}
function authHeaders(ident) {
    return ident.key ? {
        [KEY_HEADER]: ident.key
    } : {};
}
class ApiError extends Error {
    status;
    code;
    constructor(message, status, code){
        super(message), this.status = status, this.code = code;
    }
}
async function api(path, ident, init = {}) {
    const res = await fetch(apiUrl(path, ident), {
        ...init,
        cache: "no-store",
        headers: {
            ...init.body && typeof init.body === "string" ? {
                "Content-Type": "application/json"
            } : {},
            ...authHeaders(ident),
            ...init.headers ?? {}
        }
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
    return data;
}
function streamUrl(ident) {
    return `/api/stream?game=${encodeURIComponent(ident.game)}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/tv/TvApp.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TvApp",
    ()=>TvApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/useGame.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Purse$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Purse.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/SceneView.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/ShopBoard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Notice.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$BannerToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/BannerToast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
const FADE_MS = 600;
function TvApp({ ident }) {
    _s();
    const g = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"])(ident);
    const view = g.view;
    if (!view) {
        if (g.phase === "no-game") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
            title: "No table here yet",
            children: "Ask the DM to set up this game, then reload."
        }, void 0, false, {
            fileName: "[project]/src/client/tv/TvApp.tsx",
            lineNumber: 21,
            columnNumber: 39
        }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "tv-root tv-blank",
            "aria-busy": "true"
        }, void 0, false, {
            fileName: "[project]/src/client/tv/TvApp.tsx",
            lineNumber: 22,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TvScreen, {
        view: view,
        online: g.online
    }, void 0, false, {
        fileName: "[project]/src/client/tv/TvApp.tsx",
        lineNumber: 24,
        columnNumber: 10
    }, this);
}
_s(TvApp, "E/0JSCBS2d2MVPKVLNUvZnZMpeg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"]
    ];
});
_c = TvApp;
function TvScreen({ view, online }) {
    _s1();
    const live = view.scenes.find((s)=>s.id === view.live.sceneId) ?? view.scenes[0];
    const layers = useCrossfade(live);
    usePreload(view.scenes);
    const { barVisible, idle, togglePinned } = useIdleBar();
    const [showOffline, setShowOffline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Only mention a lost connection if it lasts; the scene stays on screen regardless.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TvScreen.useEffect": ()=>{
            if (online) return setShowOffline(false);
            const t = setTimeout({
                "TvScreen.useEffect.t": ()=>setShowOffline(true)
            }["TvScreen.useEffect.t"], 4000);
            return ({
                "TvScreen.useEffect": ()=>clearTimeout(t)
            })["TvScreen.useEffect"];
        }
    }["TvScreen.useEffect"], [
        online
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TvScreen.useEffect": ()=>{
            const onKey = {
                "TvScreen.useEffect.onKey": (e)=>{
                    if (e.metaKey || e.ctrlKey || e.altKey) return;
                    if (e.key === "f" || e.key === "F") toggleFullscreen();
                    if (e.key === "h" || e.key === "H") togglePinned();
                }
            }["TvScreen.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "TvScreen.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["TvScreen.useEffect"];
        }
    }["TvScreen.useEffect"], [
        togglePinned
    ]);
    const shop = view.shops.find((s)=>s.id === view.live.shopId) ?? view.shops[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `tv-root${idle ? " idle" : ""}`,
        children: [
            layers.map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `tv-layer${l.entering ? " entering" : ""}`,
                    "aria-hidden": l.leaving,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SceneView"], {
                        scene: l.scene,
                        flyers: view.flyers
                    }, void 0, false, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this)
                }, l.key, false, {
                    fileName: "[project]/src/client/tv/TvApp.tsx",
                    lineNumber: 56,
                    columnNumber: 9
                }, this)),
            view.live.shopOpen && shop ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "tv-shop",
                role: "region",
                "aria-label": view.live.shopCategory ? "The market, open on the TV" : `${shop.name}, open on the TV`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShopBoard"], {
                    shops: view.shops,
                    items: view.items,
                    shopId: shop.id,
                    size: "tv",
                    mode: view.live.shopCategory ? "category" : "shop",
                    category: view.live.shopCategory
                }, void 0, false, {
                    fileName: "[project]/src/client/tv/TvApp.tsx",
                    lineNumber: 63,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/tv/TvApp.tsx",
                lineNumber: 62,
                columnNumber: 9
            }, this) : null,
            view.recap ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "tv-recap",
                role: "region",
                "aria-label": "Previously on",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "tv-recap-sheet",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "tv-recap-kicker",
                            children: "Previously on…"
                        }, void 0, false, {
                            fileName: "[project]/src/client/tv/TvApp.tsx",
                            lineNumber: 70,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "tv-recap-title",
                            children: view.recap.title
                        }, void 0, false, {
                            fileName: "[project]/src/client/tv/TvApp.tsx",
                            lineNumber: 71,
                            columnNumber: 13
                        }, this),
                        view.recap.text.split(/\n\s*\n/).filter((p)=>p.trim()).map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: p.trim()
                            }, i, false, {
                                fileName: "[project]/src/client/tv/TvApp.tsx",
                                lineNumber: 76,
                                columnNumber: 17
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/tv/TvApp.tsx",
                    lineNumber: 69,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/tv/TvApp.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Purse$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Purse"], {
                players: view.purse,
                visible: view.live.purseVisible,
                size: "tv"
            }, void 0, false, {
                fileName: "[project]/src/client/tv/TvApp.tsx",
                lineNumber: 82,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$BannerToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BannerToast"], {
                banner: view.banner,
                className: "tv-banner"
            }, void 0, false, {
                fileName: "[project]/src/client/tv/TvApp.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            showOffline ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "tv-offline",
                role: "status",
                children: [
                    "Reconnecting",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "dots",
                        "aria-hidden": "true"
                    }, void 0, false, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 88,
                        columnNumber: 23
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/tv/TvApp.tsx",
                lineNumber: 87,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: `tv-bar${barVisible ? "" : " hidden"}`,
                "aria-label": "TV controls",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tv-bar-title",
                        children: view.game.name
                    }, void 0, false, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    view.session ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tv-bar-session",
                        children: view.session.title
                    }, void 0, false, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 94,
                        columnNumber: 25
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "spacer"
                    }, void 0, false, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tv-bar-hint",
                        children: "F fullscreen · H hide this bar · scenes are switched from the DM view"
                    }, void 0, false, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: toggleFullscreen,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FullscreenIcon"], {}, void 0, false, {
                                fileName: "[project]/src/client/tv/TvApp.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            " Fullscreen"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: togglePinned,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EyeOffIcon"], {}, void 0, false, {
                                fileName: "[project]/src/client/tv/TvApp.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this),
                            " Hide bar"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/tv/TvApp.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/tv/TvApp.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/tv/TvApp.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
_s1(TvScreen, "6rJq/kCnAvL/J+/pwqN3T+RTzxU=", false, function() {
    return [
        useCrossfade,
        usePreload,
        useIdleBar
    ];
});
_c1 = TvScreen;
function toggleFullscreen() {
    try {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen().catch(()=>{});
    } catch  {}
}
/** Keep the old scene underneath while the new one fades in on top. */ function useCrossfade(scene) {
    _s2();
    const [layers, setLayers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useCrossfade.useState": ()=>scene ? [
                {
                    key: scene.id + ":0",
                    scene,
                    entering: false,
                    leaving: false
                }
            ] : []
    }["useCrossfade.useState"]);
    const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const sig = scene ? JSON.stringify(scene) : "";
    const lastSig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(sig);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useCrossfade.useEffect": ()=>{
            if (!scene || sig === lastSig.current) return;
            const sameScene = layers.length && layers[layers.length - 1].scene.id === scene.id;
            lastSig.current = sig;
            if (sameScene) {
                // Same scene, new details (a caption edit or new image): swap in place.
                setLayers({
                    "useCrossfade.useEffect": (ls)=>ls.map({
                            "useCrossfade.useEffect": (l, i)=>i === ls.length - 1 ? {
                                    ...l,
                                    scene
                                } : l
                        }["useCrossfade.useEffect"])
                }["useCrossfade.useEffect"]);
                return;
            }
            const key = `${scene.id}:${++n.current}`;
            setLayers({
                "useCrossfade.useEffect": (ls)=>[
                        ...ls.slice(-1).map({
                            "useCrossfade.useEffect": (l)=>({
                                    ...l,
                                    leaving: true
                                })
                        }["useCrossfade.useEffect"]),
                        {
                            key,
                            scene,
                            entering: true,
                            leaving: false
                        }
                    ]
            }["useCrossfade.useEffect"]);
            const t = setTimeout({
                "useCrossfade.useEffect.t": ()=>setLayers({
                        "useCrossfade.useEffect.t": (ls)=>ls.filter({
                                "useCrossfade.useEffect.t": (l)=>!l.leaving
                            }["useCrossfade.useEffect.t"]).map({
                                "useCrossfade.useEffect.t": (l)=>({
                                        ...l,
                                        entering: false
                                    })
                            }["useCrossfade.useEffect.t"])
                    }["useCrossfade.useEffect.t"])
            }["useCrossfade.useEffect.t"], FADE_MS + 80);
            return ({
                "useCrossfade.useEffect": ()=>clearTimeout(t)
            })["useCrossfade.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["useCrossfade.useEffect"], [
        sig
    ]);
    return layers;
}
_s2(useCrossfade, "MGHTq5g9GXn65joqh5mgEK/7oAY=");
/** Warm the browser cache so switching scenes is instant (and survives a network blip). */ function usePreload(scenes) {
    _s3();
    const urls = scenes.map((s)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["artSrc"])(s.art)).filter((u)=>!!u && !u.startsWith("/api/art/"));
    const key = urls.join("|");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePreload.useEffect": ()=>{
            const imgs = urls.map({
                "usePreload.useEffect.imgs": (u)=>{
                    const i = new Image();
                    i.decoding = "async";
                    i.src = u;
                    return i;
                }
            }["usePreload.useEffect.imgs"]);
            return ({
                "usePreload.useEffect": ()=>void imgs
            })["usePreload.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["usePreload.useEffect"], [
        key
    ]);
}
_s3(usePreload, "OD7bBpZva5O2jO+Puf00hKivP7c=");
/** The control bar shows when the mouse moves and hides after 3 seconds, like the prototype. */ function useIdleBar() {
    _s4();
    const [idle, setIdle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pinnedHidden, setPinnedHidden] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useIdleBar.useEffect": ()=>{
            let t;
            const wake = {
                "useIdleBar.useEffect.wake": ()=>{
                    setIdle(false);
                    clearTimeout(t);
                    t = setTimeout({
                        "useIdleBar.useEffect.wake": ()=>setIdle(true)
                    }["useIdleBar.useEffect.wake"], 3000);
                }
            }["useIdleBar.useEffect.wake"];
            wake();
            window.addEventListener("mousemove", wake);
            window.addEventListener("touchstart", wake, {
                passive: true
            });
            return ({
                "useIdleBar.useEffect": ()=>{
                    clearTimeout(t);
                    window.removeEventListener("mousemove", wake);
                    window.removeEventListener("touchstart", wake);
                }
            })["useIdleBar.useEffect"];
        }
    }["useIdleBar.useEffect"], []);
    return {
        idle,
        barVisible: !idle && !pinnedHidden,
        togglePinned: ()=>setPinnedHidden((v)=>!v)
    };
}
_s4(useIdleBar, "3MAb+y7T8mbyfQpqtvTKqHvbyuc=");
var _c, _c1;
__turbopack_context__.k.register(_c, "TvApp");
__turbopack_context__.k.register(_c1, "TvScreen");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/BannerToast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BannerToast",
    ()=>BannerToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function BannerToast({ banner, className }) {
    _s();
    const seen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(undefined);
    const [shown, setShown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BannerToast.useEffect": ()=>{
            const id = banner?.id ?? null;
            if (seen.current === undefined) {
                seen.current = id;
                return;
            }
            if (id === seen.current) return;
            seen.current = id;
            if (!banner) return;
            setShown(banner);
            const t = setTimeout({
                "BannerToast.useEffect.t": ()=>setShown(null)
            }["BannerToast.useEffect.t"], 7000);
            return ({
                "BannerToast.useEffect": ()=>clearTimeout(t)
            })["BannerToast.useEffect"];
        }
    }["BannerToast.useEffect"], [
        banner
    ]);
    if (!shown) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: className,
        role: "status",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "banner-seal",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/BannerToast.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            shown.text
        ]
    }, shown.id, true, {
        fileName: "[project]/src/client/ui/BannerToast.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
_s(BannerToast, "n7eAfPPDP+uUur4Wg0oT+7iniGk=");
_c = BannerToast;
var _c;
__turbopack_context__.k.register(_c, "BannerToast");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/ItemCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ItemCard",
    ()=>ItemCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-client] (ecmascript)");
;
;
;
;
const TIER_LABEL = {
    sale: "For sale",
    locked: "Locked",
    rumored: "Rumored",
    hidden: "Hidden"
};
function ItemCard({ item, children, dm, where }) {
    const { tier } = item;
    const soldOut = item.stock === 0;
    // The DM always sees the real thing; players see what the server sent them.
    const showPriceAsUnknown = !dm && (item.priceCp === null || tier === "rumored");
    const kind = item.kind ?? "purchase";
    const known = tier !== "rumored" || dm;
    const base = item.priceLabel && tier !== "rumored" ? item.priceLabel : showPriceAsUnknown ? "??? gp" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(item.priceCp ?? 0);
    const priceText = !known || showPriceAsUnknown ? base : kind === "recurring" ? `${base} a month` : kind === "training" && (item.installments ?? 1) > 1 ? `${base} · ${item.installments} lessons of ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["installmentCp"])(item.priceCp ?? 0, item.installments ?? 1, 0))}` : kind === "project" ? `Goal: ${base}` : base;
    const playersSee = dm && (tier === "rumored" ? "players see ??? and the hint" : tier === "locked" && item.hidePrice ? "players see ??? gp" : tier === "hidden" ? "players don't see this" : null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: `card tier-${tier}${tier !== "sale" ? " locked" : ""}${soldOut ? " sold-out" : ""}`,
        "aria-label": tier === "rumored" && !dm ? "A rumor" : item.name,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-pin",
                "aria-hidden": "true"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            dm ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `tier-badge tier-badge-${tier}`,
                children: TIER_LABEL[tier]
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 63,
                columnNumber: 13
            }, this) : null,
            known && kind === "earned" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "earned-badge",
                children: "Earned"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 64,
                columnNumber: 37
            }, this) : null,
            where ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-shop",
                children: where
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 65,
                columnNumber: 16
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "card-name",
                children: tier === "rumored" && !dm ? "???" : item.name
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            kind === "earned" && known ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-price",
                children: [
                    item.listCp !== undefined && item.listCp !== item.priceCp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("s", {
                                className: "card-was",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(item.listCp)
                            }, void 0, false, {
                                fileName: "[project]/src/client/ui/ItemCard.tsx",
                                lineNumber: 71,
                                columnNumber: 15
                            }, this),
                            " "
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/ui/ItemCard.tsx",
                        lineNumber: 70,
                        columnNumber: 13
                    }, this) : null,
                    priceText,
                    item.discountPct ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "card-off",
                        children: [
                            " ",
                            item.discountPct,
                            "% off"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/ui/ItemCard.tsx",
                        lineNumber: 75,
                        columnNumber: 31
                    }, this) : null,
                    playersSee ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "card-dmprice",
                        children: [
                            " (",
                            playersSee,
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/ui/ItemCard.tsx",
                        lineNumber: 76,
                        columnNumber: 25
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this),
            item.description && (tier !== "rumored" || dm) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-desc",
                children: item.description
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 79,
                columnNumber: 57
            }, this) : null,
            tier === "rumored" && item.hint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-hint",
                children: [
                    "“",
                    item.hint,
                    "”"
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 80,
                columnNumber: 42
            }, this) : null,
            tier === "locked" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-lock",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LockIcon"], {
                        size: 18
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ItemCard.tsx",
                        lineNumber: 83,
                        columnNumber: 11
                    }, this),
                    " ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: item.reason || "Not for sale yet"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ItemCard.tsx",
                        lineNumber: 83,
                        columnNumber: 34
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 82,
                columnNumber: 9
            }, this) : null,
            item.arrivesInSessions && tier !== "rumored" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-order",
                children: [
                    "Special order: arrives ",
                    item.arrivesInSessions === 1 ? "next session" : `${item.arrivesInSessions} sessions after you buy`
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 87,
                columnNumber: 9
            }, this) : null,
            kind === "project" && known && item.priceCp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProjectBar, {
                raised: item.raisedCp ?? 0,
                goal: item.priceCp,
                funded: !!item.funded
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 89,
                columnNumber: 54
            }, this) : null,
            kind === "earned" && known ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-order",
                children: item.earnedBy?.length ? `Earned by ${item.earnedBy.join(", ")}` : "Can’t be bought. Not earned yet."
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 90,
                columnNumber: 37
            }, this) : null,
            item.stock !== null && tier !== "rumored" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-stock",
                children: soldOut ? `Sold out${item.restockNote ? `. ${item.restockNote}` : ""}` : stockText(item.stock, item.held ?? 0)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 92,
                columnNumber: 9
            }, this) : null,
            item.finePrint && tier !== "rumored" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-fine",
                children: item.finePrint
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 94,
                columnNumber: 47
            }, this) : null,
            children ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-acts",
                children: children
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 95,
                columnNumber: 19
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/ItemCard.tsx",
        lineNumber: 61,
        columnNumber: 5
    }, this);
}
_c = ItemCard;
function ProjectBar({ raised, goal, funded }) {
    const pct = Math.max(0, Math.min(100, Math.round(raised / goal * 100)));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "project-bar-wrap",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "project-bar",
                role: "progressbar",
                "aria-valuemin": 0,
                "aria-valuemax": goal,
                "aria-valuenow": Math.min(raised, goal),
                "aria-label": "Raised so far",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "project-fill",
                    style: {
                        width: `${pct}%`
                    }
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/ItemCard.tsx",
                    lineNumber: 105,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "card-order",
                children: funded ? "Funded!" : `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(raised)} of ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(goal)} raised`
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ItemCard.tsx",
                lineNumber: 107,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/ItemCard.tsx",
        lineNumber: 103,
        columnNumber: 5
    }, this);
}
_c1 = ProjectBar;
function stockText(stock, held) {
    if (!held) return `${stock} in stock`;
    if (held >= stock) return "On hold";
    return `${stock - held} in stock, ${held} on hold`;
}
var _c, _c1;
__turbopack_context__.k.register(_c, "ItemCard");
__turbopack_context__.k.register(_c1, "ProjectBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/MapView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapView",
    ()=>MapView,
    "Seal",
    ()=>Seal,
    "useMapBox",
    ()=>useMapBox,
    "usePrefersReducedMotion",
    ()=>usePrefersReducedMotion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$mapGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/mapGeometry.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
const ZOOM = 2;
const BANNER_MS = 5000;
/** Until the image loads (or with no image yet), lay pins out on a 16:9 sheet. */ const PLACEHOLDER = {
    w: 1600,
    h: 900
};
function useMapBox(outer, src) {
    _s();
    const [size, setSize] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        w: 0,
        h: 0
    });
    const [nat, setNat] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "useMapBox.useLayoutEffect": ()=>{
            const el = outer.current;
            if (!el) return;
            const measure = {
                "useMapBox.useLayoutEffect.measure": ()=>setSize({
                        w: el.clientWidth,
                        h: el.clientHeight
                    })
            }["useMapBox.useLayoutEffect.measure"];
            measure();
            const ro = new ResizeObserver(measure);
            ro.observe(el);
            return ({
                "useMapBox.useLayoutEffect": ()=>ro.disconnect()
            })["useMapBox.useLayoutEffect"];
        }
    }["useMapBox.useLayoutEffect"], [
        outer
    ]);
    const img = nat && nat.src === src ? nat : PLACEHOLDER;
    const box = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$mapGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fitBox"])(size.w, size.h, img.w, img.h);
    /** One TV "pixel" at 1920x1080, for this screen (the DM's preview is smaller). */ const unit = Math.min(size.w / 1920, size.h / 1080) || 0;
    const onLoad = (e)=>{
        const i = e.currentTarget;
        if (i.naturalWidth && i.naturalHeight) setNat({
            w: i.naturalWidth,
            h: i.naturalHeight,
            src: src ?? ""
        });
    };
    return {
        size,
        box,
        unit,
        onLoad
    };
}
_s(useMapBox, "ZCqTLdyWmipmoqwphV6H906DJwU=");
function usePrefersReducedMotion() {
    _s1();
    const [reduced, setReduced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePrefersReducedMotion.useEffect": ()=>{
            const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
            setReduced(mq.matches);
            const on = {
                "usePrefersReducedMotion.useEffect.on": ()=>setReduced(mq.matches)
            }["usePrefersReducedMotion.useEffect.on"];
            mq.addEventListener("change", on);
            return ({
                "usePrefersReducedMotion.useEffect": ()=>mq.removeEventListener("change", on)
            })["usePrefersReducedMotion.useEffect"];
        }
    }["usePrefersReducedMotion.useEffect"], []);
    return reduced;
}
_s1(usePrefersReducedMotion, "PAG4zvF6+IsK2eHB7xTPE8NJ12w=");
function Seal({ label, className = "", style, children, ...rest }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `seal${label.length > 2 ? " seal-long" : ""}${className ? " " + className : ""}`,
        style: style,
        ...rest,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "seal-text",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/client/ui/MapView.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/MapView.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
_c = Seal;
function MapView({ src, alt, map, emptyHint }) {
    _s2();
    const outer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { size, box, unit, onLoad } = useMapBox(outer, src);
    const reduced = usePrefersReducedMotion();
    const banner = useBanner(map.banner);
    const focusPin = map.focus ? map.pins.find((p)=>p.id === map.focus.pinId) : undefined;
    const zoom = focusPin && !reduced ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$mapGeometry$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["zoomToward"])(focusPin, box, size.w, size.h, ZOOM) : {
        tx: 0,
        ty: 0,
        scale: 1
    };
    const sealPx = Math.max(16, 64 * unit);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: outer,
        className: `scene-fill scene-backdrop map-scene${reduced ? " still" : ""}`,
        style: {
            "--mu": `${unit}px`,
            "--seal": `${sealPx}px`
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-box",
                style: {
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                    transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.scale})`
                },
                children: [
                    src ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        className: "map-img",
                        src: src,
                        alt: alt ?? "",
                        onLoad: onLoad,
                        draggable: false
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 77,
                        columnNumber: 16
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "map-empty",
                        children: emptyHint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: emptyHint
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/MapView.tsx",
                            lineNumber: 77,
                            columnNumber: 146
                        }, this) : null
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 77,
                        columnNumber: 106
                    }, this),
                    map.pins.map((p)=>{
                        const focused = focusPin?.id === p.id;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Seal, {
                            label: p.label,
                            className: focused ? "pulse" : "",
                            style: {
                                left: `${p.x * 100}%`,
                                top: `${p.y * 100}%`,
                                transform: `translate(-50%, -50%) scale(${1 / zoom.scale})`
                            },
                            "aria-label": p.name ? `${p.label}: ${p.name}` : `Location ${p.label}`
                        }, p.id + (focused ? `:${map.focus.n}` : ""), false, {
                            fileName: "[project]/src/client/ui/MapView.tsx",
                            lineNumber: 81,
                            columnNumber: 13
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/MapView.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            map.legend.on && map.pins.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "map-legend",
                "aria-label": "Locations",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Locations"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        children: map.pins.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Seal, {
                                        label: p.label
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/ui/MapView.tsx",
                                        lineNumber: 98,
                                        columnNumber: 17
                                    }, this),
                                    map.legend.style === "names" && p.name ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "map-legend-text",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "map-legend-name",
                                                children: p.name
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/ui/MapView.tsx",
                                                lineNumber: 101,
                                                columnNumber: 21
                                            }, this),
                                            p.type ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "map-legend-type",
                                                children: p.type
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/ui/MapView.tsx",
                                                lineNumber: 102,
                                                columnNumber: 31
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/ui/MapView.tsx",
                                        lineNumber: 100,
                                        columnNumber: 19
                                    }, this) : null
                                ]
                            }, p.id, true, {
                                fileName: "[project]/src/client/ui/MapView.tsx",
                                lineNumber: 97,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/MapView.tsx",
                lineNumber: 93,
                columnNumber: 9
            }, this) : null,
            focusPin?.name ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-caption",
                role: "status",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Seal, {
                        label: focusPin.label
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "map-caption-name",
                                children: [
                                    focusPin.name,
                                    focusPin.type ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "map-caption-type",
                                        children: focusPin.type
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/ui/MapView.tsx",
                                        lineNumber: 117,
                                        columnNumber: 32
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/ui/MapView.tsx",
                                lineNumber: 115,
                                columnNumber: 13
                            }, this),
                            focusPin.description ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "map-caption-desc",
                                children: focusPin.description
                            }, void 0, false, {
                                fileName: "[project]/src/client/ui/MapView.tsx",
                                lineNumber: 119,
                                columnNumber: 37
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this)
                ]
            }, map.focus.n, true, {
                fileName: "[project]/src/client/ui/MapView.tsx",
                lineNumber: 112,
                columnNumber: 9
            }, this) : null,
            banner ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-banner",
                role: "status",
                children: [
                    "Discovered: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: banner.name
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/MapView.tsx",
                        lineNumber: 126,
                        columnNumber: 23
                    }, this)
                ]
            }, banner.n, true, {
                fileName: "[project]/src/client/ui/MapView.tsx",
                lineNumber: 125,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/MapView.tsx",
        lineNumber: 72,
        columnNumber: 5
    }, this);
}
_s2(MapView, "RZESp2zqM4S+eXmR1iTdfvh9EKc=", false, function() {
    return [
        useMapBox,
        usePrefersReducedMotion,
        useBanner
    ];
});
_c1 = MapView;
/** Show a discovery banner for a few seconds when a new one arrives (not on page load). */ function useBanner(b) {
    _s3();
    const seen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(b?.n ?? 0);
    const [shown, setShown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const n = b?.n ?? 0;
    const name = b?.name ?? "";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useBanner.useEffect": ()=>{
            if (!n || n === seen.current) return;
            seen.current = n;
            setShown({
                n,
                name
            });
            const t = setTimeout({
                "useBanner.useEffect.t": ()=>setShown(null)
            }["useBanner.useEffect.t"], BANNER_MS);
            return ({
                "useBanner.useEffect": ()=>clearTimeout(t)
            })["useBanner.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["useBanner.useEffect"], [
        n
    ]);
    return shown;
}
_s3(useBanner, "n7eAfPPDP+uUur4Wg0oT+7iniGk=");
var _c, _c1;
__turbopack_context__.k.register(_c, "Seal");
__turbopack_context__.k.register(_c1, "MapView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/Notice.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Notice",
    ()=>Notice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-client] (ecmascript)");
;
;
function Notice({ title, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "notice-page",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "notice-sheet",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "card-pin",
                    "aria-hidden": "true"
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/Notice.tsx",
                    lineNumber: 9,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CandleIcon"], {
                    size: 40,
                    className: "notice-candle"
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/Notice.tsx",
                    lineNumber: 10,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    children: title
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/Notice.tsx",
                    lineNumber: 11,
                    columnNumber: 9
                }, this),
                children
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/ui/Notice.tsx",
            lineNumber: 8,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/Notice.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = Notice;
var _c;
__turbopack_context__.k.register(_c, "Notice");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/Purse.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Purse",
    ()=>Purse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function Purse({ players, visible, size = "tv" }) {
    _s();
    const prev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [floats, setFloats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const seq = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const timers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Purse.useEffect": ()=>{
            const now = new Map(players.map({
                "Purse.useEffect": (p)=>[
                        p.id,
                        p.balanceCp
                    ]
            }["Purse.useEffect"]));
            const before = prev.current;
            prev.current = now;
            if (!before) return;
            const fresh = [];
            for (const [id, cp] of now){
                const old = before.get(id);
                if (old !== undefined && old !== cp) fresh.push({
                    key: ++seq.current,
                    playerId: id,
                    delta: cp - old
                });
            }
            if (!fresh.length) return;
            setFloats({
                "Purse.useEffect": (f)=>[
                        ...f,
                        ...fresh
                    ]
            }["Purse.useEffect"]);
            const keys = new Set(fresh.map({
                "Purse.useEffect": (f)=>f.key
            }["Purse.useEffect"]));
            timers.current.push(setTimeout({
                "Purse.useEffect": ()=>setFloats({
                        "Purse.useEffect": (f)=>f.filter({
                                "Purse.useEffect": (x)=>!keys.has(x.key)
                            }["Purse.useEffect"])
                    }["Purse.useEffect"])
            }["Purse.useEffect"], 2600));
        }
    }["Purse.useEffect"], [
        players
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Purse.useEffect": ()=>({
                "Purse.useEffect": ()=>timers.current.forEach(clearTimeout)
            })["Purse.useEffect"]
    }["Purse.useEffect"], []);
    const total = players.reduce((a, p)=>a + p.balanceCp, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
        className: `purse purse-${size}${players.length > 6 ? " purse-many" : ""}${visible ? "" : " purse-off"}`,
        "aria-label": "Party purse",
        "aria-hidden": !visible,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Party Purse"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/Purse.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            players.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "purse-empty",
                children: "Nobody at the table yet"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/Purse.tsx",
                lineNumber: 48,
                columnNumber: 31
            }, this) : null,
            players.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "purse-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "purse-name",
                            children: [
                                p.inspired ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InspirationIcon"], {
                                    className: "insp",
                                    "aria-hidden": false,
                                    role: "img",
                                    "aria-label": "Heroic Inspiration"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/ui/Purse.tsx",
                                    lineNumber: 52,
                                    columnNumber: 27
                                }, this) : null,
                                p.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/ui/Purse.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "purse-amt",
                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/Purse.tsx",
                            lineNumber: 55,
                            columnNumber: 11
                        }, this),
                        floats.filter((f)=>f.playerId === p.id).map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `float ${f.delta > 0 ? "up" : "down"}`,
                                "aria-hidden": "true",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDelta"])(f.delta)
                            }, f.key, false, {
                                fileName: "[project]/src/client/ui/Purse.tsx",
                                lineNumber: 59,
                                columnNumber: 15
                            }, this))
                    ]
                }, p.id, true, {
                    fileName: "[project]/src/client/ui/Purse.tsx",
                    lineNumber: 50,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "purse-total",
                children: [
                    "Party total: ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(total)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/Purse.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/Purse.tsx",
        lineNumber: 46,
        columnNumber: 5
    }, this);
}
_s(Purse, "Zz1AGSJv79GR5BTel3m02/Ib1ds=");
_c = Purse;
var _c;
__turbopack_context__.k.register(_c, "Purse");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/SceneView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SceneView",
    ()=>SceneView,
    "artSrc",
    ()=>artSrc
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/MapView.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$scenes$2f$ArtumNotice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/scenes/ArtumNotice.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$scenes$2f$NoticeBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/scenes/NoticeBoard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Stage.tsx [app-client] (ecmascript)");
"use client";
;
;
;
;
;
const PUBLIC_ART = new Set([
    "artum",
    "mags-wick",
    "chef"
]);
function artSrc(art, gated) {
    if (!art) return null;
    if (art.url) return art.url;
    if (art.builtin && PUBLIC_ART.has(art.builtin)) return `/art/${art.builtin}.svg`;
    if (art.builtin && gated?.[art.builtin]) return gated[art.builtin];
    return null;
}
function SceneView({ scene, gated, emptyHint, flyers }) {
    const src = artSrc(scene.art, gated);
    if (scene.kind === "black") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "scene-fill scene-black"
    }, void 0, false, {
        fileName: "[project]/src/client/ui/SceneView.tsx",
        lineNumber: 36,
        columnNumber: 38
    }, this);
    if (scene.kind === "map") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapView"], {
            src: src ?? undefined,
            alt: scene.alt,
            map: scene.map ?? {
                pins: [],
                legend: {
                    on: false,
                    style: "names"
                }
            },
            emptyHint: emptyHint
        }, void 0, false, {
            fileName: "[project]/src/client/ui/SceneView.tsx",
            lineNumber: 39,
            columnNumber: 12
        }, this);
    }
    if (scene.kind === "notice") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "scene-fill scene-backdrop",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
                w: 1920,
                h: 1080,
                children: scene.art?.builtin === "candlefair-board" || !src ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$scenes$2f$NoticeBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NoticeBoard"], {
                    flyers: flyers
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 47,
                    columnNumber: 13
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            className: "scene-img",
                            src: src,
                            alt: scene.alt ?? ""
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 50,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                position: "absolute",
                                inset: 0
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$scenes$2f$NoticeBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Flyers"], {
                                flyers: flyers ?? []
                            }, void 0, false, {
                                fileName: "[project]/src/client/ui/SceneView.tsx",
                                lineNumber: 52,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 51,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 49,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/SceneView.tsx",
                lineNumber: 45,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/client/ui/SceneView.tsx",
            lineNumber: 44,
            columnNumber: 7
        }, this);
    }
    if (scene.kind === "portrait") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "scene-fill scene-backdrop",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
                w: 1920,
                h: 1080,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "portrait",
                    children: [
                        src ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            className: "portrait-art",
                            src: src,
                            alt: scene.alt ?? `Portrait of ${scene.name ?? ""}`
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 66,
                            columnNumber: 20
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "portrait-art portrait-blank"
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 66,
                            columnNumber: 118
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "caption",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "caption-name",
                                    children: scene.name
                                }, void 0, false, {
                                    fileName: "[project]/src/client/ui/SceneView.tsx",
                                    lineNumber: 68,
                                    columnNumber: 15
                                }, this),
                                scene.title ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "caption-title",
                                    children: scene.title
                                }, void 0, false, {
                                    fileName: "[project]/src/client/ui/SceneView.tsx",
                                    lineNumber: 69,
                                    columnNumber: 30
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 67,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 65,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/SceneView.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/client/ui/SceneView.tsx",
            lineNumber: 63,
            columnNumber: 7
        }, this);
    }
    if (scene.kind === "handout") {
        if (scene.art?.builtin === "artum-notice") {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "scene-fill scene-backdrop",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
                    w: 816,
                    h: 1056,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$scenes$2f$ArtumNotice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ArtumNotice"], {}, void 0, false, {
                        fileName: "[project]/src/client/ui/SceneView.tsx",
                        lineNumber: 82,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 81,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/SceneView.tsx",
                lineNumber: 80,
                columnNumber: 9
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "scene-fill scene-backdrop",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
                w: 1920,
                h: 1080,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "handout",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "handout-paper",
                        children: src ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: src,
                            alt: scene.alt ?? ""
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 91,
                            columnNumber: 51
                        }, this) : null
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/SceneView.tsx",
                        lineNumber: 91,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 90,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/SceneView.tsx",
                lineNumber: 89,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/client/ui/SceneView.tsx",
            lineNumber: 88,
            columnNumber: 7
        }, this);
    }
    // image
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "scene-fill scene-backdrop",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Stage"], {
            w: 1920,
            h: 1080,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "slot",
                children: src ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                    className: "scene-img",
                    src: src,
                    alt: scene.alt ?? ""
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 104,
                    columnNumber: 13
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "slot-empty",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: "Candlefair"
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 107,
                            columnNumber: 15
                        }, this),
                        emptyHint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: emptyHint
                        }, void 0, false, {
                            fileName: "[project]/src/client/ui/SceneView.tsx",
                            lineNumber: 108,
                            columnNumber: 28
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/ui/SceneView.tsx",
                    lineNumber: 106,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/ui/SceneView.tsx",
                lineNumber: 102,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/client/ui/SceneView.tsx",
            lineNumber: 101,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/SceneView.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
_c = SceneView;
var _c;
__turbopack_context__.k.register(_c, "SceneView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/ShopBoard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ShopBoard",
    ()=>ShopBoard,
    "categoriesWith",
    ()=>categoriesWith,
    "cheapestFirst",
    ()=>cheapestFirst
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ItemCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/ItemCard.tsx [app-client] (ecmascript)");
"use client";
;
;
;
function cheapestFirst(list) {
    const key = (i)=>i.tier === "rumored" ? 3 : i.kind === "earned" ? 2 : i.priceCp === null ? 1 : 0;
    return [
        ...list
    ].sort((a, b)=>key(a) - key(b) || (a.priceCp ?? 0) - (b.priceCp ?? 0));
}
function categoriesWith(items) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CATEGORIES"].filter((c)=>items.some((i)=>i.category === c.id));
}
function ShopBoard({ shops, items, shopId, onShop, size, actions, footer, dm, tabNote, mode = "shop", onMode, category, onCategory }) {
    const shop = shops.find((s)=>s.id === shopId) ?? shops[0];
    if (!shop) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `market market-${size}`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "market-head",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "market-title",
                        children: "Candlefair Market"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 69,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/ShopBoard.tsx",
                    lineNumber: 68,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "note",
                    children: "No shops are open yet."
                }, void 0, false, {
                    fileName: "[project]/src/client/ui/ShopBoard.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/ui/ShopBoard.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this);
    }
    const shopName = new Map(shops.map((s)=>[
            s.id,
            s.name
        ]));
    const cats = categoriesWith(items.filter((i)=>shopName.has(i.shopId)));
    const byCategory = mode === "category" && cats.length > 0;
    const cat = cats.find((c)=>c.id === category) ?? cats[0];
    const list = byCategory ? cheapestFirst(items.filter((i)=>i.category === cat.id && shopName.has(i.shopId))) : items.filter((i)=>i.shopId === shop.id);
    const tabs = byCategory ? cats.map((c)=>({
            id: c.id,
            name: c.label,
            note: null
        })) : shops.map((s)=>({
            id: s.id,
            name: s.name,
            note: tabNote?.(s) ?? null
        }));
    const current = byCategory ? cat.id : shop.id;
    const pick = byCategory ? onCategory : onShop;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `market market-${size}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "market-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "market-title",
                        children: byCategory && size === "tv" ? cat.label : "Candlefair Market"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    !byCategory && shop.subtitle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "market-sub",
                        children: shop.subtitle
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 87,
                        columnNumber: 41
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ShopBoard.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            onMode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "shop-modes",
                role: "group",
                "aria-label": "Browse",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: "Browse"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 91,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn small${mode === "category" ? " on" : ""}`,
                        "aria-pressed": mode === "category",
                        onClick: ()=>onMode("category"),
                        children: "By what it does"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn small${mode === "shop" ? " on" : ""}`,
                        "aria-pressed": mode === "shop",
                        onClick: ()=>onMode("shop"),
                        children: "By storefront"
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ShopBoard.tsx",
                lineNumber: 90,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "tabs",
                role: pick ? "tablist" : undefined,
                "aria-label": byCategory ? "Categories" : "Shops",
                children: tabs.map((t)=>pick ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        role: "tab",
                        "aria-selected": t.id === current,
                        className: `btn tab${t.id === current ? " on" : ""}`,
                        onClick: ()=>pick(t.id),
                        children: [
                            t.name,
                            t.note ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "tab-note",
                                children: t.note
                            }, void 0, false, {
                                fileName: "[project]/src/client/ui/ShopBoard.tsx",
                                lineNumber: 105,
                                columnNumber: 25
                            }, this) : null
                        ]
                    }, t.id, true, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 103,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `tab tab-static${t.id === current ? " on" : ""}`,
                        children: t.name
                    }, t.id, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 108,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/ui/ShopBoard.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            !byCategory && shop.closed && !dm ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "shop-closed",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "shop-closed-name",
                        children: shop.name
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "shop-closed-tag",
                        children: shop.subtitle
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 117,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "Not selling yet."
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 118,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ShopBoard.tsx",
                lineNumber: 115,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid",
                children: [
                    list.map((it)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ItemCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ItemCard"], {
                            item: it,
                            dm: dm,
                            where: byCategory ? shopName.get(it.shopId) : undefined,
                            children: actions?.(it)
                        }, it.id, false, {
                            fileName: "[project]/src/client/ui/ShopBoard.tsx",
                            lineNumber: 123,
                            columnNumber: 13
                        }, this)),
                    list.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "Nothing on the shelves yet."
                    }, void 0, false, {
                        fileName: "[project]/src/client/ui/ShopBoard.tsx",
                        lineNumber: 127,
                        columnNumber: 32
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/ui/ShopBoard.tsx",
                lineNumber: 121,
                columnNumber: 9
            }, this),
            footer
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/ShopBoard.tsx",
        lineNumber: 84,
        columnNumber: 5
    }, this);
}
_c = ShopBoard;
var _c;
__turbopack_context__.k.register(_c, "ShopBoard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/Stage.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Stage",
    ()=>Stage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function Stage({ w, h, children }) {
    _s();
    const outer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [scale, setScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])({
        "Stage.useLayoutEffect": ()=>{
            const el = outer.current;
            if (!el) return;
            const fit = {
                "Stage.useLayoutEffect.fit": ()=>setScale(Math.min(el.clientWidth / w, el.clientHeight / h))
            }["Stage.useLayoutEffect.fit"];
            fit();
            const ro = new ResizeObserver(fit);
            ro.observe(el);
            return ({
                "Stage.useLayoutEffect": ()=>ro.disconnect()
            })["Stage.useLayoutEffect"];
        }
    }["Stage.useLayoutEffect"], [
        w,
        h
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: outer,
        className: "stage-outer",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "stage",
            style: {
                width: w,
                height: h,
                transform: `translate(-50%, -50%) scale(${scale})`,
                visibility: scale ? "visible" : "hidden"
            },
            children: children
        }, void 0, false, {
            fileName: "[project]/src/client/ui/Stage.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/Stage.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_s(Stage, "ZaxGVGFxVxP0jmUbSaTJ4YT2vDY=");
_c = Stage;
var _c;
__turbopack_context__.k.register(_c, "Stage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/ui/icons.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Simple inline SVG icons. No emoji anywhere in the UI.
__turbopack_context__.s([
    "CandleIcon",
    ()=>CandleIcon,
    "DownIcon",
    ()=>DownIcon,
    "EyeOffIcon",
    ()=>EyeOffIcon,
    "FullscreenIcon",
    ()=>FullscreenIcon,
    "InspirationIcon",
    ()=>InspirationIcon,
    "LinkIcon",
    ()=>LinkIcon,
    "LockIcon",
    ()=>LockIcon,
    "SealIcon",
    ()=>SealIcon,
    "TvIcon",
    ()=>TvIcon,
    "UpIcon",
    ()=>UpIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function base({ size = 20, ...rest }) {
    return {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
        focusable: false,
        ...rest
    };
}
function LockIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "5",
                y: "10.5",
                width: "14",
                height: "10",
                rx: "1.5"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8 10.5V7.5a4 4 0 0 1 8 0v3"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "15.5",
                r: "1.2",
                fill: "currentColor",
                stroke: "none"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
_c = LockIcon;
function CandleIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 2.5c2 2.6 2 4.4 0 5.6-2-1.2-2-3 0-5.6Z",
                fill: "currentColor",
                stroke: "none"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "9",
                y: "10",
                width: "6",
                height: "10",
                rx: "0.8"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M5 21.5h14"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_c1 = CandleIcon;
function TvIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "5",
                width: "18",
                height: "12",
                rx: "1.5"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8 21h8M12 17v4"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c2 = TvIcon;
function FullscreenIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        }, void 0, false, {
            fileName: "[project]/src/client/ui/icons.tsx",
            lineNumber: 42,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
_c3 = FullscreenIcon;
function EyeOffIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 8.5 4.5 9 6-.3.8-1.3 2.3-2.9 3.7M6.4 7.6C4.5 8.9 3.3 10.8 3 12c.5 1.5 4 6 9 6 1.4 0 2.6-.3 3.7-.8"
        }, void 0, false, {
            fileName: "[project]/src/client/ui/icons.tsx",
            lineNumber: 50,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
_c4 = EyeOffIcon;
function LinkIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_c5 = LinkIcon;
function UpIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 15l6-6 6 6"
        }, void 0, false, {
            fileName: "[project]/src/client/ui/icons.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 66,
        columnNumber: 5
    }, this);
}
_c6 = UpIcon;
function DownIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 9l6 6 6-6"
        }, void 0, false, {
            fileName: "[project]/src/client/ui/icons.tsx",
            lineNumber: 75,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 74,
        columnNumber: 5
    }, this);
}
_c7 = DownIcon;
function InspirationIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        strokeWidth: 1.6,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 2.5l8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4z",
                fill: "currentColor",
                fillOpacity: 0.22
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 6.5l5 8.6H7z"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 2.5v4M20.5 7.4L17 15.1M3.5 7.4L7 15.1M12 21.5l-5-6.4M12 21.5l5-6.4",
                opacity: 0.75
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 86,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_c8 = InspirationIcon;
function SealIcon(p) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        ...base(p),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "12",
                r: "8",
                fill: "currentColor",
                stroke: "none",
                opacity: "0.9"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8.5 12.5l2.3 2.3 4.7-5",
                stroke: "#efe3c8"
            }, void 0, false, {
                fileName: "[project]/src/client/ui/icons.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/ui/icons.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_c9 = SealIcon;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9;
__turbopack_context__.k.register(_c, "LockIcon");
__turbopack_context__.k.register(_c1, "CandleIcon");
__turbopack_context__.k.register(_c2, "TvIcon");
__turbopack_context__.k.register(_c3, "FullscreenIcon");
__turbopack_context__.k.register(_c4, "EyeOffIcon");
__turbopack_context__.k.register(_c5, "LinkIcon");
__turbopack_context__.k.register(_c6, "UpIcon");
__turbopack_context__.k.register(_c7, "DownIcon");
__turbopack_context__.k.register(_c8, "InspirationIcon");
__turbopack_context__.k.register(_c9, "SealIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/useGame.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useGame",
    ()=>useGame
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const IDLE_AFTER_MS = 15 * 60_000;
function useGame(ident) {
    _s();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("loading");
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [online, setOnline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const versionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(-1);
    const phaseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])("loading");
    const inflight = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const again = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const [helloTick, setHelloTick] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    phaseRef.current = phase;
    /** Set by the stream effect: marks activity and leaves idle mode. */ const activity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        "useGame.useRef[activity]": ()=>{}
    }["useGame.useRef[activity]"]);
    /** True while a session is running: never go idle then. */ const inSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const accept = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGame.useCallback[accept]": (v)=>{
            if (v.version < versionRef.current) return;
            if (v.version > versionRef.current) activity.current();
            inSession.current = v.role === "dm" ? !!v.state.currentSessionId : !!v.session;
            versionRef.current = v.version;
            setView(v);
        }
    }["useGame.useCallback[accept]"], []);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGame.useCallback[refresh]": ()=>{
            if (!ident) return;
            if (inflight.current) {
                again.current = true;
                return;
            }
            inflight.current = ({
                "useGame.useCallback[refresh]": async ()=>{
                    try {
                        accept(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"])("/api/view", ident));
                        setOnline(true);
                    } catch (e) {
                        if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] && e.status < 500) {
                            // We were removed, renamed or locked out: go back through hello.
                            setHelloTick({
                                "useGame.useCallback[refresh]": (t)=>t + 1
                            }["useGame.useCallback[refresh]"]);
                        } else {
                            setOnline(false);
                        }
                    } finally{
                        inflight.current = null;
                        if (again.current) {
                            again.current = false;
                            refresh();
                        }
                    }
                }
            })["useGame.useCallback[refresh]"]();
        }
    }["useGame.useCallback[refresh]"], [
        ident,
        accept
    ]);
    // hello
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useGame.useEffect": ()=>{
            if (!ident) return;
            let cancelled = false;
            ({
                "useGame.useEffect": async ()=>{
                    try {
                        const r = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"])("/api/hello", ident, {
                            method: "POST"
                        });
                        if (cancelled) return;
                        if (r.status === "ok") {
                            accept(r.view);
                            setPhase("ok");
                        } else setPhase(r.status);
                        setOnline(true);
                    } catch (e) {
                        if (cancelled) return;
                        setError(e instanceof Error ? e.message : String(e));
                        setOnline(false);
                        // Keep the old view if we had one; otherwise show an error and retry.
                        if (phaseRef.current === "loading") setPhase("error");
                        setTimeout({
                            "useGame.useEffect": ()=>!cancelled && setHelloTick({
                                    "useGame.useEffect": (t)=>t + 1
                                }["useGame.useEffect"])
                        }["useGame.useEffect"], 4000);
                    }
                }
            })["useGame.useEffect"]();
            return ({
                "useGame.useEffect": ()=>{
                    cancelled = true;
                }
            })["useGame.useEffect"];
        }
    }["useGame.useEffect"], [
        ident,
        accept,
        helloTick
    ]);
    // live stream
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useGame.useEffect": ()=>{
            if (!ident) return;
            let es = null;
            let downTimer = null;
            let closed = false;
            // Live mode: an open event stream. Idle mode (after a long quiet spell): no
            // stream, just a cheap version check every 15 s, so a TV left on all week
            // doesn't hold a server connection open. Any change switches back to live.
            let lastChange = Date.now();
            let idle = false;
            const markActive = {
                "useGame.useEffect.markActive": ()=>{
                    lastChange = Date.now();
                    if (idle) {
                        idle = false;
                        open();
                    }
                }
            }["useGame.useEffect.markActive"];
            activity.current = markActive;
            const seen = {
                "useGame.useEffect.seen": (v)=>{
                    if (v > versionRef.current) markActive();
                    if (phaseRef.current !== "ok") {
                        // Knocking or waiting for the game: something changed, try again.
                        if (phaseRef.current !== "loading") setHelloTick({
                            "useGame.useEffect.seen": (t)=>t + 1
                        }["useGame.useEffect.seen"]);
                        return;
                    }
                    if (v > versionRef.current) refresh();
                }
            }["useGame.useEffect.seen"];
            const open = {
                "useGame.useEffect.open": ()=>{
                    if (es || closed) return;
                    es = new EventSource((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["streamUrl"])(ident));
                    es.addEventListener("v", {
                        "useGame.useEffect.open": (ev)=>{
                            if (downTimer) clearTimeout(downTimer);
                            downTimer = null;
                            setOnline(true);
                            seen(Number(ev.data));
                        }
                    }["useGame.useEffect.open"]);
                    es.onerror = ({
                        "useGame.useEffect.open": ()=>{
                            // EventSource retries on its own; only show "reconnecting" if it stays down.
                            if (!downTimer) downTimer = setTimeout({
                                "useGame.useEffect.open": ()=>setOnline(false)
                            }["useGame.useEffect.open"], 3000);
                            if (es && es.readyState === EventSource.CLOSED && !closed) {
                                es = null;
                                setTimeout({
                                    "useGame.useEffect.open": ()=>!closed && !idle && open()
                                }["useGame.useEffect.open"], 2000);
                            }
                        }
                    })["useGame.useEffect.open"];
                }
            }["useGame.useEffect.open"];
            open();
            let polledAt = 0;
            const tick = setInterval({
                "useGame.useEffect.tick": async ()=>{
                    const now = Date.now();
                    if (inSession.current) lastChange = now; // game night: stay live
                    if (!idle && now - lastChange > IDLE_AFTER_MS) {
                        idle = true;
                        es?.close();
                        es = null;
                        if (downTimer) clearTimeout(downTimer);
                        downTimer = null;
                    }
                    if (now - polledAt < (idle ? 15_000 : 30_000)) return;
                    polledAt = now;
                    try {
                        const { version } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"])("/api/version", ident);
                        setOnline(true);
                        seen(version);
                    } catch  {
                        setOnline(false);
                    }
                }
            }["useGame.useEffect.tick"], 5_000);
            const wake = {
                "useGame.useEffect.wake": ()=>{
                    if (document.visibilityState !== "visible") return;
                    markActive();
                    refresh();
                }
            }["useGame.useEffect.wake"];
            window.addEventListener("online", wake);
            document.addEventListener("visibilitychange", wake);
            return ({
                "useGame.useEffect": ()=>{
                    closed = true;
                    activity.current = ({
                        "useGame.useEffect": ()=>{}
                    })["useGame.useEffect"];
                    es?.close();
                    clearInterval(tick);
                    if (downTimer) clearTimeout(downTimer);
                    window.removeEventListener("online", wake);
                    document.removeEventListener("visibilitychange", wake);
                }
            })["useGame.useEffect"];
        }
    }["useGame.useEffect"], [
        ident,
        refresh
    ]);
    const call = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGame.useCallback[call]": async (cmd)=>{
            if (!ident) return {
                error: "Not ready."
            };
            try {
                const r = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"])("/api/command", ident, {
                    method: "POST",
                    body: JSON.stringify(cmd)
                });
                if (r.version > versionRef.current) refresh();
                return {
                    error: null,
                    ...r.info ? {
                        info: r.info
                    } : {}
                };
            } catch (e) {
                return {
                    error: e instanceof Error ? e.message : String(e),
                    ...e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] && e.code ? {
                        code: e.code
                    } : {}
                };
            }
        }
    }["useGame.useCallback[call]"], [
        ident,
        refresh
    ]);
    const send = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGame.useCallback[send]": async (cmd)=>(await call(cmd)).error
    }["useGame.useCallback[send]"], [
        call
    ]);
    const retryHello = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useGame.useCallback[retryHello]": ()=>setHelloTick({
                "useGame.useCallback[retryHello]": (t)=>t + 1
            }["useGame.useCallback[retryHello]"])
    }["useGame.useCallback[retryHello]"], []);
    return {
        phase,
        view,
        online,
        error,
        send,
        call,
        refresh,
        retryHello
    };
}
_s(useGame, "6h2ZF2mm+Pg4/Zu8ld+6DhDYGb0=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_client_1map6odcpo3ha._.js.map