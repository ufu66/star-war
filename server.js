const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SWAPI_BASE_URL = "https://swapi.dev/api";
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 256;
const MAX_PAGES = 50;
const ALLOWED_RESOURCES = new Set(["people", "films", "starships", "species", "planets"]);
const responseCache = new Map();
const pendingRequests = new Map();
const DIST_DIR = path.join(__dirname, "dist");

class UpstreamError extends Error {
    constructor(message, status = 502) {
        super(message);
        this.status = status;
    }
}

function getCached(key) {
    const entry = responseCache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
        responseCache.delete(key);
        return undefined;
    }

    responseCache.delete(key);
    responseCache.set(key, entry);
    return entry.value;
}

function setCached(key, value) {
    responseCache.delete(key);
    responseCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

    while (responseCache.size > CACHE_MAX_ENTRIES) {
        responseCache.delete(responseCache.keys().next().value);
    }
}

async function getCachedOrFetch(key, fetcher) {
    const cached = getCached(key);
    if (cached !== undefined) return cached;

    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    const request = fetcher()
        .then((value) => {
            setCached(key, value);
            return value;
        })
        .finally(() => pendingRequests.delete(key));
    pendingRequests.set(key, request);
    return request;
}

async function fetchSwapiJson(url) {
    let response;
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    } catch (error) {
        const reason = error.name === "TimeoutError" ? "SWAPI ใช้เวลาตอบสนองนานเกินไป" : "เชื่อมต่อ SWAPI ไม่สำเร็จ";
        throw new UpstreamError(reason, 502);
    }

    if (!response.ok) {
        throw new UpstreamError(`SWAPI ตอบกลับด้วยสถานะ ${response.status}`, response.status === 404 ? 404 : 502);
    }

    try {
        return await response.json();
    } catch {
        throw new UpstreamError("SWAPI ส่งข้อมูลที่ไม่ใช่ JSON", 502);
    }
}

async function fetchCollection(resource) {
    const results = [];
    let page = 1;
    let expectedCount = null;

    while (page <= MAX_PAGES) {
        const payload = await fetchSwapiJson(`${SWAPI_BASE_URL}/${resource}/?page=${page}`);
        if (!Array.isArray(payload.results)) {
            throw new UpstreamError(`รูปแบบข้อมูล ${resource} จาก SWAPI ไม่ถูกต้อง`, 502);
        }

        expectedCount = payload.count;
        results.push(...payload.results);
        if (!payload.next) {
            return { count: expectedCount ?? results.length, results };
        }
        page++;
    }

    throw new UpstreamError(`ข้อมูล ${resource} มีจำนวนหน้ามากกว่าที่ระบบรองรับ`, 502);
}

function validateResource(resource) {
    return typeof resource === "string" && ALLOWED_RESOURCES.has(resource);
}

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        cache: {
            entries: responseCache.size,
            inFlight: pendingRequests.size,
            maxEntries: CACHE_MAX_ENTRIES,
            ttlMs: CACHE_TTL_MS
        }
    });
});

app.get("/api/:resource", async (req, res, next) => {
    const { resource } = req.params;
    if (!validateResource(resource)) {
        res.status(400).json({ error: "ไม่รองรับข้อมูลประเภทนี้" });
        return;
    }

    try {
        const data = await getCachedOrFetch(`collection:${resource}`, () => fetchCollection(resource));
        res.set("Cache-Control", "public, max-age=60");
        res.json(data);
    } catch (error) {
        next(error);
    }
});

app.get("/api/:resource/:id", async (req, res, next) => {
    const { resource, id } = req.params;
    if (!validateResource(resource) || !/^[1-9]\d{0,8}$/.test(id)) {
        res.status(400).json({ error: "ประเภทข้อมูลหรือรหัสรายการไม่ถูกต้อง" });
        return;
    }

    try {
        const data = await getCachedOrFetch(`resource:${resource}:${id}`, () =>
            fetchSwapiJson(`${SWAPI_BASE_URL}/${resource}/${id}/`)
        );
        res.set("Cache-Control", "public, max-age=60");
        res.json(data);
    } catch (error) {
        next(error);
    }
});

app.use("/api", (_req, res) => {
    res.status(404).json({ error: "ไม่พบ API endpoint" });
});

app.use(express.static(DIST_DIR, { fallthrough: true }));
app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
        next();
        return;
    }

    res.sendFile(path.join(DIST_DIR, "index.html"), (error) => {
        if (error) next(error);
    });
});

app.use((error, _req, res, _next) => {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) {
        console.error(`[api] ${error.message}`);
    }
    res.status(status).json({ error: error.message || "เกิดข้อผิดพลาดในระบบ" });
});

app.listen(PORT, () => {
    console.log(`Star Wars API server listening at http://localhost:${PORT}`);
});
