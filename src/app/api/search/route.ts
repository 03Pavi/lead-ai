import { NextResponse } from "next/server";
import { searchRequestSchema } from "@/shared/validation/schemas";
import { CacheService } from "@/shared/services/server/cache-service";
import { workerQuery, normaliseWorkerBusiness } from "@/shared/services/server/worker-service";
import { DBService } from "@/shared/services/server/db-service";
import { AuthService } from "@/shared/services/server/auth-service";

// IP-based token-bucket rate limiter
const rateLimitMap = new Map<string, { tokens: number; lastRefill: number }>();
const LIMIT_MAX_TOKENS = 15;
const LIMIT_REFILL_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const client = rateLimitMap.get(ip) || { tokens: LIMIT_MAX_TOKENS, lastRefill: now };
  const refilled = Math.floor((now - client.lastRefill) / LIMIT_REFILL_MS);
  if (refilled > 0) {
    client.tokens = Math.min(LIMIT_MAX_TOKENS, client.tokens + refilled);
    client.lastRefill = now - ((now - client.lastRefill) % LIMIT_REFILL_MS);
  }
  if (client.tokens <= 0) { rateLimitMap.set(ip, client); return true; }
  client.tokens -= 1;
  rateLimitMap.set(ip, client);
  return false;
}

export async function POST(request: Request) {
  try {
    // ── Auth (optional bearer token check) ──────────────────────────────────
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace(/^bearer\s+/i, "");
    if (token && !AuthService.verifyAccessToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limit ───────────────────────────────────────────────────────────
    const ip = request.headers.get("x-forwarded-for") || "local";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before searching again." },
        { status: 429 }
      );
    }

    // ── Validate body ────────────────────────────────────────────────────────
    const body = await request.json();
    const parsed = searchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { query, filters } = parsed.data;

    // ── Cache check ──────────────────────────────────────────────────────────
    const cacheKey = `search:${query.toLowerCase()}:${JSON.stringify(filters || {})}`;
    const cached = CacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, cached: true, ...(cached as object) });
    }

    // ── Build the NL query sent to the Worker ────────────────────────────────
    // Append any explicit UI filters as natural-language hints so the Worker
    // can consider them (it's the source of truth for routing/parsing).
    let workerQuery_ = query;
    if (filters?.lat && filters?.lng) {
      workerQuery_ += ` near me: Latitude: ${filters.lat}, Longitude: ${filters.lng}`;
    }
    if (filters?.category) workerQuery_ += ` category:${filters.category}`;
    if (filters?.city)     workerQuery_ += ` in ${filters.city}`;
    if (filters?.radius)   workerQuery_ += ` within ${filters.radius} km`;

    // ── Call the Cloudflare Worker (primary) ─────────────────────────────────
    let leads: any[] = [];
    let plan: any = null;
    let requestUrl: string | undefined;
    let workerResult: any = null;
    let source = "worker";

    try {
      const workerRes = await workerQuery(workerQuery_);

      if (workerRes.success && workerRes.result) {
        plan = workerRes.plan;
        requestUrl = (workerRes as any).request_url;
        workerResult = workerRes.result;
        const raw = workerRes.result.businesses ?? workerRes.result.results ?? [];
        leads = raw.map(normaliseWorkerBusiness);
      }
    } catch (err) {
      console.warn("Worker failed:", err);
      source = "error";
    }

    // ── Client-side filter pass (website / phone) ────────────────────────────
    if (filters?.websiteAvailable !== undefined) {
      leads = leads.filter((l) => filters.websiteAvailable ? !!l.website : !l.website);
    }
    if (filters?.phoneAvailable !== undefined) {
      leads = leads.filter((l) => filters.phoneAvailable ? !!l.phone : !l.phone);
    }

    // ── Derive query details from Worker plan (or use defaults) ──────────────
    const category = plan?.params?.category || filters?.category || "business";
    const city     = plan?.params?.location || filters?.city || "location";
    const limit    = plan?.params?.limit || leads.length;
    const parsedSummary = `${category} in ${city} (${limit} results)`;

    // ── Log & save search ────────────────────────────────────────────────────
    await DBService.addLog("search", `Searched: "${query}"`);
    await DBService.saveSearch(query, parsedSummary);

    const payload = {
      leads,
      source,
      queryDetails: {
        category,
        city,
        limit,
        parsedFilters: {
          websiteAvailable: filters?.websiteAvailable,
          phoneAvailable: filters?.phoneAvailable,
          openingNow: filters?.openingNow,
          maxDistance: filters?.distance ?? filters?.radius,
        },
        explanation: plan
          ? `Worker routed to ${plan.endpoint} with ${JSON.stringify(plan.params)}`
          : "Fallback search",
        source: source as any,
        plan,
        requestUrl,
        total: workerResult?.total,
        locationResolved: workerResult?.location_resolved,
        dataQuality: workerResult?.data_quality,
      },
    };

    // ── Cache for 10 mins ────────────────────────────────────────────────────
    CacheService.set(cacheKey, payload);

    return NextResponse.json({ success: true, cached: false, ...payload });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
