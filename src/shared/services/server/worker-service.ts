/**
 * WorkerService — all business search goes through the Cloudflare Worker.
 * The Worker handles NL query parsing, routing, and data fetching internally.
 *
 * POST https://ai-lead.03pavitar-dev.workers.dev
 * Body: { query: string }
 * Response: { success, userQuery, plan, result }
 */

const WORKER_URL =
  process.env.WORKER_API_URL || "https://ai-lead.03pavitar-dev.workers.dev";

export interface WorkerPlan {
  endpoint: "/api/businesses" | "/api/count" | "/api/categories" | string;
  params: {
    location?: string;
    category?: string;
    categories?: string;
    limit?: number;
    radius_km?: number;
    [key: string]: any;
  };
}

export interface WorkerResponse {
  success: boolean;
  userQuery: string;
  plan: WorkerPlan;
  result: {
    businesses?: any[];
    count?: number;
    total?: number;
    categories?: string[];
    [key: string]: any;
  };
  error?: string;
}

/**
 * Send any natural-language query to the Cloudflare Worker.
 * The Worker decides which bizdata endpoint to call and returns the result.
 */
export async function workerQuery(query: string): Promise<WorkerResponse> {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch (err) {
    data = { error: text || `Failed to parse response (HTTP ${res.status})` };
  }

  if (!res.ok) {
    throw new Error(data.error || `Worker returned HTTP ${res.status}`);
  }

  return data as WorkerResponse;
}

/**
 * Normalise a raw business object from the Worker / bizdata API
 * into the LeadInput shape the rest of the app expects.
 */
export function normaliseWorkerBusiness(b: any, index: number): any {
  return {
    id: String(b.osm_id ?? b.id ?? `w-${index}`),
    name: b.name ?? "Unknown Business",
    category: b.category ?? "unknown",
    address: ([b.address, b.city, b.country].filter(Boolean).join(", ") || b.addr) ?? "",
    phone: b.phone ?? b.contact_phone ?? "",
    website: b.website ?? b.contact_website ?? "",
    openingHours: b.opening_hours ?? b.openingHours ?? "",
    coordinates: {
      lat: Number(b.lat ?? b.latitude ?? 0),
      lng: Number(b.lon ?? b.lng ?? b.longitude ?? 0),
    },
    rating: b.rating ?? null,
    reviewCount: b.review_count ?? b.reviewCount ?? 0,
    distance: b.distance ?? null,
  };
}
