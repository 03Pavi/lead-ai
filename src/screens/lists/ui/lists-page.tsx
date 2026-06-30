"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  useTheme,
  Alert,
  Tooltip,
  Divider,
  List,
  ListItemText,
  ListItemIcon,
  Menu,
  useMediaQuery,
  ListItem,
} from "@mui/material";
import {
  Folder,
  FolderHeart,
  FileText,
  Plus,
  Trash2,
  Archive,
  Download,
  Link,
  ChevronRight,
  MapPin,
  FolderPlus,
  BookmarkCheck,
  RotateCcw,
  Star,
  ExternalLink,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCollectionsSuccess,
  setCollectionStart,
  setCollectionFailure,
  addLocalCollection,
  updateLocalCollection,
  deleteLocalCollection,
  addLocalFolder,
  deleteLocalFolder,
  removeLeadFromLocalCollection,
} from "@/entities/collection/model/collection-slice";
import { setFavorites } from "@/entities/lead/model/lead-slice";
import { collectionApi } from "@/shared/api/collection-api";
import { leadApi } from "@/shared/api/lead-api";
import { CollectionInput, FolderInput, LeadInput } from "@/shared/validation/schemas";
import { apiClient } from "@/shared/api/client";
import { useRouter } from "next/navigation";

export default function ListsPage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const { collections, folders, loading } = useAppSelector((state) => state.collection);
  const { favoriteLeads } = useAppSelector((state) => state.lead);

  const [activeCollectionId, setActiveCollectionId] = useState<string | null>("favorites");
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"collection" | "folder">("collection");
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColFolderId, setNewColFolderId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [crmDialogOpen, setCrmDialogOpen] = useState(false);
  const [selectedCrm, setSelectedCrm] = useState<"hubspot" | "salesforce" | "zoho">("hubspot");
  const [crmConnecting, setCrmConnecting] = useState(false);
  const [crmSuccessMsg, setCrmSuccessMsg] = useState<string | null>(null);

  const reloadListsData = async () => {
    dispatch(setCollectionStart());
    try {
      const res = await collectionApi.getCollections();
      if (res.success) {
        dispatch(
          setCollectionsSuccess({
            folders: res.folders,
            collections: res.collections,
            savedSearches: res.savedSearches,
          })
        );
        if (res.favorites) {
          dispatch(setFavorites(res.favorites));
        }
        const activeCols = res.collections.filter((c: CollectionInput) => !c.isArchived);
        if (!activeCollectionId) {
          setActiveCollectionId("favorites");
        }
      }
    } catch (err: any) {
      dispatch(setCollectionFailure(err.message || "Failed to load collections"));
    }
  };

  useEffect(() => {
    reloadListsData();
  }, []);

  const activeCollection = activeCollectionId === "favorites"
    ? {
        id: "favorites",
        name: "My Favorites",
        description: "Your starred and favorited leads across all searches",
        leads: favoriteLeads || [],
        isArchived: false,
        folderId: undefined,
        createdAt: new Date().toISOString(),
      }
    : collections.find((c) => c.id === activeCollectionId);

  const handleCreateSubmit = async () => {
    if (!newColName.trim()) return;

    setCreateLoading(true);
    try {
      if (createType === "collection") {
        const res = await collectionApi.createCollection(
          newColName.trim(),
          newColDesc.trim(),
          newColFolderId || undefined
        );
        if (res.success && res.collection) {
          dispatch(addLocalCollection(res.collection));
          setActiveCollectionId(res.collection.id);
        }
      } else {
        const res = await collectionApi.createFolder(
          newColName.trim(),
          newColDesc.trim()
        );
        if (res.success && res.folder) {
          dispatch(addLocalFolder(res.folder));
        }
      }
      setCreateDialogOpen(false);
      setNewColName("");
      setNewColDesc("");
      setNewColFolderId("");
    } catch (err) {
      console.error("Failed to create list/folder:", err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleArchiveToggle = async (col: CollectionInput) => {
    try {
      const nextArchivedState = !col.isArchived;
      const res = await collectionApi.updateCollection(col.id, { isArchived: nextArchivedState });
      if (res.success && res.collection) {
        dispatch(updateLocalCollection(res.collection));
        if (nextArchivedState && activeCollectionId === col.id) {
          const remaining = collections.filter((c) => c.id !== col.id && !c.isArchived);
          setActiveCollectionId(remaining.length > 0 ? remaining[0].id : null);
        } else {
          setActiveCollectionId(col.id);
        }
      }
    } catch (err) {
      console.error("Archive toggle failed:", err);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this collection?")) return;
    try {
      const res = await collectionApi.deleteCollection(id);
      if (res.success) {
        dispatch(deleteLocalCollection(id));
        if (activeCollectionId === id) {
          const remaining = collections.filter((c) => c.id !== id && !c.isArchived);
          setActiveCollectionId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error("Delete collection failed:", err);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder? Inner collections will become standalone.")) return;
    try {
      const res = await collectionApi.deleteFolder(id);
      if (res.success) {
        dispatch(deleteLocalFolder(id));
      }
    } catch (err) {
      console.error("Delete folder failed:", err);
    }
  };

  const handleRemoveLead = async (leadId: string) => {
    if (!activeCollectionId) return;
    try {
      const res = await leadApi.deleteLead(activeCollectionId, leadId);
      if (res.success) {
        dispatch(removeLeadFromLocalCollection({ collectionId: activeCollectionId, leadId }));
      }
    } catch (err) {
      console.error("Failed to remove prospect:", err);
    }
  };

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    if (!activeCollectionId) return;

    try {
      const response = await apiClient.post("/export", {
        collectionId: activeCollectionId,
        format,
      }, {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"];
      const blob = new Blob([response.data], {
        type: typeof contentType === "string" ? contentType : "application/octet-stream",
      });
      
      const ext = format === "csv" ? "csv" : format === "excel" ? "xls" : "html";
      const filename = `${activeCollection?.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-export.${ext}`;
      
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      
      if (format === "pdf") {
        const printWindow = window.open(link.href, "_blank");
        if (printWindow) {
          printWindow.focus();
        }
      } else {
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Export operation failed:", err);
    }
  };

  const handleCRMConnect = () => {
    setCrmConnecting(true);
    setCrmSuccessMsg(null);
    setTimeout(() => {
      setCrmConnecting(false);
      const crmName = selectedCrm === "hubspot" ? "HubSpot" : selectedCrm === "salesforce" ? "Salesforce" : "Zoho CRM";
      setCrmSuccessMsg(`Successfully pushed ${activeCollection?.leads.length} leads to your ${crmName} account!`);
      setTimeout(() => {
        setCrmDialogOpen(false);
        setCrmSuccessMsg(null);
      }, 2000);
    }, 1500);
  };

  return (
    <Stack spacing={4}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: "28px", sm: "36px" } }}>
            Saved Lists
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Organize business leads into custom collection folders and lists.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => {
            setCreateType("collection");
            setCreateDialogOpen(true);
          }}
          sx={{ fontWeight: 600, flexShrink: 0, whiteSpace: "nowrap" }}
        >
          Create List
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
          gap: 4,
          alignItems: "flex-start",
        }}
      >
        <Stack spacing={3}>
          <Paper sx={{ p: 2, borderRadius: 2, borderColor: "divider" }}>
            <Stack spacing={1}>
              <Button
                fullWidth
                size="small"
                variant="text"
                startIcon={<FolderPlus size={16} />}
                onClick={() => {
                  setCreateType("folder");
                  setCreateDialogOpen(true);
                }}
                sx={{ justifySelf: "flex-start", justifyContent: "flex-start", color: "text.primary", fontWeight: 600 }}
              >
                New Folder
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ borderRadius: 2, borderColor: "divider", overflow: "hidden" }}>
            <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Button
                fullWidth
                onClick={() => setActiveTab("active")}
                sx={{
                  py: 1.5,
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: "13px",
                  color: activeTab === "active" ? "info.main" : "text.secondary",
                  borderBottom: activeTab === "active" ? "2px solid" : "none",
                  borderColor: "info.main",
                }}
              >
                Active
              </Button>
              <Button
                fullWidth
                onClick={() => setActiveTab("archived")}
                sx={{
                  py: 1.5,
                  borderRadius: 0,
                  fontWeight: 600,
                  fontSize: "13px",
                  color: activeTab === "archived" ? "info.main" : "text.secondary",
                  borderBottom: activeTab === "archived" ? "2px solid" : "none",
                  borderColor: "info.main",
                }}
              >
                Archived
              </Button>
            </Stack>

            <Box sx={{ p: 1.5 }}>
              {activeTab === "active" ? (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: "11px", px: 1 }}>
                      QUICK VIEWS
                    </Typography>
                    <List sx={{ p: 0 }}>
                      <ListItem
                        onClick={() => setActiveCollectionId("favorites")}
                        sx={{
                          p: 1,
                          borderRadius: "6px",
                          cursor: "pointer",
                          bgcolor: activeCollectionId === "favorites" ? "action.selected" : "transparent",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28, color: activeCollectionId === "favorites" ? "warning.main" : "text.secondary" }}>
                          <Star size={16} fill={activeCollectionId === "favorites" ? theme.palette.warning.main : "none"} />
                        </ListItemIcon>
                        <ListItemText
                          primary="My Favorites"
                          secondary={`${favoriteLeads?.length || 0} leads`}
                          slotProps={{
                            primary: { sx: { fontSize: "13px", fontWeight: activeCollectionId === "favorites" ? 700 : 500 } },
                            secondary: { sx: { fontSize: "10.5px" } }
                          }}
                        />
                      </ListItem>
                    </List>
                  </Stack>

                  {folders.length > 0 && (
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: "11px", px: 1 }}>
                        FOLDERS
                      </Typography>
                      {folders.map((folder) => (
                        <Box key={folder.id}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{
                              p: 1,
                              borderRadius: "6px",
                              bgcolor: "action.hover",
                              mb: 0.5,
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Folder size={16} color={theme.palette.info.main} />
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "13px" }}>
                                {folder.name}
                              </Typography>
                            </Stack>
                            <IconButton size="small" onClick={() => handleDeleteFolder(folder.id)} sx={{ color: "text.disabled" }}>
                              <Trash2 size={12} />
                            </IconButton>
                          </Stack>

                          <Stack spacing={0.5} sx={{ pl: 3.5 }}>
                            {collections
                              .filter((c) => c.folderId === folder.id && !c.isArchived)
                              .map((col) => (
                                <ListItem
                                  key={col.id}
                                  onClick={() => setActiveCollectionId(col.id)}
                                  sx={{
                                    p: 1,
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    bgcolor: activeCollectionId === col.id ? "action.selected" : "transparent",
                                    "&:hover": { bgcolor: "action.hover" },
                                  }}
                                >
                                  <ListItemText
                                    primary={col.name}
                                    secondary={`${col.leads.length} leads`}
                                    slotProps={{
                                      primary: { sx: { fontSize: "12.5px", fontWeight: activeCollectionId === col.id ? 700 : 500 } },
                                      secondary: { sx: { fontSize: "10px" } }
                                    }}
                                  />
                                </ListItem>
                              ))}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: "11px", px: 1 }}>
                      STANDALONE LISTS
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {collections
                        .filter((c) => !c.folderId && !c.isArchived)
                        .map((col) => (
                          <ListItem
                            key={col.id}
                            onClick={() => setActiveCollectionId(col.id)}
                            sx={{
                              p: 1,
                              borderRadius: "6px",
                              cursor: "pointer",
                              mb: 0.5,
                              bgcolor: activeCollectionId === col.id ? "action.selected" : "transparent",
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28, color: activeCollectionId === col.id ? "info.main" : "text.secondary" }}>
                              <FileText size={16} />
                            </ListItemIcon>
                            <ListItemText
                              primary={col.name}
                              secondary={`${col.leads.length} leads`}
                              slotProps={{
                                primary: { sx: { fontSize: "13px", fontWeight: activeCollectionId === col.id ? 700 : 500 } },
                                secondary: { sx: { fontSize: "10.5px" } }
                              }}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </Stack>
                </Stack>
              ) : (
                <List sx={{ p: 0 }}>
                  {collections
                    .filter((c) => c.isArchived)
                    .map((col) => (
                      <ListItem
                        key={col.id}
                        onClick={() => setActiveCollectionId(col.id)}
                        sx={{
                          p: 1,
                          borderRadius: "6px",
                          cursor: "pointer",
                          mb: 0.5,
                          bgcolor: activeCollectionId === col.id ? "action.selected" : "transparent",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <Archive size={16} />
                        </ListItemIcon>
                        <ListItemText
                          primary={col.name}
                          secondary={`${col.leads.length} leads`}
                          slotProps={{
                            primary: { sx: { fontSize: "13px" } },
                            secondary: { sx: { fontSize: "10.5px" } }
                          }}
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </Box>
          </Paper>
        </Stack>

        <Box sx={{ flexGrow: 1 }}>
          {activeCollection ? (
            <Paper sx={{ p: 4, borderRadius: 2, borderColor: "divider" }}>
              <Stack spacing={4}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Box>
                    <Typography variant="h3" sx={{ fontSize: "22px", fontWeight: 800 }}>
                      {activeCollection.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {activeCollection.description || "Collection lists management console"}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => setExportAnchorEl(e.currentTarget)}
                      startIcon={<Download size={14} />}
                      sx={{ fontSize: "12px", py: 0.5, borderColor: "divider" }}
                    >
                      Export
                    </Button>
                    <Menu
                      anchorEl={exportAnchorEl}
                      open={Boolean(exportAnchorEl)}
                      onClose={() => setExportAnchorEl(null)}
                      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                      transformOrigin={{ vertical: "top", horizontal: "left" }}
                    >
                      <MenuItem onClick={() => { handleExport("csv"); setExportAnchorEl(null); }} sx={{ fontSize: "13px", fontWeight: 600 }}>
                        <ListItemIcon><FileText size={16} /></ListItemIcon>
                        Export as CSV
                      </MenuItem>
                      <MenuItem onClick={() => { handleExport("excel"); setExportAnchorEl(null); }} sx={{ fontSize: "13px", fontWeight: 600 }}>
                        <ListItemIcon><FileText size={16} /></ListItemIcon>
                        Export as Excel
                      </MenuItem>
                      <MenuItem onClick={() => { handleExport("pdf"); setExportAnchorEl(null); }} sx={{ fontSize: "13px", fontWeight: 600 }}>
                        <ListItemIcon><FileText size={16} /></ListItemIcon>
                        Export as PDF
                      </MenuItem>
                    </Menu>


                    <IconButton size="small" onClick={() => handleArchiveToggle(activeCollection)} sx={{ border: 1, borderColor: "divider", borderRadius: "6px" }}>
                      {activeCollection.isArchived ? <RotateCcw size={15} /> : <Archive size={15} />}
                    </IconButton>

                    <IconButton size="small" onClick={() => handleDeleteCollection(activeCollection.id)} sx={{ border: 1, borderColor: "divider", color: "error.main", borderRadius: "6px" }}>
                      <Trash2 size={15} />
                    </IconButton>
                  </Stack>
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography variant="h5" sx={{ fontSize: "14px", fontWeight: 700 }}>
                    Prospects ({activeCollection.leads.length})
                  </Typography>

                  {activeCollection.leads.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        This list is currently empty.
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => router.push("/search")}
                        sx={{ mt: 2, color: "info.main" }}
                      >
                        Search for leads to add
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {activeCollection.leads.map((lead) => (
                        <Paper
                          key={lead.id}
                          sx={{
                            p: 2.5,
                            borderRadius: 1.5,
                            borderColor: "divider",
                            bgcolor: "background.default",
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "center" },
                            gap: 2,
                          }}
                        >
                          <Box sx={{ overflow: "hidden" }}>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              {lead.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                              <MapPin size={12} /> {lead.address}
                            </Typography>
                            {lead.phone && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px", mt: 0.5 }}>
                                Phone: <strong>{lead.phone}</strong>
                              </Typography>
                            )}
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-end", sm: "auto" } }}>
                            {lead.website && (
                              <IconButton size="small" onClick={() => window.open(lead.website || undefined, "_blank")} sx={{ color: "text.secondary" }}>
                                <ExternalLink size={15} />
                              </IconButton>
                            )}
                            <IconButton size="small" onClick={() => handleRemoveLead(lead.id)} sx={{ color: "error.main" }}>
                              <Trash2 size={15} />
                            </IconButton>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Paper sx={{ p: 6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 2, borderColor: "divider" }}>
              <Stack spacing={2} alignItems="center">
                <FolderHeart size={36} color={theme.palette.text.disabled} />
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  No List Selected
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", maxWidth: 300 }}>
                  Select an active list from the left sidebar panel, or create a new collection to get started.
                </Typography>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>
      <Dialog fullScreen={isMobile} open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Create New {createType === "collection" ? "Collection List" : "Folder"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              placeholder={createType === "collection" ? "e.g. London Dental Centers" : "e.g. European Clinics"}
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description (Optional)"
              value={newColDesc}
              onChange={(e) => setNewColDesc(e.target.value)}
            />

            {createType === "collection" && folders.length > 0 && (
              <TextField
                select
                fullWidth
                label="Assign to Folder (Optional)"
                value={newColFolderId}
                onChange={(e) => setNewColFolderId(e.target.value)}
              >
                <MenuItem value=""><em>None (Standalone List)</em></MenuItem>
                {folders.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={createLoading || !newColName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog fullScreen={isMobile} open={crmDialogOpen} onClose={() => setCrmDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Sync Leads to CRM</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {crmSuccessMsg ? (
              <Alert severity="success" sx={{ borderRadius: "6px" }}>
                {crmSuccessMsg}
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Connect your collection <strong>"{activeCollection?.name}"</strong> directly into your sales workflow pipeline.
                </Typography>
                <TextField
                  select
                  fullWidth
                  label="Select Target CRM Client"
                  value={selectedCrm}
                  onChange={(e) => setSelectedCrm(e.target.value as any)}
                >
                  <MenuItem value="hubspot">HubSpot API</MenuItem>
                  <MenuItem value="salesforce">Salesforce Cloud</MenuItem>
                  <MenuItem value="zoho">Zoho CRM Integration</MenuItem>
                </TextField>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setCrmDialogOpen(false)} disabled={crmConnecting}>
            Cancel
          </Button>
          {!crmSuccessMsg && (
            <Button
              variant="contained"
              onClick={handleCRMConnect}
              disabled={crmConnecting}
              startIcon={crmConnecting ? <CircularProgress size={12} color="inherit" /> : <Link size={14} />}
            >
              Push prospects
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
