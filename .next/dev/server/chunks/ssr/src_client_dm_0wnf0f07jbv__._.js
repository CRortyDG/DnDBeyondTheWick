module.exports = [
"[project]/src/client/dm/BankPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BankPanel",
    ()=>BankPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InspireToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/InspireToggle.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function BankPanel() {
    const { view, run, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("25");
    const [note, setNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [allowDebt, setAllowDebt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [sessionFilter, setSessionFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("all");
    const active = s.players.filter((p)=>!p.archived);
    const [unticked, setUnticked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(amount);
    const amountOk = cp !== null && cp > 0;
    const payees = active.filter((p)=>!p.away && !unticked.has(p.id));
    const give = (playerId, sign)=>{
        if (!amountOk) return toast("Enter an amount, like 25 or 12 gp 5 sp.");
        void run({
            type: "money.adjust",
            playerId,
            amountCp: sign * cp,
            note,
            allowDebt
        });
    };
    const ledger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (sessionFilter === "all") return view.ledger;
        if (sessionFilter === "none") return view.ledger.filter((l)=>!l.sessionId || !s.sessions.some((x)=>x.id === l.sessionId));
        return view.ledger.filter((l)=>l.sessionId === sessionFilter);
    }, [
        view.ledger,
        sessionFilter,
        s.sessions
    ]);
    const sessionName = (id)=>id && s.sessions.find((x)=>x.id === id)?.title || "Between sessions";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "panel-grid",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Players"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "Amount",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "fld amt",
                                        inputMode: "decimal",
                                        value: amount,
                                        onChange: (e)=>setAmount(e.target.value),
                                        "aria-describedby": "amt-hint"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                                        lineNumber: 42,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 40,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "grow",
                                children: [
                                    "Note",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "fld",
                                        value: note,
                                        placeholder: "e.g. Artum's pay",
                                        onChange: (e)=>setNote(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 44,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        id: "amt-hint",
                        className: "note",
                        children: amount.trim() === "" ? "A plain number is gold. You can also type 12 gp 5 sp, or 3 sp." : amountOk ? `= ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(cp)}` : "That isn't an amount I can read."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "prow-list",
                        children: [
                            active.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `prow${p.away ? " away" : ""}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InspireToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InspireToggle"], {
                                            playerId: p.id,
                                            name: p.name,
                                            on: !!p.inspired,
                                            compact: true
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 56,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "prow-name",
                                            children: [
                                                p.name,
                                                p.away ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "tag",
                                                    children: "away"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                    lineNumber: 59,
                                                    columnNumber: 27
                                                }, this) : null
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 57,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "bal",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 61,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn small primary",
                                            type: "button",
                                            onClick: ()=>give(p.id, 1),
                                            "aria-label": `Give ${p.name} ${amountOk ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(cp) : ""}`,
                                            children: "Give"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 62,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "btn small",
                                            type: "button",
                                            onClick: ()=>give(p.id, -1),
                                            "aria-label": `Take ${amountOk ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(cp) : ""} from ${p.name}`,
                                            children: "Take"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 65,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, p.id, true, {
                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                    lineNumber: 55,
                                    columnNumber: 13
                                }, this)),
                            active.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "note",
                                children: "No players yet. Anyone who opens ?player=their-name joins automatically."
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 70,
                                columnNumber: 34
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "check",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: allowDebt,
                                onChange: (e)=>setAllowDebt(e.target.checked)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 73,
                                columnNumber: 11
                            }, this),
                            " Allow debt (Take can go below zero)"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
                        className: "payall",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                                children: "Pay everyone"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "checks",
                                children: active.filter((p)=>!p.away).map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "check",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                checked: !unticked.has(p.id),
                                                onChange: (e)=>setUnticked((u)=>{
                                                        const n = new Set(u);
                                                        if (e.target.checked) n.delete(p.id);
                                                        else n.add(p.id);
                                                        return n;
                                                    })
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                lineNumber: 83,
                                                columnNumber: 19
                                            }, this),
                                            p.name
                                        ]
                                    }, p.id, true, {
                                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                                        lineNumber: 82,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn primary",
                                type: "button",
                                disabled: !payees.length,
                                onClick: ()=>{
                                    if (!amountOk) return toast("Enter an amount first.");
                                    void run({
                                        type: "money.payAll",
                                        amountCp: cp,
                                        note,
                                        playerIds: payees.map((p)=>p.id)
                                    }, `Paid ${payees.length} ${payees.length === 1 ? "player" : "players"} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(cp)} each.`);
                                },
                                children: [
                                    "Pay ",
                                    payees.length === active.filter((p)=>!p.away).length ? "everyone" : `${payees.length} players`,
                                    " ",
                                    amountOk ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(cp) : ""
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 99,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/BankPanel.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "box-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Ledger"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "inline-label",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "sr-only",
                                        children: "Show ledger for"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                                        lineNumber: 117,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "fld",
                                        value: sessionFilter,
                                        onChange: (e)=>setSessionFilter(e.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "all",
                                                children: "All sessions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                lineNumber: 119,
                                                columnNumber: 15
                                            }, this),
                                            [
                                                ...s.sessions
                                            ].reverse().map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: x.id,
                                                    children: x.title
                                                }, x.id, false, {
                                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                    lineNumber: 121,
                                                    columnNumber: 17
                                                }, this)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "none",
                                                children: "Between sessions"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                lineNumber: 125,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                                        lineNumber: 118,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "ledger",
                        children: [
                            ledger.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "note",
                                    children: "Nothing yet. Every payment and purchase shows up here."
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                    lineNumber: 132,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/BankPanel.tsx",
                                lineNumber: 131,
                                columnNumber: 13
                            }, this) : null,
                            ledger.slice(0, 300).map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: l.note
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                    lineNumber: 138,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "who",
                                                    children: [
                                                        l.playerName,
                                                        " · ",
                                                        new Date(l.at).toLocaleString(undefined, {
                                                            dateStyle: "medium",
                                                            timeStyle: "short"
                                                        }),
                                                        " · ",
                                                        sessionName(l.sessionId)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                                    lineNumber: 139,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 137,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: l.amountCp >= 0 ? "up" : "down",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDelta"])(l.amountCp)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/BankPanel.tsx",
                                            lineNumber: 143,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, l.id, true, {
                                    fileName: "[project]/src/client/dm/BankPanel.tsx",
                                    lineNumber: 136,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/BankPanel.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/BankPanel.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/BankPanel.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/Check.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Check",
    ()=>Check
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function Check({ checked, onChange, children, className }) {
    const [pending, setPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const timer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (pending !== null && checked === pending) setPending(null);
    }, [
        checked,
        pending
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>()=>void (timer.current && clearTimeout(timer.current)), []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        className: `check${className ? " " + className : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "checkbox",
                checked: pending ?? checked,
                onChange: (e)=>{
                    const v = e.target.checked;
                    setPending(v);
                    if (timer.current) clearTimeout(timer.current);
                    timer.current = setTimeout(()=>setPending(null), 4000);
                    void Promise.resolve(onChange(v)).then((ok)=>{
                        if (ok === false) setPending(null);
                    });
                }
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Check.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Check.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/DmApp.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DmApp",
    ()=>DmApp
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/useGame.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Notice.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Purse$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Purse.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/SceneView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/ShopBoard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/Stage.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/projection.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/reducer.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$BankPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/BankPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ShopPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/ShopPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ScenesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/ScenesPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$PlayersPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/PlayersPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$GamePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/GamePanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$EpisodesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/EpisodesPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$RunGame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/RunGame.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$LiveMapControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/LiveMapControls.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$MapEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/MapEditor.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Inbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Inbox.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Dues$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Dues.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-ssr] (ecmascript)");
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
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const TABS = [
    [
        "bank",
        "Bank",
        "B"
    ],
    [
        "shop",
        "Shop",
        ""
    ],
    [
        "scenes",
        "Scenes",
        ""
    ],
    [
        "players",
        "Players",
        ""
    ],
    [
        "episodes",
        "Episodes",
        ""
    ],
    [
        "game",
        "Game",
        ""
    ]
];
function DmApp({ ident: initial }) {
    const [ident, setIdent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initial);
    const g = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$useGame$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useGame"])(ident);
    if (g.phase === "invalid") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(KeyPrompt, {
            game: ident.game,
            onKey: (key)=>((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rememberKey"])(ident, key), setIdent({
                    ...ident,
                    key
                })),
            wrong: !!ident.key
        }, void 0, false, {
            fileName: "[project]/src/client/dm/DmApp.tsx",
            lineNumber: 46,
            columnNumber: 12
        }, this);
    }
    if (g.phase === "no-game") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CreateGame, {
        ident: ident,
        onCreated: g.retryHello
    }, void 0, false, {
        fileName: "[project]/src/client/dm/DmApp.tsx",
        lineNumber: 48,
        columnNumber: 37
    }, this);
    if (!g.view || g.view.role !== "dm") {
        if (g.phase === "error") return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Notice"], {
            title: "Can't reach the server",
            children: [
                g.error ?? "Trying again",
                "..."
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/DmApp.tsx",
            lineNumber: 50,
            columnNumber: 37
        }, this);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "dm-root",
            "aria-busy": "true"
        }, void 0, false, {
            fileName: "[project]/src/client/dm/DmApp.tsx",
            lineNumber: 51,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DmConsole, {
        view: g.view,
        ident: ident,
        online: g.online,
        send: g.send,
        call: g.call
    }, void 0, false, {
        fileName: "[project]/src/client/dm/DmApp.tsx",
        lineNumber: 53,
        columnNumber: 10
    }, this);
}
function KeyPrompt({ game, onKey, wrong }) {
    const [k, setK] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Notice"], {
        title: "The DM's table",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
            className: "form",
            onSubmit: (e)=>{
                e.preventDefault();
                if (k.trim()) onKey(k.trim());
            },
            children: [
                wrong ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "error-text",
                    children: "That key didn’t work."
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 67,
                    columnNumber: 18
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    children: "Enter the DM key to continue."
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 67,
                    columnNumber: 78
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                    children: [
                        "DM key",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            className: "fld",
                            type: "password",
                            autoComplete: "current-password",
                            value: k,
                            onChange: (e)=>setK(e.target.value),
                            autoFocus: true
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 68,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn primary",
                    type: "submit",
                    children: "Open the DM view"
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "note",
                    children: [
                        "Game: ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: game
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 76,
                            columnNumber: 17
                        }, this),
                        ". The key is saved on this device only."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/DmApp.tsx",
            lineNumber: 60,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/dm/DmApp.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
function CreateGame({ ident, onCreated }) {
    const [err, setErr] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Notice$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Notice"], {
        title: `Set up “${ident.game}”`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "There’s no game here yet. Create it with Candlefair’s scenes, shops and items, and Players 1–4."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/DmApp.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this),
            err ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "error-text",
                children: err
            }, void 0, false, {
                fileName: "[project]/src/client/dm/DmApp.tsx",
                lineNumber: 88,
                columnNumber: 14
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn primary",
                type: "button",
                onClick: async ()=>{
                    try {
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"])("/api/game", ident, {
                            method: "POST"
                        });
                        onCreated();
                    } catch (e) {
                        setErr(e instanceof Error ? e.message : String(e));
                    }
                },
                children: "Create the game"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/DmApp.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/DmApp.tsx",
        lineNumber: 86,
        columnNumber: 5
    }, this);
}
/** Fetch DM-only art with the key header and keep it as a local blob URL. */ function useGatedArt(ident, names) {
    const [urls, setUrls] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const key = names.join(",");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let alive = true;
        const made = [];
        (async ()=>{
            const out = {};
            for (const n of names){
                try {
                    const r = await fetch(`/api/art/${n}?game=${encodeURIComponent(ident.game)}`, {
                        headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authHeaders"])(ident),
                        cache: "no-store"
                    });
                    if (r.ok) {
                        const u = URL.createObjectURL(await r.blob());
                        made.push(u);
                        out[n] = u;
                    }
                } catch  {}
            }
            if (alive) setUrls(out);
        })();
        return ()=>{
            alive = false;
            made.forEach((u)=>URL.revokeObjectURL(u));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        key,
        ident.key,
        ident.game
    ]);
    return urls;
}
function DmConsole({ view, ident, online, send, call }) {
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("bank");
    const [toastMsg, setToastMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const toastTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const s = view.state;
    const toast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((text)=>{
        setToastMsg((t)=>({
                text,
                n: (t?.n ?? 0) + 1
            }));
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(()=>setToastMsg(null), 3200);
    }, []);
    const run = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (cmd, success)=>{
        const err = await send(cmd);
        if (err) {
            toast(err);
            return false;
        }
        if (success) toast(success);
        return true;
    }, [
        send,
        toast
    ]);
    const gated = useGatedArt(ident, [
        "merchant-sigil"
    ]);
    const [editingMap, setEditingMap] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [ending, setEnding] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const closeMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>setEditingMap(null), []);
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            view,
            ident,
            run,
            toast,
            gated,
            call,
            openMap: setEditingMap
        }), [
        view,
        ident,
        run,
        toast,
        gated,
        call
    ]);
    /** S: open the shop on the TV (at a shop the party can see), or close it. */ const toggleShop = ()=>{
        if (s.live.shopOpen) return void run({
            type: "live.shop",
            open: false
        });
        const open = s.shops.filter((x)=>x.visibility === "all");
        const target = open.find((x)=>x.id === s.live.shopId) ?? open[0];
        if (!target) return toast("Every shop is hidden. Open one to everyone under Shop first.");
        void run({
            type: "live.shop",
            open: true,
            shopId: target.id
        });
    };
    // Run-game mode. It reopens on reload (or on another device) while an episode
    // is running, unless you left it on this device during this session.
    const session0 = s.sessions.find((x)=>x.id === s.currentSessionId);
    const runKey = `candlefair-run-left:${ident.game}`;
    const [runOpen, setRunOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>{
        if (!session0?.run) return false;
        try {
            return sessionStorage.getItem(runKey) !== session0.id;
        } catch  {
            return true;
        }
    });
    const [pickEpisode, setPickEpisode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const leaveRun = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setRunOpen(false);
        try {
            if (s.currentSessionId) sessionStorage.setItem(runKey, s.currentSessionId);
        } catch  {}
    }, [
        runKey,
        s.currentSessionId
    ]);
    const startRun = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (episodeId)=>{
        if (await run({
            type: "run.start",
            episodeId
        })) {
            try {
                sessionStorage.removeItem(runKey);
            } catch  {}
            setRunOpen(true);
            window.scrollTo(0, 0);
        }
    }, [
        run,
        runKey
    ]);
    const askedShop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(s.live.shopId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        askedShop.current = s.live.shopId;
    }, [
        s.live.shopId,
        view.version
    ]);
    // Keyboard: 0-9 scenes, arrows step, S shop on TV, P purse, B bank, L map legend, Esc closes the shop (or zooms the map back out).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (runOpen) return; // run-game mode has its own keys
        const onKey = (e)=>{
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const k = e.key;
            if (/^[0-9]$/.test(k)) {
                const sc = s.scenes.find((x)=>x.hotkey === Number(k));
                if (sc) void run({
                    type: "scene.show",
                    sceneId: sc.id
                });
            } else if ((k === "ArrowRight" || k === "ArrowLeft") && s.live.shopOpen && s.shops.some((x)=>x.visibility === "all")) {
                // While the shop is on the TV, the arrows flip through the shops the party can see.
                // Count from the shop we last asked for, so quick presses add up before the server answers.
                const open = s.shops.filter((x)=>x.visibility === "all");
                const i = Math.max(0, open.findIndex((x)=>x.id === askedShop.current));
                const n = open.length;
                const next = open[(i + (k === "ArrowRight" ? 1 : -1) + n) % n];
                askedShop.current = next.id;
                void run({
                    type: "live.shop",
                    open: true,
                    shopId: next.id
                });
            } else if (k === "ArrowRight") void run({
                type: "scene.step",
                dir: 1
            });
            else if (k === "ArrowLeft") void run({
                type: "scene.step",
                dir: -1
            });
            else if (k === "s" || k === "S") toggleShop();
            else if (k === "p" || k === "P") void run({
                type: "live.purse",
                visible: !s.live.purseVisible
            });
            else if (k === "b" || k === "B") setTab("bank");
            else if (k === "Escape" && s.live.shopOpen) void run({
                type: "live.shop",
                open: false
            });
            else if (k === "Escape" && s.live.focus) void run({
                type: "live.focus",
                pinId: null
            });
            else if (k === "l" || k === "L") {
                const m = s.scenes.find((x)=>x.id === s.live.sceneId);
                if (m?.kind !== "map" || !m.map) return;
                void run({
                    type: "map.legend",
                    sceneId: m.id,
                    on: !m.map.legendOn
                });
            } else return;
            e.preventDefault();
        };
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, [
        s.scenes,
        s.shops,
        s.live.shopOpen,
        s.live.shopId,
        s.live.purseVisible,
        s.live.sceneId,
        s.live.focus,
        run,
        runOpen
    ]);
    const live = s.scenes.find((x)=>x.id === s.live.sceneId) ?? s.scenes[0];
    const purse = s.players.filter((p)=>!p.archived && !p.away).map((p)=>({
            id: p.id,
            name: p.name,
            balanceCp: p.balanceCp,
            inspired: !!p.inspired
        }));
    // What the TV sees, for the preview (hidden prices stay hidden here too).
    const tvView = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["projectTv"])(s, view.version);
    // Maps preview exactly what the TV gets: discovered pins only.
    const previewScene = tvView.scenes.find((x)=>x.id === live.id) ?? {
        ...live,
        map: undefined
    };
    const session = s.sessions.find((x)=>x.id === s.currentSessionId);
    const liveShop = s.shops.find((x)=>x.id === s.live.shopId);
    const openTv = ()=>{
        window.open((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hrefFor"])(ident.game, "TV"), "candlefair-tv", "popup,width=1280,height=720");
    };
    const episodes = s.episodes ?? [];
    const runningEp = session?.run ? episodes.find((e)=>e.id === session.run.episodeId) : undefined;
    const chosenEp = episodes.find((e)=>e.id === pickEpisode) ?? episodes[0];
    if (runOpen && session?.run) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DmContext"].Provider, {
            value: ctx,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$RunGame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RunGame"], {
                    onExit: leaveRun
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 272,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `toast${toastMsg ? " show" : ""}`,
                    role: "status",
                    "aria-live": "polite",
                    children: toastMsg?.text
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 273,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/DmApp.tsx",
            lineNumber: 271,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DmContext"].Provider, {
        value: ctx,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "dm-root",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "dm-top",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "dm-brand",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CandleIcon"], {
                                    size: 26
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 285,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "dm-title",
                                            children: s.name
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 287,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "dm-subtitle",
                                            children: [
                                                "DM view",
                                                session ? ` · ${session.title}, running` : " · between sessions"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 288,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 286,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 284,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `conn${online ? " ok" : ""}`,
                            role: "status",
                            children: online ? "Live" : "Reconnecting"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 291,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "spacer"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 294,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Inbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Inbox"], {}, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 295,
                            columnNumber: 11
                        }, this),
                        ending && session ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Dues$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EndSessionDialog"], {
                            session: session,
                            onClose: ()=>setEnding(false)
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 296,
                            columnNumber: 32
                        }, this) : null,
                        session ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn",
                            type: "button",
                            onClick: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["duesFor"])(s, session.number).length ? setEnding(true) : void run({
                                    type: "session.end"
                                }, `${session.title} ended.`),
                            children: "End session"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 298,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn primary",
                            type: "button",
                            onClick: ()=>run({
                                    type: "session.start"
                                }, "Session started. The TV is back on the notice board."),
                            children: [
                                "Start session ",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nextSessionNumber"])(s)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 302,
                            columnNumber: 13
                        }, this),
                        runningEp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn primary",
                            type: "button",
                            onClick: ()=>startRun(runningEp.id),
                            children: "Resume run-game"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 307,
                            columnNumber: 13
                        }, this) : chosenEp ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "run-pick",
                            children: [
                                episodes.length > 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "fld",
                                    "aria-label": "Episode to run",
                                    value: chosenEp.id,
                                    onChange: (e)=>setPickEpisode(e.target.value),
                                    children: episodes.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: e.id,
                                            children: e.title
                                        }, e.id, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 315,
                                            columnNumber: 21
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 313,
                                    columnNumber: 17
                                }, this) : null,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn",
                                    type: "button",
                                    onClick: ()=>startRun(chosenEp.id),
                                    title: `Run “${chosenEp.title}”`,
                                    children: [
                                        "Run game",
                                        episodes.length > 1 ? "" : `: ${chosenEp.title}`
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 321,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 311,
                            columnNumber: 13
                        }, this) : null,
                        s.vttUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            className: "btn",
                            href: s.vttUrl,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InspirationIcon"], {}, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 328,
                                    columnNumber: 15
                                }, this),
                                " Launch VTT"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 327,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn",
                            type: "button",
                            onClick: openTv,
                            title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(ident.game, "TV"),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TvIcon"], {}, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 332,
                                    columnNumber: 13
                                }, this),
                                " Open TV window"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 331,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 283,
                    columnNumber: 9
                }, this),
                s.knocks.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "dm-knocks",
                    role: "status",
                    children: s.knocks.map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "knock",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                    children: k.handle
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 340,
                                    columnNumber: 17
                                }, this),
                                " is knocking.",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn small primary",
                                    type: "button",
                                    onClick: ()=>run({
                                            type: "knock.admit",
                                            knockId: k.id
                                        }, `Let ${k.handle} in.`),
                                    children: "Let in"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 341,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn small",
                                    type: "button",
                                    onClick: ()=>run({
                                            type: "knock.dismiss",
                                            knockId: k.id
                                        }),
                                    children: "Dismiss"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 344,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, k.id, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 339,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 337,
                    columnNumber: 11
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "dm-grid",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "dm-live box",
                            "aria-label": "What the TV shows",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "box-head",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            children: "On the TV"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 355,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "note",
                                            children: [
                                                live.label,
                                                live.reveal ? " (reveal)" : ""
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 356,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 354,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "preview",
                                    "aria-label": `Preview: ${live.label}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SceneView"], {
                                            scene: previewScene,
                                            gated: gated,
                                            flyers: tvView.flyers,
                                            emptyHint: "No image yet. Add one under Scenes."
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 362,
                                            columnNumber: 15
                                        }, this),
                                        s.live.shopOpen && liveShop ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "preview-shop",
                                            "aria-label": `Shop open on the TV: ${liveShop.name}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Stage$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Stage"], {
                                                w: 1920,
                                                h: 1080,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShopBoard"], {
                                                    shops: tvView.shops,
                                                    items: tvView.items,
                                                    shopId: liveShop.id,
                                                    size: "tv",
                                                    mode: s.live.shopCategory ? "category" : "shop",
                                                    category: s.live.shopCategory
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 366,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/DmApp.tsx",
                                                lineNumber: 365,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 364,
                                            columnNumber: 17
                                        }, this) : null,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "preview-purse",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$Purse$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Purse"], {
                                                players: purse,
                                                visible: s.live.purseVisible,
                                                size: "small"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/DmApp.tsx",
                                                lineNumber: 371,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 370,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 361,
                                    columnNumber: 13
                                }, this),
                                live.kind === "map" && live.map ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$LiveMapControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LiveMapControls"], {
                                    scene: live
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 375,
                                    columnNumber: 48
                                }, this) : null,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "scene-buttons",
                                    role: "group",
                                    "aria-label": "Scenes",
                                    children: s.scenes.map((sc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `btn scene-btn${sc.id === s.live.sceneId ? " on" : ""}${sc.reveal ? " reveal-btn" : ""}`,
                                            "aria-pressed": sc.id === s.live.sceneId,
                                            onClick: ()=>run({
                                                    type: "scene.show",
                                                    sceneId: sc.id
                                                }),
                                            children: [
                                                sc.hotkey !== null ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "key",
                                                    children: sc.hotkey
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 386,
                                                    columnNumber: 41
                                                }, this) : null,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        sc.label,
                                                        sc.reveal ? " (reveal)" : ""
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, sc.id, true, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 379,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 377,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "live-toggles",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `btn${s.live.shopOpen ? " on" : ""}`,
                                            "aria-pressed": s.live.shopOpen,
                                            onClick: toggleShop,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "key",
                                                    children: "S"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 397,
                                                    columnNumber: 17
                                                }, this),
                                                " ",
                                                s.live.shopOpen ? "Close the shop" : "Shop on TV"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 396,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `btn${s.live.purseVisible ? " on" : ""}`,
                                            "aria-pressed": s.live.purseVisible,
                                            onClick: ()=>run({
                                                    type: "live.purse",
                                                    visible: !s.live.purseVisible
                                                }),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "key",
                                                    children: "P"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 400,
                                                    columnNumber: 17
                                                }, this),
                                                " Purse"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 399,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 395,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `live-shops${s.live.shopOpen ? " open" : ""}`,
                                    role: "group",
                                    "aria-label": "Which shop the TV shows",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "note",
                                            children: s.live.shopOpen ? "The TV is showing:" : "Open the shop on the TV at:"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 404,
                                            columnNumber: 15
                                        }, this),
                                        s.shops.filter((sh)=>sh.visibility === "all").length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "note",
                                            children: "Every shop is hidden. Open one to everyone under Shop first."
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 406,
                                            columnNumber: 17
                                        }, this) : null,
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["categoriesWith"])(tvView.items).map((c)=>{
                                            const on = s.live.shopOpen && s.live.shopCategory === c.id;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: `btn small${on ? " on" : ""}`,
                                                "aria-pressed": on,
                                                onClick: ()=>run({
                                                        type: "live.shop",
                                                        open: true,
                                                        category: c.id
                                                    }),
                                                children: c.label
                                            }, c.id, false, {
                                                fileName: "[project]/src/client/dm/DmApp.tsx",
                                                lineNumber: 411,
                                                columnNumber: 19
                                            }, this);
                                        }),
                                        s.shops.filter((sh)=>sh.visibility === "all").length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "note",
                                            children: "or a storefront:"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 416,
                                            columnNumber: 73
                                        }, this) : null,
                                        s.shops.filter((sh)=>sh.visibility === "all").map((sh)=>{
                                            const on = s.live.shopOpen && !s.live.shopCategory && sh.id === s.live.shopId;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: `btn small${on ? " on" : ""}`,
                                                "aria-pressed": on,
                                                onClick: ()=>run({
                                                        type: "live.shop",
                                                        open: true,
                                                        shopId: sh.id
                                                    }),
                                                children: sh.name
                                            }, sh.id, false, {
                                                fileName: "[project]/src/client/dm/DmApp.tsx",
                                                lineNumber: 420,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 403,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "note hint",
                                    children: "Keys: 0–9 scenes · ← → step (or flip shops while the shop is open) · S shop · P purse · B bank · I requests · L map legend · Esc closes the shop or zooms the map out"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 426,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 353,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "dm-panels",
                            "aria-label": "DM tools",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "tabs",
                                    role: "tablist",
                                    "aria-label": "DM tools",
                                    children: TABS.map(([id, label, key])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            role: "tab",
                                            id: `tab-${id}`,
                                            "aria-selected": tab === id,
                                            "aria-controls": `panel-${id}`,
                                            className: `btn tab${tab === id ? " on" : ""}`,
                                            onClick: ()=>setTab(id),
                                            children: [
                                                key ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "key",
                                                    children: key
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 435,
                                                    columnNumber: 26
                                                }, this) : null,
                                                label,
                                                id === "players" && s.knocks.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "badge",
                                                    children: s.knocks.length
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                                    lineNumber: 437,
                                                    columnNumber: 58
                                                }, this) : null
                                            ]
                                        }, id, true, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 434,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 432,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    role: "tabpanel",
                                    id: `panel-${tab}`,
                                    "aria-labelledby": `tab-${tab}`,
                                    className: "panel",
                                    children: [
                                        tab === "bank" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$BankPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BankPanel"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 442,
                                            columnNumber: 33
                                        }, this) : null,
                                        tab === "shop" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ShopPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShopPanel"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 443,
                                            columnNumber: 33
                                        }, this) : null,
                                        tab === "scenes" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ScenesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ScenesPanel"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 444,
                                            columnNumber: 35
                                        }, this) : null,
                                        tab === "players" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$PlayersPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlayersPanel"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 445,
                                            columnNumber: 36
                                        }, this) : null,
                                        tab === "episodes" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$EpisodesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EpisodesPanel"], {
                                            onRun: startRun
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 446,
                                            columnNumber: 37
                                        }, this) : null,
                                        tab === "game" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$GamePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GamePanel"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/DmApp.tsx",
                                            lineNumber: 447,
                                            columnNumber: 33
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/DmApp.tsx",
                                    lineNumber: 441,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/DmApp.tsx",
                            lineNumber: 431,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 352,
                    columnNumber: 9
                }, this),
                editingMap ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$MapEditor$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MapEditor"], {
                    sceneId: editingMap,
                    onClose: closeMap
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 452,
                    columnNumber: 23
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `toast${toastMsg ? " show" : ""}`,
                    role: "status",
                    "aria-live": "polite",
                    children: toastMsg?.text
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/DmApp.tsx",
                    lineNumber: 454,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/DmApp.tsx",
            lineNumber: 282,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/dm/DmApp.tsx",
        lineNumber: 281,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/Dues.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dues",
    ()=>Dues,
    "EndSessionDialog",
    ()=>EndSessionDialog,
    "useDues",
    ()=>useDues
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// "Rent and lessons due": the session-end step that charges every active
// renter and the next lesson for anyone in training. You confirm it.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function useDues(session) {
    const { view } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    return session ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["duesFor"])(view.state, session.number) : [];
}
function Dues({ session, onCharged }) {
    const { view, call, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const due = useDues(session);
    const name = (id)=>s.players.find((p)=>p.id === id)?.name ?? "someone who left";
    /** Can they pay without going past zero (or past their tab, where the item is)? */ const canPay = (d)=>{
        const p = s.players.find((x)=>x.id === d.playerId);
        if (!p || p.archived) return false;
        const itemId = d.kind === "rent" ? s.rentals.find((r)=>r.id === d.id)?.itemId : s.trainings.find((t)=>t.id === d.id)?.itemId;
        const shopId = s.items.find((i)=>i.id === itemId)?.shopId;
        return p.balanceCp - d.cp >= -(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["creditCp"])(s, p.id, shopId);
    };
    // Players who can't pay start unticked; tick one to charge it into debt.
    const [picked, setPicked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>new Set(due.filter(canPay).map((d)=>d.id)));
    const ticked = due.filter((d)=>picked.has(d.id));
    const total = ticked.reduce((a, d)=>a + d.cp, 0);
    if (!due.length) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "note",
            children: session.duesCharged ? "Rent and lessons are paid for this session." : "No rent or lessons due this session."
        }, void 0, false, {
            fileName: "[project]/src/client/dm/Dues.tsx",
            lineNumber: 36,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "dues",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "dues-list",
                children: due.map((d)=>{
                    const ok = canPay(d);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "check",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: picked.has(d.id),
                                        onChange: (e)=>{
                                            const next = new Set(picked);
                                            if (e.target.checked) next.add(d.id);
                                            else next.delete(d.id);
                                            setPicked(next);
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/Dues.tsx",
                                        lineNumber: 46,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: name(d.playerId)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/Dues.tsx",
                                        lineNumber: 56,
                                        columnNumber: 17
                                    }, this),
                                    ": ",
                                    d.kind === "rent" ? `rent for ${d.itemName}` : `${d.itemName}, lesson ${d.step}`,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "purse-amt",
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(d.cp)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/Dues.tsx",
                                        lineNumber: 56,
                                        columnNumber: 127
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/Dues.tsx",
                                lineNumber: 45,
                                columnNumber: 15
                            }, this),
                            !ok ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "short",
                                children: "can’t pay: ticking it puts them in debt"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Dues.tsx",
                                lineNumber: 58,
                                columnNumber: 22
                            }, this) : null
                        ]
                    }, d.id, true, {
                        fileName: "[project]/src/client/dm/Dues.tsx",
                        lineNumber: 44,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Dues.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "btn primary",
                disabled: !ticked.length,
                onClick: async ()=>{
                    const r = await call({
                        type: "dues.charge",
                        ids: ticked.map((d)=>d.id)
                    });
                    toast(r.error ?? r.info ?? "Charged.");
                    if (!r.error) onCharged?.();
                },
                children: [
                    "Charge ",
                    ticked.length,
                    " · ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(total)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Dues.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            ticked.length < due.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "Anything unticked stays due. You can charge it later this session."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Dues.tsx",
                lineNumber: 75,
                columnNumber: 37
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Dues.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
function EndSessionDialog({ session, onClose }) {
    const { run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const due = useDues(session);
    const end = async ()=>{
        if (await run({
            type: "session.end"
        }, `${session.title} ended.`)) onClose();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "inbox-backdrop",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: "inbox-drawer",
            role: "dialog",
            "aria-label": "Rent and lessons due",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "box-head",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "Rent and lessons due"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Dues.tsx",
                            lineNumber: 91,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "btn small",
                            onClick: onClose,
                            children: "Not yet"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Dues.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Dues.tsx",
                    lineNumber: 90,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Dues, {
                    session: session
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/Dues.tsx",
                    lineNumber: 96,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: `btn${due.length ? "" : " primary"}`,
                    onClick: end,
                    children: due.length ? `End ${session.title} without charging the rest` : `End ${session.title}`
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/Dues.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/Dues.tsx",
            lineNumber: 89,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/dm/Dues.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/EpisodesPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EpisodesPanel",
    ()=>EpisodesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// Episodes: create, edit, reorder, import and export run sheets. DM-only.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/reducer.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/runsheet.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$RunGame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/RunGame.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
// A made-up example: the browser bundle must not carry any real episode text.
const FORMAT_HELP = `## The toll bridge
> "Nobody crosses without paying."
- Notes are bullet lines.
check: Charisma (Persuasion) DC 12 | talk the toll down | fail: the price doubles
if: they pay → the troll waves them through
action: black`;
function EpisodesPanel({ onRun }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const episodes = s.episodes ?? [];
    const [openId, setOpenId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(episodes[0]?.id ?? null);
    const [newTitle, setNewTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [importing, setImporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const ep = episodes.find((e)=>e.id === openId) ?? episodes[0];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "episodes-panel panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "box-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "Episodes"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 35,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "note",
                                children: "Run sheets are DM-only. The TV only sees what their actions do."
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 36,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "tabs",
                        role: "group",
                        "aria-label": "Episodes",
                        children: episodes.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: `btn small${ep?.id === e.id ? " on" : ""}`,
                                "aria-pressed": ep?.id === e.id,
                                onClick: ()=>setOpenId(e.id),
                                children: e.title
                            }, e.id, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        className: "inline",
                        style: {
                            marginTop: 12
                        },
                        onSubmit: async (e)=>{
                            e.preventDefault();
                            if (await run({
                                type: "episode.add",
                                title: newTitle.trim() || "New episode"
                            }, "Episode added.")) setNewTitle("");
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "grow",
                                children: [
                                    "New episode",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "fld",
                                        value: newTitle,
                                        placeholder: "Episode 2: …",
                                        onChange: (e)=>setNewTitle(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 55,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 53,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "submit",
                                children: "Add episode"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "button",
                                "aria-expanded": importing,
                                onClick: ()=>setImporting((v)=>!v),
                                children: "Import Markdown"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    importing ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ImportBox, {
                        episode: ep,
                        onDone: ()=>setImporting(false)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 64,
                        columnNumber: 22
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            ep ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EpisodeEditor, {
                ep: ep,
                onRun: onRun,
                running: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["curRunEpisode"])(s) === ep.id
            }, ep.id, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 67,
                columnNumber: 13
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "No episodes yet."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 67,
                columnNumber: 104
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
function ImportBox({ episode, onDone }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const [md, setMd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [into, setInto] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("new");
    const parsed = md.trim() ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseEpisode"])(md, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sceneResolver"])(view.state.scenes)) : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "import-box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "form",
                children: [
                    "Paste an episode: one beat per “##”",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        className: "fld mono",
                        rows: 10,
                        value: md,
                        placeholder: FORMAT_HELP,
                        onChange: (e)=>setMd(e.target.value)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: [
                    "Lines: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ">"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 16
                    }, this),
                    " read-aloud · ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "-"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 47
                    }, this),
                    " note · ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "check:"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 69
                    }, this),
                    " skill DC n | what | fail: … | success: … · ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "if:"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 132
                    }, this),
                    " … → … · ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "action:"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 157
                    }, this),
                    " scene <name>, black or bank. A ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "# Title"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 84,
                        columnNumber: 215
                    }, this),
                    " line names the episode."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            parsed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "import-preview",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: parsed.title
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 89,
                                columnNumber: 13
                            }, this),
                            ": ",
                            parsed.beats.length,
                            " beat",
                            parsed.beats.length === 1 ? "" : "s",
                            ", ",
                            parsed.beats.reduce((n, b)=>n + b.checks.length, 0),
                            " checks, ",
                            parsed.beats.reduce((n, b)=>n + b.branches.length, 0),
                            " branches,",
                            " ",
                            parsed.beats.reduce((n, b)=>n + b.actions.length, 0),
                            " actions."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 88,
                        columnNumber: 11
                    }, this),
                    parsed.warnings.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "import-warnings",
                        children: parsed.warnings.map((w, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: w
                            }, i, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 95,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 93,
                        columnNumber: 13
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            episode ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "check",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                name: "into",
                                                checked: into === "new",
                                                onChange: ()=>setInto("new")
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                                lineNumber: 103,
                                                columnNumber: 19
                                            }, this),
                                            " As a new episode"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 102,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "check",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "radio",
                                                name: "into",
                                                checked: into === "replace",
                                                onChange: ()=>setInto("replace")
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                                lineNumber: 106,
                                                columnNumber: 19
                                            }, this),
                                            " Replace the beats of “",
                                            episode.title,
                                            "”"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 105,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 101,
                                columnNumber: 15
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn primary",
                                type: "button",
                                disabled: !parsed.beats.length,
                                onClick: async ()=>{
                                    const ok = into === "replace" && episode ? await run({
                                        type: "episode.replaceBeats",
                                        episodeId: episode.id,
                                        beats: parsed.beats
                                    }, `Imported ${parsed.beats.length} beats.`) : await run({
                                        type: "episode.add",
                                        title: parsed.title,
                                        beats: parsed.beats
                                    }, `Imported “${parsed.title}”.`);
                                    if (ok) onDone();
                                },
                                children: [
                                    "Import ",
                                    parsed.beats.length,
                                    " beats"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 99,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 87,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
function EpisodeEditor({ ep, onRun, running }) {
    const { view, run, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [exporting, setExporting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [confirmDelete, setConfirmDelete] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dragId, setDragId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const md = exporting ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["episodeMarkdown"])(ep, s.scenes) : "";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "box-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: ep.title
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: [
                            ep.beats.length,
                            " beats"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 144,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 142,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grow",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                            label: "Title",
                            value: ep.title,
                            onCommit: (v)=>v.trim() ? run({
                                    type: "episode.update",
                                    episodeId: ep.id,
                                    title: v
                                }) : false
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                            lineNumber: 148,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 147,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary",
                        type: "button",
                        onClick: ()=>onRun(ep.id),
                        children: running ? "Resume run-game" : "Run this episode"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 150,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn",
                        type: "button",
                        "aria-expanded": exporting,
                        onClick: ()=>setExporting((v)=>!v),
                        children: "Export Markdown"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this),
                    confirmDelete === ep.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn danger",
                        type: "button",
                        onClick: ()=>run({
                                type: "episode.remove",
                                episodeId: ep.id
                            }, "Episode deleted."),
                        children: "Really delete the episode?"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 157,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn danger",
                        type: "button",
                        onClick: ()=>setConfirmDelete(ep.id),
                        children: "Delete episode"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this),
            exporting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "import-box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        className: "fld mono",
                        rows: 12,
                        readOnly: true,
                        value: md,
                        onFocus: (e)=>e.currentTarget.select()
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 168,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn",
                        type: "button",
                        onClick: async ()=>{
                            try {
                                await navigator.clipboard.writeText(md);
                                toast("Copied the episode as Markdown.");
                            } catch  {
                                toast("Couldn't copy. Select the text and copy it yourself.");
                            }
                        },
                        children: "Copy"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 169,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 167,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "beat-list",
                children: ep.beats.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `scene-item beat-item${dragId === b.id ? " dragging" : ""}`,
                        draggable: editing !== b.id,
                        onDragStart: (e)=>{
                            setDragId(b.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", b.id);
                        },
                        onDragEnd: ()=>setDragId(null),
                        onDragOver: (e)=>{
                            if (dragId) e.preventDefault();
                        },
                        onDrop: (e)=>{
                            e.preventDefault();
                            const id = dragId ?? e.dataTransfer.getData("text/plain");
                            setDragId(null);
                            if (id && id !== b.id) void run({
                                type: "beat.move",
                                episodeId: ep.id,
                                beatId: id,
                                to: i
                            });
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "scene-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "drag-handle",
                                        "aria-hidden": "true",
                                        title: "Drag to reorder",
                                        children: "⠿"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 209,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "key",
                                        children: i + 1
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 212,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "scene-label",
                                        children: b.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 213,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "note beat-summary",
                                        children: [
                                            b.readAloud?.length ? "read-aloud" : "",
                                            b.checks.length ? `${b.checks.length} check${b.checks.length === 1 ? "" : "s"}` : "",
                                            ...b.actions.map((a)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$RunGame$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["actionLabel"])(a, s.scenes))
                                        ].filter(Boolean).join(" · ")
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 214,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "spacer"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 217,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small icon",
                                        type: "button",
                                        "aria-label": `Move ${b.title} up`,
                                        disabled: i === 0,
                                        onClick: ()=>run({
                                                type: "beat.move",
                                                episodeId: ep.id,
                                                beatId: b.id,
                                                to: i - 1
                                            }),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UpIcon"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                            lineNumber: 219,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 218,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small icon",
                                        type: "button",
                                        "aria-label": `Move ${b.title} down`,
                                        disabled: i === ep.beats.length - 1,
                                        onClick: ()=>run({
                                                type: "beat.move",
                                                episodeId: ep.id,
                                                beatId: b.id,
                                                to: i + 1
                                            }),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DownIcon"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                            lineNumber: 222,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 221,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        "aria-expanded": editing === b.id,
                                        onClick: ()=>setEditing(editing === b.id ? null : b.id),
                                        children: editing === b.id ? "Close" : "Edit"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 224,
                                        columnNumber: 15
                                    }, this),
                                    confirmDelete === b.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small danger",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "beat.remove",
                                                episodeId: ep.id,
                                                beatId: b.id
                                            }),
                                        children: "Really delete?"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 228,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small danger",
                                        type: "button",
                                        onClick: ()=>setConfirmDelete(b.id),
                                        children: "Delete"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                        lineNumber: 232,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 208,
                                columnNumber: 13
                            }, this),
                            editing === b.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BeatEditor, {
                                episodeId: ep.id,
                                beat: b,
                                onDone: ()=>setEditing(null)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                                lineNumber: 237,
                                columnNumber: 33
                            }, this) : null
                        ]
                    }, b.id, true, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 188,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 186,
                columnNumber: 7
            }, this),
            editing === "__new__" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "scene-item beat-item",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BeatEditor, {
                    episodeId: ep.id,
                    onDone: ()=>setEditing(null)
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                    lineNumber: 243,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 242,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn",
                type: "button",
                onClick: ()=>setEditing("__new__"),
                children: "Add a beat"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 246,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
        lineNumber: 141,
        columnNumber: 5
    }, this);
}
const NEW_BEAT = "## New beat\n> Read-aloud text (optional)\n- A note for you\n";
/** Edit one beat (or write a new one) in the same Markdown format as import. */ function BeatEditor({ episodeId, beat, onDone }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const [md, setMd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>beat ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["beatMarkdown"])(beat, view.state.scenes) : NEW_BEAT);
    const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseEpisode"])(md, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sceneResolver"])(view.state.scenes), "");
    const one = parsed.beats.length === 1 ? parsed.beats[0] : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "beat-editor",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                className: "fld mono",
                rows: Math.min(24, Math.max(6, md.split("\n").length + 1)),
                value: md,
                onChange: (e)=>setMd(e.target.value),
                "aria-label": beat ? `Edit ${beat.title}` : "New beat"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 264,
                columnNumber: 7
            }, this),
            parsed.beats.length > 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "error-text",
                children: [
                    "That’s ",
                    parsed.beats.length,
                    " beats. Keep one “##” line here, or use Import for several."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 265,
                columnNumber: 34
            }, this) : null,
            parsed.warnings.filter((w)=>!/before the first/.test(w)).length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "import-warnings",
                children: parsed.warnings.filter((w)=>!/before the first/.test(w)).map((w, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: w
                    }, i, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 271,
                        columnNumber: 15
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 267,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary",
                        type: "button",
                        disabled: !one,
                        onClick: async ()=>{
                            if (!one) return;
                            const ok = beat ? await run({
                                type: "beat.update",
                                episodeId,
                                beatId: beat.id,
                                beat: one
                            }, "Beat saved.") : await run({
                                type: "beat.add",
                                episodeId,
                                beat: one
                            }, "Beat added.");
                            if (ok) onDone();
                        },
                        children: beat ? "Save beat" : "Add beat"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn",
                        type: "button",
                        onClick: onDone,
                        children: "Cancel"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                        lineNumber: 288,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
                lineNumber: 275,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/EpisodesPanel.tsx",
        lineNumber: 263,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Field",
    ()=>Field
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function Field({ label, value, onCommit, multiline, placeholder, hint, type = "text" }) {
    const [v, setV] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(value);
    const [focused, setFocused] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const id = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useId"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!focused) setV(value);
    }, [
        value,
        focused
    ]);
    const commit = ()=>{
        setFocused(false);
        if (v === value) return;
        const r = onCommit(v);
        if (r === false) setV(value);
    };
    const common = {
        id,
        className: "fld",
        value: v,
        placeholder,
        "aria-describedby": hint ? id + "-hint" : undefined,
        onFocus: ()=>setFocused(true),
        onBlur: commit
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
        htmlFor: id,
        children: [
            label,
            multiline ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                ...common,
                rows: 2,
                onChange: (e)=>setV(e.target.value)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Field.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ...common,
                type: type,
                onChange: (e)=>setV(e.target.value),
                onKeyDown: (e)=>{
                    if (e.key === "Enter") e.target.blur();
                    if (e.key === "Escape") {
                        setV(value);
                        setTimeout(()=>e.target.blur());
                    }
                }
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Field.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this),
            hint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                id: id + "-hint",
                className: "note",
                children: hint
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Field.tsx",
                lineNumber: 69,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Field.tsx",
        lineNumber: 50,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/GamePanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GamePanel",
    ()=>GamePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function GamePanel() {
    const { view, run, ident, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const file = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const s = view.state;
    const download = async ()=>{
        try {
            const r = await fetch(`/api/export?game=${encodeURIComponent(ident.game)}`, {
                headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authHeaders"])(ident),
                cache: "no-store"
            });
            if (!r.ok) throw new Error("Couldn't make a backup.");
            const blob = await r.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${ident.game}-backup-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
            toast("Backup downloaded. Keep it somewhere safe.");
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e));
        }
    };
    const reset = async (mode)=>{
        const msg = mode === "play" ? "Zero every purse, wipe the ledger and delete all sessions? Players, scenes and shops stay." : "Reset the whole game to the original Candlefair? Players, scenes, shops and items you added or changed will be gone.";
        if (!confirm(msg)) return;
        if (mode === "all" && prompt('Type RESET to confirm.') !== "RESET") return;
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"])("/api/reset", ident, {
                method: "POST",
                body: JSON.stringify({
                    mode
                })
            });
            toast(mode === "play" ? "Fresh start: purses at 0 gp, ledger and sessions cleared." : "Back to the original Candlefair.");
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e));
        }
    };
    const restore = async (f)=>{
        if (!f) return;
        if (!confirm("Replace this whole game with the backup? Everything since the backup will be lost.")) return;
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["api"])("/api/import", ident, {
                method: "POST",
                body: await f.text()
            });
            toast("Backup restored.");
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e));
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "panel-grid",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "The campaign"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "form",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Campaign name",
                                value: s.name,
                                onCommit: (v)=>run({
                                        type: "game.rename",
                                        name: v
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 60,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "D&D Beyond game link (the Launch VTT button)",
                                value: s.vttUrl ?? "",
                                placeholder: "https://www.dndbeyond.com/games/...",
                                hint: "Shows as Launch VTT at the top of your view and on every player's phone.",
                                onCommit: (v)=>run({
                                        type: "game.vtt",
                                        url: v
                                    }, v.trim() ? "VTT link saved." : "VTT link removed.")
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "note",
                                children: [
                                    "Game id: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        children: s.id
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 69,
                                        columnNumber: 22
                                    }, this),
                                    ". Sessions so far: ",
                                    s.sessions.length,
                                    "."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SessionsBox, {}, void 0, false, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Links"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                        className: "links",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                children: "TV"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 77,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(s.id, "TV")
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/GamePanel.tsx",
                                    lineNumber: 79,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                children: "Players"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 81,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(s.id, "their-name")
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/GamePanel.tsx",
                                    lineNumber: 83,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                children: "You"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(s.id, "DM")
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 87,
                                        columnNumber: 13
                                    }, this),
                                    " plus ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        children: "&key="
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 87,
                                        columnNumber: 58
                                    }, this),
                                    " your DM key. The key is saved on each device after the first visit."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 76,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Backup"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "Everything is saved online automatically. A backup now and then is still a good idea."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "button",
                                onClick: download,
                                children: "Download backup"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 95,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "button",
                                onClick: ()=>file.current?.click(),
                                children: "Restore from a backup"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 98,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ref: file,
                                type: "file",
                                accept: "application/json,.json",
                                hidden: true,
                                onChange: (e)=>void restore(e.target.files?.[0])
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 101,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box danger-zone",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Start fresh"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "For after a test run. Neither can be undone, so download a backup first if you might want it."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "form",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn danger",
                                type: "button",
                                onClick: ()=>reset("play"),
                                children: "Clear gold, ledger and sessions"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "note",
                                children: "Keeps your players, scenes, images, shops and items. Every purse goes back to 0 gp and the next session is Session 1."
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 111,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn danger",
                                type: "button",
                                onClick: ()=>reset("all"),
                                children: "Reset everything to the original Candlefair"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 112,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "note",
                                children: "Back to Players 1–4, the starter scenes, shops and items. Your own edits, players and uploads are dropped."
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 115,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn danger",
                                type: "button",
                                onClick: ()=>{
                                    if (confirm("Replace every shop and item with the starter catalog? All shops start hidden. Gold, the ledger and special orders stay as they are.")) void run({
                                        type: "catalog.reset"
                                    }, "Starter catalog loaded. Every shop is hidden until you open it.");
                                },
                                children: "Load the starter catalog"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "note",
                                children: "Swaps your shops and items for the latest starter catalog: Temple Tonic and the other Candlefair goods, special orders from Baldur’s Gate, Training and the Traveling Peddler. Your edits to shops and items are replaced; gold and history aren’t touched."
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 107,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/GamePanel.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
function SessionsBox() {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const counts = new Map();
    for (const l of view.ledger)if (l.sessionId) counts.set(l.sessionId, (counts.get(l.sessionId) ?? 0) + 1);
    const names = new Map(s.players.map((p)=>[
            p.id,
            p.name
        ]));
    const when = (t)=>new Date(t).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
        });
    const list = [
        ...s.sessions
    ].sort((a, b)=>b.number - a.number);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Sessions"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            list.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "No sessions yet. “Start session 1” is at the top of the page."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 146,
                columnNumber: 28
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "session-list",
                children: list.map((x)=>{
                    const running = x.id === s.currentSessionId;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: running ? "running" : undefined,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                        label: "No.",
                                        type: "number",
                                        value: String(x.number),
                                        onCommit: (v)=>{
                                            const n = Number(v);
                                            if (!Number.isInteger(n) || n < 1) return false;
                                            void run({
                                                type: "session.update",
                                                sessionId: x.id,
                                                patch: {
                                                    number: n
                                                }
                                            });
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 153,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                        label: "Title",
                                        value: x.title,
                                        onCommit: (v)=>run({
                                                type: "session.update",
                                                sessionId: x.id,
                                                patch: {
                                                    title: v
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 163,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 152,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "note",
                                children: [
                                    when(x.startedAt),
                                    running ? " \u00b7 running now" : x.endedAt ? ` \u2013 ${when(x.endedAt)}` : "",
                                    " · ",
                                    counts.get(x.id) ?? 0,
                                    " ledger lines",
                                    x.attendeeIds.length ? ` \u00b7 ${x.attendeeIds.map((id)=>names.get(id) ?? "someone who left").join(", ")}` : ""
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 165,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "inline",
                                children: [
                                    running ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "session.end"
                                            }, `${x.title} ended.`),
                                        children: "End it"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 172,
                                        columnNumber: 19
                                    }, this) : !s.currentSessionId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "session.reopen",
                                                sessionId: x.id
                                            }, `${x.title} is running again.`),
                                        children: "Reopen"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 176,
                                        columnNumber: 19
                                    }, this) : null,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small danger",
                                        type: "button",
                                        onClick: ()=>{
                                            if (confirm(`Delete \u201c${x.title}\u201d? Its ledger lines stay, filed under \u201cbetween sessions\u201d.`)) void run({
                                                type: "session.remove",
                                                sessionId: x.id
                                            }, `Deleted ${x.title}.`);
                                        },
                                        children: "Delete"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                                        lineNumber: 180,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/GamePanel.tsx",
                                lineNumber: 170,
                                columnNumber: 15
                            }, this)
                        ]
                    }, x.id, true, {
                        fileName: "[project]/src/client/dm/GamePanel.tsx",
                        lineNumber: 151,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/client/dm/GamePanel.tsx",
                lineNumber: 147,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/GamePanel.tsx",
        lineNumber: 144,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/Inbox.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Inbox",
    ()=>Inbox,
    "isInboxOpen",
    ()=>isInboxOpen
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// The DM's request inbox: purchases and gold transfers asked for from phones.
// <Inbox /> is self-contained (badge, chime, drawer, the I key), so the run-game
// sheet can mount it as well as the DM view.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/requests.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
const MUTE_SLOT = "cf-inbox-muted";
function readMuted() {
    try {
        return localStorage.getItem(MUTE_SLOT) === "1";
    } catch  {
        return false;
    }
}
function writeMuted(v) {
    try {
        localStorage.setItem(MUTE_SLOT, v ? "1" : "0");
    } catch  {}
}
/** Two soft notes. Browsers only allow sound after the page has been clicked once. */ function chime() {
    try {
        const Ctx = window.AudioContext ?? window.webkitAudioContext;
        if (!Ctx) return;
        const ac = new Ctx();
        const t = ac.currentTime;
        [
            880,
            1318.5
        ].forEach((f, i)=>{
            const o = ac.createOscillator();
            const gain = ac.createGain();
            o.type = "sine";
            o.frequency.value = f;
            gain.gain.setValueAtTime(0, t + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.06, t + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.5);
            o.connect(gain).connect(ac.destination);
            o.start(t + i * 0.12);
            o.stop(t + i * 0.12 + 0.55);
        });
        setTimeout(()=>void ac.close(), 1200);
    } catch  {}
}
function isInboxOpen() {
    return typeof document !== "undefined" && !!document.querySelector(".inbox-drawer");
}
function Inbox() {
    const { view } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const pending = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$requests$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pendingRequests"])(view.state);
    const openTasks = view.state.tasks.filter((t)=>!t.done).length;
    const waiting = pending.length + openTasks;
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [muted, setMuted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>setMuted(readMuted()), []);
    // Chime when a new request arrives (never for the ones already waiting on load).
    const seen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const ids = new Set(pending.map((r)=>r.id));
        const before = seen.current;
        seen.current = ids;
        if (!before || muted) return;
        if ([
            ...ids
        ].some((id)=>!before.has(id))) chime();
    }, [
        pending,
        muted
    ]);
    // I opens and closes the inbox.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const onKey = (e)=>{
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === "i" || e.key === "I") {
                e.preventDefault();
                setOpen((o)=>!o);
            }
        };
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: `btn inbox-btn${waiting ? " has" : ""}`,
                "aria-expanded": open,
                onClick: ()=>setOpen((o)=>!o),
                "aria-label": `Requests: ${waiting} waiting`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "key",
                        children: "I"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 94,
                        columnNumber: 9
                    }, this),
                    " Requests",
                    waiting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "badge",
                        children: waiting
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 95,
                        columnNumber: 20
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            open ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(InboxDrawer, {
                pending: pending,
                muted: muted,
                onMute: ()=>{
                    writeMuted(!muted);
                    setMuted(!muted);
                },
                onClose: ()=>setOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 98,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Inbox.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
function InboxDrawer({ pending, muted, onMute, onClose }) {
    const { view, run, call, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const recent = s.requests.filter((r)=>r.status !== "pending").slice(-6).reverse();
    const panel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Esc closes the drawer first, before the DM view (or run sheet) sees it.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        panel.current?.focus();
        const esc = (e)=>{
            if (e.key !== "Escape") return;
            e.preventDefault();
            e.stopImmediatePropagation();
            onClose();
        };
        window.addEventListener("keydown", esc, true);
        return ()=>window.removeEventListener("keydown", esc, true);
    }, [
        onClose
    ]);
    const approveAll = async ()=>{
        const r = await call({
            type: "request.approveAll"
        });
        toast(r.error ?? r.info ?? "Approved.");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "inbox-backdrop",
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: "inbox-drawer",
            role: "dialog",
            "aria-label": "Requests from phones",
            tabIndex: -1,
            ref: panel,
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "box-head",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "Requests"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 140,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "btn small",
                            onClick: onClose,
                            children: [
                                "Close ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "key",
                                    children: "Esc"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/Inbox.tsx",
                                    lineNumber: 142,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 139,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline inbox-settings",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "check",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: !muted,
                                    onChange: onMute
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/Inbox.tsx",
                                    lineNumber: 147,
                                    columnNumber: 13
                                }, this),
                                " Chime"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 146,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "check",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: s.tvPurchases !== false,
                                    onChange: (e)=>run({
                                            type: "game.tvPurchases",
                                            on: e.target.checked
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/Inbox.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this),
                                " Show purchases on the TV"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 145,
                    columnNumber: 9
                }, this),
                pending.length > 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: "btn primary big",
                    onClick: approveAll,
                    children: [
                        "Approve all ",
                        pending.length
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 154,
                    columnNumber: 11
                }, this) : null,
                pending.length === 0 && !s.tasks.some((t)=>!t.done) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "note",
                    children: "Nothing waiting. Requests from phones show up here."
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 158,
                    columnNumber: 66
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "inbox-list",
                    children: pending.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RequestRow, {
                            r: r
                        }, r.id, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 161,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Tasks, {}, void 0, false, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 164,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BoardFlyers, {}, void 0, false, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 165,
                    columnNumber: 9
                }, this),
                recent.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            children: "Recently"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 168,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                            className: "inbox-recent",
                            children: recent.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                r.playerName,
                                                ": ",
                                                describe(r)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/Inbox.tsx",
                                            lineNumber: 172,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: `req-status st-${r.status}`,
                                            children: [
                                                r.status,
                                                r.chargedCp !== undefined && r.kind === "buy" ? ` · ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.chargedCp)}` : ""
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/Inbox.tsx",
                                            lineNumber: 175,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, r.id, true, {
                                    fileName: "[project]/src/client/dm/Inbox.tsx",
                                    lineNumber: 171,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 169,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 167,
                    columnNumber: 11
                }, this) : null
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/Inbox.tsx",
            lineNumber: 138,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/dm/Inbox.tsx",
        lineNumber: 137,
        columnNumber: 5
    }, this);
}
function describe(r) {
    if (r.kind === "give") return `send ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)} to ${r.toPlayerName}`;
    if (r.kind === "contribute") return `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.chargedCp ?? r.totalCp)} toward ${r.itemName}`;
    if (r.flyer) return `flyer “${r.flyer.title}”`;
    return `${r.qty > 1 ? `${r.qty} × ` : ""}${r.itemName}`;
}
function RequestRow({ r }) {
    const { view, call, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const p = s.players.find((x)=>x.id === r.playerId);
    const item = r.itemId ? s.items.find((x)=>x.id === r.itemId) : undefined;
    const shop = item ? s.shops.find((x)=>x.id === item.shopId) : undefined;
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [reason, setReason] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [price, setPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [problem, setProblem] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const service = item?.kind === "service";
    const [answer, setAnswer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [flyer, setFlyer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(r.flyer ?? {
        title: "",
        body: "",
        signedBy: ""
    });
    const approve = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (totalCp, override = false)=>{
        const res = await call({
            type: "request.approve",
            requestId: r.id,
            ...totalCp !== undefined ? {
                totalCp
            } : {},
            ...override ? {
                override: true
            } : {},
            ...answer.trim() ? {
                answer: answer.trim()
            } : {},
            ...r.flyer && flyer.title.trim() ? {
                flyer
            } : {}
        });
        if (res.code === "recheck") return setProblem({
            msg: res.error ?? "",
            totalCp
        });
        if (res.error) return toast(res.error);
        toast(`Approved: ${r.playerName}, ${describe(r)}.`);
    }, [
        call,
        r,
        toast,
        answer,
        flyer
    ]);
    const decline = async ()=>{
        const res = await call({
            type: "request.decline",
            requestId: r.id,
            reason: reason.trim()
        });
        if (res.error) return toast(res.error);
        toast(`Declined: ${r.playerName}, ${describe(r)}.`);
    };
    const newTotal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(price);
    const nowCp = item ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["firstChargeCp"])(s, item) : 0;
    const priceChanged = item && r.kind === "buy" && nowCp !== r.unitCp;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        className: "inbox-req",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inbox-who",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                        children: r.playerName
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 239,
                        columnNumber: 9
                    }, this),
                    r.secret ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tag wax",
                        children: "secret"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 240,
                        columnNumber: 21
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: new Date(r.at).toLocaleTimeString(undefined, {
                            timeStyle: "short"
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 241,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inbox-what",
                children: r.kind === "give" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        "Send ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            className: "purse-amt",
                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 246,
                            columnNumber: 18
                        }, this),
                        " to ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: r.toPlayerName
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 246,
                            columnNumber: 72
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 245,
                    columnNumber: 11
                }, this) : r.kind === "contribute" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        "Put ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            className: "purse-amt",
                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 250,
                            columnNumber: 17
                        }, this),
                        " toward ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: r.itemName
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 250,
                            columnNumber: 75
                        }, this),
                        item ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "note",
                            children: [
                                " ",
                                "(",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(s.stakes.filter((k)=>k.itemId === item.id).reduce((a, k)=>a + k.cp, 0)),
                                " of ",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(item.priceCp),
                                " so far)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 252,
                            columnNumber: 15
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 249,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        r.qty > 1 ? `${r.qty} × ` : "",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: r.itemName
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 261,
                            columnNumber: 13
                        }, this),
                        shop ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "note",
                            children: [
                                " at ",
                                shop.name
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 262,
                            columnNumber: 21
                        }, this) : null,
                        " for ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            className: "purse-amt",
                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp)
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 262,
                            columnNumber: 79
                        }, this),
                        r.qty > 1 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "note",
                            children: [
                                " (",
                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.unitCp),
                                " each)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/Inbox.tsx",
                            lineNumber: 263,
                            columnNumber: 26
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/Inbox.tsx",
                    lineNumber: 259,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 243,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "note",
                children: [
                    p ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            p.name,
                            " has ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "purse-amt",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 270,
                                columnNumber: 26
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 269,
                        columnNumber: 11
                    }, this) : "That player is no longer at the table.",
                    item && item.stock !== null ? ` · ${item.stock} in stock` : ""
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 267,
                columnNumber: 7
            }, this),
            priceChanged ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inbox-warn",
                children: [
                    "The price is now ",
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(nowCp),
                    " each. Approving charges what they saw, unless you set a price."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 277,
                columnNumber: 23
            }, this) : null,
            r.question ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inbox-note",
                children: [
                    item?.prompt ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: [
                            item.prompt,
                            " "
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 280,
                        columnNumber: 27
                    }, this) : null,
                    "“",
                    r.question,
                    "”"
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 279,
                columnNumber: 9
            }, this) : null,
            r.note ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inbox-note",
                children: [
                    "“",
                    r.note,
                    "”"
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 283,
                columnNumber: 17
            }, this) : null,
            item?.finePrint ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "card-fine inbox-fine",
                children: item.finePrint
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 284,
                columnNumber: 26
            }, this) : null,
            item?.dmNote ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "note",
                children: [
                    "Your note: ",
                    item.dmNote
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 285,
                columnNumber: 23
            }, this) : null,
            service && r.flyer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "form",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Flyer title",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: flyer.title,
                                maxLength: 60,
                                onChange: (e)=>setFlyer({
                                        ...flyer,
                                        title: e.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 290,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 288,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Lines",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "fld",
                                rows: 3,
                                value: flyer.body,
                                maxLength: 400,
                                onChange: (e)=>setFlyer({
                                        ...flyer,
                                        body: e.target.value
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 294,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 292,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Signed",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: flyer.signedBy,
                                maxLength: 60,
                                onChange: (e)=>setFlyer({
                                        ...flyer,
                                        signedBy: e.target.value
                                    }),
                                placeholder: r.playerName
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 298,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 296,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 287,
                columnNumber: 9
            }, this) : service ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Your answer (they see it on their phone)",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        className: "fld",
                        rows: 2,
                        value: answer,
                        maxLength: 600,
                        onChange: (e)=>setAnswer(e.target.value),
                        placeholder: "Mags leans in: “The chef? Bought those recipes off a traveling merchant.”"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 304,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 302,
                columnNumber: 9
            }, this) : null,
            problem ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inbox-problem",
                role: "alert",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: problem.msg
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 310,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn danger",
                                onClick: ()=>(setProblem(null), void approve(problem.totalCp, true)),
                                children: "Approve anyway"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 312,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn",
                                onClick: ()=>(setProblem(null), setMode("decline")),
                                children: "Decline"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 315,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn",
                                onClick: ()=>setProblem(null),
                                children: "Not now"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 318,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 311,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 309,
                columnNumber: 9
            }, this) : mode === "decline" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "inline",
                onSubmit: (e)=>{
                    e.preventDefault();
                    void decline();
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "grow",
                        children: [
                            "Reason the player sees (optional)",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                autoFocus: true,
                                value: reason,
                                maxLength: 120,
                                onChange: (e)=>setReason(e.target.value),
                                placeholder: "The smith won't sell to you after last night"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 333,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 331,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        className: "btn primary",
                        children: "Decline"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 335,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: ()=>setMode("idle"),
                        children: "Back"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 338,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 324,
                columnNumber: 9
            }, this) : mode === "price" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "inline",
                onSubmit: (e)=>{
                    e.preventDefault();
                    if (newTotal === null) return toast("Enter the new total, like 8 or 7 gp 5 sp.");
                    void approve(newTotal);
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "grow",
                        children: [
                            "New total (was ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.totalCp),
                            ")",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld amt",
                                autoFocus: true,
                                inputMode: "decimal",
                                value: price,
                                onChange: (e)=>setPrice(e.target.value),
                                placeholder: "8"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 353,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 351,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        className: "btn primary",
                        disabled: newTotal === null,
                        children: [
                            "Approve at ",
                            newTotal === null ? "…" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(newTotal)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 355,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: ()=>setMode("idle"),
                        children: "Back"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 358,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 343,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn primary",
                        onClick: ()=>void approve(),
                        children: r.flyer ? "Pin it up" : service ? answer.trim() ? "Answer and charge" : "Done, charge it" : "Approve"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 364,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: ()=>setMode("decline"),
                        children: "Decline"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 367,
                        columnNumber: 11
                    }, this),
                    r.kind === "buy" && !r.flyer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: ()=>setMode("price"),
                        children: "Different price"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 371,
                        columnNumber: 13
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 363,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Inbox.tsx",
        lineNumber: 237,
        columnNumber: 5
    }, this);
}
/** Your to-do list: record a proficiency, a project funded. */ function Tasks() {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const open = view.state.tasks.filter((t)=>!t.done);
    if (!open.length) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "To do"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 388,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "inbox-list",
                children: open.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "inbox-req inbox-task",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: t.text
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 392,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn small primary",
                                onClick: ()=>run({
                                        type: "task.done",
                                        taskId: t.id,
                                        done: true
                                    }),
                                children: "Done"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 393,
                                columnNumber: 13
                            }, this)
                        ]
                    }, t.id, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 391,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 389,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Inbox.tsx",
        lineNumber: 387,
        columnNumber: 5
    }, this);
}
/** Player flyers: up on the TV notice board until you take them down. */ function BoardFlyers() {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const flyers = view.state.flyers;
    if (!flyers.length) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "On the notice board"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 410,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "inbox-recent",
                children: flyers.slice().reverse().map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: f.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/Inbox.tsx",
                                        lineNumber: 418,
                                        columnNumber: 17
                                    }, this),
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "note",
                                        children: [
                                            "· ",
                                            f.signedBy
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/Inbox.tsx",
                                        lineNumber: 418,
                                        columnNumber: 34
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 417,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "btn small",
                                        onClick: ()=>run({
                                                type: "flyer.update",
                                                flyerId: f.id,
                                                patch: {
                                                    up: !f.up
                                                }
                                            }),
                                        children: f.up ? "Take down" : "Put back up"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/Inbox.tsx",
                                        lineNumber: 421,
                                        columnNumber: 17
                                    }, this),
                                    !f.up ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "btn small danger",
                                        onClick: ()=>run({
                                                type: "flyer.remove",
                                                flyerId: f.id
                                            }),
                                        children: "Throw away"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/Inbox.tsx",
                                        lineNumber: 425,
                                        columnNumber: 19
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/Inbox.tsx",
                                lineNumber: 420,
                                columnNumber: 15
                            }, this)
                        ]
                    }, f.id, true, {
                        fileName: "[project]/src/client/dm/Inbox.tsx",
                        lineNumber: 416,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 411,
                columnNumber: 7
            }, this),
            flyers.filter((f)=>f.up).length > 8 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "The board shows the newest 8."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/Inbox.tsx",
                lineNumber: 433,
                columnNumber: 48
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/Inbox.tsx",
        lineNumber: 409,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/InlineText.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InlineText",
    ()=>InlineText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
function InlineText({ value, placeholder, onCommit, className = "", maxLength, label }) {
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [v, setV] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(value);
    const start = ()=>{
        setV(value);
        setEditing(true);
    };
    if (editing) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            className: "fld inline-input",
            "aria-label": label,
            value: v,
            maxLength: maxLength,
            autoFocus: true,
            onChange: (e)=>setV(e.target.value),
            onBlur: ()=>{
                setEditing(false);
                if (v.trim() !== value.trim()) onCommit(v.trim());
            },
            onKeyDown: (e)=>{
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") {
                    setV(value);
                    setEditing(false);
                }
            }
        }, void 0, false, {
            fileName: "[project]/src/client/dm/InlineText.tsx",
            lineNumber: 30,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        role: "button",
        tabIndex: 0,
        "aria-label": `${label}: ${value || "empty"}. Click to edit.`,
        className: `inline-text ${className}${value ? "" : " empty"}`,
        onClick: start,
        onKeyDown: (e)=>{
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                start();
            }
        },
        children: value || placeholder
    }, void 0, false, {
        fileName: "[project]/src/client/dm/InlineText.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/InspireToggle.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InspireToggle",
    ()=>InspireToggle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function InspireToggle({ playerId, name, on, compact }) {
    const { run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const [pending, setPending] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (pending !== null && pending === on) setPending(null);
    }, [
        on,
        pending
    ]);
    const shown = pending ?? on;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        className: `btn small insp-btn${shown ? " on" : ""}`,
        "aria-pressed": shown,
        "aria-label": `Heroic Inspiration for ${name}`,
        title: shown ? `${name} has Heroic Inspiration. Tap when it's spent.` : `Give ${name} Heroic Inspiration`,
        onClick: async ()=>{
            const next = !shown;
            setPending(next);
            if (!await run({
                type: "player.inspire",
                playerId,
                on: next
            })) setPending(null);
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InspirationIcon"], {
                size: 20
            }, void 0, false, {
                fileName: "[project]/src/client/dm/InspireToggle.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            compact ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: shown ? "Inspired" : "Inspiration"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/InspireToggle.tsx",
                lineNumber: 29,
                columnNumber: 25
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/InspireToggle.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/ItemExtras.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ContributeBox",
    ()=>ContributeBox,
    "GrantBox",
    ()=>GrantBox,
    "KindFields",
    ()=>KindFields,
    "RunningBox",
    ()=>RunningBox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// DM shop tools for the progression shop: what kind of item it is, its
// effects, granting Earned items, chipping in to projects, and what's running.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Check.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
function KindFields({ it, patch }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "inline-label",
                        children: [
                            "Category",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: it.category,
                                onChange: (e)=>patch({
                                        category: e.target.value
                                    }),
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORIES"].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: c.id,
                                        children: c.label
                                    }, c.id, false, {
                                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                        lineNumber: 25,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                lineNumber: 23,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                        lineNumber: 21,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "inline-label",
                        children: [
                            "Type",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: it.kind,
                                onChange: (e)=>patch({
                                        kind: e.target.value
                                    }),
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KINDS"].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: k.id,
                                        children: k.label
                                    }, k.id, false, {
                                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                        lineNumber: 35,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 20,
                columnNumber: 7
            }, this),
            it.kind === "training" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                label: "Paid in how many lessons (one per session)",
                type: "number",
                value: String(it.installments ?? 1),
                onCommit: (v)=>{
                    const n = Number(v);
                    if (!Number.isInteger(n) || n < 1 || n > 20) return false;
                    void patch({
                        installments: n
                    });
                }
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 43,
                columnNumber: 9
            }, this) : null,
            it.kind === "service" || it.kind === "training" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                label: "Ask the player (leave blank for nothing)",
                value: it.prompt ?? "",
                placeholder: "e.g. Which language or tool?",
                onCommit: (v)=>patch({
                        prompt: v
                    })
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this) : null,
            it.kind === "service" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                checked: !!it.flyer,
                onChange: (v)=>patch({
                        flyer: v
                    }),
                children: "The player writes a flyer for the notice board"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 58,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                checked: !!it.keep,
                onChange: (v)=>patch({
                        keep: v
                    }),
                children: "Goes on the buyer’s page once bought (a trophy, a title, a house)"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                label: "Tags (for discounts; commas between)",
                value: (it.tags ?? []).join(", "),
                placeholder: "e.g. armor, potion",
                onCommit: (v)=>patch({
                        tags: v.split(",").map((t)=>t.trim()).filter(Boolean)
                    })
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EffectsEditor, {
                it: it,
                patch: patch
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ItemExtras.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
const EFFECT_LABEL = {
    unlock: "Unlock an item or storefront",
    discount: "Discount",
    income: "Income each session",
    credit: "Credit line (a tab)"
};
function blankEffect(type) {
    if (type === "unlock") return {
        type
    };
    if (type === "discount") return {
        type,
        pct: 10,
        category: "healing"
    };
    if (type === "income") return {
        type,
        dice: "1d6",
        unitCp: 100
    };
    return {
        type,
        limitCp: 1000
    };
}
/** What buying (or funding) it does. Only you see this. */ function EffectsEditor({ it, patch }) {
    const { view } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const effects = it.effects ?? [];
    const set = (i, e)=>patch({
            effects: effects.map((x, k)=>k === i ? e : x)
        });
    const on = !!s.effectsOn[it.id];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("fieldset", {
        className: "form",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("legend", {
                children: [
                    "Effects (only you see these)",
                    on ? " · live now" : ""
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            effects.map((e, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "effect-row",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            children: EFFECT_LABEL[e.type]
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this),
                        e.type === "unlock" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "fld",
                                    value: e.itemId ?? "",
                                    onChange: (ev)=>set(i, {
                                            ...e,
                                            itemId: ev.target.value || undefined
                                        }),
                                    "aria-label": "Item to unlock",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "No item"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 103,
                                            columnNumber: 17
                                        }, this),
                                        s.items.filter((x)=>x.id !== it.id).map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: x.id,
                                                children: x.name
                                            }, x.id, false, {
                                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                                lineNumber: 107,
                                                columnNumber: 21
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 102,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "fld",
                                    value: e.shopId ?? "",
                                    onChange: (ev)=>set(i, {
                                            ...e,
                                            shopId: ev.target.value || undefined
                                        }),
                                    "aria-label": "Storefront to open",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "No storefront"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 113,
                                            columnNumber: 17
                                        }, this),
                                        s.shops.map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: x.id,
                                                children: [
                                                    "Open ",
                                                    x.name
                                                ]
                                            }, x.id, true, {
                                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                                lineNumber: 115,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 112,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 101,
                            columnNumber: 13
                        }, this) : null,
                        e.type === "discount" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld amt",
                                    type: "number",
                                    min: 1,
                                    max: 50,
                                    value: e.pct,
                                    "aria-label": "Percent off",
                                    onChange: (ev)=>set(i, {
                                            ...e,
                                            pct: Math.max(1, Math.min(50, Number(ev.target.value) || 1))
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 124,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "% off"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 125,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                    className: "fld",
                                    value: e.category ?? "",
                                    onChange: (ev)=>set(i, {
                                            ...e,
                                            category: ev.target.value || undefined
                                        }),
                                    "aria-label": "Category",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: "",
                                            children: "No category"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 127,
                                            columnNumber: 17
                                        }, this),
                                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORIES"].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: c.id,
                                                children: c.label
                                            }, c.id, false, {
                                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                                lineNumber: 129,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 126,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld",
                                    value: e.tag ?? "",
                                    placeholder: "or a tag",
                                    "aria-label": "Tag",
                                    onChange: (ev)=>set(i, {
                                            ...e,
                                            tag: ev.target.value || undefined
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 134,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 123,
                            columnNumber: 13
                        }, this) : null,
                        e.type === "income" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld amt",
                                    value: e.dice,
                                    "aria-label": "Dice",
                                    onChange: (ev)=>set(i, {
                                            ...e,
                                            dice: ev.target.value
                                        })
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 139,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 140,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld amt",
                                    defaultValue: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cpToGpInput"])(e.unitCp),
                                    "aria-label": "Each point is worth (gp)",
                                    onBlur: (ev)=>{
                                        const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(ev.target.value);
                                        if (cp !== null) void set(i, {
                                            ...e,
                                            unitCp: cp
                                        });
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "gp, split by share"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 150,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 138,
                            columnNumber: 13
                        }, this) : null,
                        e.type === "credit" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "up to"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 155,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    className: "fld amt",
                                    defaultValue: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cpToGpInput"])(e.limitCp),
                                    "aria-label": "Credit limit (gp)",
                                    onBlur: (ev)=>{
                                        const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(ev.target.value);
                                        if (cp !== null) void set(i, {
                                            ...e,
                                            limitCp: cp
                                        });
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 156,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "gp, at this storefront"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 165,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 154,
                            columnNumber: 13
                        }, this) : null,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "btn small",
                            onClick: ()=>patch({
                                    effects: effects.filter((_, k)=>k !== i)
                                }),
                            children: "Remove"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 168,
                            columnNumber: 11
                        }, this)
                    ]
                }, i, true, {
                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "inline-label",
                children: [
                    "Add an effect",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "fld",
                        value: "",
                        onChange: (ev)=>{
                            if (ev.target.value) void patch({
                                effects: [
                                    ...effects,
                                    blankEffect(ev.target.value)
                                ]
                            });
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "Choose…"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                lineNumber: 182,
                                columnNumber: 11
                            }, this),
                            Object.keys(EFFECT_LABEL).map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: t,
                                    children: EFFECT_LABEL[t]
                                }, t, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 184,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                        lineNumber: 175,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 173,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "For what it means for the story later (allies, favors), use the DM note."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 190,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ItemExtras.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
function ContributeBox({ it, onDone }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const players = view.state.players.filter((p)=>!p.archived);
    const [who, setWho] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(players[0]?.id ?? "");
    const [amt, setAmt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(amt);
    const left = Math.max(0, it.priceCp - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["raisedCp"])(view.state, it.id));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        className: "buyers",
        onSubmit: async (e)=>{
            e.preventDefault();
            if (!cp || !who) return;
            if (await run({
                type: "project.contribute",
                playerId: who,
                itemId: it.id,
                amountCp: cp
            }, `Put ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(Math.min(cp, left))} toward ${it.name}.`)) onDone();
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                className: "fld",
                value: who,
                onChange: (e)=>setWho(e.target.value),
                "aria-label": "Who's putting gold in?",
                children: players.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: p.id,
                        children: [
                            p.name,
                            " (",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp),
                            ")"
                        ]
                    }, p.id, true, {
                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                        lineNumber: 214,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                className: "fld amt",
                inputMode: "decimal",
                value: amt,
                onChange: (e)=>setAmt(e.target.value),
                placeholder: `up to ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cpToGpInput"])(left)}`,
                "aria-label": "How much (gp)"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 219,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn small primary",
                type: "submit",
                disabled: !cp,
                children: "Put it in"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 220,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn small",
                type: "button",
                onClick: onDone,
                children: "Cancel"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ItemExtras.tsx",
        lineNumber: 204,
        columnNumber: 5
    }, this);
}
function GrantBox({ it, onDone }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const players = view.state.players.filter((p)=>!p.archived);
    const [picked, setPicked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [note, setNote] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        className: "buyers",
        onSubmit: async (e)=>{
            e.preventDefault();
            if (!picked.length) return;
            if (await run({
                type: "award.grant",
                itemId: it.id,
                playerIds: picked,
                note
            }, `Granted ${it.name}.`)) onDone();
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "checks",
                children: players.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "check",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: picked.includes(p.id),
                                onChange: (e)=>setPicked(e.target.checked ? [
                                        ...picked,
                                        p.id
                                    ] : picked.filter((x)=>x !== p.id))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                lineNumber: 248,
                                columnNumber: 13
                            }, this),
                            p.name
                        ]
                    }, p.id, true, {
                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                        lineNumber: 247,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                className: "fld",
                value: note,
                maxLength: 200,
                onChange: (e)=>setNote(e.target.value),
                placeholder: "Why (they see it), e.g. Best tale on Tale Night"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 253,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn small primary",
                type: "submit",
                disabled: !picked.length,
                children: "Grant"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 254,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn small",
                type: "button",
                onClick: onDone,
                children: "Cancel"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 257,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ItemExtras.tsx",
        lineNumber: 237,
        columnNumber: 5
    }, this);
}
function RunningBox() {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const name = (id)=>s.players.find((p)=>p.id === id)?.name ?? "someone who left";
    const rentals = s.rentals.filter((r)=>r.active);
    const lessons = s.trainings.filter((t)=>!t.done && !t.cancelled);
    const live = s.items.filter((i)=>s.effectsOn[i.id] && i.effects?.length);
    if (!rentals.length && !lessons.length && !s.awards.length && !live.length) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Rentals, lessons and honours"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 275,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "orders",
                children: [
                    rentals.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: r.itemName
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 280,
                                            columnNumber: 15
                                        }, this),
                                        ": ",
                                        name(r.playerId),
                                        " · ",
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(r.monthlyCp),
                                        " a session · paid through session ",
                                        r.paidThrough
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 279,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn small",
                                    type: "button",
                                    onClick: ()=>run({
                                            type: "rental.cancel",
                                            rentalId: r.id
                                        }, `${r.itemName} is no longer rented.`),
                                    children: "End rental"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 282,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, r.id, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 278,
                            columnNumber: 11
                        }, this)),
                    lessons.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: t.itemName
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 290,
                                            columnNumber: 15
                                        }, this),
                                        t.what ? ` (${t.what})` : "",
                                        ": ",
                                        name(t.playerId),
                                        " · ",
                                        t.paid,
                                        " of ",
                                        t.of,
                                        " paid"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 289,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn small",
                                    type: "button",
                                    onClick: ()=>confirm(`Stop ${name(t.playerId)}'s lessons? Nothing is refunded.`) && void run({
                                            type: "training.cancel",
                                            trainingId: t.id
                                        }, "Lessons stopped."),
                                    children: "Stop lessons"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 293,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, t.id, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 288,
                            columnNumber: 11
                        }, this)),
                    s.awards.map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "earned-badge",
                                            children: "Earned"
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 301,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                            children: a.itemName
                                        }, void 0, false, {
                                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                            lineNumber: 301,
                                            columnNumber: 60
                                        }, this),
                                        ": ",
                                        a.playerIds.map(name).join(", "),
                                        a.note ? ` · ${a.note}` : ""
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 300,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "btn small",
                                    type: "button",
                                    onClick: ()=>confirm(`Take back ${a.itemName}?`) && void run({
                                            type: "award.revoke",
                                            awardId: a.id
                                        }),
                                    children: "Take back"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                    lineNumber: 304,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, a.id, true, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 299,
                            columnNumber: 11
                        }, this)),
                    live.map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "Live: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: i.name
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                        lineNumber: 312,
                                        columnNumber: 21
                                    }, this),
                                    " · ",
                                    (i.effects ?? []).map((e)=>EFFECT_LABEL[e.type].toLowerCase()).join(", ")
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                                lineNumber: 311,
                                columnNumber: 13
                            }, this)
                        }, i.id, false, {
                            fileName: "[project]/src/client/dm/ItemExtras.tsx",
                            lineNumber: 310,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ItemExtras.tsx",
                lineNumber: 276,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ItemExtras.tsx",
        lineNumber: 274,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/LiveMapControls.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LiveMapControls",
    ()=>LiveMapControls,
    "describeLink",
    ()=>describeLink
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/projection.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/MapView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function describeLink(link, s) {
    if (link.kind === "shop") {
        const sh = s.shops.find((x)=>x.id === link.shopId);
        return sh ? {
            label: `Open ${sh.name}`,
            cmd: {
                type: "live.shop",
                open: true,
                shopId: sh.id
            }
        } : null;
    }
    const sc = s.scenes.find((x)=>x.id === link.sceneId);
    if (!sc) return null;
    return {
        label: sc.kind === "portrait" ? `Show ${sc.name || sc.label}` : `Open ${sc.label}`,
        cmd: {
            type: "scene.show",
            sceneId: sc.id
        }
    };
}
function LiveMapControls({ scene }) {
    const { view, run, openMap } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const m = scene.map;
    const pins = [
        ...m.pins
    ].sort((a, b)=>a.number - b.number);
    const focusId = s.live.focus?.pinId;
    const focused = pins.find((p)=>p.id === focusId);
    const link = focused?.link ? describeLink(focused.link, s) : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "live-map",
        "aria-label": "Locations on this map",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "live-map-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn small${m.legendOn ? " on" : ""}`,
                        "aria-pressed": m.legendOn,
                        onClick: ()=>run({
                                type: "map.legend",
                                sceneId: scene.id,
                                on: !m.legendOn
                            }),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "key",
                                children: "L"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 34,
                                columnNumber: 11
                            }, this),
                            " Legend"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "inline-label",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Legend style"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: m.legendStyle,
                                onChange: (e)=>run({
                                        type: "map.legend",
                                        sceneId: scene.id,
                                        style: e.target.value
                                    }),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "names",
                                        children: "Numbers and names"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                        lineNumber: 39,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "numbers",
                                        children: "Numbers only"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                        lineNumber: 40,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    focused ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn small",
                        onClick: ()=>run({
                                type: "live.focus",
                                pinId: null
                            }),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "key",
                                children: "Esc"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 45,
                                columnNumber: 13
                            }, this),
                            " Zoom out"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                        lineNumber: 44,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "spacer"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn small",
                        onClick: ()=>openMap(scene.id),
                        children: "Edit map"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            link ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "btn primary live-map-link",
                onClick: ()=>run(link.cmd),
                children: link.label
            }, void 0, false, {
                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                lineNumber: 54,
                columnNumber: 9
            }, this) : null,
            pins.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                children: pins.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `${p.id === focusId ? "focused" : ""}${p.discovered ? "" : " hidden-row"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Seal"], {
                                label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p),
                                className: p.discovered ? "" : "hidden-pin"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 62,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "live-map-name",
                                disabled: !p.discovered,
                                "aria-pressed": p.id === focusId,
                                title: p.discovered ? p.id === focusId ? "Tap again to zoom back out" : "Zoom the TV to this location" : "Hidden: reveal it first",
                                onClick: ()=>run({
                                        type: "live.focus",
                                        pinId: p.id === focusId ? null : p.id
                                    }),
                                children: [
                                    p.name || "Unnamed",
                                    p.type ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: p.type
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                        lineNumber: 72,
                                        columnNumber: 27
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 63,
                                columnNumber: 15
                            }, this),
                            p.discovered ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "btn small",
                                onClick: ()=>run({
                                        type: "pin.discover",
                                        sceneId: scene.id,
                                        pinId: p.id,
                                        discovered: false,
                                        announce: false
                                    }, `${p.name || "It"} is hidden again.`),
                                children: "Hide"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 75,
                                columnNumber: 17
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "btn small primary",
                                        title: "Shows “Discovered: …” on the TV",
                                        onClick: ()=>run({
                                                type: "pin.discover",
                                                sceneId: scene.id,
                                                pinId: p.id,
                                                discovered: true,
                                                announce: true
                                            }),
                                        children: "Reveal"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                        lineNumber: 80,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "btn small",
                                        title: "Appears on the map without a banner",
                                        onClick: ()=>run({
                                                type: "pin.discover",
                                                sceneId: scene.id,
                                                pinId: p.id,
                                                discovered: true,
                                                announce: false
                                            }),
                                        children: "Quietly"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                        lineNumber: 83,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                                lineNumber: 79,
                                columnNumber: 17
                            }, this)
                        ]
                    }, p.id, true, {
                        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                        lineNumber: 61,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                lineNumber: 59,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "No locations yet. Press Edit map to place some."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/LiveMapControls.tsx",
                lineNumber: 92,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/LiveMapControls.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/MapEditor.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapEditor",
    ()=>MapEditor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$mapGeometry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/mapGeometry.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/projection.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/reducer.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/MapView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/SceneView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Check.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InlineText$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/InlineText.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$upload$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/upload.ts [app-ssr] (ecmascript)");
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
;
;
;
const NUDGE = 0.002;
const NUDGE_BIG = 0.01;
function MapEditor({ sceneId, onClose }) {
    const { view } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const scene = view.state.scenes.find((x)=>x.id === sceneId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!scene || scene.kind !== "map") onClose();
    }, [
        scene,
        onClose
    ]);
    if (!scene || scene.kind !== "map") return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Editor, {
        scene: scene,
        onClose: onClose
    }, void 0, false, {
        fileName: "[project]/src/client/dm/MapEditor.tsx",
        lineNumber: 34,
        columnNumber: 10
    }, this);
}
const clamp01 = (v)=>Math.min(1, Math.max(0, v));
const newPinId = ()=>"pin" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function fullPin(p) {
    return {
        id: p.id,
        number: p.number,
        discovered: p.discovered,
        showsAs: p.showsAs,
        name: p.name,
        type: p.type,
        description: p.description,
        dmNotes: p.dmNotes,
        x: p.x,
        y: p.y,
        ...p.link ? {
            link: p.link
        } : {}
    };
}
function Editor({ scene, onClose }) {
    const { run, ident, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const pins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>[
            ...scene.map?.pins ?? []
        ].sort((a, b)=>a.number - b.number), [
        scene.map
    ]);
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [selectedId, setSelectedId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    /** Where pins are on this screen while a drag or nudge is on its way to the server. */ const [moves, setMoves] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const undo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [undoCount, setUndoCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const outer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const boxEl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const file = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const src = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["artSrc"])(scene.art) ?? undefined;
    const { size, box, onLoad } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMapBox"])(outer, src);
    const sealPx = Math.round(Math.max(24, Math.min(46, Math.min(size.w, size.h) * 0.06)));
    const selected = pins.find((p)=>p.id === selectedId) ?? null;
    const sceneId = scene.id;
    // Forget a local position once the server agrees (or the pin is gone).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMoves((m)=>{
            let changed = false;
            const out = {
                ...m
            };
            for (const id of Object.keys(m)){
                const p = pins.find((x)=>x.id === id);
                if (!p || Math.abs(p.x - m[id].x) < 1e-6 && Math.abs(p.y - m[id].y) < 1e-6) {
                    delete out[id];
                    changed = true;
                }
            }
            return changed ? out : m;
        });
    }, [
        pins
    ]);
    const pushUndo = (cmd, what)=>{
        undo.current.push({
            cmd,
            what
        });
        if (undo.current.length > 100) undo.current.shift();
        setUndoCount(undo.current.length);
    };
    const doUndo = async ()=>{
        flushNudge();
        const step = undo.current.pop();
        setUndoCount(undo.current.length);
        if (!step) return;
        if (step.cmd.type === "pin.update" && step.cmd.patch.x !== undefined && step.cmd.patch.y !== undefined) {
            const { pinId, patch } = step.cmd;
            setMoves((m)=>({
                    ...m,
                    [pinId]: {
                        x: patch.x,
                        y: patch.y
                    }
                }));
        }
        if (await run(step.cmd)) toast(`Undone: ${step.what}.`);
    };
    const posOf = (p)=>moves[p.id] ?? p;
    const edit = (p, patch, what)=>{
        const old = {};
        for (const k of Object.keys(patch)){
            if (k === "link") old.link = p.link ?? null;
            else old[k] = p[k];
        }
        pushUndo({
            type: "pin.update",
            sceneId,
            pinId: p.id,
            patch: old
        }, what);
        return run({
            type: "pin.update",
            sceneId,
            pinId: p.id,
            patch
        });
    };
    const addAt = async (x, y)=>{
        const pinId = newPinId();
        const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lowestFreeNumber"])(pins);
        if (await run({
            type: "pin.add",
            sceneId,
            pinId,
            x,
            y
        })) {
            pushUndo({
                type: "pin.remove",
                sceneId,
                pinId
            }, `add ${n}`);
            setSelectedId(pinId);
        }
    };
    const remove = async (p)=>{
        if (await run({
            type: "pin.remove",
            sceneId,
            pinId: p.id
        })) {
            pushUndo({
                type: "pin.restore",
                sceneId,
                pin: fullPin(p)
            }, `delete ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}`);
            setSelectedId(null);
            toast(`Removed ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}${p.name ? ` (${p.name})` : ""}. Ctrl+Z brings it back.`);
        }
    };
    const setDiscovered = (p, v)=>{
        pushUndo({
            type: "pin.discover",
            sceneId,
            pinId: p.id,
            discovered: !v,
            announce: false
        }, v ? "discover" : "hide");
        return run({
            type: "pin.discover",
            sceneId,
            pinId: p.id,
            discovered: v,
            announce: false
        });
    };
    // ---------- pointer ----------
    const fracAt = (clientX, clientY)=>{
        const r = boxEl.current.getBoundingClientRect();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$mapGeometry$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pixelsToPin"])(clientX - r.left, clientY - r.top, r.width, r.height);
    };
    const drag = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [draggingId, setDraggingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const onSealDown = (e, p)=>{
        e.stopPropagation();
        if (!editing || e.button !== 0) {
            setSelectedId(p.id);
            return;
        }
        flushNudge();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = {
            id: p.id,
            sx: e.clientX,
            sy: e.clientY,
            moved: false,
            orig: {
                x: p.x,
                y: p.y
            }
        };
    };
    const onSealMove = (e)=>{
        const d = drag.current;
        if (!d) return;
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
        if (!d.moved) setDraggingId(d.id);
        d.moved = true;
        const pos = fracAt(e.clientX, e.clientY);
        setMoves((m)=>({
                ...m,
                [d.id]: pos
            }));
    };
    const onSealUp = (e, p)=>{
        const d = drag.current;
        drag.current = null;
        setDraggingId(null);
        if (!d) return;
        setSelectedId(d.id);
        if (!d.moved) return;
        const pos = fracAt(e.clientX, e.clientY);
        setMoves((m)=>({
                ...m,
                [d.id]: pos
            }));
        pushUndo({
            type: "pin.update",
            sceneId,
            pinId: d.id,
            patch: d.orig
        }, `move ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}`);
        void run({
            type: "pin.update",
            sceneId,
            pinId: d.id,
            patch: pos
        });
    };
    // ---------- nudging with the arrow keys ----------
    const nudging = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    function flushNudge() {
        const n = nudging.current;
        if (!n) return;
        clearTimeout(n.timer);
        nudging.current = null;
        const p = pins.find((x)=>x.id === n.id);
        pushUndo({
            type: "pin.update",
            sceneId,
            pinId: n.id,
            patch: n.orig
        }, `nudge ${p ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p) : "pin"}`);
        void run({
            type: "pin.update",
            sceneId,
            pinId: n.id,
            patch: n.pos
        });
    }
    const nudge = (p, dx, dy, big)=>{
        if (nudging.current && nudging.current.id !== p.id) flushNudge();
        const step = big ? NUDGE_BIG : NUDGE;
        const cur = nudging.current?.pos ?? posOf(p);
        const pos = {
            x: Math.round(clamp01(cur.x + dx * step) * 10000) / 10000,
            y: Math.round(clamp01(cur.y + dy * step) * 10000) / 10000
        };
        setMoves((m)=>({
                ...m,
                [p.id]: pos
            }));
        if (nudging.current) clearTimeout(nudging.current.timer);
        nudging.current = {
            id: p.id,
            orig: nudging.current?.orig ?? {
                x: p.x,
                y: p.y
            },
            pos,
            timer: setTimeout(flushNudge, 450)
        };
    };
    // ---------- keys (captured, so the DM view's own arrows and Esc don't also fire) ----------
    const keyHandler = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(()=>{});
    keyHandler.current = (e)=>{
        const t = e.target;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
        const stop = ()=>{
            e.preventDefault();
            e.stopImmediatePropagation();
        };
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
            stop();
            void doUndo();
            return;
        }
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const dirs = {
            ArrowLeft: [
                -1,
                0
            ],
            ArrowRight: [
                1,
                0
            ],
            ArrowUp: [
                0,
                -1
            ],
            ArrowDown: [
                0,
                1
            ]
        };
        if (dirs[e.key]) {
            // Arrows never switch scenes while the editor is open.
            stop();
            if (editing && selected) nudge(selected, dirs[e.key][0], dirs[e.key][1], e.shiftKey);
            return;
        }
        if ((e.key === "Delete" || e.key === "Backspace") && editing && selected) {
            stop();
            void remove(selected);
            return;
        }
        if (e.key === "Escape") {
            stop();
            if (selected) setSelectedId(null);
            else close();
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const on = (e)=>keyHandler.current(e);
        window.addEventListener("keydown", on, true);
        return ()=>window.removeEventListener("keydown", on, true);
    }, []);
    const close = ()=>{
        flushNudge();
        onClose();
    };
    const onFile = async (f)=>{
        if (!f) return;
        setBusy(true);
        try {
            const url = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$upload$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uploadImage"])(ident, f);
            if (await run({
                type: "scene.update",
                sceneId,
                patch: {
                    art: {
                        url
                    }
                }
            })) toast("Map image saved. Your pins stay where they were on it.");
        } catch (err) {
            toast(err instanceof Error ? err.message : String(err));
        } finally{
            setBusy(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "map-editor-overlay",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `Edit map: ${scene.label}`,
        onDragOver: (e)=>e.preventDefault(),
        onDrop: (e)=>{
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-editor-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: scene.label
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 273,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn${editing ? " on" : ""}`,
                        "aria-pressed": editing,
                        onClick: ()=>setEditing(!editing),
                        children: [
                            "Edit mode ",
                            editing ? "on" : "off"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: ()=>void addAt(0.5, 0.5),
                        title: "Puts the next free number in the middle; drag it into place",
                        children: "Add number"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 277,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        disabled: !undoCount,
                        onClick: ()=>void doUndo(),
                        title: "Ctrl+Z",
                        children: "Undo"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        disabled: busy,
                        onClick: ()=>file.current?.click(),
                        children: busy ? "Uploading…" : src ? "Replace image" : "Upload image"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 283,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        ref: file,
                        type: "file",
                        accept: "image/*",
                        hidden: true,
                        onChange: (e)=>void onFile(e.target.files?.[0])
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 286,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "spacer"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 287,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn",
                        onClick: ()=>run({
                                type: "scene.show",
                                sceneId
                            }, "On the TV."),
                        children: "Show on TV"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 288,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: "btn primary",
                        onClick: close,
                        children: "Done"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 291,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 272,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: [
                    editing ? "Click the map to drop a pin. Drag pins to move them; arrows nudge the selected pin (Shift for bigger steps); Delete removes it; Ctrl+Z undoes." : "Edit mode is off: clicking a pin selects it without moving anything.",
                    " ",
                    "Hidden pins are faded and dashed; only discovered ones reach the TV."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 295,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "map-editor-body",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: outer,
                        className: `map-canvas${editing ? " map-edit" : ""}`,
                        style: {
                            "--seal": `${sealPx}px`
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: boxEl,
                            className: "map-box",
                            style: {
                                left: box.left,
                                top: box.top,
                                width: box.width,
                                height: box.height
                            },
                            onClick: (e)=>{
                                if (!editing || e.target.closest(".seal")) return;
                                const pos = fracAt(e.clientX, e.clientY);
                                void addAt(pos.x, pos.y);
                            },
                            children: [
                                src ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                    className: "map-img",
                                    src: src,
                                    alt: scene.alt ?? "",
                                    onLoad: onLoad,
                                    draggable: false
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/MapEditor.tsx",
                                    lineNumber: 315,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "map-empty",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: [
                                            "No image yet. Upload the map (or drop it here).",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                                lineNumber: 320,
                                                columnNumber: 19
                                            }, this),
                                            "Pins keep their spot as a fraction of the image."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                                        lineNumber: 318,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/MapEditor.tsx",
                                    lineNumber: 317,
                                    columnNumber: 15
                                }, this),
                                pins.map((p)=>{
                                    const pos = posOf(p);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Seal"], {
                                        label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p),
                                        className: `${p.discovered ? "" : "hidden-pin"}${p.id === selectedId ? " selected" : ""}${p.id === draggingId ? " dragging" : ""}`,
                                        style: {
                                            left: `${pos.x * 100}%`,
                                            top: `${pos.y * 100}%`,
                                            transform: "translate(-50%, -50%)"
                                        },
                                        role: "button",
                                        tabIndex: 0,
                                        "aria-label": `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}: ${p.name || "unnamed"}${p.discovered ? "" : " (hidden)"}`,
                                        "aria-pressed": p.id === selectedId,
                                        onPointerDown: (e)=>onSealDown(e, p),
                                        onPointerMove: onSealMove,
                                        onPointerUp: (e)=>onSealUp(e, p),
                                        onPointerCancel: ()=>{
                                            drag.current = null;
                                            setDraggingId(null);
                                        },
                                        onClick: (e)=>e.stopPropagation(),
                                        onKeyDown: (e)=>{
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setSelectedId(p.id);
                                            }
                                        }
                                    }, p.id, false, {
                                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                                        lineNumber: 328,
                                        columnNumber: 17
                                    }, this);
                                })
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/MapEditor.tsx",
                            lineNumber: 304,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 303,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        className: "pin-side box",
                        "aria-label": "Selected location",
                        children: selected ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PinFields, {
                            scene: scene,
                            pin: selected,
                            edit: edit,
                            setDiscovered: setDiscovered,
                            remove: remove
                        }, selected.id, false, {
                            fileName: "[project]/src/client/dm/MapEditor.tsx",
                            lineNumber: 359,
                            columnNumber: 13
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: editing ? "Select a pin to edit it, or click the map to drop a new one." : "Select a pin to edit it."
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/MapEditor.tsx",
                            lineNumber: 361,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 357,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 302,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "pin-list",
                "aria-label": "Locations",
                children: pins.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `${p.id === selectedId ? "selected" : ""}${p.discovered ? "" : " hidden-row"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Seal"], {
                                label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p),
                                className: p.discovered ? "" : "hidden-pin",
                                onClick: ()=>setSelectedId(p.id),
                                role: "button",
                                "aria-label": `Select ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}`
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 369,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InlineText$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InlineText"], {
                                label: "Type",
                                className: "type",
                                value: p.type,
                                placeholder: "type",
                                maxLength: 40,
                                onCommit: (v)=>edit(p, {
                                        type: v
                                    }, `type of ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}`)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 370,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InlineText$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InlineText"], {
                                label: "Name",
                                className: "name",
                                value: p.name,
                                placeholder: "Name this place",
                                maxLength: 120,
                                onCommit: (v)=>edit(p, {
                                        name: v
                                    }, `name of ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}`)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 371,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InlineText$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InlineText"], {
                                label: "Description",
                                value: p.description,
                                placeholder: "A line players can read",
                                maxLength: 600,
                                onCommit: (v)=>edit(p, {
                                        description: v
                                    }, `description of ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(p)}`)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 372,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                checked: p.discovered,
                                onChange: (v)=>setDiscovered(p, v),
                                children: p.discovered ? "Discovered" : "Hidden"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 373,
                                columnNumber: 13
                            }, this)
                        ]
                    }, p.id, true, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 368,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 366,
                columnNumber: 7
            }, this),
            !pins.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "No locations yet. Click the map or press Add number."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 379,
                columnNumber: 23
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/MapEditor.tsx",
        lineNumber: 261,
        columnNumber: 5
    }, this);
}
function PinFields({ scene, pin, edit, setDiscovered, remove }) {
    const { view } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$projection$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sealText"])(pin);
    const linkValue = pin.link ? pin.link.kind === "shop" ? `shop:${pin.link.shopId}` : `scene:${pin.link.sceneId}` : "";
    const portraits = s.scenes.filter((x)=>x.kind === "portrait");
    const maps = s.scenes.filter((x)=>x.kind === "map" && x.id !== scene.id);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "form",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pin-side-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$MapView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Seal"], {
                        label: label,
                        className: pin.discovered ? "" : "hidden-pin"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 407,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: pin.name || `Location ${pin.number}`
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 408,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 406,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Shows as",
                        value: pin.showsAs,
                        placeholder: String(pin.number),
                        hint: "Up to 4 characters",
                        onCommit: (v)=>v.length > 4 ? false : edit(pin, {
                                showsAs: v
                            }, `seal of ${label}`)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 411,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Type",
                        value: pin.type,
                        placeholder: "tavern, temple, danger…",
                        onCommit: (v)=>edit(pin, {
                                type: v
                            }, `type of ${label}`)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 412,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 410,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                label: "Name",
                value: pin.name,
                placeholder: "The Flickering Candle",
                onCommit: (v)=>edit(pin, {
                        name: v
                    }, `name of ${label}`)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 414,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                label: "Description (players can read this on the TV)",
                value: pin.description,
                multiline: true,
                onCommit: (v)=>edit(pin, {
                        description: v
                    }, `description of ${label}`)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 415,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                label: "DM notes (only you see these)",
                value: pin.dmNotes,
                multiline: true,
                onCommit: (v)=>edit(pin, {
                        dmNotes: v
                    }, `notes of ${label}`)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 416,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                checked: pin.discovered,
                onChange: (v)=>setDiscovered(pin, v),
                children: "Discovered (shown on the TV)"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 417,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                children: [
                    "Link",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        className: "fld",
                        value: linkValue,
                        onChange: (e)=>{
                            const v = e.target.value;
                            const link = !v ? null : v.startsWith("shop:") ? {
                                kind: "shop",
                                shopId: v.slice(5)
                            } : {
                                kind: "scene",
                                sceneId: v.slice(6)
                            };
                            void edit(pin, {
                                link
                            }, `link of ${label}`);
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "",
                                children: "None"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 431,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("optgroup", {
                                label: "Open a shop on the TV",
                                children: s.shops.map((sh)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: `shop:${sh.id}`,
                                        children: sh.name
                                    }, sh.id, false, {
                                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                                        lineNumber: 434,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 432,
                                columnNumber: 11
                            }, this),
                            portraits.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("optgroup", {
                                label: "Show an NPC portrait",
                                children: portraits.map((sc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: `scene:${sc.id}`,
                                        children: sc.name || sc.label
                                    }, sc.id, false, {
                                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                                        lineNumber: 442,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 440,
                                columnNumber: 13
                            }, this) : null,
                            maps.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("optgroup", {
                                label: "Open another map",
                                children: maps.map((sc)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: `scene:${sc.id}`,
                                        children: sc.label
                                    }, sc.id, false, {
                                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                                        lineNumber: 451,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/MapEditor.tsx",
                                lineNumber: 449,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/MapEditor.tsx",
                        lineNumber: 422,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 420,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: "btn small danger",
                onClick: ()=>void remove(pin),
                children: [
                    "Delete ",
                    label
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/MapEditor.tsx",
                lineNumber: 459,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/MapEditor.tsx",
        lineNumber: 405,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/PlayersPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PlayersPanel",
    ()=>PlayersPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/seed.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Check.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InspireToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/InspireToggle.tsx [app-ssr] (ecmascript)");
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
;
function PlayersPanel() {
    const { view, run, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [showArchived, setShowArchived] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const list = s.players.filter((p)=>showArchived || !p.archived);
    const archivedCount = s.players.filter((p)=>p.archived).length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "players-panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "box door",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "The door"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 25,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: [
                            "Anyone who opens ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(view.state.id, "their-name")
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 27,
                                columnNumber: 28
                            }, this),
                            " joins the table straight away. Close the door to make new names knock first."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 26,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                        checked: s.doorClosed,
                        onChange: (v)=>run({
                                type: "door.set",
                                closed: v
                            }, v ? "Door closed. New names will knock." : "Door open."),
                        children: "Close the door"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline seats",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "Seats at the table",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "fld",
                                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["seatsOf"])(s),
                                        onChange: (e)=>run({
                                                type: "table.seats",
                                                max: Number(e.target.value)
                                            }, `The table now seats ${e.target.value}.`),
                                        children: Array.from({
                                            length: 12
                                        }, (_, i)=>i + 1).map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: n,
                                                children: n
                                            }, n, false, {
                                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                                lineNumber: 37,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                        lineNumber: 35,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "note",
                                children: [
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["seatedCount"])(s),
                                    " of ",
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$seed$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["seatsOf"])(s),
                                    " taken. When every seat is taken, new names knock. You can always let someone in, and players who “left the table” don’t hold a seat."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 43,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    s.knocks.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "knock-list",
                        children: s.knocks.map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: k.handle
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                        lineNumber: 51,
                                        columnNumber: 17
                                    }, this),
                                    " is knocking",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small primary",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "knock.admit",
                                                knockId: k.id
                                            }, `Let ${k.handle} in.`),
                                        children: "Let in"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                        lineNumber: 52,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "knock.dismiss",
                                                knockId: k.id
                                            }),
                                        children: "Dismiss"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                        lineNumber: 55,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, k.id, true, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 50,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 48,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "player-cards",
                children: list.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PlayerCard, {
                        p: p
                    }, p.id, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 66,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        className: "inline",
                        onSubmit: async (e)=>{
                            e.preventDefault();
                            if (await run({
                                type: "player.add",
                                name
                            }, `Added ${name || "a player"}.`)) setName("");
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "New player",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "fld",
                                        value: name,
                                        onChange: (e)=>setName(e.target.value),
                                        placeholder: "Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                        lineNumber: 80,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 78,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "submit",
                                children: "Add player"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this),
                    archivedCount ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "check",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: showArchived,
                                onChange: (e)=>setShowArchived(e.target.checked)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this),
                            " Show ",
                            archivedCount,
                            " who left"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "Players can also just open their link with a new name. Add &key=anything to their link to lock the name to them."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyAll, {
                toast: toast
            }, void 0, false, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
function PlayerCard({ p }) {
    const { view, run, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const link = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(view.state.id, p.handle);
    const seen = p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    }) : "never";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `box player-card${p.archived ? " archived" : ""}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "box-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: p.name
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bal",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 104,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "tags",
                children: [
                    p.dropIn ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tag",
                        children: "drop-in"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 109,
                        columnNumber: 21
                    }, this) : null,
                    p.away ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tag",
                        children: "away tonight"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 110,
                        columnNumber: 19
                    }, this) : null,
                    p.archived ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tag",
                        children: "left the table"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 111,
                        columnNumber: 23
                    }, this) : null,
                    p.hasKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "tag",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LockIcon"], {
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 114,
                                columnNumber: 13
                            }, this),
                            " name locked"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: [
                            "last seen ",
                            seen
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "form",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Name",
                                value: p.name,
                                onCommit: (v)=>run({
                                        type: "player.update",
                                        playerId: p.id,
                                        patch: {
                                            name: v
                                        }
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "URL name (?player=)",
                                value: p.handle,
                                onCommit: (v)=>run({
                                        type: "player.update",
                                        playerId: p.id,
                                        patch: {
                                            handle: v
                                        }
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 122,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "D&D Beyond character link",
                        value: p.dndbUrl ?? "",
                        placeholder: "https://www.dndbeyond.com/characters/...",
                        onCommit: (v)=>run({
                                type: "player.update",
                                playerId: p.id,
                                patch: {
                                    dndbUrl: v
                                }
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small",
                                type: "button",
                                onClick: ()=>{
                                    void navigator.clipboard?.writeText(link).then(()=>toast(`Copied ${p.name}'s link.`), ()=>toast(link));
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LinkIcon"], {
                                        size: 16
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                        lineNumber: 136,
                                        columnNumber: 13
                                    }, this),
                                    " Copy link"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 126,
                                columnNumber: 11
                            }, this),
                            p.dndbUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                className: "btn small",
                                href: p.dndbUrl,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                children: "D&D Beyond"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 139,
                                columnNumber: 13
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                checked: p.away,
                                onChange: (v)=>run({
                                        type: "player.update",
                                        playerId: p.id,
                                        patch: {
                                            away: v
                                        }
                                    }),
                                children: "Away tonight"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 143,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                checked: p.dropIn,
                                onChange: (v)=>run({
                                        type: "player.update",
                                        playerId: p.id,
                                        patch: {
                                            dropIn: v
                                        }
                                    }),
                                children: "Drop-in"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 146,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$InspireToggle$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InspireToggle"], {
                                playerId: p.id,
                                name: p.name,
                                on: !!p.inspired
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 149,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 125,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            p.hasKey ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small",
                                type: "button",
                                onClick: ()=>run({
                                        type: "player.clearKey",
                                        playerId: p.id
                                    }, `${p.name}'s name is unlocked.`),
                                children: "Reset name lock"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 153,
                                columnNumber: 13
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small",
                                type: "button",
                                onClick: ()=>run({
                                        type: "player.archive",
                                        playerId: p.id,
                                        archived: !p.archived
                                    }),
                                children: p.archived ? "Bring back" : "Left the table"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 157,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small danger",
                                type: "button",
                                onClick: ()=>{
                                    if (confirm(`Delete ${p.name}? Their ledger lines stay.`)) void run({
                                        type: "player.remove",
                                        playerId: p.id
                                    }, `Deleted ${p.name}.`);
                                },
                                children: "Delete"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
        lineNumber: 103,
        columnNumber: 5
    }, this);
}
function CopyAll({ toast }) {
    const { view } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const text = [
        `TV: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(view.state.id, "TV")}`,
        ...view.state.players.filter((p)=>!p.archived).map((p)=>`${p.name}: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["absoluteHref"])(view.state.id, p.handle)}`)
    ].join("\n");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: "btn",
        type: "button",
        onClick: ()=>void navigator.clipboard?.writeText(text).then(()=>toast("Copied every link."), ()=>toast("Couldn't copy.")),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LinkIcon"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/src/client/dm/PlayersPanel.tsx",
                lineNumber: 192,
                columnNumber: 7
            }, this),
            " Copy the TV and player links"
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/PlayersPanel.tsx",
        lineNumber: 182,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/RunGame.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RunGame",
    ()=>RunGame,
    "actionLabel",
    ()=>actionLabel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
// Run-game mode: a presenter view for running a session beat by beat.
// DM-only. Everything here comes from the DM view; the TV only ever sees the
// effects of actions (a scene switch, the purse), never the run sheet.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/reducer.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/runsheet.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$BankPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/BankPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Inbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Inbox.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Dues$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Dues.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
function actionLabel(a, scenes) {
    if (a.type === "black") return "TV → black screen";
    if (a.type === "bank") return "Bank opens · purse on the TV";
    const sc = scenes.find((x)=>x.id === a.sceneId);
    if (!sc) return "TV → a scene that was deleted";
    return sc.kind === "portrait" ? `TV → ${sc.label}’s portrait` : `TV → ${sc.label}`;
}
function RunGame({ onExit }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const session = s.sessions.find((x)=>x.id === s.currentSessionId);
    const r = session?.run;
    const ep = r ? (s.episodes ?? []).find((e)=>e.id === r.episodeId) : undefined;
    const [drawer, setDrawer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [bank, setBank] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [skip, setSkip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    // Skips belong to the beat you're about to land on; reset them when you move.
    const where = r ? `${r.stage}:${r.beat}` : "";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>setSkip([]), [
        where
    ]);
    const target = (rr, e)=>{
        if (rr.stage === "start") return e.beats[rr.beat] ?? null;
        if (rr.stage === "beat") return e.beats[rr.beat + 1] ?? null;
        return null;
    };
    const next = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!r || !ep) return;
        const t = target(r, ep);
        if (t && t.actions.some((a, i)=>a.type === "bank" && !skip.includes(i))) setBank(true);
        void run({
            type: "run.next",
            ...skip.length ? {
                skip
            } : {}
        });
    }, [
        r,
        ep,
        skip,
        run
    ]);
    const back = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>void run({
            type: "run.back"
        }), [
        run
    ]);
    const jump = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((stage, beat)=>{
        setDrawer(false);
        if (stage === "beat" && ep && beat !== undefined && ep.beats[beat]?.actions.some((a)=>a.type === "bank")) setBank(true);
        void run({
            type: "run.jump",
            stage,
            ...beat !== undefined ? {
                beat
            } : {}
        });
    }, [
        ep,
        run
    ]);
    // Keys: Space or → next, Shift+Space or ← back. 0–9, S, P and Esc work as in the DM view; B opens the bank here.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const onKey = (e)=>{
            const t = e.target;
            if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Inbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isInboxOpen"])()) return; // the requests drawer has the keys while it's open
            const k = e.key;
            if (k === " " && !e.shiftKey || k === "ArrowRight" || k === "PageDown") next();
            else if (k === " " && e.shiftKey || k === "ArrowLeft" || k === "PageUp") back();
            else if (/^[0-9]$/.test(k)) {
                const sc = s.scenes.find((x)=>x.hotkey === Number(k));
                if (sc) void run({
                    type: "scene.show",
                    sceneId: sc.id
                });
            } else if (k === "s" || k === "S") void run({
                type: "live.shop",
                open: !s.live.shopOpen
            });
            else if (k === "p" || k === "P") void run({
                type: "live.purse",
                visible: !s.live.purseVisible
            });
            else if (k === "b" || k === "B") setBank((v)=>!v);
            else if (k === "Escape") {
                if (bank) setBank(false);
                else if (drawer) setDrawer(false);
                else if (s.live.shopOpen) void run({
                    type: "live.shop",
                    open: false
                });
                else return;
            } else return;
            e.preventDefault();
        };
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, [
        next,
        back,
        run,
        s.scenes,
        s.live.shopOpen,
        s.live.purseVisible,
        bank,
        drawer
    ]);
    if (!session || !r || !ep) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "run-root",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "run-empty box",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Run-game mode"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "No episode is running right now. Pick one in the header and press Run game."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 93,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn",
                        type: "button",
                        onClick: onExit,
                        children: "Back to the DM view"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 94,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 91,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/client/dm/RunGame.tsx",
            lineNumber: 90,
            columnNumber: 7
        }, this);
    }
    const n = ep.beats.length;
    const beat = r.stage === "beat" ? ep.beats[r.beat] : null;
    const upcoming = target(r, ep);
    const live = s.scenes.find((x)=>x.id === s.live.sceneId);
    const progress = r.stage === "start" ? 0 : r.stage === "end" ? 1 : (r.beat + 1) / Math.max(1, n);
    const position = r.stage === "start" ? "Check-in" : r.stage === "end" ? "Wrap-up" : `Beat ${r.beat + 1} of ${n}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "run-root",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "run-top",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn small",
                        type: "button",
                        onClick: onExit,
                        children: [
                            "‹ ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "run-exit-text",
                                children: "DM view"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 113,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 112,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "run-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "run-ep",
                                children: [
                                    ep.title,
                                    " · ",
                                    session.title
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 116,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "run-pos",
                                "aria-live": "polite",
                                children: position
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "spacer"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "run-tv",
                        title: "What the TV shows",
                        children: [
                            "TV: ",
                            s.live.recapSessionId ? "Previously on…" : s.live.shopOpen ? "the shop" : live?.label ?? "–",
                            s.live.purseVisible ? " · purse" : ""
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Inbox$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Inbox"], {}, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn small",
                        type: "button",
                        onClick: ()=>setBank(true),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "key",
                                children: "B"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this),
                            " Bank"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn small run-jump-toggle",
                        type: "button",
                        "aria-expanded": drawer,
                        onClick: ()=>setDrawer((v)=>!v),
                        children: "Beats"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "run-progress",
                        role: "progressbar",
                        "aria-label": position,
                        "aria-valuemin": 0,
                        "aria-valuemax": 100,
                        "aria-valuenow": Math.round(progress * 100),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: {
                                width: `${progress * 100}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/RunGame.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "run-body",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "run-main",
                        children: [
                            r.stage === "start" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StartStep, {
                                session: session
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 142,
                                columnNumber: 34
                            }, this) : null,
                            beat ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BeatCard, {
                                beat: beat,
                                scenes: s.scenes
                            }, beat.id, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 143,
                                columnNumber: 19
                            }, this) : null,
                            r.stage === "end" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(EndStep, {
                                session: session,
                                episode: ep,
                                onBank: ()=>setBank(true),
                                onEnded: onExit
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 144,
                                columnNumber: 32
                            }, this) : null,
                            r.stage !== "end" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "run-next",
                                "aria-label": "Next beat",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "run-next-label",
                                        children: "Next"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 148,
                                        columnNumber: 15
                                    }, this),
                                    upcoming ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "run-next-title",
                                                children: upcoming.title
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                                lineNumber: 151,
                                                columnNumber: 19
                                            }, this),
                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["beatFirstLine"])(upcoming) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "run-next-line",
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$runsheet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["beatFirstLine"])(upcoming)
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                                lineNumber: 152,
                                                columnNumber: 46
                                            }, this) : null,
                                            upcoming.actions.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                className: "run-actions",
                                                children: upcoming.actions.map((a, i)=>{
                                                    const skipped = skip.includes(i);
                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                        className: skipped ? "skipped" : "",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: actionLabel(a, s.scenes)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                                                lineNumber: 159,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "btn small",
                                                                type: "button",
                                                                "aria-pressed": skipped,
                                                                onClick: ()=>setSkip((xs)=>skipped ? xs.filter((x)=>x !== i) : [
                                                                            ...xs,
                                                                            i
                                                                        ]),
                                                                children: skipped ? "Skipped" : "Skip"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                                                lineNumber: 160,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, i, true, {
                                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                                        lineNumber: 158,
                                                        columnNumber: 27
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                                lineNumber: 154,
                                                columnNumber: 21
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 150,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "run-next-title",
                                        children: "Wrap-up: payday and the recap"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 170,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 147,
                                columnNumber: 13
                            }, this) : null,
                            beat ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickNotes, {
                                beatId: beat.id,
                                value: r.notes[beat.id] ?? ""
                            }, `notes-${beat.id}`, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 175,
                                columnNumber: 19
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: `run-list${drawer ? " open" : ""}`,
                        "aria-label": "Jump to a beat",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "run-list-head",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Jump to"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 180,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small run-jump-toggle",
                                        type: "button",
                                        onClick: ()=>setDrawer(false),
                                        children: "Close"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 181,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `run-li${r.stage === "start" ? " on" : ""}`,
                                            "aria-current": r.stage === "start" ? "step" : undefined,
                                            onClick: ()=>jump("start"),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "run-li-n",
                                                    children: "·"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                                    lineNumber: 188,
                                                    columnNumber: 17
                                                }, this),
                                                " Check-in"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/RunGame.tsx",
                                            lineNumber: 187,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 186,
                                        columnNumber: 13
                                    }, this),
                                    ep.beats.map((b, i)=>{
                                        const on = r.stage === "beat" && r.beat === i;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                className: `run-li${on ? " on" : ""}`,
                                                "aria-current": on ? "step" : undefined,
                                                onClick: ()=>jump("beat", i),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "run-li-n",
                                                        children: i + 1
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                                        lineNumber: 196,
                                                        columnNumber: 21
                                                    }, this),
                                                    " ",
                                                    b.title,
                                                    r.notes[b.id] ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "run-li-dot",
                                                        title: "Has quick notes",
                                                        "aria-label": "has quick notes"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                                        lineNumber: 197,
                                                        columnNumber: 38
                                                    }, this) : null
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                                lineNumber: 195,
                                                columnNumber: 19
                                            }, this)
                                        }, b.id, false, {
                                            fileName: "[project]/src/client/dm/RunGame.tsx",
                                            lineNumber: 194,
                                            columnNumber: 17
                                        }, this);
                                    }),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: `run-li${r.stage === "end" ? " on" : ""}`,
                                            "aria-current": r.stage === "end" ? "step" : undefined,
                                            onClick: ()=>jump("end"),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "run-li-n",
                                                    children: "·"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                                    lineNumber: 204,
                                                    columnNumber: 17
                                                }, this),
                                                " Wrap-up"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/client/dm/RunGame.tsx",
                                            lineNumber: 203,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 202,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    drawer ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "run-scrim",
                        type: "button",
                        "aria-label": "Close the beat list",
                        onClick: ()=>setDrawer(false)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 209,
                        columnNumber: 19
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "run-foot",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn run-nav",
                        type: "button",
                        onClick: back,
                        disabled: r.stage === "start",
                        children: "‹ Back"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 213,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary run-nav",
                        type: "button",
                        onClick: next,
                        disabled: r.stage === "end",
                        children: r.stage === "start" ? "Begin ›" : "Next ›"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 216,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this),
            bank ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "run-overlay",
                role: "dialog",
                "aria-modal": "true",
                "aria-label": "Bank",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "run-overlay-head",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Bank"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 224,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "button",
                                onClick: ()=>setBank(false),
                                children: "Back to the run sheet"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$BankPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BankPanel"], {}, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 229,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 222,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/RunGame.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
// ---------------------------------------------------------------------------
function BeatCard({ beat, scenes }) {
    const { run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const at = Math.min(beat.readAloudAt ?? 0, beat.notes.length);
    const read = beat.readAloud?.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("blockquote", {
        className: "run-read",
        children: beat.readAloud.map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: p
            }, i, false, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 244,
                columnNumber: 9
            }, this))
    }, "read", false, {
        fileName: "[project]/src/client/dm/RunGame.tsx",
        lineNumber: 242,
        columnNumber: 5
    }, this) : null;
    const before = beat.notes.slice(0, at);
    const after = beat.notes.slice(at);
    const notes = (xs, key)=>xs.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
            className: "run-notes",
            children: xs.map((x, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    children: x
                }, i, false, {
                    fileName: "[project]/src/client/dm/RunGame.tsx",
                    lineNumber: 254,
                    columnNumber: 11
                }, this))
        }, key, false, {
            fileName: "[project]/src/client/dm/RunGame.tsx",
            lineNumber: 252,
            columnNumber: 7
        }, this) : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: "run-beat",
        "aria-label": beat.title,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "run-title",
                children: beat.title
            }, void 0, false, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 261,
                columnNumber: 7
            }, this),
            beat.actions.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "run-actions current",
                children: beat.actions.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: actionLabel(a, scenes)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 266,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small",
                                type: "button",
                                onClick: ()=>run({
                                        type: "run.fire",
                                        beatId: beat.id,
                                        index: i
                                    }),
                                children: "↻ Again"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 267,
                                columnNumber: 15
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 265,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 263,
                columnNumber: 9
            }, this) : null,
            notes(before, "before"),
            read,
            notes(after, "after"),
            beat.checks.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                className: "run-checks",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    scope: "col",
                                    children: "For"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                    lineNumber: 281,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    scope: "col",
                                    children: "Check"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                    lineNumber: 282,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    scope: "col",
                                    children: "DC"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                    lineNumber: 283,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    scope: "col",
                                    children: "On a fail"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                    lineNumber: 284,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    scope: "col",
                                    children: "On a success"
                                }, void 0, false, {
                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                    lineNumber: 285,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/RunGame.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 279,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                        children: beat.checks.map((c, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        "data-label": "For",
                                        children: c.what || "–"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 291,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        "data-label": "Check",
                                        children: c.skill
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 292,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        "data-label": "DC",
                                        className: "run-dc",
                                        children: c.dc
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 293,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        "data-label": "On a fail",
                                        children: c.fail || "–"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 296,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        "data-label": "On a success",
                                        children: c.success || "–"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 297,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 290,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 288,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 278,
                columnNumber: 9
            }, this) : null,
            beat.branches.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "run-branches",
                children: beat.branches.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                children: [
                                    "If ",
                                    b.when
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 307,
                                columnNumber: 15
                            }, this),
                            b.then ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    " → ",
                                    b.then
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 308,
                                columnNumber: 25
                            }, this) : null
                        ]
                    }, i, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 306,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 304,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/RunGame.tsx",
        lineNumber: 260,
        columnNumber: 5
    }, this);
}
/** Saves a while after you stop typing, and when you leave the box or the beat. */ function useAutosave(value, save, delay = 800) {
    const [text, setText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(value);
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("saved");
    const latest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])({
        text,
        value,
        save
    });
    latest.current = {
        text,
        value,
        save
    };
    const timer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const dirty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const flush = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        if (!dirty.current) return;
        dirty.current = false;
        setState("saving");
        await latest.current.save(latest.current.text);
        setState(dirty.current ? "typing" : "saved");
    }, []);
    // Follow the server (another device) while we have nothing unsaved.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!dirty.current) setText(value);
    }, [
        value
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>()=>void flush(), [
        flush
    ]);
    const onChange = (v)=>{
        setText(v);
        dirty.current = true;
        setState("typing");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(()=>void flush(), delay);
    };
    return {
        text,
        onChange,
        flush,
        state
    };
}
function QuickNotes({ beatId, value }) {
    const { run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const a = useAutosave(value, (text)=>run({
            type: "run.note",
            beatId,
            text
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "run-quick",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "run-quick-label",
                    children: [
                        "Quick notes ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "note",
                            children: a.state === "saved" ? "Saved" : a.state === "saving" ? "Saving…" : "…"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/RunGame.tsx",
                            lineNumber: 359,
                            columnNumber: 23
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/RunGame.tsx",
                    lineNumber: 358,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    className: "fld",
                    rows: 3,
                    value: a.text,
                    placeholder: "What happened here, who did what, things to remember",
                    onChange: (e)=>a.onChange(e.target.value),
                    onBlur: ()=>void a.flush()
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/RunGame.tsx",
                    lineNumber: 361,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/RunGame.tsx",
            lineNumber: 357,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/client/dm/RunGame.tsx",
        lineNumber: 356,
        columnNumber: 5
    }, this);
}
function StartStep({ session }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const prev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$reducer$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["previousRecap"])(s);
    const showing = !!prev && s.live.recapSessionId === prev.id;
    const players = s.players.filter((p)=>!p.archived);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: "run-beat",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "run-title",
                children: "Session start"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 375,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Who’s here?"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 377,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "checks run-attend",
                        children: players.map((p)=>{
                            const here = session.attendeeIds.includes(p.id) && !p.away;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "check",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "checkbox",
                                        checked: here,
                                        onChange: (e)=>run({
                                                type: "run.attend",
                                                playerId: p.id,
                                                here: e.target.checked
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 383,
                                        columnNumber: 17
                                    }, this),
                                    p.name
                                ]
                            }, p.id, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 382,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 378,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "Anyone unticked is marked away: off the TV purse and out of “pay everyone”."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 389,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 376,
                columnNumber: 7
            }, this),
            session.startLog?.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Since last time"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 393,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "run-notelist",
                        children: session.startLog.map((line, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: line
                            }, i, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 396,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 394,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 392,
                columnNumber: 9
            }, this) : null,
            prev ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Previously on…"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 403,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("blockquote", {
                        className: "run-read small",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "run-read-kicker",
                                children: prev.title
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 405,
                                columnNumber: 13
                            }, this),
                            prev.recap.split(/\n\s*\n/).filter((p)=>p.trim()).map((p, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: p.trim()
                                }, i, false, {
                                    fileName: "[project]/src/client/dm/RunGame.tsx",
                                    lineNumber: 410,
                                    columnNumber: 17
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 404,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: `btn${showing ? " on" : ""}`,
                        type: "button",
                        "aria-pressed": showing,
                        onClick: ()=>run({
                                type: "live.recap",
                                sessionId: showing ? null : prev.id
                            }),
                        children: showing ? "Take it off the TV" : "Show it on the TV"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 413,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 402,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/RunGame.tsx",
        lineNumber: 374,
        columnNumber: 5
    }, this);
}
function EndStep({ session, episode, onBank, onEnded }) {
    const { run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const recap = useAutosave(session.recap ?? "", (text)=>run({
            type: "run.recap",
            sessionId: session.id,
            text
        }));
    const notes = episode.beats.map((b, i)=>({
            b,
            i,
            text: session.run?.notes[b.id]
        })).filter((x)=>x.text?.trim());
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: "run-beat",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "run-title",
                children: "Session end"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 428,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Rent and lessons due"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 430,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Dues$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Dues"], {
                        session: session
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 431,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 429,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section run-payday",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Payday"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 434,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Pay out tonight’s gold before everyone leaves."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 435,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary",
                        type: "button",
                        onClick: onBank,
                        children: "Open the bank"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 436,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 433,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Recap"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 441,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "note",
                                children: [
                                    "Saved with this session. Next time it’s your “Previously on…” card. ",
                                    recap.state === "saved" ? "Saved." : recap.state === "saving" ? "Saving…" : ""
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 443,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                className: "fld run-recap",
                                rows: 8,
                                value: recap.text,
                                onChange: (e)=>recap.onChange(e.target.value),
                                onBlur: ()=>void recap.flush()
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 444,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 442,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 440,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "run-section",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        children: "Your quick notes"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 448,
                        columnNumber: 9
                    }, this),
                    notes.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                        className: "run-notelist",
                        children: notes.map(({ b, i, text })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: [
                                            i + 1,
                                            ". ",
                                            b.title
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 453,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "run-notelist-text",
                                        children: text
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/RunGame.tsx",
                                        lineNumber: 456,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, b.id, true, {
                                fileName: "[project]/src/client/dm/RunGame.tsx",
                                lineNumber: 452,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 450,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "No quick notes this session."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/RunGame.tsx",
                        lineNumber: 461,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 447,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "btn",
                type: "button",
                onClick: async ()=>{
                    await recap.flush();
                    if (await run({
                        type: "session.end"
                    }, `${session.title} ended.`)) onEnded();
                },
                children: [
                    "End ",
                    session.title
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/RunGame.tsx",
                lineNumber: 464,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/RunGame.tsx",
        lineNumber: 427,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/ScenesPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScenesPanel",
    ()=>ScenesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/SceneView.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Check.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$upload$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/upload.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
const KINDS = [
    [
        "map",
        "Map with numbered locations"
    ],
    [
        "image",
        "Image"
    ],
    [
        "portrait",
        "NPC portrait"
    ],
    [
        "handout",
        "Handout on paper"
    ],
    [
        "notice",
        "Notice board"
    ],
    [
        "black",
        "Black screen"
    ]
];
function ScenesPanel() {
    const { view, run, openMap } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const hasSeedMaps = s.scenes.some((x)=>x.kind === "map" && x.label === "Candlefair map") && s.scenes.some((x)=>x.kind === "map" && x.label === "Sword Coast map");
    const [openId, setOpenId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [newKind, setNewKind] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("image");
    const [newLabel, setNewLabel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "scenes-panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "Reveal scenes never reach the TV until you show them. Images you upload are stored online, so they show on every screen."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "scene-list",
                children: s.scenes.map((sc, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: `scene-item${sc.id === s.live.sceneId ? " live" : ""}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "scene-row",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "key",
                                        children: sc.hotkey ?? "–"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 38,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "scene-label",
                                        children: [
                                            sc.label,
                                            sc.reveal ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "tag wax",
                                                children: "reveal"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                lineNumber: 41,
                                                columnNumber: 30
                                            }, this) : null,
                                            sc.kind === "map" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "tag",
                                                children: [
                                                    "map · ",
                                                    sc.map?.pins.length ?? 0
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                lineNumber: 42,
                                                columnNumber: 38
                                            }, this) : null,
                                            sc.id === s.live.sceneId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "tag",
                                                children: "on the TV"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                lineNumber: 43,
                                                columnNumber: 45
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 39,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "spacer"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 45,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small icon",
                                        type: "button",
                                        "aria-label": `Move ${sc.label} up`,
                                        disabled: i === 0,
                                        onClick: ()=>run({
                                                type: "scene.move",
                                                sceneId: sc.id,
                                                dir: -1
                                            }),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UpIcon"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                            lineNumber: 47,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small icon",
                                        type: "button",
                                        "aria-label": `Move ${sc.label} down`,
                                        disabled: i === s.scenes.length - 1,
                                        onClick: ()=>run({
                                                type: "scene.move",
                                                sceneId: sc.id,
                                                dir: 1
                                            }),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DownIcon"], {}, void 0, false, {
                                            fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                            lineNumber: 50,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 49,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "scene.show",
                                                sceneId: sc.id
                                            }),
                                        children: "Show"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 52,
                                        columnNumber: 15
                                    }, this),
                                    sc.kind === "map" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        onClick: ()=>openMap(sc.id),
                                        children: "Pins"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 56,
                                        columnNumber: 17
                                    }, this) : null,
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        "aria-expanded": openId === sc.id,
                                        onClick: ()=>setOpenId(openId === sc.id ? null : sc.id),
                                        children: openId === sc.id ? "Done" : "Edit"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 60,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 37,
                                columnNumber: 13
                            }, this),
                            openId === sc.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SceneEditor, {
                                scene: sc
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 64,
                                columnNumber: 33
                            }, this) : null
                        ]
                    }, sc.id, true, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 36,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this),
            !hasSeedMaps ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "box form",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Maps"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 71,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "Add the Candlefair map (8 locations, the first three discovered) and the Sword Coast map (5 locations). Your Town map scene becomes the Candlefair map and keeps its image and hotkey."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 72,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn",
                        type: "button",
                        onClick: ()=>run({
                                type: "map.addSeedMaps"
                            }, "Maps added. Upload their images and drag the pins into place."),
                        children: "Add the Candlefair and Sword Coast maps"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 75,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                lineNumber: 70,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "box form add-scene",
                onSubmit: async (e)=>{
                    e.preventDefault();
                    if (await run({
                        type: "scene.add",
                        kind: newKind,
                        label: newLabel || KINDS.find((k)=>k[0] === newKind)[1]
                    }, "Scene added.")) setNewLabel("");
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: "Add a scene"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "Kind",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "fld",
                                        value: newKind,
                                        onChange: (e)=>setNewKind(e.target.value),
                                        children: KINDS.map(([k, l])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: k,
                                                children: l
                                            }, k, false, {
                                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                lineNumber: 94,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 92,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "grow",
                                children: [
                                    "Name in your list",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        className: "fld",
                                        value: newLabel,
                                        onChange: (e)=>setNewLabel(e.target.value),
                                        placeholder: "e.g. The docks at dusk"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 102,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn primary",
                                type: "submit",
                                children: "Add"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                lineNumber: 81,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
function SceneEditor({ scene }) {
    const { view, run, ident, toast, gated, openMap } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const file = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const usedKeys = new Map(view.state.scenes.filter((x)=>x.id !== scene.id && x.hotkey !== null).map((x)=>[
            x.hotkey,
            x.label
        ]));
    const patch = (p)=>run({
            type: "scene.update",
            sceneId: scene.id,
            patch: p
        });
    const takesImage = scene.kind !== "black" && !(scene.art?.builtin === "candlefair-board" || scene.art?.builtin === "artum-notice");
    const onFile = async (f)=>{
        if (!f) return;
        setBusy(true);
        try {
            const url = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$upload$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uploadImage"])(ident, f);
            if (await patch({
                art: {
                    url
                }
            })) toast("Image saved.");
        } catch (e) {
            toast(e instanceof Error ? e.message : String(e));
        } finally{
            setBusy(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "scene-editor",
        onDragOver: (e)=>takesImage && e.preventDefault(),
        onDrop: (e)=>{
            if (!takesImage) return;
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "scene-editor-preview",
                "aria-hidden": scene.kind !== "map",
                children: scene.kind === "map" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "map-editor-cta",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "note",
                            children: [
                                scene.map?.pins.length ?? 0,
                                " locations."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                            lineNumber: 147,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn primary",
                            type: "button",
                            onClick: ()=>openMap(scene.id),
                            children: "Open the map editor"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                            lineNumber: 148,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                    lineNumber: 146,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$SceneView$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SceneView"], {
                    scene: {
                        ...scene,
                        map: undefined
                    },
                    gated: gated,
                    emptyHint: "No image yet"
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                    lineNumber: 153,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                lineNumber: 144,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "form",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Name in your list",
                        value: scene.label,
                        onCommit: (v)=>patch({
                                label: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "Kind",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "fld",
                                        value: scene.kind,
                                        onChange: (e)=>patch({
                                                kind: e.target.value
                                            }),
                                        children: KINDS.map(([k, l])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: k,
                                                children: l
                                            }, k, false, {
                                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                lineNumber: 163,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 161,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 159,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: [
                                    "Hotkey",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "fld",
                                        value: scene.hotkey ?? "",
                                        onChange: (e)=>patch({
                                                hotkey: e.target.value === "" ? null : Number(e.target.value)
                                            }),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "",
                                                children: "None"
                                            }, void 0, false, {
                                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                lineNumber: 172,
                                                columnNumber: 15
                                            }, this),
                                            [
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
                                            ].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: k,
                                                    children: [
                                                        k,
                                                        usedKeys.has(k) ? ` (now ${usedKeys.get(k)})` : ""
                                                    ]
                                                }, k, true, {
                                                    fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                                    lineNumber: 174,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                        lineNumber: 171,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 169,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                checked: scene.reveal,
                                onChange: (v)=>patch({
                                        reveal: v
                                    }),
                                children: "Reveal (hidden from the TV until shown)"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 181,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 158,
                        columnNumber: 9
                    }, this),
                    scene.kind === "portrait" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Name on the TV",
                                value: scene.name ?? "",
                                onCommit: (v)=>patch({
                                        name: v
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 188,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Title under it",
                                value: scene.title ?? "",
                                onCommit: (v)=>patch({
                                        title: v
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 189,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 187,
                        columnNumber: 11
                    }, this) : null,
                    takesImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "button",
                                disabled: busy,
                                onClick: ()=>file.current?.click(),
                                children: busy ? "Uploading…" : scene.art?.url || scene.art?.builtin ? "Replace image" : "Upload image"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 195,
                                columnNumber: 13
                            }, this),
                            scene.art?.url || scene.art?.builtin ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small",
                                type: "button",
                                onClick: ()=>patch({
                                        art: {}
                                    }),
                                children: "Remove image"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 199,
                                columnNumber: 15
                            }, this) : null,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "note",
                                children: [
                                    "or drop an image here. Maps from the settlement generator work too (download the .jpg).",
                                    scene.kind === "map" ? " Pins keep their spot on a new image." : ""
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 203,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                ref: file,
                                type: "file",
                                accept: "image/*",
                                hidden: true,
                                onChange: (e)=>void onFile(e.target.files?.[0])
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                                lineNumber: 204,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Describe the picture (for screen readers)",
                        value: scene.alt ?? "",
                        onCommit: (v)=>patch({
                                alt: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "DM note (only you see this)",
                        value: scene.dmNote ?? "",
                        multiline: true,
                        onCommit: (v)=>patch({
                                dmNote: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn small danger",
                        type: "button",
                        onClick: ()=>{
                            if (confirm(`Delete the scene “${scene.label}”?`)) void run({
                                type: "scene.remove",
                                sceneId: scene.id
                            }, "Scene deleted.");
                        },
                        children: "Delete scene"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ScenesPanel.tsx",
                lineNumber: 156,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ScenesPanel.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/ShopPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ShopPanel",
    ()=>ShopPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/money.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/ShopBoard.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/ui/icons.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/context.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Field.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/Check.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ItemExtras$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/dm/ItemExtras.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/shared/progress.ts [app-ssr] (ecmascript)");
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
;
const TIERS = [
    [
        "sale",
        "For sale"
    ],
    [
        "locked",
        "Locked (visible, with a reason)"
    ],
    [
        "rumored",
        "Rumored (??? and a hint)"
    ],
    [
        "hidden",
        "Hidden (players don't see it)"
    ]
];
const VIS_NOTE = {
    all: null,
    hidden: "hidden",
    some: "secret"
};
function ShopPanel() {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const [ownShopId, setShopId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(s.live.shopId);
    // While the shop is open on the TV, this panel and the TV show the same shop.
    const shopId = s.live.shopOpen ? s.live.shopId : ownShopId;
    const [buying, setBuying] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [quiet, setQuiet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("shop");
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(undefined);
    // What the cards show the DM: progress on projects and who has earned what.
    const cards = s.items.map((i)=>({
            ...i,
            ...i.kind === "project" ? {
                raisedCp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["raisedCp"])(s, i.id),
                funded: !!s.effectsOn[i.id]
            } : {},
            ...i.kind === "earned" ? {
                earnedBy: s.players.filter((p)=>s.awards.some((a)=>a.itemId === i.id && a.playerIds.includes(p.id))).map((p)=>p.name)
            } : {}
        }));
    const shop = s.shops.find((x)=>x.id === shopId) ?? s.shops[0];
    const buyers = s.players.filter((p)=>!p.archived);
    const actions = (it)=>{
        const buyable = it.tier === "sale" && it.stock !== 0 && !s.shops.find((x)=>x.id === it.shopId)?.closed && !(it.kind === "project" && s.effectsOn[it.id]);
        const cost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["firstChargeCp"])(s, it);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                buyable && buying !== it.id && it.kind !== "earned" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn small",
                    type: "button",
                    onClick: ()=>setBuying(it.id),
                    children: it.kind === "project" ? "Put gold in" : it.kind === "recurring" ? "Rent" : it.kind === "training" ? "Enroll" : "Buy"
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 50,
                    columnNumber: 11
                }, this) : null,
                it.kind === "earned" && buying !== it.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn small",
                    type: "button",
                    onClick: ()=>setBuying(it.id),
                    children: "Grant"
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 55,
                    columnNumber: 11
                }, this) : null,
                buying === it.id && it.kind === "earned" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ItemExtras$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GrantBox"], {
                    it: it,
                    onDone: ()=>setBuying(null)
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 59,
                    columnNumber: 53
                }, this) : null,
                buying === it.id && it.kind === "project" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ItemExtras$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ContributeBox"], {
                    it: it,
                    onDone: ()=>setBuying(null)
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 60,
                    columnNumber: 54
                }, this) : null,
                buying === it.id && it.kind !== "earned" && it.kind !== "project" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "buyers",
                    role: "group",
                    "aria-label": `Who's buying ${it.name}?`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "note",
                            children: "Who’s buying?"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/ShopPanel.tsx",
                            lineNumber: 63,
                            columnNumber: 13
                        }, this),
                        buyers.map((p)=>{
                            const ok = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["canAfford"])(p.balanceCp + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["creditCp"])(s, p.id, it.shopId), cost);
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small primary",
                                type: "button",
                                disabled: !ok,
                                title: ok ? undefined : `${p.name} has ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(p.balanceCp)}`,
                                onClick: async ()=>{
                                    const msg = it.arrivesInSessions ? `${p.name} ordered ${it.name}. It arrives in ${it.arrivesInSessions} sessions.` : it.kind === "recurring" ? `${p.name} rents ${it.name}. Rent is due at the end of each session.` : it.kind === "training" ? `${p.name} started ${it.name}. One lesson is charged at the end of each session.` : `${p.name} bought ${it.name}. Remind them to add it on D&D Beyond.`;
                                    let question;
                                    if (it.prompt) {
                                        question = window.prompt(it.prompt)?.trim();
                                        if (!question) return;
                                    }
                                    if (await run({
                                        type: "money.buy",
                                        playerId: p.id,
                                        itemId: it.id,
                                        ...question ? {
                                            question
                                        } : {}
                                    }, msg)) setBuying(null);
                                },
                                children: p.name
                            }, p.id, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 67,
                                columnNumber: 17
                            }, this);
                        }),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            className: "btn small",
                            type: "button",
                            onClick: ()=>setBuying(null),
                            children: "Cancel"
                        }, void 0, false, {
                            fileName: "[project]/src/client/dm/ShopPanel.tsx",
                            lineNumber: 93,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 62,
                    columnNumber: 11
                }, this) : null,
                it.tier !== "sale" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "btn small",
                    type: "button",
                    onClick: ()=>run({
                            type: "item.update",
                            itemId: it.id,
                            patch: {
                                tier: "sale"
                            },
                            quiet
                        }, quiet ? `${it.name} is for sale (quietly).` : `${it.name} is for sale.`),
                    children: "Put on sale"
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 99,
                    columnNumber: 11
                }, this) : null,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ItemEditor, {
                    it: it,
                    quiet: quiet
                }, void 0, false, {
                    fileName: "[project]/src/client/dm/ShopPanel.tsx",
                    lineNumber: 103,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/client/dm/ShopPanel.tsx",
            lineNumber: 48,
            columnNumber: 7
        }, this);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "dm-shop",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ShopVisibilityBox, {
                shop: shop,
                quiet: quiet
            }, shop.id, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline shop-tv-row",
                children: [
                    s.live.shopOpen ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "note tv-follows",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TvIcon"], {}, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 116,
                                        columnNumber: 15
                                    }, this),
                                    " The shop is open on the TV, and it follows these tabs."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 115,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn",
                                type: "button",
                                onClick: ()=>run({
                                        type: "live.shop",
                                        open: false
                                    }),
                                children: "Close the shop on the TV"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this) : shop.visibility === "all" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary",
                        type: "button",
                        onClick: ()=>run({
                                type: "live.shop",
                                open: true,
                                shopId: shop.id
                            }, `${shop.name} is on the TV.`),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TvIcon"], {}, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this),
                            " Show ",
                            shop.name,
                            " on the TV"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: "The TV only shows shops open to everyone."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 127,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "spacer"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                        checked: quiet,
                        onChange: setQuiet,
                        children: "Quietly (no “New at…” banner on the TV)"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$ui$2f$ShopBoard$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShopBoard"], {
                shops: s.shops,
                items: cards,
                shopId: shop.id,
                mode: mode,
                onMode: setMode,
                category: category,
                onCategory: setCategory,
                onShop: (id)=>{
                    setShopId(id);
                    setBuying(null);
                    const next = s.shops.find((x)=>x.id === id);
                    if (s.live.shopOpen && next?.visibility === "all") void run({
                        type: "live.shop",
                        open: true,
                        shopId: id
                    });
                },
                size: "page",
                dm: true,
                tabNote: (sh)=>VIS_NOTE[sh.visibility],
                actions: actions
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OrdersBox, {}, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ItemExtras$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RunningBox"], {}, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 156,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "panel-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "box",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                children: "This shop"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "form",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                        label: "Shop name",
                                        value: shop.name,
                                        onCommit: (v)=>run({
                                                type: "shop.update",
                                                shopId: shop.id,
                                                patch: {
                                                    name: v
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                        label: "Tagline",
                                        value: shop.subtitle,
                                        onCommit: (v)=>run({
                                                type: "shop.update",
                                                shopId: shop.id,
                                                patch: {
                                                    subtitle: v
                                                }
                                            })
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 163,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                        checked: !!shop.closed,
                                        onChange: (v)=>run({
                                                type: "shop.update",
                                                shopId: shop.id,
                                                patch: {
                                                    closed: v
                                                }
                                            }),
                                        children: "Closed: players see the name and tagline, but no goods"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 164,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                        checked: !!shop.secretSales || shop.visibility === "some",
                                        onChange: (v)=>run({
                                                type: "shop.update",
                                                shopId: shop.id,
                                                patch: {
                                                    secretSales: v
                                                }
                                            }),
                                        children: [
                                            "Secret sales: purchases here never show on the TV or other players’ phones",
                                            shop.visibility === "some" ? " (always, while it's for selected players)" : ""
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 167,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small danger",
                                        type: "button",
                                        onClick: ()=>{
                                            if (confirm(`Remove ${shop.name} and all its items?`)) void run({
                                                type: "shop.remove",
                                                shopId: shop.id
                                            }, `Removed ${shop.name}.`);
                                        },
                                        children: "Remove this shop"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 170,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, shop.id, true, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 161,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AddItem, {
                        shopId: shop.id,
                        quiet: quiet
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 181,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AddShop, {}, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 158,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ShopPanel.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
/** Hidden / everyone / some players, for one shop. */ function ShopVisibilityBox({ shop, quiet }) {
    const { view, run, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const players = view.state.players.filter((p)=>!p.archived);
    const [picked, setPicked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(shop.playerIds);
    const set = (visibility, ids = picked)=>run({
            type: "shop.visibility",
            shopId: shop.id,
            visibility,
            playerIds: ids,
            quiet
        }, visibility === "all" ? `${shop.name} is open to everyone${quiet ? " (quietly)" : ""}.` : visibility === "hidden" ? `${shop.name} is hidden.` : `${shop.name} is open to ${ids.length} ${ids.length === 1 ? "player" : "players"} only.`);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: `box vis-box vis-${shop.visibility}`,
        "aria-label": `Who can see ${shop.name}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "box-head",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        children: shop.name
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 201,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "note",
                        children: shop.visibility === "hidden" ? "Hidden: nobody but you sees this shop." : shop.visibility === "all" ? "Open to everyone, and it can go on the TV." : "Secret offer: only the players ticked below see it. Never on the TV."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 200,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline",
                role: "group",
                "aria-label": "Who can see this shop",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn small${shop.visibility === "hidden" ? " on" : ""}`,
                        "aria-pressed": shop.visibility === "hidden",
                        onClick: ()=>set("hidden"),
                        children: "Hidden"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn small${shop.visibility === "all" ? " on" : ""}`,
                        "aria-pressed": shop.visibility === "all",
                        onClick: ()=>set("all"),
                        children: "Everyone"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 210,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        className: `btn small${shop.visibility === "some" ? " on" : ""}`,
                        "aria-pressed": shop.visibility === "some",
                        onClick: ()=>picked.length ? set("some") : toast("Tick the players who should see it first."),
                        children: "Selected players"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 213,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 206,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "checks",
                children: players.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: "check",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "checkbox",
                                checked: picked.includes(p.id),
                                onChange: (e)=>{
                                    const ids = e.target.checked ? [
                                        ...picked,
                                        p.id
                                    ] : picked.filter((x)=>x !== p.id);
                                    setPicked(ids);
                                    if (shop.visibility === "some" && ids.length) void set("some", ids);
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 225,
                                columnNumber: 13
                            }, this),
                            p.name
                        ]
                    }, p.id, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 224,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 222,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ShopPanel.tsx",
        lineNumber: 199,
        columnNumber: 5
    }, this);
}
function ItemEditor({ it, quiet }) {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const patch = (p)=>run({
            type: "item.update",
            itemId: it.id,
            patch: p,
            quiet
        });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
        className: "dm-edit",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                children: "Edit"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 248,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "form",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Shown as",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: it.tier,
                                onChange: (e)=>patch({
                                        tier: e.target.value
                                    }),
                                children: TIERS.map(([t, l])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: t,
                                        children: l
                                    }, t, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 254,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 252,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 250,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Name",
                        value: it.name,
                        onCommit: (v)=>patch({
                                name: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 260,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Price",
                        value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cpToGpInput"])(it.priceCp),
                        hint: "gp, or 2 sp, or 5 gp 3 sp",
                        onCommit: (v)=>{
                            const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(v);
                            if (cp === null) return false;
                            void patch({
                                priceCp: cp
                            });
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 261,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Description",
                        value: it.description,
                        multiline: true,
                        onCommit: (v)=>patch({
                                description: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    it.tier === "locked" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Locked because",
                                value: it.reason,
                                placeholder: "e.g. The smith needs iron from Orlumbor",
                                onCommit: (v)=>patch({
                                        reason: v
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 274,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                                checked: it.hidePrice,
                                onChange: (v)=>patch({
                                        hidePrice: v
                                    }),
                                children: "Hide the price (??? gp)"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 275,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 273,
                        columnNumber: 11
                    }, this) : null,
                    it.tier === "rumored" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "The rumor (one line)",
                        value: it.hint,
                        placeholder: "e.g. They say you can still hear her singing.",
                        onCommit: (v)=>patch({
                                hint: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 280,
                        columnNumber: 34
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Stock (blank = no limit)",
                                value: it.stock === null ? "" : String(it.stock),
                                type: "number",
                                onCommit: (v)=>{
                                    if (v.trim() === "") return void patch({
                                        stock: null
                                    });
                                    const n = Number(v);
                                    if (!Number.isInteger(n) || n < 0) return false;
                                    void patch({
                                        stock: n
                                    });
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 282,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "When sold out",
                                value: it.restockNote,
                                placeholder: "e.g. Restocks next tenday",
                                onCommit: (v)=>patch({
                                        restockNote: v
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 293,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 281,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: it.kind === "order" ? "Special order: arrives after (sessions)" : "Special order: arrives after (sessions; blank = not an order)",
                                value: it.arrivesInSessions ? String(it.arrivesInSessions) : "",
                                type: "number",
                                onCommit: (v)=>{
                                    const n = v.trim() === "" ? 0 : Number(v);
                                    if (!Number.isInteger(n) || n < 0) return false;
                                    void patch({
                                        arrivesInSessions: n
                                    });
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 296,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                                label: "Price shown as",
                                value: it.priceLabel ?? "",
                                placeholder: "e.g. Free*",
                                onCommit: (v)=>patch({
                                        priceLabel: v
                                    })
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 306,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 295,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Check$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Check"], {
                        checked: !it.oneAtATime && !it.arrivesInSessions,
                        onChange: (v)=>patch({
                                oneAtATime: !v
                            }),
                        children: [
                            "Players can ask for several at once",
                            it.arrivesInSessions ? " (special orders are one at a time)" : ""
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "Fine print",
                        value: it.finePrint ?? "",
                        placeholder: "e.g. *Payment will be collected later.",
                        onCommit: (v)=>patch({
                                finePrint: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 311,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$ItemExtras$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KindFields"], {
                        it: it,
                        patch: patch
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$Field$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Field"], {
                        label: "DM note (only you see this)",
                        value: it.dmNote ?? "",
                        multiline: true,
                        placeholder: "e.g. Fennick becomes an ally",
                        onCommit: (v)=>patch({
                                dmNote: v
                            })
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 313,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: "inline-label",
                                children: [
                                    "Move to",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "fld",
                                        value: it.shopId,
                                        onChange: (e)=>patch({
                                                shopId: e.target.value
                                            }),
                                        children: s.shops.map((sh)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: sh.id,
                                                children: sh.name
                                            }, sh.id, false, {
                                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                                lineNumber: 319,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 317,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 315,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "btn small danger",
                                type: "button",
                                onClick: ()=>{
                                    if (confirm(`Remove ${it.name} from the shop?`)) void run({
                                        type: "item.remove",
                                        itemId: it.id
                                    }, `Removed ${it.name}.`);
                                },
                                children: "Remove"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 325,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 314,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 249,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ShopPanel.tsx",
        lineNumber: 247,
        columnNumber: 5
    }, this);
}
/** Special orders on their way up the coast. */ function OrdersBox() {
    const { view, run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const s = view.state;
    const pending = s.orders.filter((o)=>!o.arrived);
    if (!s.orders.length) return null;
    const name = (id)=>s.players.find((p)=>p.id === id)?.name ?? "someone who left";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Special orders"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 349,
                columnNumber: 7
            }, this),
            pending.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: [
                    "Nothing on its way. Arrived orders: ",
                    s.orders.length,
                    "."
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 350,
                columnNumber: 31
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "orders",
                children: pending.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                        children: o.itemName
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 355,
                                        columnNumber: 15
                                    }, this),
                                    " for ",
                                    name(o.playerId),
                                    " · arrives at session ",
                                    o.arrivesAtSession
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 354,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small primary",
                                        type: "button",
                                        onClick: ()=>run({
                                                type: "order.arrive",
                                                orderId: o.id
                                            }, `${o.itemName} has arrived.`),
                                        children: "It’s here"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 358,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "btn small",
                                        type: "button",
                                        onClick: ()=>{
                                            if (confirm(`Cancel ${o.itemName} and refund ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatCp"])(o.priceCp)} to ${name(o.playerId)}?`)) void run({
                                                type: "order.cancel",
                                                orderId: o.id,
                                                refund: true
                                            }, "Order cancelled and refunded.");
                                        },
                                        children: "Cancel and refund"
                                    }, void 0, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 361,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 357,
                                columnNumber: 13
                            }, this)
                        ]
                    }, o.id, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 353,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 351,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "note",
                children: "Orders arrive by themselves when their session starts. The TV says so."
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 374,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ShopPanel.tsx",
        lineNumber: 348,
        columnNumber: 5
    }, this);
}
function AddItem({ shopId, quiet }) {
    const { view, run, toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const blank = {
        shopId,
        name: "",
        price: "",
        description: "",
        tier: "sale",
        reason: "",
        hint: "",
        category: "gear",
        kind: "purchase"
    };
    const [f, setF] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(blank);
    const set = (k)=>(e)=>setF({
                ...f,
                [k]: e.target.value
            });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Add an item"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 386,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "form",
                onSubmit: async (e)=>{
                    e.preventDefault();
                    const cp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$money$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseAmount"])(f.price || "0");
                    if (!f.name.trim() || cp === null) return toast("Give the item a name and a price.");
                    const item = {
                        shopId: f.shopId,
                        name: f.name,
                        priceCp: cp,
                        description: f.description,
                        tier: f.tier,
                        reason: f.reason,
                        hint: f.hint,
                        category: f.category,
                        kind: f.kind
                    };
                    if (await run({
                        type: "item.add",
                        item,
                        quiet
                    }, `Added ${f.name}.`)) setF({
                        ...blank,
                        shopId: f.shopId
                    });
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Shop",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: f.shopId,
                                onChange: set("shopId"),
                                children: view.state.shops.map((sh)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: sh.id,
                                        children: sh.name
                                    }, sh.id, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 401,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 399,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 397,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Name",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: f.name,
                                onChange: set("name")
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 409,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 407,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Category",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: f.category,
                                onChange: set("category"),
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CATEGORIES"].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: c.id,
                                        children: c.label
                                    }, c.id, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 415,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 413,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 411,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Type",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: f.kind,
                                onChange: set("kind"),
                                children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$shared$2f$progress$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["KINDS"].map((k)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: k.id,
                                        children: k.label
                                    }, k.id, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 425,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 423,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 421,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            f.kind === "project" ? "Goal" : f.kind === "recurring" ? "Price per month" : f.kind === "training" ? "Total price" : "Price",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: f.price,
                                onChange: set("price"),
                                inputMode: "decimal",
                                placeholder: "gp, or 5 gp 3 sp"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 433,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 431,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Description",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: f.description,
                                onChange: set("description")
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 437,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 435,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Shown as",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "fld",
                                value: f.tier,
                                onChange: set("tier"),
                                children: TIERS.map(([t, l])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: t,
                                        children: l
                                    }, t, false, {
                                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                        lineNumber: 443,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 441,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 439,
                        columnNumber: 9
                    }, this),
                    f.tier === "locked" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Locked because",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: f.reason,
                                onChange: set("reason"),
                                placeholder: "e.g. Arrives at level 5"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 452,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 450,
                        columnNumber: 11
                    }, this) : null,
                    f.tier === "rumored" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "The rumor",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: f.hint,
                                onChange: set("hint"),
                                placeholder: "e.g. Someone in town has been watching you."
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 458,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 456,
                        columnNumber: 11
                    }, this) : null,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "note",
                        children: "Stock, lessons, effects and fine print are under Edit on the card once it’s added."
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 461,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn primary",
                        type: "submit",
                        children: "Add item"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 462,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 387,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ShopPanel.tsx",
        lineNumber: 385,
        columnNumber: 5
    }, this);
}
function AddShop() {
    const { run } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$dm$2f$context$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useDm"])();
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [subtitle, setSubtitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "box",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Add a shop"
            }, void 0, false, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 476,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                className: "form",
                onSubmit: async (e)=>{
                    e.preventDefault();
                    if (!name.trim()) return;
                    if (await run({
                        type: "shop.add",
                        name,
                        subtitle
                    }, `Added ${name}. It starts hidden.`)) {
                        setName("");
                        setSubtitle("");
                    }
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Name",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: name,
                                onChange: (e)=>setName(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 490,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 488,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: [
                            "Tagline",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                className: "fld",
                                value: subtitle,
                                onChange: (e)=>setSubtitle(e.target.value),
                                placeholder: "e.g. Everything smells of fish"
                            }, void 0, false, {
                                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                                lineNumber: 494,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 492,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "btn",
                        type: "submit",
                        children: "Add shop (starts hidden)"
                    }, void 0, false, {
                        fileName: "[project]/src/client/dm/ShopPanel.tsx",
                        lineNumber: 496,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/client/dm/ShopPanel.tsx",
                lineNumber: 477,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/client/dm/ShopPanel.tsx",
        lineNumber: 475,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/client/dm/context.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DmContext",
    ()=>DmContext,
    "useDm",
    ()=>useDm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const DmContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function useDm() {
    const c = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(DmContext);
    if (!c) throw new Error("useDm outside DmContext");
    return c;
}
}),
"[project]/src/client/dm/upload.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uploadImage",
    ()=>uploadImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/client/api.ts [app-ssr] (ecmascript)");
"use client";
;
let modePromise = null;
function uploadMode() {
    modePromise ??= fetch("/api/upload", {
        cache: "no-store"
    }).then((r)=>r.json()).then((d)=>d.mode).catch(()=>"local");
    return modePromise;
}
async function uploadImage(ident, file) {
    if (!file.type.startsWith("image/")) throw new Error("That isn't an image.");
    if (file.size > 25 * 1024 * 1024) throw new Error("That image is over 25 MB.");
    const mode = await uploadMode();
    if (mode === "blob") {
        const { upload } = await __turbopack_context__.A("[project]/node_modules/@vercel/blob/dist/client.js [app-ssr] (ecmascript, async loader)");
        const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "image";
        const blob = await upload(`${ident.game}/${safe}`, file, {
            access: "public",
            handleUploadUrl: `/api/upload?game=${encodeURIComponent(ident.game)}`,
            headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authHeaders"])(ident),
            contentType: file.type
        });
        return blob.url;
    }
    const form = new FormData();
    form.append("file", file);
    const r = await fetch(`/api/upload-local?game=${encodeURIComponent(ident.game)}`, {
        method: "POST",
        body: form,
        headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$client$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authHeaders"])(ident)
    });
    const data = await r.json();
    if (!r.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
    return data.url;
}
}),
];

//# sourceMappingURL=src_client_dm_0wnf0f07jbv__._.js.map