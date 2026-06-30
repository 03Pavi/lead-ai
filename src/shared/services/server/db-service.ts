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

// ─── In-Memory Fallback State (per-user mock database) ─────────────────────
// Each user gets their own isolated mock data, keyed by userId.
// A default "mock" user is used when no userId is provided (unauthenticated mock mode).

interface UserMockData {
  folders: FolderInput[];
  collections: CollectionInput[];
  favorites: Map<string, LeadInput>;
  activityLogs: ActivityLog[];
  savedSearches: SavedSearch[];
}

const userMockStore = new Map<string, UserMockData>();

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

function getOrCreateMockData(userId: string): UserMockData {
  if (userMockStore.has(userId)) {
    return userMockStore.get(userId)!;
  }

  // Seed default data for the first user, empty for others
  const isFirst = userMockStore.size === 0;
  const data: UserMockData = isFirst
    ? {
        folders: [
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
          },
        ],
        collections: [
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
          },
        ],
        favorites: new Map([["lon-dent-1", seedLeadsMap["col-lon-dent"][0]]]),
        activityLogs: [
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
          },
        ],
        savedSearches: [
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
          },
        ],
      }
    : {
        folders: [],
        collections: [],
        favorites: new Map<string, LeadInput>(),
        activityLogs: [],
        savedSearches: [],
      };

  userMockStore.set(userId, data);
  return data;
}

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

/**
 * Recursively strip `undefined` values from an object so Firebase RTDB
 * doesn't throw "value argument contains undefined".
 */
function sanitizeForFirebase<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class DBService {
  // ─── Helper: build user-scoped Firebase ref path ──────────────────────────
  private static userRef(userId: string, path: string) {
    return `users/${userId}/${path}`;
  }

  // --- Folders CRUD ---
  static async getFolders(userId: string): Promise<FolderInput[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref(this.userRef(userId, "folders")).once("value");
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
    return getOrCreateMockData(userId).folders;
  }

  static async createFolder(userId: string, data: { name: string; description?: string }): Promise<FolderInput> {
    const newFolder: FolderInput = {
      id: `folder-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description || "",
      collectionIds: [],
      createdAt: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(this.userRef(userId, `folders/${newFolder.id}`)).set(sanitizeForFirebase(newFolder));
      } catch (err) {
        console.error("Realtime DB createFolder failed:", err);
      }
    } else {
      getOrCreateMockData(userId).folders.push(newFolder);
    }

    await this.addLog(userId, "collection_create", `Created folder '${newFolder.name}'`);
    return newFolder;
  }

  static async deleteFolder(userId: string, id: string): Promise<void> {
    let folderName = "";

    if (useRealFirebase && db) {
      try {
        const folderRef = db.ref(this.userRef(userId, `folders/${id}`));
        const folderSnap = await folderRef.once("value");
        if (folderSnap.exists()) {
          folderName = (folderSnap.val() as FolderInput).name;
          await folderRef.remove();
          
          // Remove folder references from collections
          const colsSnap = await db.ref(this.userRef(userId, "collections")).once("value");
          if (colsSnap.exists()) {
            const collectionsVal = colsSnap.val();
            const updates: Record<string, any> = {};
            for (const key of Object.keys(collectionsVal)) {
              if (collectionsVal[key].folderId === id) {
                updates[this.userRef(userId, `collections/${key}/folderId`)] = "";
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
      const mock = getOrCreateMockData(userId);
      const folder = mock.folders.find((f) => f.id === id);
      if (folder) {
        folderName = folder.name;
        mock.folders = mock.folders.filter((f) => f.id !== id);
        mock.collections = mock.collections.map((c) =>
          c.folderId === id ? { ...c, folderId: undefined } : c
        );
      }
    }

    if (folderName) {
      await this.addLog(userId, "collection_create", `Deleted folder '${folderName}'`);
    }
  }

  // --- Collections CRUD ---
  static async getCollections(userId: string): Promise<CollectionInput[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref(this.userRef(userId, "collections")).once("value");
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
    return getOrCreateMockData(userId).collections;
  }

  static async createCollection(userId: string, data: { name: string; description?: string; folderId?: string }): Promise<CollectionInput> {
    const newCol: CollectionInput = {
      id: `col-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description || "",
      folderId: data.folderId || undefined,
      leads: [],
      isArchived: false,
      createdAt: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(this.userRef(userId, `collections/${newCol.id}`)).set(sanitizeForFirebase(newCol));
        if (data.folderId) {
          const folderRef = db.ref(this.userRef(userId, `folders/${data.folderId}`));
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
      const mock = getOrCreateMockData(userId);
      mock.collections.push(newCol);
      if (data.folderId) {
        mock.folders = mock.folders.map((f) =>
          f.id === data.folderId ? { ...f, collectionIds: [...(f.collectionIds || []), newCol.id] } : f
        );
      }
    }

    await this.addLog(userId, "collection_create", `Created collection '${newCol.name}'`);
    return newCol;
  }

  static async updateCollection(userId: string, id: string, updates: Partial<CollectionInput>): Promise<CollectionInput | undefined> {
    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(this.userRef(userId, `collections/${id}`));
        const colSnap = await colRef.once("value");
        if (!colSnap.exists()) return undefined;

        const old = colSnap.val() as CollectionInput;
        await colRef.update(updates);
        const updated = { ...old, ...updates };

        if (updates.folderId !== undefined && updates.folderId !== old.folderId) {
          if (old.folderId) {
            const oldFolderRef = db.ref(this.userRef(userId, `folders/${old.folderId}`));
            const fSnap = await oldFolderRef.once("value");
            if (fSnap.exists()) {
              const f = fSnap.val() as FolderInput;
              const collectionIds = (f.collectionIds || []).filter(cid => cid !== id);
              await oldFolderRef.update({ collectionIds });
            }
          }
          if (updates.folderId) {
            const newFolderRef = db.ref(this.userRef(userId, `folders/${updates.folderId}`));
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
      const mock = getOrCreateMockData(userId);
      const idx = mock.collections.findIndex((c) => c.id === id);
      if (idx === -1) return undefined;

      const old = mock.collections[idx];
      const updated = { ...old, ...updates };
      mock.collections[idx] = updated;

      if (updates.folderId !== undefined && updates.folderId !== old.folderId) {
        if (old.folderId) {
          mock.folders = mock.folders.map((f) =>
            f.id === old.folderId ? { ...f, collectionIds: (f.collectionIds || []).filter(cid => cid !== id) } : f
          );
        }
        if (updates.folderId) {
          mock.folders = mock.folders.map((f) =>
            f.id === updates.folderId ? { ...f, collectionIds: [...(f.collectionIds || []), id] } : f
          );
        }
      }
      return updated;
    }
  }

  static async deleteCollection(userId: string, id: string): Promise<void> {
    let colName = "";
    let folderId = "";

    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(this.userRef(userId, `collections/${id}`));
        const colSnap = await colRef.once("value");
        if (colSnap.exists()) {
          const col = colSnap.val() as CollectionInput;
          colName = col.name;
          folderId = col.folderId || "";
          await colRef.remove();

          if (folderId) {
            const folderRef = db.ref(this.userRef(userId, `folders/${folderId}`));
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
      const mock = getOrCreateMockData(userId);
      const col = mock.collections.find((c) => c.id === id);
      if (col) {
        colName = col.name;
        folderId = col.folderId || "";
        mock.collections = mock.collections.filter((c) => c.id !== id);

        if (folderId) {
          mock.folders = mock.folders.map((f) =>
            f.id === folderId ? { ...f, collectionIds: (f.collectionIds || []).filter(cid => cid !== id) } : f
          );
        }
      }
    }

    if (colName) {
      await this.addLog(userId, "collection_create", `Deleted collection '${colName}'`);
    }
  }

  // --- Leads Management ---
  static async saveLeadToCollection(userId: string, collectionId: string, lead: LeadInput): Promise<boolean> {
    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(this.userRef(userId, `collections/${collectionId}`));
        const colSnap = await colRef.once("value");
        if (!colSnap.exists()) return false;

        const col = colSnap.val() as CollectionInput;
        const leads = col.leads || [];
        if (leads.some((l) => l.id === lead.id)) return true;

        const newLeads = [...leads, lead];
        await colRef.update({ leads: newLeads });
        await this.addLog(userId, "lead_save", `Saved '${lead.name}' to collection '${col.name}'`);
        return true;
      } catch (err) {
        console.error("Realtime DB saveLeadToCollection failed:", err);
      }
    } else {
      const mock = getOrCreateMockData(userId);
      const col = mock.collections.find((c) => c.id === collectionId);
      if (!col) return false;

      if (col.leads.some((l) => l.id === lead.id)) return true;
      col.leads.push(lead);
      
      await this.addLog(userId, "lead_save", `Saved '${lead.name}' to collection '${col.name}'`);
      return true;
    }
    return false;
  }

  static async removeLeadFromCollection(userId: string, collectionId: string, leadId: string): Promise<boolean> {
    if (useRealFirebase && db) {
      try {
        const colRef = db.ref(this.userRef(userId, `collections/${collectionId}`));
        const colSnap = await colRef.once("value");
        if (!colSnap.exists()) return false;

        const col = colSnap.val() as CollectionInput;
        const leads = col.leads || [];
        const lead = leads.find((l) => l.id === leadId);
        if (!lead) return false;

        const newLeads = leads.filter((l) => l.id !== leadId);
        await colRef.update({ leads: newLeads });
        await this.addLog(userId, "lead_save", `Removed '${lead.name}' from collection '${col.name}'`);
        return true;
      } catch (err) {
        console.error("Realtime DB removeLeadFromCollection failed:", err);
      }
    } else {
      const mock = getOrCreateMockData(userId);
      const col = mock.collections.find((c) => c.id === collectionId);
      if (!col) return false;

      const lead = col.leads.find((l) => l.id === leadId);
      if (!lead) return false;

      col.leads = col.leads.filter((l) => l.id !== leadId);
      await this.addLog(userId, "lead_save", `Removed '${lead.name}' from collection '${col.name}'`);
      return true;
    }
    return false;
  }

  // --- Favorites Management ---
  static async toggleFavorite(userId: string, leadId: string, lead?: LeadInput): Promise<boolean> {
    if (useRealFirebase && db) {
      try {
        const favRef = db.ref(this.userRef(userId, `favorites/${leadId}`));
        const favSnap = await favRef.once("value");
        if (favSnap.exists()) {
          await favRef.remove();
          return false;
        } else {
          const payload = lead 
            ? { ...lead, createdAt: new Date().toISOString() }
            : { id: leadId, name: "Favorite", category: "Unknown", address: "Unknown", coordinates: { lat: 0, lng: 0 }, createdAt: new Date().toISOString() };
          await favRef.set(sanitizeForFirebase(payload));
          return true;
        }
      } catch (err) {
        console.error("Realtime DB toggleFavorite failed:", err);
      }
    } else {
      const mock = getOrCreateMockData(userId);
      if (mock.favorites.has(leadId)) {
        mock.favorites.delete(leadId);
        return false;
      } else {
        const fallbackLead: LeadInput = lead || {
          id: leadId,
          name: "Favorite",
          category: "Unknown",
          address: "Unknown",
          coordinates: { lat: 0, lng: 0 },
        };
        mock.favorites.set(leadId, fallbackLead);
        return true;
      }
    }
    return false;
  }

  static async getFavorites(userId: string): Promise<LeadInput[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref(this.userRef(userId, "favorites")).once("value");
        if (snap.exists()) {
          return Object.values(snap.val()) as LeadInput[];
        }
        return [];
      } catch (err) {
        console.error("Realtime DB getFavorites failed:", err);
      }
    }
    return Array.from(getOrCreateMockData(userId).favorites.values());
  }

  // --- Saved Searches CRUD ---
  static async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref(this.userRef(userId, "searches")).once("value");
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
    return getOrCreateMockData(userId).savedSearches;
  }

  static async saveSearch(userId: string, queryStr: string, parsedSummary: string): Promise<SavedSearch> {
    const newSearch: SavedSearch = {
      id: `search-${Math.random().toString(36).substr(2, 9)}`,
      query: queryStr,
      parsedSummary,
      createdAt: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        await db.ref(this.userRef(userId, `searches/${newSearch.id}`)).set(sanitizeForFirebase(newSearch));
      } catch (err) {
        console.error("Realtime DB saveSearch failed:", err);
      }
    } else {
      getOrCreateMockData(userId).savedSearches.unshift(newSearch);
    }

    await this.addLog(userId, "search", `Saved search: "${queryStr}"`);
    return newSearch;
  }

  static async deleteSavedSearch(userId: string, id: string): Promise<void> {
    if (useRealFirebase && db) {
      try {
        await db.ref(this.userRef(userId, `searches/${id}`)).remove();
      } catch (err) {
        console.error("Realtime DB deleteSavedSearch failed:", err);
      }
    } else {
      const mock = getOrCreateMockData(userId);
      mock.savedSearches = mock.savedSearches.filter((s) => s.id !== id);
    }
  }

  // --- Activity Log & Dashboard Telemetry ---
  static async getActivityLogs(userId: string): Promise<ActivityLog[]> {
    if (useRealFirebase && db) {
      try {
        const snap = await db.ref(this.userRef(userId, "logs")).once("value");
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
    return getOrCreateMockData(userId).activityLogs;
  }

  static async addLog(userId: string, type: ActivityLog["type"], description: string): Promise<void> {
    const newLog: ActivityLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      timestamp: new Date().toISOString(),
    };

    if (useRealFirebase && db) {
      try {
        const logsRef = db.ref(this.userRef(userId, "logs"));
        await logsRef.child(newLog.id).set(sanitizeForFirebase(newLog));
        
        // Fetch all logs to prune so we only keep the newest 6
        const snap = await logsRef.once("value");
        if (snap.exists()) {
          const data = snap.val();
          const list = Object.values(data) as ActivityLog[];
          if (list.length > 6) {
            // Sort ascending by timestamp (oldest first)
            list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            // Identify how many to remove
            const overflowCount = list.length - 6;
            for (let i = 0; i < overflowCount; i++) {
              await logsRef.child(list[i].id).remove();
            }
          }
        }
      } catch (err) {
        console.error("Realtime DB addLog failed:", err);
      }
    } else {
      const mock = getOrCreateMockData(userId);
      mock.activityLogs.unshift(newLog);
      if (mock.activityLogs.length > 6) {
        mock.activityLogs = mock.activityLogs.slice(0, 6);
      }
    }
  }

  static async getTelemetryMetrics(userId: string) {
    const collectionsList = await this.getCollections(userId);
    const foldersList = await this.getFolders(userId);
    const searchesList = await this.getSavedSearches(userId);
    const logsList = await this.getActivityLogs(userId);

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
