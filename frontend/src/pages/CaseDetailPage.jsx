import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/EditOutlined";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import LockOpenIcon from "@mui/icons-material/LockOpenOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import Tooltip from "@mui/material/Tooltip";
import { deleteCase, exportCase, getCase, updateCase } from "../api/cases.js";
import { deleteQuery } from "../api/queries.js";
import useUiStore from "../store/uiStore.js";

const MONO = "'IBM Plex Mono', monospace";

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Notes
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Delete confirm
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCase(id);
      setCaseData(data);
      setNotes(data.notes || "");
      setNotesDirty(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateCase(id, { notes });
      setNotesDirty(false);
      showToast("Notes saved", "success");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = caseData.status === "open" ? "closed" : "open";
    try {
      const updated = await updateCase(id, { status: newStatus });
      setCaseData((prev) => ({ ...prev, status: updated.status }));
      showToast(`Case ${newStatus}`, "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleEdit = async () => {
    try {
      const updated = await updateCase(id, {
        name: editName,
        description: editDesc || null,
      });
      setCaseData((prev) => ({ ...prev, name: updated.name, description: updated.description }));
      setEditOpen(false);
      showToast("Case updated", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleExport = async () => {
    try {
      await exportCase(id);
      showToast("Case exported", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCase(id);
      showToast("Case deleted", "info");
      navigate("/cases");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDeleteQuery = async (queryId) => {
    try {
      await deleteQuery(queryId);
      setCaseData((prev) => ({
        ...prev,
        queries: prev.queries.filter((q) => q.id !== queryId),
        query_count: prev.query_count - 1,
      }));
      showToast("Query deleted", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!caseData) return <Alert severity="warning">Case not found.</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: "1.1rem" }}>{caseData.name}</Typography>
          <Chip
            label={caseData.status}
            size="small"
            color={caseData.status === "open" ? "success" : "default"}
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <IconButton size="small" onClick={() => { setEditName(caseData.name); setEditDesc(caseData.description || ""); setEditOpen(true); }} title="Edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleToggleStatus} title={caseData.status === "open" ? "Close case" : "Reopen case"}>
            {caseData.status === "open" ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={handleExport} title="Export">
            <FileDownloadIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setDeleteOpen(true)} title="Delete" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {caseData.description && (
        <Typography variant="body2" color="text.secondary">{caseData.description}</Typography>
      )}

      {/* Notes */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="overline">Investigator Notes</Typography>
          {notesDirty && (
            <Button
              size="small"
              variant="outlined"
              startIcon={savingNotes ? <CircularProgress size={14} /> : <SaveIcon />}
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              Save
            </Button>
          )}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
          placeholder="Write your investigation notes here…"
          InputProps={{ sx: { fontSize: "0.84rem" } }}
        />
      </Paper>

      {/* Queries */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="overline">
            Queries ({caseData.queries?.length || 0})
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => navigate(`/query?case=${id}`)}
          >
            New Query
          </Button>
        </Box>

        {!caseData.queries?.length ? (
          <Typography variant="body2" color="text.disabled">
            No queries yet. Run your first query for this case.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Module</TableCell>
                <TableCell>Query</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Fetched / Total</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Date</TableCell>
                <TableCell sx={{ width: 48 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {caseData.queries.map((q) => (
                <TableRow key={q.id || q.created_at} hover sx={{ cursor: q.id ? "pointer" : "default" }}
                  onClick={() => q.id && navigate(`/results/${q.id}`)}>
                  <TableCell sx={{ fontFamily: MONO, color: "primary.main" }}>{q.module}</TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.78rem", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {q.query}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={q.status}
                      size="small"
                      color={q.status === "success" ? "success" : q.status === "error" ? "error" : "warning"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO }}>
                      {q.result_count != null
                        ? q.total_available && q.total_available !== q.result_count
                          ? `${q.result_count} / ${q.total_available}`
                          : q.result_count
                        : "—"}
                    </TableCell>
                  <TableCell sx={{ fontFamily: MONO, color: "text.disabled" }}>
                    {q.duration_ms != null ? `${q.duration_ms}ms` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "text.disabled" }}>
                    {new Date(q.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    {q.id && (
                      <Tooltip title="Delete query and results">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleDeleteQuery(q.id); }}
                          sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Case</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <TextField label="Name" fullWidth value={editName} onChange={(e) => setEditName(e.target.value)} />
          <TextField label="Description" fullWidth multiline rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!editName.trim()} onClick={handleEdit}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Case</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will delete the case "{caseData.name}". Associated queries will remain in history but will no longer be linked to this case.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
