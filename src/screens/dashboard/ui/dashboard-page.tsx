"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  useTheme,
  LinearProgress,
} from "@mui/material";
import {
  FolderHeart,
  Search,
  Download,
  Flame,
  Activity,
  ArrowRight,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMetricsSuccess, setCollectionStart, setCollectionFailure } from "@/entities/collection/model/collection-slice";
import { collectionApi } from "@/shared/api/collection-api";
import { useRouter } from "next/navigation";
import { setSearchSuccess } from "@/entities/lead/model/lead-slice";
import { searchApi } from "@/shared/api/search-api";

export default function DashboardPage() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { metrics, activityLogs, savedSearches, loading } = useAppSelector(
    (state) => state.collection
  );
  const [runningSearchId, setRunningSearchId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    dispatch(setCollectionStart());
    try {
      const data = await collectionApi.getMetrics();
      if (data.success) {
        dispatch(
          setMetricsSuccess({
            metrics: data.metrics,
            logs: data.logs,
            savedSearches: data.savedSearches,
          })
        );
      } else {
        dispatch(setCollectionFailure(data.error || "Failed to load dashboard data"));
      }
    } catch (err: any) {
      dispatch(setCollectionFailure(err.message || "Failed to fetch metrics"));
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunSavedSearch = async (searchQuery: string, searchId: string) => {
    setRunningSearchId(searchId);
    try {
      const res = await searchApi.search(searchQuery);
      if (res.success) {
        dispatch(
          setSearchSuccess({
            leads: res.leads,
            queryDetails: res.queryDetails,
          })
        );
        router.push("/search");
      }
    } catch (err) {
      console.error("Failed to run saved search:", err);
    } finally {
      setRunningSearchId(null);
    }
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ display: "flex", flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const cards = [
    {
      title: "Saved Prospects",
      val: metrics?.savedLeads ?? 0,
      icon: FolderHeart,
      color: theme.palette.info.main,
      desc: "In active lists",
    },
    {
      title: "Total Searches",
      val: metrics?.searches ?? 0,
      icon: Search,
      color: "#8b5cf6",
      desc: "AI conversational queries",
    },
    {
      title: "Active Collections",
      val: metrics?.collections ?? 0,
      icon: FileText,
      color: "#10b981",
      desc: "Folders: " + (metrics?.folders ?? 0),
    },
    {
      title: "Total Exports",
      val: metrics?.exports ?? 0,
      icon: Download,
      color: "#f59e0b",
      desc: "CSV / Excel / PDF",
    },
  ];

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: "28px", sm: "36px" } }}>
          LeadLens Overview
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          AI-powered lead intelligence and prospect mapping cockpit.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 3,
        }}
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Paper
              key={i}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: "background.paper",
                borderColor: "divider",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: "13px" }}>
                    {card.title}
                  </Typography>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "6px",
                      bgcolor: `${card.color}15`,
                      color: card.color,
                      display: "flex",
                    }}
                  >
                    <Icon size={16} />
                  </Box>
                </Stack>
                <Typography variant="h3" sx={{ fontSize: "28px", fontWeight: 800 }}>
                  {card.val}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px" }}>
                  {card.desc}
                </Typography>
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "7fr 5fr" },
          gap: 4,
        }}
      >
        <Stack spacing={4} sx={{ minWidth: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 2, borderColor: "divider" }}>
            <Stack spacing={2.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h3" sx={{ fontSize: "16px", fontWeight: 700 }}>
                  Saved AI Searches
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  endIcon={<ArrowRight size={14} />}
                  onClick={() => router.push("/search")}
                  sx={{ fontSize: "12px", color: "info.main" }}
                >
                  New Search
                </Button>
              </Stack>

              <Stack spacing={1.5}>
                {savedSearches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                    No saved searches. Perform an AI query to get started!
                  </Typography>
                ) : (
                  savedSearches.slice(0, 4).map((search) => (
                    <Paper
                      key={search.id}
                      sx={{
                        p: 2,
                        borderRadius: 1.5,
                        borderColor: "divider",
                        bgcolor: "background.default",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box sx={{ overflow: "hidden", flex: 1, minWidth: 0, pr: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }} noWrap>
                          "{search.query}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "11px" }} noWrap>
                          {search.parsedSummary} • {new Date(search.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={runningSearchId !== null}
                        onClick={() => handleRunSavedSearch(search.query, search.id)}
                        sx={{
                          fontSize: "12px",
                          py: 0.5,
                          px: 1.5,
                          borderRadius: "4px",
                          bgcolor: "action.selected",
                          color: "text.primary",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        {runningSearchId === search.id ? <CircularProgress size={12} color="inherit" /> : "Run"}
                      </Button>
                    </Paper>
                  ))
                )}
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2, borderColor: "divider" }}>
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Activity size={18} color={theme.palette.info.main} />
                <Typography variant="h3" sx={{ fontSize: "16px", fontWeight: 700 }}>
                  Recent Activity
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {activityLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                    No recent activity records.
                  </Typography>
                ) : (
                  activityLogs.slice(0, 5).map((log) => (
                    <Stack
                      key={log.id}
                      direction="row"
                      spacing={2}
                      alignItems="flex-start"
                      sx={{
                        pb: 1.5,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        "&:last-child": { pb: 0, borderBottom: 0 },
                      }}
                    >
                      <Box
                        sx={{
                          p: 0.75,
                          borderRadius: "4px",
                          bgcolor: "action.hover",
                          color: log.type === "export" ? "warning.main" : log.type === "lead_save" ? "success.main" : "info.main",
                          display: "flex",
                        }}
                      >
                        <Flame size={14} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
                        <Typography variant="body2" sx={{ fontSize: "13px", color: "text.primary" }} noWrap>
                          {log.description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "10px", mt: 0.5 }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Stack>
                  ))
                )}
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={4} sx={{ minWidth: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 2, borderColor: "divider" }}>
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUp size={18} color="#10b981" />
                <Typography variant="h3" sx={{ fontSize: "16px", fontWeight: 700 }}>
                  Favorite Categories
                </Typography>
              </Stack>

              <Stack spacing={2.5} sx={{ py: 1 }}>
                {(metrics?.favoriteCategories || []).map((cat, i) => {
                  const maxCount = metrics?.favoriteCategories?.[0]?.count || 1;
                  const percent = Math.min(100, Math.max(10, (cat.count / maxCount) * 100));
                  return (
                    <Stack key={i} spacing={1}>
                      <Stack direction="row" justifyContent="space-between" sx={{ fontSize: "12px", fontWeight: 600 }}>
                        <Typography sx={{ fontSize: "13px" }}>{cat.name}</Typography>
                        <Typography color="text.secondary">{cat.count} saved leads</Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "action.hover",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: i === 0 ? "info.main" : i === 1 ? "#8b5cf6" : "#10b981",
                          },
                        }}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          </Paper>

          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 700 }}>
                💡 Pro Tips for discovery
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px", lineHeight: 1.6 }}>
                Our conversational search box converts query phrases directly into filters. Try typing:
                <br />
                • <em>"Find 20 restaurants in Tokyo"</em>
                <br />
                • <em>"Dentists in London without websites"</em>
                <br />
                • <em>"Gyms in Berlin within 5 km"</em>
                <br />
                <br />
                Results update instantly, and you can export any list to Excel or PDF with one click.
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
