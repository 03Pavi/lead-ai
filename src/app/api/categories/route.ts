import { NextResponse } from "next/server";
import { workerQuery } from "@/shared/services/server/worker-service";

const FALLBACK_CATEGORIES = [
  "accountant", "bakery", "bank", "bar", "beauty", "bookstore", "cafe",
  "car_dealer", "car_repair", "cinema", "clothing", "coworking", "dentist",
  "doctor", "electronics", "florist", "furniture", "gallery", "gas_station",
  "guest_house", "gym", "hairdresser", "hospital", "hostel", "hotel",
  "insurance", "lawyer", "museum", "parking", "pet_shop", "pharmacy",
  "real_estate", "restaurant", "school", "supermarket", "theatre", "university",
];

export async function GET() {
  // 1. Ask the Worker for the categories list
  try {
    const res = await workerQuery("List all available business categories");
    const categories = res.result?.categories;
    if (Array.isArray(categories) && categories.length > 0) {
      return NextResponse.json({ success: true, categories, source: "worker" });
    }
  } catch (err) {
    console.warn("Worker categories fetch failed, using static list:", err);
  }

  // 2. Static fallback
  return NextResponse.json({ success: true, categories: FALLBACK_CATEGORIES, source: "fallback" });
}
