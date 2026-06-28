import { NextResponse } from "next/server";
import { DBService } from "@/shared/services/server/db-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { collectionId, format } = body;

    if (!collectionId || !format) {
      return NextResponse.json({ error: "collectionId and format are required" }, { status: 400 });
    }

    const collections = await DBService.getCollections();
    const collection = collections.find(c => c.id === collectionId);

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const leads = collection.leads;
    const filename = `${collection.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-export`;

    // Add log entry
    await DBService.addLog("export", `Exported collection '${collection.name}' to ${format.toUpperCase()}`);

    // --- CSV FORMAT ---
    if (format === "csv") {
      const headers = ["Name", "Category", "Address", "Phone", "Website", "Opening Hours", "Latitude", "Longitude", "Rating", "Reviews"];
      const rows = leads.map(l => [
        `"${l.name.replace(/"/g, '""')}"`,
        `"${l.category.replace(/"/g, '""')}"`,
        `"${l.address.replace(/"/g, '""')}"`,
        `"${(l.phone || "").replace(/"/g, '""')}"`,
        `"${(l.website || "").replace(/"/g, '""')}"`,
        `"${(l.openingHours || "").replace(/"/g, '""')}"`,
        l.coordinates.lat,
        l.coordinates.lng,
        l.rating || 0,
        l.reviewCount || 0,
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // --- EXCEL FORMAT ---
    if (format === "excel") {
      let xml = `xmlns:o="urn:schemas-microsoft-com:office:office"\r\n`;
      xml += `xmlns:x="urn:schemas-microsoft-com:office:excel"\r\n`;
      xml += `xmlns="http://www.w3.org/TR/REC-html40">\r\n`;
      xml += `<head>\r\n`;
      xml += `<!--[if gte mso 9]><xml>\r\n`;
      xml += `<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>\r\n`;
      xml += `<x:Name>${collection.name.substring(0, 30)}</x:Name>\r\n`;
      xml += `<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>\r\n`;
      xml += `</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>\r\n`;
      xml += `</xml><![endif]-->\r\n`;
      xml += `<style>\r\n`;
      xml += `  table { border-collapse: collapse; font-family: sans-serif; }\r\n`;
      xml += `  th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; }\r\n`;
      xml += `  td { border: 1px solid #e2e8f0; padding: 6px 8px; color: #334155; }\r\n`;
      xml += `</style>\r\n`;
      xml += `</head>\r\n`;
      xml += `<body>\r\n`;
      xml += `<h2>LeadLens AI - ${collection.name} Leads</h2>\r\n`;
      xml += `<p>Generated on: ${new Date().toLocaleDateString()}</p>\r\n`;
      xml += `<table>\r\n`;
      xml += `  <thead>\r\n`;
      xml += `    <tr>\r\n`;
      xml += `      <th>Name</th><th>Category</th><th>Address</th><th>Phone</th><th>Website</th><th>Rating</th><th>Reviews</th><th>Distance (km)</th>\r\n`;
      xml += `    </tr>\r\n`;
      xml += `  </thead>\r\n`;
      xml += `  <tbody>\r\n`;
      
      leads.forEach(l => {
        xml += `    <tr>\r\n`;
        xml += `      <td>${l.name}</td>\r\n`;
        xml += `      <td>${l.category}</td>\r\n`;
        xml += `      <td>${l.address}</td>\r\n`;
        xml += `      <td>${l.phone || "-"}</td>\r\n`;
        xml += `      <td>${l.website || "-"}</td>\r\n`;
        xml += `      <td>${l.rating || "-"}</td>\r\n`;
        xml += `      <td>${l.reviewCount || "-"}</td>\r\n`;
        xml += `      <td>${l.distance || "-"}</td>\r\n`;
        xml += `    </tr>\r\n`;
      });
      
      xml += `  </tbody>\r\n`;
      xml += `</table>\r\n`;
      xml += `</body>\r\n`;
      xml += `</html>`;

      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${filename}.xls"`,
        },
      });
    }

    // --- PDF / PRINT HTML LAYOUT ---
    if (format === "pdf") {
      let html = `<!DOCTYPE html>\r\n`;
      html += `<html>\r\n`;
      html += `<head>\r\n`;
      html += `  <title>LeadLens AI Report - ${collection.name}</title>\r\n`;
      html += `  <style>\r\n`;
      html += `    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; line-height: 1.5; padding: 40px; max-width: 900px; margin: 0 auto; }\r\n`;
      html += `    header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }\r\n`;
      html += `    .brand { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.025em; }\r\n`;
      html += `    .meta { font-size: 14px; color: #6b7280; text-align: right; }\r\n`;
      html += `    h1 { font-size: 28px; font-weight: 700; margin: 0 0 10px 0; color: #111827; letter-spacing: -0.025em; }\r\n`;
      html += `    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }\r\n`;
      html += `    .summary-card { background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 15px; text-align: center; }\r\n`;
      html += `    .summary-val { font-size: 24px; font-weight: 700; color: #111827; }\r\n`;
      html += `    .summary-lbl { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-top: 5px; }\r\n`;
      html += `    table { width: 100%; border-collapse: collapse; margin-top: 20px; }\r\n`;
      html += `    th { text-align: left; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 12px 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #4b5563; }\r\n`;
      html += `    td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: top; }\r\n`;
      html += `    .lead-name { font-weight: 600; color: #111827; }\r\n`;
      html += `    .lead-meta { font-size: 12px; color: #6b7280; margin-top: 3px; }\r\n`;
      html += `    .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: 500; border-radius: 4px; background-color: #eff6ff; color: #1e40af; }\r\n`;
      html += `    @media print {\r\n`;
      html += `      body { padding: 0; }\r\n`;
      html += `      button { display: none; }\r\n`;
      html += `      .no-print { display: none; }\r\n`;
      html += `    }\r\n`;
      html += `  </style>\r\n`;
      html += `</head>\r\n`;
      html += `<body>\r\n`;
      html += `  <div class="no-print" style="margin-bottom: 20px; text-align: right;">\r\n`;
      html += `    <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print Report / Save to PDF</button>\r\n`;
      html += `  </div>\r\n`;
      html += `  <header>\r\n`;
      html += `    <div>\r\n`;
      html += `      <span class="brand">LeadLens AI</span>\r\n`;
      html += `      <h1>${collection.name}</h1>\r\n`;
      html += `      <p style="margin: 0; color: #4b5563;">${collection.description || "Business discovery export list"}</p>\r\n`;
      html += `    </div>\r\n`;
      html += `    <div class="meta">\r\n`;
      html += `      <p style="margin: 0 0 5px 0;">Generated: <strong>${new Date().toLocaleDateString()}</strong></p>\r\n`;
      html += `      <p style="margin: 0;">Total Leads: <strong>${leads.length}</strong></p>\r\n`;
      html += `    </div>\r\n`;
      html += `  </header>\r\n`;
      html += `  <div class="summary-grid">\r\n`;
      html += `    <div class="summary-card">\r\n`;
      html += `      <div class="summary-val">${leads.length}</div>\r\n`;
      html += `      <div class="summary-lbl">Total Prospects</div>\r\n`;
      html += `    </div>\r\n`;
      html += `    <div class="summary-card">\r\n`;
      const avgRating = leads.length > 0 ? (leads.reduce((s, l) => s + (l.rating || 0), 0) / leads.length).toFixed(1) : "0.0";
      html += `      <div class="summary-val">${avgRating} ★</div>\r\n`;
      html += `      <div class="summary-lbl">Average Rating</div>\r\n`;
      html += `    </div>\r\n`;
      html += `    <div class="summary-card">\r\n`;
      const withWeb = leads.filter(l => !!l.website).length;
      html += `      <div class="summary-val">${withWeb} / ${leads.length}</div>\r\n`;
      html += `      <div class="summary-lbl">Websites Available</div>\r\n`;
      html += `    </div>\r\n`;
      html += `  </div>\r\n`;
      html += `  <table>\r\n`;
      html += `    <thead>\r\n`;
      html += `      <tr>\r\n`;
      html += `        <th style="width: 25%;">Business</th>\r\n`;
      html += `        <th style="width: 40%;">Contact details</th>\r\n`;
      html += `        <th style="width: 20%;">Category & Rating</th>\r\n`;
      html += `      </tr>\r\n`;
      html += `    </thead>\r\n`;
      html += `    <tbody>\r\n`;

      leads.forEach(l => {
        html += `      <tr>\r\n`;
        html += `        <td>\r\n`;
        html += `          <div class="lead-name">${l.name}</div>\r\n`;
        html += `          <div style="font-size: 12px; color: #4b5563; margin-top: 5px;">${l.address}</div>\r\n`;
        html += `        </td>\r\n`;
        html += `        <td>\r\n`;
        html += `          <div class="lead-meta">Phone: <strong>${l.phone || "-"}</strong></div>\r\n`;
        html += `          <div class="lead-meta">Web: <strong>${l.website || "-"}</strong></div>\r\n`;
        html += `        </td>\r\n`;
        html += `        <td>\r\n`;
        html += `          <span class="badge">${l.category}</span>\r\n`;
        html += `          <div style="font-size: 13px; font-weight: bold; margin-top: 5px; color: #b45309;">${l.rating || 0} ★ <span style="font-size:11px; font-weight:normal; color:#6b7280;">(${l.reviewCount || 0})</span></div>\r\n`;
        html += `        </td>\r\n`;
        html += `      </tr>\r\n`;
      });

      html += `    </tbody>\r\n`;
      html += `  </table>\r\n`;
      html += `  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</script>\r\n`;
      html += `</body>\r\n`;
      html += `</html>\r\n`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
