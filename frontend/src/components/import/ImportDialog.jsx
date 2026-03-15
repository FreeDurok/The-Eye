import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UploadFileIcon from "@mui/icons-material/UploadFileOutlined";
import { listCases } from "../../api/cases.js";
import { listModules } from "../../api/modules.js";
import { importFile } from "../../api/queries.js";

const MONO = "'IBM Plex Mono', monospace";

export default function ImportDialog({ open, onClose, onSuccess, defaultModule, defaultCaseId }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState(defaultModule || "");
  const [caseId, setCaseId] = useState(defaultCaseId || "");
  const [modules, setModules] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setQuery("");
    setModule(defaultModule || "");
    setCaseId(defaultCaseId || "");
    setError(null);

    Promise.all([listModules(), listCases(1, 100, "open")])
      .then(([mods, casesData]) => {
        setModules(mods);
        setCases(casesData.items);
      })
      .catch(() => {});
  }, [open, defaultModule, defaultCaseId]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleImport = async () => {
    if (!file || !query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const record = await importFile(
        file,
        query.trim(),
        module || null,
        caseId || null,
      );
      onSuccess?.(record);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Import Results</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        {/* File picker */}
        <Box>
          <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>File</Typography>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.jsonl,.gz"
            hidden
            onChange={handleFileChange}
          />
          <Button
            variant="outlined"
            fullWidth
            startIcon={<UploadFileIcon />}
            onClick={() => fileRef.current?.click()}
            sx={{
              justifyContent: "flex-start",
              textTransform: "none",
              fontFamily: file ? MONO : undefined,
              fontSize: "0.84rem",
              color: file ? "text.primary" : "text.secondary",
            }}
          >
            {file ? file.name : "Select .json, .jsonl, or .gz file..."}
          </Button>
          {file && (
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
              {(file.size / 1024).toFixed(1)} KB
            </Typography>
          )}
        </Box>

        {/* Query */}
        <Box>
          <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>Original Query</Typography>
          <TextField
            fullWidth
            size="small"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. country:IT port:443'
            InputProps={{ sx: { fontFamily: MONO, fontSize: "0.84rem" } }}
          />
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
            The query that generated these results
          </Typography>
        </Box>

        {/* Module */}
        <Box>
          <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>Module</Typography>
          <Select
            size="small"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="">Auto-detect</MenuItem>
            {modules.map((m) => (
              <MenuItem key={m.name} value={m.name}>{m.display_name}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Case */}
        {cases.length > 0 && (
          <Box>
            <Typography variant="overline" sx={{ mb: 0.5, display: "block" }}>Case</Typography>
            <Select
              size="small"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
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

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!file || !query.trim() || loading}
          onClick={handleImport}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
