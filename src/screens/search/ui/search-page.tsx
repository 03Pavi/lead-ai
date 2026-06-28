"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Slider,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  useMediaQuery,
} from "@mui/material";
import {
  Search,
  Copy,
  ExternalLink,
  MapPin,
  Clock,
  Phone,
  Bookmark,
  Sparkles,
  SlidersHorizontal,
  BookmarkCheck,
  Info,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setSearchStart,
  setSearchSuccess,
  setSearchFailure,
  toggleLocalFavorite,
} from "@/entities/lead/model/lead-slice";
import {
  addLocalCollection,
  setCollectionsSuccess,
  saveLeadToLocalCollection,
  removeLeadFromLocalCollection,
} from "@/entities/collection/model/collection-slice";
import { searchApi } from "@/shared/api/search-api";
import { collectionApi } from "@/shared/api/collection-api";
import { leadApi } from "@/shared/api/lead-api";
import { LeadInput } from "@/shared/validation/schemas";
import { Navigation } from "lucide-react";

export default function SearchPage() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  const { searchResults, queryDetails, loading, error, favorites } = useAppSelector((state) => state.lead);
  const { collections } = useAppSelector((state) => state.collection);

  const [queryInput, setQueryInput] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Near me state
  const [useNearMe, setUseNearMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const isUpdatingFiltersRef = useRef(false);

  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [maxDistance, setMaxDistance] = useState<number>(30);
  const [websiteRequired, setWebsiteRequired] = useState<boolean | null>(null);
  const [phoneRequired, setPhoneRequired] = useState<boolean | null>(null);
  const [openNowRequired, setOpenNowRequired] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"name" | "distance" | "relevance">("relevance");

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [selectedLead, setSelectedLead] = useState<LeadInput | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  const [categoriesList, setCategoriesList] = useState<string[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
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
        }
      } catch (err) {
        console.error("Failed to load collections for lead saver:", err);
      }
    };
    fetchCollections();
  }, [dispatch]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await searchApi.getCategories();
        if (res.success && res.categories) {
          setCategoriesList(res.categories);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = async (overrideQuery?: string, isFilterUpdate = false) => {
    let queryToSearch = overrideQuery !== undefined ? overrideQuery : queryInput;
    if (!queryToSearch.trim()) return;

    if (!isFilterUpdate) {
      dispatch(setSearchStart());
      setSearchTriggered(true);
    }

    try {
      const activeFilters: any = {};
      if (categoryFilter) activeFilters.category = categoryFilter;
      if (cityFilter && !useNearMe) activeFilters.city = cityFilter; // Don't send city if using coordinates
      if (maxDistance > 0 && maxDistance < 100) activeFilters.radius = maxDistance;
      if (websiteRequired !== null) activeFilters.websiteAvailable = websiteRequired;
      if (phoneRequired !== null) activeFilters.phoneAvailable = phoneRequired;
      if (openNowRequired) activeFilters.openingNow = true;
      if (useNearMe && userLocation && !isFilterUpdate) {
        activeFilters.lat = userLocation.lat;
        activeFilters.lng = userLocation.lng;
      }
      activeFilters.sortBy = sortBy;

      const res = await searchApi.search(queryToSearch, activeFilters);
      if (res.success) {
        dispatch(
          setSearchSuccess({
            leads: res.leads,
            queryDetails: res.queryDetails,
          })
        );

        if (!isFilterUpdate && res.queryDetails) {
          isUpdatingFiltersRef.current = true;
          setCategoryFilter(res.queryDetails.category || "");
          setCityFilter(res.queryDetails.city || "");
          if (res.queryDetails.parsedFilters) {
            setMaxDistance(res.queryDetails.parsedFilters.maxDistance || 30);
            setWebsiteRequired(res.queryDetails.parsedFilters.websiteAvailable ?? null);
            setPhoneRequired(res.queryDetails.parsedFilters.phoneAvailable ?? null);
            setOpenNowRequired(res.queryDetails.parsedFilters.openingNow || false);
          }
          setTimeout(() => {
            isUpdatingFiltersRef.current = false;
          }, 0);
        }
      } else {
        dispatch(setSearchFailure(res.error || "Search request failed."));
      }
    } catch (err: any) {
      dispatch(setSearchFailure(err.response?.data?.error || err.message || "Failed to search"));
    }
  };

  useEffect(() => {
    if (searchTriggered && queryDetails && !isUpdatingFiltersRef.current) {
      handleSearch(undefined, true);
    }
  }, [categoryFilter, cityFilter, maxDistance, websiteRequired, phoneRequired, openNowRequired, sortBy]);

  const handleNearMeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setUseNearMe(checked);
    if (checked && !userLocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLoading(false);
        },
        (err) => {
          console.error("Location error:", err);
          setLocationLoading(false);
          setUseNearMe(false);
          dispatch(setSearchFailure("Location access denied or unavailable."));
        }
      );
    }
  };

  const handleCopyPhone = (leadId: string, phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopyFeedbackId(leadId);
    setTimeout(() => setCopyFeedbackId(null), 2000);
  };

  const handleViewMap = (lead: LeadInput) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lead.name}, ${lead.address}`
    )}`;
    window.open(mapsUrl, "_blank");
  };

  const handleFavoriteToggle = async (leadId: string) => {
    try {
      const res = await leadApi.toggleFavorite(leadId);
      if (res.success) {
        dispatch(toggleLocalFavorite(leadId));
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleOpenSaveDialog = (lead: LeadInput) => {
    setSelectedLead(lead);
    setSaveDialogOpen(true);
    setSaveSuccessMsg(null);
    if (collections.length > 0) {
      setTargetCollectionId(collections[0].id);
    }
  };

  const handleUnsaveLead = async (leadId: string) => {
    const collectionsWithLead = collections.filter((c) => c.leads?.some((l) => l.id === leadId));
    for (const collection of collectionsWithLead) {
      try {
        const res = await leadApi.deleteLead(collection.id, leadId);
        if (res.success) {
          dispatch(removeLeadFromLocalCollection({ collectionId: collection.id, leadId }));
        }
      } catch (err) {
        console.error(`Failed to remove lead from collection ${collection.id}:`, err);
      }
    }
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    
    setSaveLoading(true);
    setSaveSuccessMsg(null);

    try {
      let finalCollectionId = targetCollectionId;

      if (newCollectionName.trim()) {
        const createRes = await collectionApi.createCollection(
          newCollectionName.trim(),
          newCollectionDesc.trim()
        );
        if (createRes.success && createRes.collection) {
          dispatch(addLocalCollection(createRes.collection));
          finalCollectionId = createRes.collection.id;
          setNewCollectionName("");
          setNewCollectionDesc("");
        }
      }

      if (!finalCollectionId) {
        setSaveLoading(false);
        return;
      }

      const res = await leadApi.saveLead(finalCollectionId, selectedLead);
      if (res.success) {
        dispatch(saveLeadToLocalCollection({ collectionId: finalCollectionId, lead: selectedLead }));
        const colName = collections.find(c => c.id === finalCollectionId)?.name || "list";
        setSaveSuccessMsg(`Lead successfully saved to "${colName}"!`);
        setTimeout(() => {
          setSaveDialogOpen(false);
          setSaveSuccessMsg(null);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Failed to save lead:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: "28px", sm: "36px" } }}>
          Lead Finder
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Type a conversational B2B search query to discover prospects instantly.
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 3.5,
          borderRadius: 2.5,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack spacing={3.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="e.g. Find 20 dentists in London..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              slotProps={{
                input: {
                  startAdornment: (
                    <Box sx={{ mr: 1.5, color: "info.main", display: "flex" }}>
                      <Sparkles size={20} />
                    </Box>
                  ),
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  py: { xs: 0.5, sm: 1 },
                  px: 2,
                  fontSize: "16px",
                },
              }}
            />
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                disabled={loading}
                onClick={() => handleSearch()}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search size={18} />}
                sx={{ flexGrow: 1, px: { xs: 2, sm: 4.5 }, py: { xs: 1, sm: 1.5 }, fontWeight: 700 }}
              >
                Search
              </Button>
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  border: 1,
                  borderColor: showFilters ? "info.main" : "divider",
                  borderRadius: "6px",
                  color: showFilters ? "info.main" : "text.secondary",
                  px: 2,
                }}
              >
                <SlidersHorizontal size={20} />
              </IconButton>
            </Stack>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: -1.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={useNearMe}
                  onChange={handleNearMeToggle}
                  disabled={loading || locationLoading}
                />
              }
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Navigation size={14} color={useNearMe ? theme.palette.info.main : theme.palette.text.secondary} />
                  <Typography variant="body2" sx={{ fontSize: "13px", fontWeight: 600, color: useNearMe ? "info.main" : "text.secondary" }}>
                    Near Me {locationLoading && "(Locating...)"}
                  </Typography>
                </Stack>
              }
            />
          </Stack>
        </Stack>
      </Paper>

      {showFilters && (
        <Paper sx={{ p: 3, borderRadius: 2, borderColor: "divider", bgcolor: "background.paper" }}>
          <Stack spacing={2.5}>
            <Typography variant="h3" sx={{ fontSize: "15px", fontWeight: 700 }}>
              Adjust Search Filters (Instant Updates)
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                gap: 3,
              }}
            >
              <FormControl size="small" fullWidth>
                <InputLabel id="category-filter-label">Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value=""><em>Any Category</em></MenuItem>
                  {categoriesList.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="City / Region"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />

              <Select
                size="small"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                displayEmpty
              >
                <MenuItem value="relevance">Sort: Relevance</MenuItem>
                <MenuItem value="distance">Sort: Distance</MenuItem>
                <MenuItem value="name">Sort: A-Z Alphabetical</MenuItem>
              </Select>

              <Box>
                <Typography variant="body2" sx={{ fontSize: "11px", fontWeight: 600, mb: 0.5, color: "text.secondary" }}>
                  Max Distance: {maxDistance === 100 ? "Anywhere" : `${maxDistance} km`}
                </Typography>
                <Slider
                  size="small"
                  value={maxDistance}
                  onChange={(_, val) => setMaxDistance(val as number)}
                  min={1}
                  max={100}
                />
              </Box>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ pt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={websiteRequired === true}
                    onChange={(e) => setWebsiteRequired(e.target.checked ? true : null)}
                  />
                }
                label="Has Website"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "13px" } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={websiteRequired === false}
                    onChange={(e) => setWebsiteRequired(e.target.checked ? false : null)}
                  />
                }
                label="No Website"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "13px" } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={phoneRequired === true}
                    onChange={(e) => setPhoneRequired(e.target.checked ? true : null)}
                  />
                }
                label="Has Phone"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "13px" } }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={openNowRequired}
                    onChange={(e) => setOpenNowRequired(e.target.checked)}
                  />
                }
                label="Open Now"
                sx={{ "& .MuiFormControlLabel-label": { fontSize: "13px" } }}
              />
            </Stack>
          </Stack>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ borderRadius: "6px" }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h3" sx={{ fontSize: "18px", fontWeight: 700 }}>
              {searchResults.length > 0
                ? `Discovered ${searchResults.length} B2B Leads`
                : searchTriggered && !loading
                ? "No business leads found"
                : "Search results cockpit"}
            </Typography>
            {queryDetails && (
              <Tooltip title="View AI Query Analysis">
                <IconButton size="small" onClick={() => setInfoModalOpen(true)} color="info" sx={{ bgcolor: `${theme.palette.info.main}1A` }}>
                  <Info size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <Stack spacing={2} alignItems="center">
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary">
                LeadLens AI is compiling coordinates and contacts...
              </Typography>
            </Stack>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {searchResults.map((lead) => {
              const isFavorited = favorites.includes(lead.id);
              const isSaved = collections.some(col => col.leads?.some(l => l.id === lead.id));
              return (
                <Card
                  key={lead.id}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    borderColor: "divider",
                    transition: "transform 0.2s, border-color 0.2s",
                    "&:hover": {
                      borderColor: "text.disabled",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                        <Typography variant="h5" sx={{ fontSize: "16px", fontWeight: 700 }}>
                          {lead.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleFavoriteToggle(lead.id)}
                          sx={{ color: isFavorited ? "warning.main" : "text.disabled", mt: -0.5 }}
                        >
                          <Sparkles size={16} fill={isFavorited ? theme.palette.warning.main : "none"} />
                        </IconButton>
                      </Stack>

                      <Box>
                        <Chip
                          label={lead.category}
                          size="small"
                          sx={{
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            bgcolor: "action.hover",
                          }}
                        />
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Box sx={{ color: "text.secondary", mt: 0.25 }}>
                          <MapPin size={14} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12.5px" }}>
                          {lead.address}
                        </Typography>
                      </Stack>

                      <Stack spacing={0.75} sx={{ pt: 1 }}>
                        {lead.phone && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Phone size={13} color={theme.palette.text.secondary} />
                            <Typography variant="body2" sx={{ fontSize: "12px", color: "text.primary" }}>
                              {lead.phone}
                            </Typography>
                          </Stack>
                        )}
                        {lead.openingHours && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Clock size={13} color={theme.palette.text.secondary} />
                            <Typography variant="body2" sx={{ fontSize: "12px", color: "text.secondary" }} noWrap>
                              {lead.openingHours}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>

                  <CardActions
                    sx={{
                      p: 2,
                      pt: 0,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={0.5}>
                      {lead.website ? (
                        <Tooltip title="Visit Website">
                          <IconButton
                            size="small"
                            onClick={() => window.open(lead?.website || undefined, "_blank")}
                            sx={{ color: "text.secondary" }}
                          >
                            <ExternalLink size={15} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="No website available">
                          <Box>
                            <IconButton size="small" disabled sx={{ color: "text.disabled" }}>
                              <ExternalLink size={15} />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      )}

                      {lead.phone ? (
                        <Tooltip title={copyFeedbackId === lead.id ? "Copied!" : "Copy Phone"}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyPhone(lead.id, lead.phone!)}
                            sx={{ color: copyFeedbackId === lead.id ? "success.main" : "text.secondary" }}
                          >
                            <Copy size={15} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <IconButton size="small" disabled sx={{ color: "text.disabled" }}>
                          <Copy size={15} />
                        </IconButton>
                      )}

                      <Tooltip title="View location on Google Maps">
                        <IconButton
                          size="small"
                          onClick={() => handleViewMap(lead)}
                          sx={{ color: "text.secondary" }}
                        >
                          <MapPin size={15} />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Button
                      size="small"
                      variant={isSaved ? "contained" : "outlined"}
                      startIcon={isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                      onClick={() => {
                        if (isSaved) handleUnsaveLead(lead.id);
                        else handleOpenSaveDialog(lead);
                      }}
                      sx={{
                        fontSize: "12px",
                        py: 0.5,
                        borderColor: isSaved ? "success.main" : "divider",
                        bgcolor: isSaved ? "success.main" : "transparent",
                        color: isSaved ? "white" : "inherit",
                        "&:hover": { 
                          borderColor: isSaved ? "success.dark" : "text.secondary",
                          bgcolor: isSaved ? "success.dark" : "transparent"
                        },
                      }}
                    >
                      {isSaved ? "Saved" : "Save"}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Box>
        )}
      </Stack>

      <Dialog fullScreen={isMobile} open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Save Lead to Collection</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {saveSuccessMsg ? (
              <Alert severity="success" sx={{ borderRadius: "6px" }}>
                {saveSuccessMsg}
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Add <strong>{selectedLead?.name}</strong> to one of your existing lists or create a new collection folder.
                </Typography>

                {collections.length > 0 && (
                  <TextField
                    select
                    fullWidth
                    label="Choose Existing Collection"
                    value={targetCollectionId}
                    onChange={(e) => {
                      setTargetCollectionId(e.target.value);
                      setNewCollectionName("");
                    }}
                  >
                    {collections
                      .filter((c) => !c.isArchived)
                      .map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                  </TextField>
                )}

                {collections.length > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "divider" }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mx: 2, fontWeight: 600 }}>
                      OR CREATE NEW
                    </Typography>
                    <Box sx={{ flexGrow: 1, height: "1px", bgcolor: "divider" }} />
                  </Box>
                )}

                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="New Collection Name"
                    placeholder="e.g. London Dental Clinics"
                    value={newCollectionName}
                    onChange={(e) => {
                      setNewCollectionName(e.target.value);
                      setTargetCollectionId("");
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    label="Description (Optional)"
                    placeholder="Short list notes..."
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                  />
                </Stack>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setSaveDialogOpen(false)} disabled={saveLoading}>
            Cancel
          </Button>
          {!saveSuccessMsg && (
            <Button
              variant="contained"
              onClick={handleSaveLead}
              disabled={saveLoading || (!targetCollectionId && !newCollectionName.trim())}
              startIcon={saveLoading ? <CircularProgress size={12} color="inherit" /> : <BookmarkCheck size={14} />}
            >
              Save Prospect
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* AI Query Info Modal */}
      <Dialog fullScreen={isMobile} open={infoModalOpen} onClose={() => setInfoModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>AI Query Analysis</DialogTitle>
        <DialogContent dividers>
          {queryDetails && (
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Sparkles size={18} color={theme.palette.info.main} />
                <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                  Worker Routing & Parsing
                </Typography>
                {queryDetails.source && (
                  <Chip 
                    label={queryDetails.source.toUpperCase()} 
                    size="small" 
                    color={queryDetails.source === "worker" ? "success" : "warning"}
                    sx={{ height: 20, fontSize: "10px", fontWeight: 700, ml: 1 }}
                  />
                )}
              </Stack>
              
              <Typography variant="body2" color="text.secondary">
                {queryDetails.explanation}
              </Typography>

              {(queryDetails.locationResolved || queryDetails.total !== undefined || queryDetails.dataQuality) && (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2.5, mt: 1 }}>
                  {queryDetails.locationResolved && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Resolved Location</Typography>
                      <Typography variant="body2">{queryDetails.locationResolved}</Typography>
                    </Box>
                  )}
                  {queryDetails.total !== undefined && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Total Found (in area)</Typography>
                      <Typography variant="body2">{queryDetails.total}</Typography>
                    </Box>
                  )}
                  {queryDetails.dataQuality?.note && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Data Quality Note</Typography>
                      <Typography variant="body2" sx={{ fontStyle: "italic" }}>{queryDetails.dataQuality.note}</Typography>
                    </Box>
                  )}
                  {queryDetails.requestUrl && (
                     <Box>
                       <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Worker Requested URL</Typography>
                       <Typography variant="caption" sx={{ wordBreak: "break-all", color: "info.main", fontFamily: "monospace" }}>
                         {queryDetails.requestUrl}
                       </Typography>
                     </Box>
                  )}
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoModalOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
