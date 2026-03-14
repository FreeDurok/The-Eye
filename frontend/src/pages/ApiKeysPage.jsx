import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import RefreshIcon from "@mui/icons-material/RefreshOutlined";
import { getApiKeyStatus } from "../api/apiKeys.js";

const MONO = "'IBM Plex Mono', monospace";

function StatusChip({ status }) {
  if (!status.is_configured)
    return <Chip label="Not configured" size="small" variant="outlined" />;
  if (status.is_valid === null)
    return <Chip label="Unknown" size="small" color="warning" variant="outlined" />;
  return status.is_valid
    ? <Chip label="Valid" size="small" color="success" variant="outlined" />
    : <Chip label="Invalid" size="small" color="error" variant="outlined" />;
}

export default function ApiKeysPage() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatuses(await getApiKeyStatus());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          API keys are read from environment variables. Restart the backend after changes.
        </Typography>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={load}>
          Re-check
        </Button>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
        {statuses.map((s) => (
          <Paper key={s.module} sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontFamily: MONO, fontWeight: 500, fontSize: "1rem" }}>
                {s.display_name}
              </Typography>
              <StatusChip status={s} />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: s.error_msg ? 2 : 0 }}>
              {s.required_keys.map((k) => (
                <Box
                  key={k}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "background.default",
                    borderRadius: 1,
                    px: 1.5,
                    py: 0.8,
                  }}
                >
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.secondary" }}>
                    {k}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem", color: s.is_configured ? "success.main" : "text.disabled" }}>
                    {s.is_configured ? "set" : "not set"}
                  </Typography>
                </Box>
              ))}
            </Box>

            {s.error_msg && (
              <Alert severity="error" variant="outlined" sx={{ fontSize: "0.78rem" }}>
                {s.error_msg}
              </Alert>
            )}
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
