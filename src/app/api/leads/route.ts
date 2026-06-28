import { NextResponse } from "next/server";
import { DBService } from "@/shared/services/server/db-service";
import { leadSchema } from "@/shared/validation/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, collectionId, leadId, lead } = body;

    if (action === "save") {
      if (!collectionId || !lead) {
        return NextResponse.json({ error: "collectionId and lead data are required" }, { status: 400 });
      }

      // Validate lead details
      const result = leadSchema.safeParse(lead);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid lead details", details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const success = await DBService.saveLeadToCollection(collectionId, result.data);
      if (!success) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Lead saved successfully" });
    }

    if (action === "favorite") {
      if (!leadId) {
        return NextResponse.json({ error: "leadId is required" }, { status: 400 });
      }

      const isFavorited = await DBService.toggleFavorite(leadId);
      return NextResponse.json({ success: true, isFavorited });
    }

    if (action === "delete") {
      if (!collectionId || !leadId) {
        return NextResponse.json({ error: "collectionId and leadId are required" }, { status: 400 });
      }

      const success = await DBService.removeLeadFromCollection(collectionId, leadId);
      if (!success) {
        return NextResponse.json({ error: "Collection or lead not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Lead removed from collection" });
    }

    return NextResponse.json({ error: "Invalid or unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Leads API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
