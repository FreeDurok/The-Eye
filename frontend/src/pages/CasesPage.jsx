import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/AddOutlined";
import UploadIcon from "@mui/icons-material/UploadFileOutlined";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import { createCase, importCase, listCases } from "../api/cases.js";
import useUiStore from "../store/uiStore.js";
import PageHeader from "../components/common/PageHeader.jsx";

const MONO = "'IBM Plex Mono', monospace";

const STATUS_COLORS = {
  open: "success",
  closed: "default",
  archived: "warning",
};

function CaseCardSkeleton() {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Skeleton variant="text" width="70%" sx={{ fontSize: "0.95rem", mb: 1 }} />
      <Skeleton variant="text" width="90%" sx={{ fontSize: "0.84rem", mb: 1.5 }} />
      <Skeleton variant="text" width="40%" sx={{ fontSize: "0.78rem" }} />
    </Paper>
  );
}

export default function CasesPage() {
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const fileInputRef = useRef(null);

  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async (p = page, status = statusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCases(p, 20, status || null);
      setCases(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page, statusFilter); }, [page, statusFilter]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const c = await createCase(newName.trim(), newDesc.trim() || null);
      setDialogOpen(false);
      setNewName("");
      setNewDesc("");
      showToast("Case created", "success");
      navigate(`/cases/${c.id}`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const c = await importCase(file);
      showToast("Case imported", "success");
      navigate(`/cases/${c.id}`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader icon={<FolderIcon />} title="Cases" />
      {/* Toolbar — always visible */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? <Skeleton width={60} sx={{ display: "inline-block" }} /> : `${total} cases`}
          </Typography>
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            displayEmpty
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <input ref={fileInputRef} type="file" accept=".json,.zip" hidden onChange={handleImport} />
          <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
            Import
          </Button>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            New Case
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Cases grid — skeletons during loading */}
      {loading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => <CaseCardSkeleton key={i} />)}
        </Box>
      ) : cases.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <FolderIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.disabled">No cases yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
          {cases.map((c) => (
            <Paper
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              sx={{
                p: 2.5, cursor: "pointer",
                transition: "border-color 0.15s", "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography sx={{ fontWeight: 500, fontSize: "0.95rem" }}>{c.name}</Typography>
                <Chip label={c.status} size="small" color={STATUS_COLORS[c.status] || "default"} variant="outlined" />
              </Box>
              {c.description && (
                <Typography variant="body2" color="text.secondary"
                  sx={{ mb: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.description}
                </Typography>
              )}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "primary.main" }}>
                  {c.query_count} queries
                </Typography>
                <Typography variant="caption">{new Date(c.created_at).toLocaleDateString()}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {total > 20 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.disabled", alignSelf: "center" }}>
            {page} / {Math.ceil(total / 20)}
          </Typography>
          <Button variant="outlined" size="small" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Case</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField label="Name" fullWidth value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          <TextField label="Description (optional)" fullWidth multiline rows={2} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!newName.trim() || creating} onClick={handleCreate}>
            {creating ? <CircularProgress size={16} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
