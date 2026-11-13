(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/client/player/PlayerApp.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlayerApp",
    ()=>PlayerApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/useGame.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Notice.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/ShopBoard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$BannerToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/BannerToast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/player/Requests.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
function PlayerApp({ ident: initial }) {
    _s();
    const [ident, setIdent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initial);
    const g = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"])(ident);
    if (g.phase === "taken") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Taken, {
        ident: ident,
        onKey: (key)=>((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rememberKey"])(ident, key), setIdent({
                ...ident,
                key
            }))
    }, void 0, false, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 19,
        columnNumber: 35
    }, this);
    if (g.phase === "full") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
        title: "The table is full",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: "Every seat is taken tonight, so you’ve knocked instead. If the DM lets you in, this page will open by itself."
        }, void 0, false, {
            fileName: "[project]/src/client/player/PlayerApp.tsx",
            lineNumber: 23,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 22,
        columnNumber: 7
    }, this);
    if (g.phase === "knocking") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
        title: "You knocked",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: "The door’s closed tonight. The DM will let you in in a moment; this page will open by itself."
        }, void 0, false, {
            fileName: "[project]/src/client/player/PlayerApp.tsx",
            lineNumber: 29,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 28,
        columnNumber: 7
    }, this);
    if (g.phase === "invalid") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
        title: "Pick another name",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "That name can’t be used here."
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 35,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                className: "btn primary",
                href: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hrefFor"])(ident.game),
                children: "Choose a name"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 36,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 34,
        columnNumber: 7
    }, this);
    if (g.phase === "no-game") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
        title: "No table here yet",
        children: "Ask the DM to set up this game."
    }, void 0, false, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 41,
        columnNumber: 37
    }, this);
    if (!g.view || g.view.role !== "player") {
        if (g.phase === "error") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
            title: "Can't reach the table",
            children: "Trying again…"
        }, void 0, false, {
            fileName: "[project]/src/client/player/PlayerApp.tsx",
            lineNumber: 43,
            columnNumber: 37
        }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "player-root",
            "aria-busy": "true"
        }, void 0, false, {
            fileName: "[project]/src/client/player/PlayerApp.tsx",
            lineNumber: 44,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PlayerScreen, {
        view: g.view,
        online: g.online,
        send: g.send,
        ident: ident,
        setIdent: setIdent
    }, void 0, false, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 46,
        columnNumber: 10
    }, this);
}
_s(PlayerApp, "XVQSlhe2dqRBczXLFZ/1xIew1xQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGame"]
    ];
});
_c = PlayerApp;
function Taken({ ident, onKey }) {
    _s1();
    const [k, setK] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
        title: "That name is taken",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: [
                    "Someone has locked “",
                    ident.player,
                    "”. If it’s yours, enter your key."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "form",
                onSubmit: (e)=>{
                    e.preventDefault();
                    if (k.trim()) onKey(k.trim());
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Your key",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                type: "password",
                                value: k,
                                onChange: (e)=>setK(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 63,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary",
                        type: "submit",
                        children: "That’s me"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                className: "btn",
                href: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hrefFor"])(ident.game),
                children: "Use another name"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 69,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_s1(Taken, "ZTqrSYnKD6kokPVDwzOAtO6B4f8=");
_c1 = Taken;
function PlayerScreen({ view, online, send, ident, setIdent }) {
    _s2();
    const [shopId, setShopId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(view.live.shopOpen ? view.live.shopId : view.shops[0]?.id);
    const pendingOrders = view.myOrders.filter((o)=>!o.arrived);
    const [msg, setMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [purseOpen, setPurseOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [looking, setLooking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("category");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(undefined);
    const me = view.me;
    const availableCp = me.balanceCp - me.heldCp;
    /** Mags's tab only counts at her own storefront. */ const availableAt = (shopId)=>availableCp + (view.mine.credit.find((c)=>c.shopId === shopId)?.limitCp ?? 0);
    // Keep the sheet in step with live changes (stock, price); close it if the item disappears.
    const lookingAt = looking ? view.items.find((i)=>i.id === looking) : undefined;
    if (me.archived) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
            title: `Farewell, ${me.name}`,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "The DM has marked you as having left the table. Ask them to bring you back."
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 94,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/client/player/PlayerApp.tsx",
            lineNumber: 93,
            columnNumber: 7
        }, this);
    }
    const lock = async ()=>{
        const key = prompt("Pick a key to lock your name. You'll need it on any new phone or browser.");
        if (!key || key.length < 4) return setMsg("Keys need at least 4 characters.");
        const err = await send({
            type: "me.lock",
            key
        });
        if (err) return setMsg(err);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rememberKey"])(ident, key);
        setIdent({
            ...ident,
            key
        });
        setMsg("Your name is locked to this key. It's saved on this device.");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "player-root",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "player-top",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "player-hello",
                                children: view.game.name
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 113,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "player-name",
                                children: me.name
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 114,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "player-gold-wrap",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "player-gold",
                                "aria-label": `Your gold: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(me.balanceCp)}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(me.balanceCp)
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 117,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `player-avail${me.heldCp ? " held" : ""}`,
                                children: me.heldCp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "purse-amt",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(availableCp)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 123,
                                            columnNumber: 17
                                        }, this),
                                        " available"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 122,
                                    columnNumber: 15
                                }, this) : "all available"
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn small purse-btn",
                                "aria-expanded": purseOpen,
                                "aria-controls": "party-purse",
                                onClick: ()=>setPurseOpen((o)=>!o),
                                children: purseOpen ? "Hide party purse" : "Party purse"
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 129,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DecisionBanners"], {
                view: view
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this),
            me.balanceCp < 0 && view.mine.credit.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note owe-note",
                role: "status",
                children: [
                    "You owe ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(-me.balanceCp),
                    " on your tab at ",
                    view.mine.credit.map((c)=>c.shopName).join(" and "),
                    ". Pay it off before Mags remembers."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 136,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note gold-note",
                children: "Your gold lives here, not on D&D Beyond: keep D&D Beyond’s coins at 0. Anything you buy, add to your D&D Beyond inventory yourself."
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            !online ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "player-offline",
                role: "status",
                children: "Reconnecting…"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 142,
                columnNumber: 9
            }, this) : null,
            msg ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "player-msg",
                role: "status",
                children: msg
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 147,
                columnNumber: 9
            }, this) : null,
            purseOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                id: "party-purse",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Party purse"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "purse-list",
                        children: view.purse.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: p.id === me.id ? "me" : undefined,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            p.inspired ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InspirationIcon"], {
                                                size: 18,
                                                className: "insp",
                                                role: "img",
                                                "aria-hidden": false,
                                                "aria-label": "Heroic Inspiration"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                                lineNumber: 159,
                                                columnNumber: 31
                                            }, this) : null,
                                            p.name
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 158,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "purse-amt",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 162,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, p.id, true, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 157,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: [
                            "Party total: ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(view.purse.reduce((a, p)=>a + p.balanceCp, 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SendGold"], {
                        view: view,
                        availableCp: availableCp,
                        send: send,
                        onMsg: setMsg
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 167,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 153,
                columnNumber: 7
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$BannerToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BannerToast"], {
                banner: view.banner,
                className: "phone-banner"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: view.shops.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ShopBoard"], {
                            shops: view.shops,
                            items: view.items,
                            shopId: shopId ?? "",
                            onShop: setShopId,
                            mode: mode,
                            onMode: setMode,
                            category: category,
                            onCategory: setCategory,
                            size: "page",
                            actions: (it)=>{
                                if (it.tier === "rumored" || it.kind === "earned") return null;
                                const why = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["whyNot"])(it, it.kind === "project" ? availableCp : availableAt(it.shopId));
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `btn${why ? "" : " primary"} grow-btn`,
                                            onClick: ()=>setLooking(it.id),
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["askLabel"])(it)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 191,
                                            columnNumber: 21
                                        }, this),
                                        why && it.tier === "sale" && !it.funded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "card-why",
                                            children: why
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 194,
                                            columnNumber: 64
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 190,
                                    columnNumber: 19
                                }, this);
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 176,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: "Asking holds the gold until the DM approves or declines. You can cancel while it’s waiting."
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 199,
                            columnNumber: 13
                        }, this),
                        !me.locked ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: [
                                "Tip: anyone who opens your link can ask to spend your gold.",
                                " ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "linkish",
                                    onClick: lock,
                                    children: "Lock your name"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 203,
                                    columnNumber: 17
                                }, this),
                                " ",
                                "so only you can."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 201,
                            columnNumber: 15
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                    lineNumber: 175,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "The market"
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 212,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: "No shops are open to you yet. Keep your eyes open around town."
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 213,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                    lineNumber: 211,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            lookingAt ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RequestSheet"], {
                item: lookingAt,
                availableCp: lookingAt.kind === "project" ? availableCp : availableAt(lookingAt.shopId),
                send: send,
                onClose: ()=>setLooking(null),
                onDone: (m)=>{
                    setLooking(null);
                    setMsg(m);
                }
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 219,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$player$2f$Requests$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MyRequests"], {
                requests: view.myRequests,
                send: send,
                onMsg: setMsg
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 231,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Yours, {
                view: view,
                send: send,
                onMsg: setMsg
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this),
            pendingOrders.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "On its way"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 237,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "ledger",
                        children: pendingOrders.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: o.itemName
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 241,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "note",
                                        children: [
                                            "arrives at session ",
                                            o.arrivesAtSession
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 242,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, o.id, true, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 240,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 238,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 236,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Your history"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "ledger",
                        children: [
                            view.myLedger.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "note",
                                    children: "No gold has changed hands yet."
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 253,
                                columnNumber: 13
                            }, this) : null,
                            view.myLedger.map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: l.note
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                                    lineNumber: 260,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "who",
                                                    children: new Date(l.at).toLocaleString(undefined, {
                                                        dateStyle: "medium",
                                                        timeStyle: "short"
                                                    })
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                                    lineNumber: 261,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 259,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: l.amountCp >= 0 ? "up" : "down",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDelta"])(l.amountCp)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 263,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, l.id, true, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 258,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 251,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Your character"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 270,
                        columnNumber: 9
                    }, this),
                    view.vttUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "btn primary big vtt-btn",
                        href: view.vttUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: "Launch the VTT"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 272,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CharacterLink, {
                        current: me.dndbUrl,
                        onSave: async (url)=>setMsg(await send({
                                type: "me.update",
                                patch: {
                                    dndbUrl: url
                                }
                            }) ?? "Saved.")
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: me.locked ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "tag",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LockIcon"], {
                                    size: 14
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 280,
                                    columnNumber: 15
                                }, this),
                                " Your name is locked"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 279,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn",
                            type: "button",
                            onClick: lock,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LockIcon"], {
                                    size: 18
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 284,
                                    columnNumber: 15
                                }, this),
                                " Lock my name"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 283,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 277,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
_s2(PlayerScreen, "ov101QSMDuY/fphhANUvbFtfpjs=");
_c2 = PlayerScreen;
/** What I have going: rentals, lessons, shares, titles and honours. */ function Yours({ view, send, onMsg }) {
    const { rentals, trainings, stakes, awards, credit } = view.mine;
    if (!rentals.length && !trainings.length && !stakes.length && !awards.length && !credit.length) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        "aria-label": "Yours",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Yours"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 299,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "mine-list",
                children: [
                    awards.map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "earned-badge",
                                        children: "Earned"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 304,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: a.itemName
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 304,
                                        columnNumber: 60
                                    }, this),
                                    a.note ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "note",
                                        children: [
                                            " · ",
                                            a.note
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 305,
                                        columnNumber: 25
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 303,
                                columnNumber: 13
                            }, this)
                        }, a.id, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 302,
                            columnNumber: 11
                        }, this)),
                    stakes.filter((k)=>!k.project).map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: k.itemName
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 313,
                                columnNumber: 15
                            }, this)
                        }, k.itemId, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 312,
                            columnNumber: 13
                        }, this)),
                    rentals.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: r.itemName
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 319,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "note",
                                            children: [
                                                "· ",
                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(r.monthlyCp),
                                                " at the end of each session"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 319,
                                            columnNumber: 35
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 318,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "btn small",
                                    onClick: async ()=>{
                                        if (!confirm(`Give up ${r.itemName}? Rent stops from now on.`)) return;
                                        onMsg(await send({
                                            type: "me.cancelRental",
                                            rentalId: r.id
                                        }) ?? `You gave up ${r.itemName}.`);
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 321,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, r.id, true, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 317,
                            columnNumber: 11
                        }, this)),
                    trainings.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: t.itemName
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 336,
                                        columnNumber: 15
                                    }, this),
                                    t.what ? ` (${t.what})` : "",
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "note",
                                        children: [
                                            "· ",
                                            t.done ? "finished!" : `${t.paid} of ${t.of} lessons paid`
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 337,
                                        columnNumber: 46
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 335,
                                columnNumber: 13
                            }, this)
                        }, t.id, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 334,
                            columnNumber: 11
                        }, this)),
                    stakes.filter((k)=>k.project).map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: k.itemName
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 346,
                                            columnNumber: 17
                                        }, this),
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "note",
                                            children: [
                                                "· you put in ",
                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(k.cp)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                                            lineNumber: 346,
                                            columnNumber: 37
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 345,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "note",
                                    children: k.funded ? "Funded!" : `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(k.raisedCp ?? 0)} of ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(k.goalCp ?? 0)}`
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/PlayerApp.tsx",
                                    lineNumber: 348,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, k.itemId, true, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 344,
                            columnNumber: 13
                        }, this)),
                    credit.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: [
                                            "A tab at ",
                                            c.shopName
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 354,
                                        columnNumber: 15
                                    }, this),
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "note",
                                        children: [
                                            "· up to ",
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(c.limitCp)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                                        lineNumber: 354,
                                        columnNumber: 44
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/player/PlayerApp.tsx",
                                lineNumber: 353,
                                columnNumber: 13
                            }, this)
                        }, c.shopId, false, {
                            fileName: "[project]/src/client/player/PlayerApp.tsx",
                            lineNumber: 352,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 300,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 298,
        columnNumber: 5
    }, this);
}
_c3 = Yours;
function CharacterLink({ current, onSave }) {
    _s3();
    const [v, setV] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(current ?? "");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        className: "form",
        onSubmit: (e)=>{
            e.preventDefault();
            onSave(v.trim());
        },
        children: [
            current ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                className: "btn primary big",
                href: current,
                target: "_blank",
                rel: "noopener noreferrer",
                children: "Open my character on D&D Beyond"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 374,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "D&D Beyond link",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "fld",
                        type: "url",
                        inputMode: "url",
                        value: v,
                        onChange: (e)=>setV(e.target.value),
                        placeholder: "https://www.dndbeyond.com/characters/..."
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/PlayerApp.tsx",
                        lineNumber: 380,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 378,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn",
                type: "submit",
                children: "Save link"
            }, void 0, false, {
                fileName: "[project]/src/client/player/PlayerApp.tsx",
                lineNumber: 382,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/PlayerApp.tsx",
        lineNumber: 366,
        columnNumber: 5
    }, this);
}
_s3(CharacterLink, "sahCiJKpdKo9JFHTpHLTeltjEB8=");
_c4 = CharacterLink;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "PlayerApp");
__turbopack_context__.k.register(_c1, "Taken");
__turbopack_context__.k.register(_c2, "PlayerScreen");
__turbopack_context__.k.register(_c3, "Yours");
__turbopack_context__.k.register(_c4, "CharacterLink");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/client/player/Requests.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DecisionBanners",
    ()=>DecisionBanners,
    "MyRequests",
    ()=>MyRequests,
    "RequestSheet",
    ()=>RequestSheet,
    "SendGold",
    ()=>SendGold,
    "askLabel",
    ()=>askLabel,
    "dueNow",
    ()=>dueNow,
    "freeStock",
    ()=>freeStock,
    "whyNot",
    ()=>whyNot
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// Buying from your phone: ask the DM, see what they decided.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ItemCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/ItemCard.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
"use client";
;
;
;
function freeStock(it) {
    return it.stock === null ? null : Math.max(0, it.stock - (it.held ?? 0));
}
function dueNow(it) {
    return it.dueNowCp ?? it.priceCp ?? 0;
}
function whyNot(it, availableCp, qty = 1) {
    if (it.tier !== "sale" || it.priceCp === null) return it.tier === "locked" ? it.reason || "Not for sale yet" : "Not for sale";
    if (it.kind === "earned") return "Can’t be bought";
    if (it.kind === "project") return it.funded ? "Funded" : availableCp <= 0 ? "You have 0 gp available" : null;
    const left = freeStock(it);
    if (it.stock === 0) return "Sold out";
    if (left === 0) return "On hold for someone else";
    if (left !== null && left < qty) return `Only ${left} left`;
    if (dueNow(it) * qty > availableCp) return `You have ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(Math.max(0, availableCp))} available`;
    return null;
}
function askLabel(it) {
    if (it.tier !== "sale") return "Details";
    switch(it.kind){
        case "recurring":
            return "Ask to rent";
        case "service":
            return it.flyer ? "Write a flyer" : "Ask";
        case "training":
            return "Ask to enroll";
        case "project":
            return it.funded ? "Details" : "Put gold toward it";
        case "earned":
            return "Details";
        case "order":
            return "Ask to order";
        default:
            return "Ask to buy";
    }
}
function RequestSheet({ item, availableCp, send, onClose, onDone }) {
    _s();
    const [qty, setQty] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [note, setNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [question, setQuestion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [flyer, setFlyer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        title: "",
        body: "",
        signedBy: ""
    });
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const left = freeStock(item);
    const maxQty = item.oneAtATime ? 1 : Math.max(1, Math.min(99, left ?? 99, item.priceCp ? Math.floor(Math.max(0, availableCp) / item.priceCp) || 1 : 99));
    const project = item.kind === "project";
    const pledgeCp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAmount"])(amount);
    const needCp = Math.max(0, (item.priceCp ?? 0) - (item.raisedCp ?? 0));
    const reason = whyNot(item, availableCp, qty) ?? (project && !amount.trim() ? "How much will you put in?" : null) ?? (project && (pledgeCp === null || pledgeCp <= 0) ? "Enter an amount, like 5 or 2 gp 5 sp" : null) ?? (project && pledgeCp > availableCp ? `You have ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(Math.max(0, availableCp))} available` : null) ?? (project && pledgeCp > needCp ? `It only needs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(needCp)} more` : null) ?? (item.prompt && !question.trim() ? item.prompt : null) ?? (item.flyer && !flyer.title.trim() ? "Give your flyer a title" : null);
    const total = project ? pledgeCp ?? 0 : dueNow(item) * qty;
    const dialog = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequestSheet.useEffect": ()=>{
            dialog.current?.focus();
            const esc = {
                "RequestSheet.useEffect.esc": (e)=>e.key === "Escape" && onClose()
            }["RequestSheet.useEffect.esc"];
            window.addEventListener("keydown", esc);
            return ({
                "RequestSheet.useEffect": ()=>window.removeEventListener("keydown", esc)
            })["RequestSheet.useEffect"];
        }
    }["RequestSheet.useEffect"], [
        onClose
    ]);
    const submit = async ()=>{
        setBusy(true);
        const e = project ? await send({
            type: "me.contribute",
            itemId: item.id,
            amountCp: pledgeCp,
            note: note.trim()
        }) : await send({
            type: "me.requestBuy",
            itemId: item.id,
            qty,
            note: note.trim(),
            expectedUnitCp: item.priceCp === null ? undefined : dueNow(item),
            ...question.trim() ? {
                question: question.trim()
            } : {},
            ...item.flyer ? {
                flyer
            } : {}
        });
        setBusy(false);
        if (e) return setErr(e);
        onDone(project ? `Pledged ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(total)} toward ${item.name}. It's held until the DM approves.` : `Asked the DM for ${qty > 1 ? `${qty} × ` : ""}${item.name}. Your gold is held until they decide.`);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "sheet-backdrop",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "sheet",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": item.name,
            tabIndex: -1,
            ref: dialog,
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ItemCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ItemCard"], {
                    item: item
                }, void 0, false, {
                    fileName: "[project]/src/client/player/Requests.tsx",
                    lineNumber: 109,
                    columnNumber: 9
                }, this),
                item.held && left !== 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "note",
                    children: [
                        item.held,
                        " on hold for other requests."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/player/Requests.tsx",
                    lineNumber: 110,
                    columnNumber: 36
                }, this) : null,
                item.tier === "sale" && item.kind !== "earned" && !item.funded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "form",
                    children: [
                        project ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "How much will you put in? (",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(needCp),
                                " still needed)",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld amt",
                                    inputMode: "decimal",
                                    value: amount,
                                    onChange: (e)=>setAmount(e.target.value),
                                    placeholder: "5 or 2 gp 5 sp"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 116,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 114,
                            columnNumber: 15
                        }, this) : null,
                        item.kind === "training" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: "You pay the first lesson now, then one lesson at the end of each session."
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 119,
                            columnNumber: 41
                        }, this) : null,
                        item.kind === "recurring" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: "You pay the first month now, then rent is due at the end of each session. Cancel any time from your page."
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 120,
                            columnNumber: 42
                        }, this) : null,
                        item.prompt ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                item.prompt,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld",
                                    value: question,
                                    maxLength: 300,
                                    onChange: (e)=>setQuestion(e.target.value)
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 124,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 122,
                            columnNumber: 15
                        }, this) : null,
                        item.flyer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Title",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "fld",
                                            value: flyer.title,
                                            maxLength: 60,
                                            onChange: (e)=>setFlyer({
                                                    ...flyer,
                                                    title: e.target.value
                                                }),
                                            placeholder: "LOST: one ham"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/Requests.tsx",
                                            lineNumber: 131,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 129,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "A few lines",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                            className: "fld",
                                            rows: 3,
                                            value: flyer.body,
                                            maxLength: 400,
                                            onChange: (e)=>setFlyer({
                                                    ...flyer,
                                                    body: e.target.value
                                                })
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/Requests.tsx",
                                            lineNumber: 135,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 133,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Signed",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            className: "fld",
                                            value: flyer.signedBy,
                                            maxLength: 60,
                                            onChange: (e)=>setFlyer({
                                                    ...flyer,
                                                    signedBy: e.target.value
                                                }),
                                            placeholder: "Your character's name"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/player/Requests.tsx",
                                            lineNumber: 139,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 137,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "note",
                                    children: "Mags (the DM) reads it first, and may tidy it up."
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 141,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 128,
                            columnNumber: 15
                        }, this) : null,
                        !item.oneAtATime ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "qty",
                            role: "group",
                            "aria-label": "Quantity",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "btn",
                                    "aria-label": "One fewer",
                                    disabled: qty <= 1,
                                    onClick: ()=>setQty((q)=>Math.max(1, q - 1)),
                                    children: "−"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 146,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "qty-n",
                                    "aria-live": "polite",
                                    children: qty
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 149,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "btn",
                                    "aria-label": "One more",
                                    disabled: qty >= maxQty,
                                    onClick: ()=>setQty((q)=>Math.min(maxQty, q + 1)),
                                    children: "+"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 152,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "qty-total",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(total)
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 155,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 145,
                            columnNumber: 15
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            children: [
                                "Note to the DM (optional)",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld",
                                    value: note,
                                    maxLength: 120,
                                    onChange: (e)=>setNote(e.target.value),
                                    placeholder: "for the bard · I'll haggle"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 160,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 158,
                            columnNumber: 13
                        }, this),
                        reason ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "sheet-why",
                            children: reason
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 162,
                            columnNumber: 23
                        }, this) : null,
                        err ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "error-text",
                            role: "alert",
                            children: err
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 164,
                            columnNumber: 15
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "btn primary big",
                            disabled: !!reason || busy,
                            onClick: submit,
                            children: [
                                project ? "Pledge" : askLabel(item),
                                qty > 1 ? ` ${qty}` : "",
                                " · ",
                                item.priceLabel && total === 0 ? item.priceLabel : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(total)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 168,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/player/Requests.tsx",
                    lineNumber: 112,
                    columnNumber: 11
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "btn big",
                    onClick: onClose,
                    children: "Close"
                }, void 0, false, {
                    fileName: "[project]/src/client/player/Requests.tsx",
                    lineNumber: 174,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/player/Requests.tsx",
            lineNumber: 108,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/player/Requests.tsx",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_s(RequestSheet, "1RF1qi8pNs+ETcUWtkpxZVeyLbc=");
_c = RequestSheet;
const STATUS = {
    pending: "Waiting for the DM",
    approved: "Approved",
    declined: "Declined",
    cancelled: "Cancelled"
};
function title(r) {
    if (r.kind === "give") return `Send ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)} to ${r.toPlayerName}`;
    if (r.kind === "contribute") return `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)} toward ${r.itemName}`;
    if (r.flyerTitle) return `Flyer: ${r.flyerTitle}`;
    return `${r.qty > 1 ? `${r.qty} × ` : ""}${r.itemName}`;
}
function MyRequests({ requests, send, onMsg }) {
    _s1();
    const [all, setAll] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    if (!requests.length) return null;
    const shown = all ? requests : requests.filter((r)=>r.status === "pending" || requests.indexOf(r) < 5);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        "aria-label": "My requests",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "My requests"
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "requests",
                children: shown.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `req req-${r.status}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "req-main",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "req-title",
                                        children: title(r)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/Requests.tsx",
                                        lineNumber: 202,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "req-meta",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `req-status st-${r.status}`,
                                                children: STATUS[r.status]
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/player/Requests.tsx",
                                                lineNumber: 204,
                                                columnNumber: 17
                                            }, this),
                                            r.kind !== "give" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "purse-amt",
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(r.chargedCp ?? r.totalCp)
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/player/Requests.tsx",
                                                lineNumber: 205,
                                                columnNumber: 38
                                            }, this) : null,
                                            r.chargedCp !== undefined && r.chargedCp !== r.totalCp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "note",
                                                children: [
                                                    "(asked ",
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp),
                                                    ")"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/client/player/Requests.tsx",
                                                lineNumber: 206,
                                                columnNumber: 75
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/Requests.tsx",
                                        lineNumber: 203,
                                        columnNumber: 15
                                    }, this),
                                    r.question ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "note",
                                        children: [
                                            "You asked: “",
                                            r.question,
                                            "”"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/Requests.tsx",
                                        lineNumber: 208,
                                        columnNumber: 29
                                    }, this) : null,
                                    r.note ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "note",
                                        children: [
                                            "“",
                                            r.note,
                                            "”"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/Requests.tsx",
                                        lineNumber: 209,
                                        columnNumber: 25
                                    }, this) : null,
                                    r.answer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "req-answer",
                                        children: r.answer
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/player/Requests.tsx",
                                        lineNumber: 210,
                                        columnNumber: 27
                                    }, this) : null,
                                    r.status === "declined" && r.reason ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "req-reason",
                                        children: [
                                            "DM: ",
                                            r.reason
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/player/Requests.tsx",
                                        lineNumber: 211,
                                        columnNumber: 54
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/player/Requests.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this),
                            r.status === "pending" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn",
                                onClick: async ()=>{
                                    const e = await send({
                                        type: "me.cancelRequest",
                                        requestId: r.id
                                    });
                                    onMsg(e ?? "Cancelled. Your gold is free again.");
                                },
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/Requests.tsx",
                                lineNumber: 214,
                                columnNumber: 15
                            }, this) : null
                        ]
                    }, r.id, true, {
                        fileName: "[project]/src/client/player/Requests.tsx",
                        lineNumber: 200,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 198,
                columnNumber: 7
            }, this),
            shown.length < requests.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "btn",
                onClick: ()=>setAll(true),
                children: [
                    "Show all ",
                    requests.length
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 229,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/Requests.tsx",
        lineNumber: 196,
        columnNumber: 5
    }, this);
}
_s1(MyRequests, "8l2nPlYXO2msCmHIFj3XD1W3hjM=");
_c1 = MyRequests;
function seenSlot(view) {
    return `cf-seen:${view.game.id}:${view.me.id}`;
}
function readSeen(k) {
    try {
        const v = localStorage.getItem(k);
        return v === null ? null : Number(v);
    } catch  {
        return null;
    }
}
function writeSeen(k, v) {
    try {
        localStorage.setItem(k, String(v));
    } catch  {}
}
function DecisionBanners({ view }) {
    _s2();
    const slot = seenSlot(view);
    const latest = view.myRequests.reduce((m, r)=>r.status === "approved" || r.status === "declined" ? Math.max(m, r.decidedAt ?? 0) : m, 0);
    const [seen, setSeen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DecisionBanners.useEffect": ()=>{
            const stored = readSeen(slot);
            if (stored === null) {
                writeSeen(slot, latest);
                setSeen(latest);
            } else setSeen(stored);
        // only on first load for this player
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["DecisionBanners.useEffect"], [
        slot
    ]);
    if (seen === null) return null;
    const fresh = view.myRequests.filter((r)=>(r.status === "approved" || r.status === "declined") && (r.decidedAt ?? 0) > seen);
    if (!fresh.length) return null;
    const dismiss = ()=>{
        writeSeen(slot, latest);
        setSeen(latest);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "decisions",
        role: "status",
        "aria-live": "polite",
        children: [
            fresh.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `decision decision-${r.status}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: [
                                r.status === "approved" ? "Approved" : "Declined",
                                ":"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 282,
                            columnNumber: 11
                        }, this),
                        " ",
                        title(r),
                        r.status === "approved" && r.kind === "buy" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                " for ",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(r.chargedCp ?? r.totalCp)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 283,
                            columnNumber: 58
                        }, this) : null,
                        r.status === "declined" && r.reason ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "decision-reason",
                            children: r.reason
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 284,
                            columnNumber: 50
                        }, this) : null,
                        r.answer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "decision-reason",
                            children: r.answer
                        }, void 0, false, {
                            fileName: "[project]/src/client/player/Requests.tsx",
                            lineNumber: 285,
                            columnNumber: 23
                        }, this) : null
                    ]
                }, r.id, true, {
                    fileName: "[project]/src/client/player/Requests.tsx",
                    lineNumber: 281,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "btn big",
                onClick: dismiss,
                children: "Got it"
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 288,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/Requests.tsx",
        lineNumber: 279,
        columnNumber: 5
    }, this);
}
_s2(DecisionBanners, "xR5ug6eIsYDYYSTXwFlNT0Gmzo4=");
_c2 = DecisionBanners;
function SendGold({ view, availableCp, send, onMsg }) {
    _s3();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [to, setTo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [amt, setAmt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [note, setNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    if (!view.table.length) return null;
    if (!open) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: "btn big",
        onClick: ()=>setOpen(true),
        children: "Send gold to someone"
    }, void 0, false, {
        fileName: "[project]/src/client/player/Requests.tsx",
        lineNumber: 305,
        columnNumber: 7
    }, this);
    const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseAmount"])(amt);
    const why = !to ? "Pick who to send it to" : !cp || cp <= 0 ? "Enter an amount" : cp > availableCp ? `You have ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(Math.max(0, availableCp))} available` : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        className: "form",
        onSubmit: async (e)=>{
            e.preventDefault();
            if (why || !cp) return;
            const r = await send({
                type: "me.requestGive",
                toPlayerId: to,
                amountCp: cp,
                note: note.trim()
            });
            if (r) return setErr(r);
            onMsg(`Asked the DM to send ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCp"])(cp)} to ${view.table.find((p)=>p.id === to)?.name}.`);
            setOpen(false);
            setAmt("");
            setNote("");
            setErr(null);
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "To",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "fld",
                        value: to,
                        onChange: (e)=>setTo(e.target.value),
                        style: {
                            width: "100%"
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Choose…"
                            }, void 0, false, {
                                fileName: "[project]/src/client/player/Requests.tsx",
                                lineNumber: 329,
                                columnNumber: 11
                            }, this),
                            view.table.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: p.id,
                                    children: p.name
                                }, p.id, false, {
                                    fileName: "[project]/src/client/player/Requests.tsx",
                                    lineNumber: 331,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/player/Requests.tsx",
                        lineNumber: 328,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 326,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Amount (gp)",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "fld amt",
                        inputMode: "decimal",
                        value: amt,
                        onChange: (e)=>setAmt(e.target.value),
                        placeholder: "5 or 2 gp 5 sp"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/Requests.tsx",
                        lineNumber: 339,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 337,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "What for (optional)",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        className: "fld",
                        value: note,
                        maxLength: 120,
                        onChange: (e)=>setNote(e.target.value),
                        placeholder: "paying back the potion"
                    }, void 0, false, {
                        fileName: "[project]/src/client/player/Requests.tsx",
                        lineNumber: 343,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 341,
                columnNumber: 7
            }, this),
            why && (to || amt) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "sheet-why",
                children: why
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 345,
                columnNumber: 29
            }, this) : null,
            err ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "error-text",
                role: "alert",
                children: err
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 347,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "submit",
                className: "btn primary big",
                disabled: !!why,
                children: "Ask the DM to send it"
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 351,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "btn big",
                onClick: ()=>setOpen(false),
                children: "Never mind"
            }, void 0, false, {
                fileName: "[project]/src/client/player/Requests.tsx",
                lineNumber: 354,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/player/Requests.tsx",
        lineNumber: 312,
        columnNumber: 5
    }, this);
}
_s3(SendGold, "asa8VRzzDk4r9QxT/uHxyIEXq38=");
_c3 = SendGold;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "RequestSheet");
__turbopack_context__.k.register(_c1, "MyRequests");
__turbopack_context__.k.register(_c2, "DecisionBanners");
__turbopack_context__.k.register(_c3, "SendGold");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_client_player_0pgekoadlpsqe._.js.map