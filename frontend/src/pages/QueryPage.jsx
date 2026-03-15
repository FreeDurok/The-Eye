import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import SendIcon from "@mui/icons-material/SendOutlined";
import { listCases } from "../api/cases.js";
import { listModules } from "../api/modules.js";
import { listQueries, runQuery } from "../api/queries.js";
import useUiStore from "../store/uiStore.js";
import PageHeader from "../components/common/PageHeader.jsx";
import ImportDialog from "../components/import/ImportDialog.jsx";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFileOutlined";

const MONO = "'IBM Plex Mono', monospace";

const MAX_RESULTS_OPTIONS = [
  { value: 100,  label: "100" },
  { value: 500,  label: "500" },
  { value: 1000, label: "1K" },
  { value: 0,    label: "All" },
];

export default function QueryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showToast = useUiStore((s) => s.showToast);

  const [modules, setModules] = useState([]);
  const [cases, setCases] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedCase, setSelectedCase] = useState(searchParams.get("case") || "");
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState(100);
  const [running, setRunning] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState(null);

  const [recentQueries, setRecentQueries] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    Promise.all([
      listModules(),
      listCases(1, 100, "open"),
    ])
      .then(([mods, casesData]) => {
        setModules(mods);
        if (mods.length > 0) setSelectedModule(mods[0].name);
        setCases(casesData.items);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingModules(false));
  }, []);

  const loadRecent = (mod) => {
    if (!mod) return;
    setLoadingRecent(true);
    listQueries(1, 10, mod)
      .then((data) => setRecentQueries(data.items))
      .catch(() => setRecentQueries([]))
      .finally(() => setLoadingRecent(false));
  };

  useEffect(() => { loadRecent(selectedModule); }, [selectedModule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setRunning(true);
    setError(null);
    try {
      const result = await runQuery(
        selectedModule,
        query.trim(),
        { max_results: maxResults },
        selectedCase || null,
      );
      showToast(
        result.status === "success"
          ? `Query completed — ${result.result?.result_count ?? 0} results`
          : `Query failed: ${result.error_msg}`,
        result.status === "success" ? "success" : "error"
      );
      loadRecent(selectedModule);
      navigate(`/results/${result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  if (loadingModules) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>;

  const currentModule = modules.find((m) => m.name === selectedModule);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader icon={<SearchIcon />} title="New Query" />
      {/* Top row: form + module info */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 260px" }, gap: 2.5, alignItems: "start" }}>
        {/* Query form */}
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="overline" sx={{ mb: 1, display: "block" }}>Module</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {modules.map((m) => (
                  <Paper
                    key={m.name}
                    onClick={() => setSelectedModule(m.name)}
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      borderColor: selectedModule === m.name ? "primary.main" : "divider",
                      bgcolor: selectedModule === m.name ? "rgba(0,212,255,0.06)" : "background.default",
                      transition: "border-color 0.15s, background 0.15s",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <Typography sx={{ fontFamily: MONO, fontSize: "0.84rem", fontWeight: 500 }}>
                      {m.display_name}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: "0.72rem" }}>
                      {m.description}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>

            {cases.length > 0 && (
              <Box>
                <Typography variant="overline" sx={{ mb: 1, display: "block" }}>Case</Typography>
                <Select
                  size="small"
                  value={selectedCase}
                  onChange={(e) => setSelectedCase(e.target.value)}
                  displayEmpty
                  fullWidth
                >
                  <MenuItem value="">No case</MenuItem>
                  {cases.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            <Box>
              <Typography variant="overline" sx={{ mb: 1, display: "block" }}>Query</Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={running}
                placeholder={
                  selectedModule === "shodan"
                    ? 'e.g. apache country:"IT" port:80'
                    : 'e.g. services.port=443 and location.country="IT"'
                }
                InputProps={{ sx: { fontFamily: MONO, fontSize: "0.84rem" } }}
              />
            </Box>

            <Box>
              <Typography variant="overline" sx={{ mb: 1, display: "block" }}>Max Results</Typography>
              <ToggleButtonGroup
                value={maxResults}
                exclusive
                onChange={(_, v) => v !== null && setMaxResults(v)}
                size="small"
              >
                {MAX_RESULTS_OPTIONS.map(({ value, label }) => (
                  <ToggleButton key={value} value={value} sx={{ fontFamily: MONO, fontSize: "0.78rem", px: 2 }}>
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                {maxResults === 0
                  ? "Fetches all results (max 10K). Each page of 100 costs 1 query credit."
                  : `Fetches up to ${maxResults} results (${Math.ceil(maxResults / 100)} page${maxResults > 100 ? "s" : ""}).`}
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => setImportOpen(true)}
              >
                Import File
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={!query.trim() || running}
                startIcon={running ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              >
                Run Query
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Module info */}
        {currentModule && (
          <Paper sx={{ p: 2.5 }}>
            <Typography sx={{ fontFamily: MONO, fontWeight: 500, mb: 1 }}>
              {currentModule.display_name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
              {currentModule.description}
            </Typography>

            <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>Required keys</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
              {currentModule.required_keys.map((k) => (
                <Typography key={k} sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "secondary.main" }}>
                  {k}
                </Typography>
              ))}
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {currentModule.tags.map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined" color="default" />
              ))}
            </Box>
          </Paper>
        )}
      </Box>

      {/* Recent queries — full width below */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <HistoryIcon sx={{ fontSize: 16, color: "text.disabled" }} />
          <Typography variant="overline">Recent Queries</Typography>
          <Typography variant="caption" color="text.disabled">
            — click to reuse
          </Typography>
        </Box>

        {loadingRecent ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={32} />
            ))}
          </Box>
        ) : recentQueries.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.78rem" }}>
            No previous queries for this module.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Query</TableCell>
                <TableCell sx={{ width: 100 }}>Status</TableCell>
                <TableCell sx={{ width: 110 }}>Fetched / Total</TableCell>
                <TableCell sx={{ width: 80 }}>Duration</TableCell>
                <TableCell sx={{ width: 100 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentQueries.map((q) => (
                <TableRow
                  key={q.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => setQuery(q.query)}
                >
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.78rem" }}>
                    {q.query}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={q.status}
                      size="small"
                      variant="outlined"
                      color={q.status === "success" ? "success" : q.status === "error" ? "error" : "warning"}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.78rem" }}>
                    {q.result?.result_count != null
                      ? q.result.total_available && q.result.total_available !== q.result.result_count
                        ? `${q.result.result_count} / ${q.result.total_available}`
                        : q.result.result_count
                      : "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "text.disabled" }}>
                    {q.duration_ms != null ? `${q.duration_ms}ms` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.68rem", color: "text.disabled" }}>
                    {new Date(q.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={(rec) => {
          setImportOpen(false);
          navigate(`/results/${rec.id}`);
        }}
        defaultModule={selectedModule}
        defaultCaseId={selectedCase}
      />
    </Box>
  );
}
