import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import { getQuery } from "../api/queries.js";
import DataExplorer from "../components/explorer/DataExplorer.jsx";
import useExportStore from "../store/exportStore.js";

const MONO = "'IBM Plex Mono', monospace";

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setIds = useExportStore((s) => s.setIds);

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setRecord(await getQuery(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleExport = () => {
    if (record?.result?.id) {
      setIds(record.id, record.result.id);
      navigate("/export");
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!record) return <Alert severity="warning">Query not found.</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: "1rem", fontWeight: 500, color: "primary.main" }}>
            {record.module}
          </Typography>
          <Chip
            label={record.status}
            size="small"
            color={record.status === "success" ? "success" : record.status === "error" ? "error" : "warning"}
            variant="outlined"
          />
          {record.result && (
            <Typography variant="body2" color="text.disabled">
              {record.result.result_count} results
            </Typography>
          )}
          {record.duration_ms != null && (
            <Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.disabled" }}>
              {record.duration_ms}ms
            </Typography>
          )}
        </Box>
        {record.result && (
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={handleExport}>
            Export
          </Button>
        )}
      </Box>

      {/* Query string */}
      <Paper sx={{ p: 1.5, bgcolor: "background.default" }}>
        <Typography sx={{ fontFamily: MONO, fontSize: "0.84rem", color: "text.secondary", wordBreak: "break-all" }}>
          {record.query}
        </Typography>
      </Paper>

      {/* Error */}
      {record.status === "error" && record.error_msg && (
        <Alert severity="error">{record.error_msg}</Alert>
      )}

      {/* Data explorer */}
      {record.result?.raw_data && (
        <Paper sx={{ p: 2, minHeight: 400 }}>
          <DataExplorer data={record.result.raw_data} />
        </Paper>
      )}
    </Box>
  );
}
