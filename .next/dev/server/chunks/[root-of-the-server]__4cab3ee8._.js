module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/proxy/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const BASE_URL = "https://api.livedatanow.com/api/online-order";
async function GET(request, { params }) {
    try {
        const { path: pathArray } = await params;
        const path = pathArray.join("/");
        const searchParams = request.nextUrl.searchParams.toString();
        const url = `${BASE_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;
        console.log("[v0] API Proxy GET:", url);
        const token = request.headers.get("authorization");
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = token;
        }
        const response = await fetch(url, {
            method: "GET",
            headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorData.message || errorText;
            } catch  {
                errorMessage = errorText || response.statusText || `HTTP ${response.status}`;
            }
            console.error("[v0] API Proxy GET error:", errorMessage);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: errorMessage
            }, {
                status: response.status
            });
        }
        const data = await response.json();
        console.log("[v0] API Proxy GET response:", JSON.stringify(data).substring(0, 200));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error("[v0] API Proxy GET exception:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch from external API"
        }, {
            status: 500
        });
    }
}
async function POST(request, { params }) {
    try {
        const { path: pathArray } = await params;
        const path = pathArray.join("/");
        const url = `${BASE_URL}/${path}`;
        const body = await request.text();
        console.log("[v0] API Proxy POST:", url);
        console.log("[v0] API Proxy POST body:", body);
        const token = request.headers.get("authorization");
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = token;
        }
        const response = await fetch(url, {
            method: "POST",
            headers,
            body
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorData.message || errorText;
            } catch  {
                errorMessage = errorText || response.statusText || `HTTP ${response.status}`;
            }
            console.error("[v0] API Proxy POST error:", errorMessage);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: errorMessage
            }, {
                status: response.status
            });
        }
        const data = await response.json();
        console.log("[v0] API Proxy POST response:", JSON.stringify(data));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error("[v0] API Proxy POST exception:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch from external API"
        }, {
            status: 500
        });
    }
}
async function PUT(request, { params }) {
    try {
        const { path: pathArray } = await params;
        const path = pathArray.join("/");
        const url = `${BASE_URL}/${path}`;
        const body = await request.text();
        console.log("[v0] API Proxy PUT:", url);
        const token = request.headers.get("authorization");
        const headers = {
            "Content-Type": "application/json"
        };
        if (token) {
            headers["Authorization"] = token;
        }
        const response = await fetch(url, {
            method: "PUT",
            headers,
            body
        });
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorData.message || errorText;
            } catch  {
                errorMessage = errorText || response.statusText || `HTTP ${response.status}`;
            }
            console.error("[v0] API Proxy PUT error:", errorMessage);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: errorMessage
            }, {
                status: response.status
            });
        }
        const data = await response.json();
        console.log("[v0] API Proxy PUT response:", JSON.stringify(data).substring(0, 200));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(data);
    } catch (error) {
        console.error("[v0] API Proxy PUT exception:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to fetch from external API"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__4cab3ee8._.js.map