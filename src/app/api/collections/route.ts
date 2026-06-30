import { NextResponse } from "next/server";
import { DBService } from "@/shared/services/server/db-service";
import { createCollectionSchema, createFolderSchema } from "@/shared/validation/schemas";
import { getUserIdFromRequest } from "@/shared/services/server/auth-helper";

const FALLBACK_USER_ID = "anonymous";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request) || FALLBACK_USER_ID;
    const { searchParams } = new URL(request.url);
    const metrics = searchParams.get("metrics") === "true";

    if (metrics) {
      const telemetry = await DBService.getTelemetryMetrics(userId);
      const logs = await DBService.getActivityLogs(userId);
      const savedSearches = await DBService.getSavedSearches(userId);
      return NextResponse.json({
        success: true,
        metrics: telemetry,
        logs,
        savedSearches,
      });
    }

    const folders = await DBService.getFolders(userId);
    const collections = await DBService.getCollections(userId);
    const favorites = await DBService.getFavorites(userId);
    const savedSearches = await DBService.getSavedSearches(userId);

    return NextResponse.json({
      success: true,
      folders,
      collections,
      favorites,
      savedSearches,
    });
  } catch (error) {
    console.error("Collections GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === "collection") {
      const result = createCollectionSchema.safeParse(data);
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const collection = await DBService.createCollection(userId, result.data);
      return NextResponse.json({ success: true, collection });
    }

    if (type === "folder") {
      const result = createFolderSchema.safeParse(data);
      if (!result.success) {
        return NextResponse.json(
          { error: "Validation failed", details: result.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const folder = await DBService.createFolder(userId, result.data);
      return NextResponse.json({ success: true, folder });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    console.error("Collections POST Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required for updates" }, { status: 400 });
    }

    if (type === "collection") {
      const updated = await DBService.updateCollection(userId, id, updates);
      if (!updated) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, collection: updated });
    }

    return NextResponse.json({ error: "Invalid or unsupported update type" }, { status: 400 });
  } catch (error) {
    console.error("Collections PUT Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id || !type) {
      return NextResponse.json({ error: "id and type are required" }, { status: 400 });
    }

    if (type === "collection") {
      await DBService.deleteCollection(userId, id);
      return NextResponse.json({ success: true, message: "Collection deleted successfully" });
    }

    if (type === "folder") {
      await DBService.deleteFolder(userId, id);
      return NextResponse.json({ success: true, message: "Folder deleted successfully" });
    }

    return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
  } catch (error) {
    console.error("Collections DELETE Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
