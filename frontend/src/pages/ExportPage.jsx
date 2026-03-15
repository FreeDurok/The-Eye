import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader.jsx";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import { getQuery } from "../api/queries.js";
import { deleteProfile, exportData, listProfiles, saveProfile } from "../api/export.js";
import { extractPaths } from "../components/explorer/pathUtils.js";
import useExportStore from "../store/exportStore.js";
import useUiStore from "../store/uiStore.js";

const MONO = "'IBM Plex Mono', monospace";

export default function ExportPage() {
  const showToast = useUiStore((s) => s.showToast);
  const { queryId, resultId, selectedFields, format, setSelectedFields, setFormat, loadProfile, reset } =
    useExportStore();

  const [record, setRecord] = useState(null);
  const [allPaths, setAllPaths] = useState([]);
  const [fieldFilter, setFieldFilter] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [newProfileName, setNewProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { listProfiles().then(setProfiles).catch(() => {}); }, []);

  useEffect(() => {
    if (!queryId) return;
    setLoading(true);
    getQuery(queryId)
      .then((r) => {
        setRecord(r);
        if (r?.result?.raw_data) {
          const paths = extractPaths(r.result.raw_data);
          setAllPaths(paths);
          if (selectedFields.length === 0) setSelectedFields(paths);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [queryId]);

  const toggleField = (path) => {
    setSelectedFields(
      selectedFields.includes(path)
        ? selectedFields.filter((f) => f !== path)
        : [...selectedFields, path]
    );
  };

  const handleExport = async () => {
    if (!resultId || selectedFields.length === 0) return;
    setExporting(true);
    try {
      await exportData(resultId, selectedFields, format);
      showToast("Export downloaded", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!newProfileName.trim()) return;
    try {
      const p = await saveProfile(newProfileName.trim(), format, selectedFields);
      setProfiles((prev) => [...prev, p]);
      setNewProfileName("");
      showToast("Profile saved", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDeleteProfile = async (id) => {
    try {
      await deleteProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // Preview rows
  const previewRows = (() => {
    if (!record?.result?.raw_data || selectedFields.length === 0) return [];
    const data = record.result.raw_data;
    const firstArray = Object.values(data).find(Array.isArray);
    const items = firstArray ? firstArray.slice(0, 5) : [data];
    return items.map((item) => {
      const row = {};
      for (const f of selectedFields) {
        const subPath = f.includes("[]") ? f.split("[]").slice(1).join("").replace(/^\./, "") : f;
        let val;
        if (f.includes("[]")) {
          val = subPath ? getNestedVal(item, subPath) : item;
        } else {
          val = getNestedVal(data, f);
        }
        row[f] = val == null ? "" : typeof val === "object" ? JSON.stringify(val) : String(val);
      }
      return row;
    });
  })();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader icon={<FileDownloadIcon />} title="Export" />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, gap: 2.5, alignItems: "start" }}>
      {/* Left panel */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Result info */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 1 }}>Result</Typography>
          {queryId ? (
            <Box>
              {record ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Typography sx={{ fontFamily: MONO, color: "primary.main", fontSize: "0.84rem" }}>{record.module}</Typography>
                  <Typography variant="caption">{record.query}</Typography>
                </Box>
              ) : loading ? (
                <CircularProgress size={20} />
              ) : null}
              <Button size="small" onClick={() => { reset(); setRecord(null); setAllPaths([]); }} sx={{ mt: 1 }}>
                Clear
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Navigate to a result and click "Export".
            </Typography>
          )}
        </Paper>

        {/* Format */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 1 }}>Format</Typography>
          <ToggleButtonGroup
            value={format}
            exclusive
            onChange={(_, v) => v && setFormat(v)}
            size="small"
            fullWidth
          >
            <ToggleButton value="json" sx={{ fontFamily: MONO, fontSize: "0.78rem" }}>JSON</ToggleButton>
            <ToggleButton value="csv" sx={{ fontFamily: MONO, fontSize: "0.78rem" }}>CSV</ToggleButton>
            <ToggleButton value="excel" sx={{ fontFamily: MONO, fontSize: "0.78rem" }}>Excel</ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* Fields */}
        {allPaths.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="overline">Fields</Typography>
              <Typography variant="caption">{selectedFields.length}/{allPaths.length}</Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={selectedFields.length === allPaths.length}
                  indeterminate={selectedFields.length > 0 && selectedFields.length < allPaths.length}
                  onChange={() => setSelectedFields(selectedFields.length === allPaths.length ? [] : allPaths)}
                />
              }
              label={<Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.secondary" }}>Select all</Typography>}
            />

            <TextField
              size="small"
              fullWidth
              placeholder="Search fields…"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                  </InputAdornment>
                ),
                sx: { fontSize: "0.78rem", fontFamily: MONO },
              }}
              sx={{ mb: 1 }}
            />

            <Divider sx={{ mb: 0.5 }} />

            <Box sx={{ maxHeight: 260, overflowY: "auto" }}>
              {allPaths
                .filter((p) => !fieldFilter || p.toLowerCase().includes(fieldFilter.toLowerCase()))
                .map((path) => (
                  <FormControlLabel
                    key={path}
                    sx={{ display: "flex", ml: 0 }}
                    control={
                      <Checkbox size="small" checked={selectedFields.includes(path)} onChange={() => toggleField(path)} />
                    }
                    label={<Typography sx={{ fontFamily: MONO, fontSize: "0.75rem" }}>{path}</Typography>}
                  />
                ))}
            </Box>
          </Paper>
        )}

        {/* Profiles */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="overline" sx={{ display: "block", mb: 1 }}>Profiles</Typography>
          {profiles.length > 0 && (
            <List dense disablePadding sx={{ mb: 1 }}>
              {profiles.map((p) => (
                <ListItem key={p.id} disablePadding secondaryAction={
                  <IconButton edge="end" size="small" onClick={() => handleDeleteProfile(p.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }>
                  <ListItemButton onClick={() => loadProfile(p)} sx={{ borderRadius: 1 }}>
                    <ListItemText
                      primary={p.name}
                      secondary={p.format}
                      primaryTypographyProps={{ fontFamily: MONO, fontSize: "0.78rem" }}
                      secondaryTypographyProps={{ fontSize: "0.68rem" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              placeholder="Profile name…"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontSize: "0.78rem" } }}
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<SaveIcon />}
              disabled={!newProfileName.trim()}
              onClick={handleSaveProfile}
            >
              Save
            </Button>
          </Box>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          fullWidth
          startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
          disabled={!resultId || selectedFields.length === 0 || exporting}
          onClick={handleExport}
        >
          Export {format.toUpperCase()}
        </Button>
      </Box>

      {/* Right: preview */}
      <Paper sx={{ p: 2, minHeight: 300, minWidth: 0, overflow: "hidden" }}>
        <Typography variant="overline" sx={{ display: "block", mb: 1.5 }}>Preview</Typography>
        {previewRows.length === 0 ? (
          <Typography variant="body2" color="text.disabled">
            Select a result and fields to see a preview.
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 400, overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {selectedFields.map((f) => (
                    <TableCell key={f} sx={{ fontFamily: MONO, fontSize: "0.68rem", bgcolor: "background.paper" }}>
                      {f}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i} hover>
                    {selectedFields.map((f) => (
                      <TableCell
                        key={f}
                        sx={{
                          fontFamily: MONO,
                          fontSize: "0.75rem",
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row[f]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
    </Box>
  );
}

function getNestedVal(obj, path) {
  if (!path || obj == null) return obj;
  return path.split(".").reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);
}
