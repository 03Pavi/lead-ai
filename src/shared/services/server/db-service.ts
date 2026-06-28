import { LeadInput, CollectionInput, FolderInput } from "../../validation/schemas";
import { db, useRealFirebase } from "./firebase-service";

export interface ActivityLog {
  id: string;
  type: "search" | "collection_create" | "lead_save" | "export";
  description: string;
  timestamp: string;
}

export interface SavedSearch {
  id: string;
  query: string;
  parsedSummary: string;
  createdAt: string;
}

// In-Memory Fallback State (Mock Firestore Database)
let localFolders: FolderInput[] = [
  {
    id: "folder-uk",
    name: "UK Expansion Q3",
    description: "Leads for our dental software sales push in London",
    collectionIds: ["col-lon-dent"],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "folder-asia",
    name: "APAC Restaurants",
    description: "Target restaurants for reservation engine sales",
    collectionIds: ["col-tok-rest"],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const seedLeadsMap: Record<string, LeadInput[]> = {
  "col-lon-dent": [
    {
      id: "lon-dent-1",
      name: "London Smile Care",
      category: "dentist",
      address: "24 Harley St, London W1G 9HP, UK",
      phone: "+44 20 7935 5555",
      website: "https://londonsmilecare.co.uk",
      openingHours: "Mon-Fri: 09:00 - 18:00, Sat: 09:00 - 13:00",
      coordinates: { lat: 51.5205, lng: -0.1456 },
      rating: 4.8,
      reviewCount: 142,
      distance: 1.2,
    },
    {
      id: "lon-dent-2",
      name: "Harley Street Dental Studio",
      category: "dentist",
      address: "52 Harley St, London W1G 9QY, UK",
      phone: "+44 20 7636 5981",
      website: "https://harleystreetdentalstudio.org.uk",
      openingHours: "Mon-Thu: 08:30 - 18:00, Fri: 08:30 - 17:00",
      coordinates: { lat: 51.5218, lng: -0.1462 },
      rating: 4.9,
      reviewCount: 318,
      distance: 1.5,
    }
  ],
  "col-tok-rest": [
    {
      id: "tok-rest-1",
      name: "Shinya Ramen",
      category: "restaurant",
      address: "1-13-8 Nishi-Shinjuku, Tokyo 160-0023, Japan",
      phone: "+81 3-3349-2624",
      website: "https://shinyaramen.jp",
      openingHours: "Mon-Sun: 11:00 - 23:00",
      coordinates: { lat: 35.6898, lng: 139.6967 },
      rating: 4.6,
      reviewCount: 890,
      distance: 0.8,
    }
  ]
};

let localCollections: CollectionInput[] = [
  {
    id: "col-lon-dent",
    name: "London Dentists",
    description: "Harley Street area high-rating clinics",
    folderId: "folder-uk",
    leads: seedLeadsMap["col-lon-dent"],
    isArchived: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "col-tok-rest",
    name: "Tokyo Ramen Shops",
    description: "Central Shinjuku ramen spots with websites",
    folderId: "folder-asia",
    leads: seedLeadsMap["col-tok-rest"],
    isArchived: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "col-archived-1",
    name: "Old Gyms Berlin",
    description: "Archived lead collection",
    leads: [],
    isArchived: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

let localFavorites: Set<string> = new Set(["lon-dent-1"]);

let localActivityLogs: ActivityLog[] = [
  {
    id: "log-1",
    type: "export",
    description: "Exported 52 London Dentists leads to Excel",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "log-2",
    type: "lead_save",
    description: "Saved 'Harley Street Dental Studio' to London Dentists collection",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-3",
    type: "search",
    description: "Searched: 'Find bakeries without websites in Paris'",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "log-4",
    type: "collection_create",
    description: "Created collection 'Tokyo Ramen Shops'",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

let localSavedSearches: SavedSearch[] = [
  {
    id: "search-1",
    query: "Find 300 dentists in London",
    parsedSummary: "dentist in London (Limit: 300)",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "search-2",
    query: "Find bakeries without websites in Paris",
    parsedSummary: "bakery in Paris (Without website, Limit: 50)",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Haversine Distance helper
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export class DBService {
  // --- Folders CRUD ---
  static async getFolders(): Promise<FolderInput[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref("folders").once("value");
        if (snap.exists()) {
          const data = snap.val();
          return Object.values(data).map((f: any) => ({
            ...f,
            collectionIds: f.collectionIds || [],
          })) as FolderInput[];
        }
        return [];
      } catch (err) {
        console.error("Realtime DB getFolders failed:", err);
      }
    }
    return localFolders;
  }

  static async createFolder(data: { name: string; description?: string }): Promise<FolderInput> {
    const newFolder: FolderInput = {
      id: `folder-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description || "",
      collectionIds: [],
      createdAt: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(`folders/${newFolder.id}`).set(newFolder);
      } catch (err) {
        console.error("Realtime DB createFolder failed:", err);
      }
    } else {
      localFolders.push(newFolder);
    }

    await this.addLog("collection_create", `Created folder '${newFolder.name}'`);
    return newFolder;
  }

  static async deleteFolder(id: string): Promise<void> {
    let folderName = "";

    if (useRealFirebase && db) {
      try {
        const folderRef = db.ref(`folders/${id}`);
        const folderSnap = await folderRef.once("value");
        if (folderSnap.exists()) {
          folderName = (folderSnap.val() as FolderInput).name;
          await folderRef.remove();
          
          // Remove folder references from collections
          const colsSnap = await db.ref("collections").once("value");
          if (colsSnap.exists()) {
            const collectionsVal = colsSnap.val();
            const updates: Record<string, any> = {};
            for (const key of Object.keys(collectionsVal)) {
              if (collectionsVal[key].folderId === id) {
                updates[`collections/${key}/folderId`] = "";
              }
            }
            if (Object.keys(updates).length > 0) {
              await db.ref().update(updates);
            }
          }
        }
      } catch (err) {
        console.error("Realtime DB deleteFolder failed:", err);
      }
    } else {
      const folder = localFolders.find((f) => f.id === id);
      if (folder) {
        folderName = folder.name;
        localFolders = localFolders.filter((f) => f.id !== id);
        localCollections = localCollections.map((c) =>
          c.folderId === id ? { ...c, folderId: undefined } : c
        );
      }
    }

    if (folderName) {
      await this.addLog("collection_create", `Deleted folder '${folderName}'`);
    }
  }

  // --- Collections CRUD ---
  static async getCollections(): Promise<CollectionInput[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref("collections").once("value");
        if (snap.exists()) {
          const data = snap.val();
          return Object.values(data).map((c: any) => ({
            ...c,
            leads: c.leads || [],
          })) as CollectionInput[];
        }
        return [];
      } catch (err) {
        console.error("Realtime DB getCollections failed:", err);
      }
    }
    return localCollections;
  }

  static async createCollection(data: { name: string; description?: string; folderId?: string }): Promise<CollectionInput> {
    const newCol: CollectionInput = {
      id: `col-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description || "",
      folderId: data.folderId || null,
      leads: [],
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(`collections/${newCol.id}`).set(newCol);
        if (data.folderId) {
          const folderRef = db.ref(`folders/${data.folderId}`);
          const fSnap = await folderRef.once("value");
          if (fSnap.exists()) {
            const f = fSnap.val() as FolderInput;
            const collectionIds = f.collectionIds || [];
            await folderRef.update({ collectionIds: [...collectionIds, newCol.id] });
          }
        }
      } catch (err) {
        console.error("Realtime DB createCollection failed:", err);
      }
    } else {
      localCollections.push(newCol);
      if (data.folderId) {
        localFolders = localFolders.map((f) =>
          f.id === data.folderId ? { ...f, collectionIds: [...(f.collectionIds || []), newCol.id] } : f
        );
      }
    }

    await this.addLog("collection_create", `Created collection '${newCol.name}'`);
    return newCol;
  }

  static async updateCollection(id: string, updates: Partial<CollectionInput>): Promise<CollectionInput | undefined> {
    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(`collections/${id}`);
        const colSnap = await colRef.once("value");
        if (!colSnap.exists()) return undefined;

        const old = colSnap.val() as CollectionInput;
        await colRef.update(updates);
        const updated = { ...old, ...updates };

        if (updates.folderId !== undefined && updates.folderId !== old.folderId) {
          if (old.folderId) {
            const oldFolderRef = db.ref(`folders/${old.folderId}`);
            const fSnap = await oldFolderRef.once("value");
            if (fSnap.exists()) {
              const f = fSnap.val() as FolderInput;
              const collectionIds = (f.collectionIds || []).filter(cid => cid !== id);
              await oldFolderRef.update({ collectionIds });
            }
          }
          if (updates.folderId) {
            const newFolderRef = db.ref(`folders/${updates.folderId}`);
            const fSnap = await newFolderRef.once("value");
            if (fSnap.exists()) {
              const f = fSnap.val() as FolderInput;
              const collectionIds = [...(f.collectionIds || []), id];
              await newFolderRef.update({ collectionIds });
            }
          }
        }
        return updated;
      } catch (err) {
        console.error("Realtime DB updateCollection failed:", err);
      }
    } else {
      const idx = localCollections.findIndex((c) => c.id === id);
      if (idx === -1) return undefined;

      const old = localCollections[idx];
      const updated = { ...old, ...updates };
      localCollections[idx] = updated;

      if (updates.folderId !== undefined && updates.folderId !== old.folderId) {
        if (old.folderId) {
          localFolders = localFolders.map((f) =>
            f.id === old.folderId ? { ...f, collectionIds: (f.collectionIds || []).filter(cid => cid !== id) } : f
          );
        }
        if (updates.folderId) {
          localFolders = localFolders.map((f) =>
            f.id === updates.folderId ? { ...f, collectionIds: [...(f.collectionIds || []), id] } : f
          );
        }
      }
      return updated;
    }
  }

  static async deleteCollection(id: string): Promise<void> {
    let colName = "";
    let folderId = "";

    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(`collections/${id}`);
        const colSnap = await colRef.once("value");
        if (colSnap.exists()) {
          const col = colSnap.val() as CollectionInput;
          colName = col.name;
          folderId = col.folderId || "";
          await colRef.remove();

          if (folderId) {
            const folderRef = db.ref(`folders/${folderId}`);
            const fSnap = await folderRef.once("value");
            if (fSnap.exists()) {
              const f = fSnap.val() as FolderInput;
              const collectionIds = (f.collectionIds || []).filter(cid => cid !== id);
              await folderRef.update({ collectionIds });
            }
          }
        }
      } catch (err) {
        console.error("Realtime DB deleteCollection failed:", err);
      }
    } else {
      const col = localCollections.find((c) => c.id === id);
      if (col) {
        colName = col.name;
        folderId = col.folderId || "";
        localCollections = localCollections.filter((c) => c.id !== id);

        if (folderId) {
          localFolders = localFolders.map((f) =>
            f.id === folderId ? { ...f, collectionIds: (f.collectionIds || []).filter(cid => cid !== id) } : f
          );
        }
      }
    }

    if (colName) {
      await this.addLog("collection_create", `Deleted collection '${colName}'`);
    }
  }

  // --- Leads Management ---
  static async saveLeadToCollection(collectionId: string, lead: LeadInput): Promise<boolean> {
    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(`collections/${collectionId}`);
        const colSnap = await colRef.once("value");
        if (!colSnap.exists()) return false;

        const col = colSnap.val() as CollectionInput;
        const leads = col.leads || [];
        if (leads.some((l) => l.id === lead.id)) return true;

        const newLeads = [...leads, lead];
        await colRef.update({ leads: newLeads });
        await this.addLog("lead_save", `Saved '${lead.name}' to collection '${col.name}'`);
        return true;
      } catch (err) {
        console.error("Realtime DB saveLeadToCollection failed:", err);
      }
    } else {
      const col = localCollections.find((c) => c.id === collectionId);
      if (!col) return false;

      if (col.leads.some((l) => l.id === lead.id)) return true;
      col.leads.push(lead);
      
      await this.addLog("lead_save", `Saved '${lead.name}' to collection '${col.name}'`);
      return true;
    }
    return false;
  }

  static async removeLeadFromCollection(collectionId: string, leadId: string): Promise<boolean> {
    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(`collections/${collectionId}`);
        const colSnap = await colRef.once("value");
        if (!colSnap.exists()) return false;

        const col = colSnap.val() as CollectionInput;
        const leads = col.leads || [];
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return false;

        const newLeads = leads.filter((l) => l.id !== leadId);
        await colRef.update({ leads: newLeads });
        await this.addLog("lead_save", `Removed '${lead.name}' from collection '${col.name}'`);
        return true;
      } catch (err) {
        console.error("Realtime DB removeLeadFromCollection failed:", err);
      }
    } else {
      const col = localCollections.find((c) => c.id === collectionId);
      if (!col) return false;

      const lead = col.leads.find((l) => l.id === leadId);
      if (!lead) return false;

      col.leads = col.leads.filter((l) => l.id !== leadId);
      await this.addLog("lead_save", `Removed '${lead.name}' from collection '${col.name}'`);
      return true;
    }
    return false;
  }

  // --- Favorites Management ---
  static async toggleFavorite(leadId: string): Promise<boolean> {
    if (useRealFirebase && db) {
      try {
        const favRef = db.ref(`favorites/${leadId}`);
        const favSnap = await favRef.once("value");
        if (favSnap.exists()) {
          await favRef.remove();
          return false;
        } else {
          await favRef.set({ leadId, createdAt: new Date().toISOString() });
          return true;
        }
      } catch (err) {
        console.error("Realtime DB toggleFavorite failed:", err);
      }
    } else {
      if (localFavorites.has(leadId)) {
        localFavorites.delete(leadId);
        return false;
      } else {
        localFavorites.add(leadId);
        return true;
      }
    }
    return false;
  }

  static async getFavorites(): Promise<string[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref("favorites").once("value");
        if (snap.exists()) {
          return Object.keys(snap.val());
        }
        return [];
      } catch (err) {
        console.error("Realtime DB getFavorites failed:", err);
      }
    }
    return Array.from(localFavorites);
  }

  // --- Saved Searches CRUD ---
  static async getSavedSearches(): Promise<SavedSearch[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref("searches").once("value");
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.values(data) as SavedSearch[];
          return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return [];
      } catch (err) {
        console.error("Realtime DB getSavedSearches failed:", err);
      }
    }
    return localSavedSearches;
  }

  static async saveSearch(queryStr: string, parsedSummary: string): Promise<SavedSearch> {
    const newSearch: SavedSearch = {
      id: `search-${Math.random().toString(36).substr(2, 9)}`,
      query: queryStr,
      parsedSummary,
      createdAt: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(`searches/${newSearch.id}`).set(newSearch);
      } catch (err) {
        console.error("Realtime DB saveSearch failed:", err);
      }
    } else {
      localSavedSearches.unshift(newSearch);
    }

    await this.addLog("search", `Saved search: "${queryStr}"`);
    return newSearch;
  }

  static async deleteSavedSearch(id: string): Promise<void> {
    if (useRealFirebase && db) {
      try {
        await db.ref(`searches/${id}`).remove();
      } catch (err) {
        console.error("Realtime DB deleteSavedSearch failed:", err);
      }
    } else {
      localSavedSearches = localSavedSearches.filter((s) => s.id !== id);
    }
  }

  // --- Activity Log & Dashboard Telemetry ---
  static async getActivityLogs(): Promise<ActivityLog[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref("logs").once("value");
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.values(data) as ActivityLog[];
          return list
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50);
        }
        return [];
      } catch (err) {
        console.error("Realtime DB getActivityLogs failed:", err);
      }
    }
    return localActivityLogs;
  }

  static async addLog(type: ActivityLog["type"], description: string): Promise<void> {
    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      timestamp: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(`logs/${newLog.id}`).set(newLog);
      } catch (err) {
        console.error("Realtime DB addLog failed:", err);
      }
    } else {
      localActivityLogs.unshift(newLog);
      if (localActivityLogs.length > 50) {
        localActivityLogs = localActivityLogs.slice(0, 50);
      }
    }
  }

  static async getTelemetryMetrics() {
    const collectionsList = await this.getCollections();
    const foldersList = await this.getFolders();
    const searchesList = await this.getSavedSearches();
    const logsList = await this.getActivityLogs();

    const totalSavedLeads = collectionsList
      .filter((c) => !c.isArchived)
      .reduce((sum, col) => sum + (col.leads ? col.leads.length : 0), 0);

    const activeCollections = collectionsList.filter((c) => !c.isArchived).length;
    const activeFolders = foldersList.length;

    const categoryCounts: Record<string, number> = {};
    collectionsList.forEach((col) => {
      if (col.leads) {
        col.leads.forEach((l) => {
          categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
        });
      }
    });

    const favoriteCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (favoriteCategories.length === 0) {
      favoriteCategories.push({ name: "Dentist", count: 2 }, { name: "Restaurant", count: 1 });
    }

    return {
      savedLeads: totalSavedLeads,
      searches: searchesList.length,
      collections: activeCollections,
      folders: activeFolders,
      exports: logsList.filter((log) => log.type === "export").length,
      favoriteCategories,
    };
  }
}
