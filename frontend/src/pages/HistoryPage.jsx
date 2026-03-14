import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { listModules } from "../api/modules.js";
import { listQueries } from "../api/queries.js";
import useAsyncData from "../hooks/useAsyncData.js";

const MONO = "'IBM Plex Mono', monospace";
const PAGE_SIZE = 20;

function SkeletonRows({ count = 8, cols = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <TableCell key={j}><Skeleton variant="text" /></TableCell>
      ))}
    </TableRow>
  ));
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState("");

  const modulesData = useAsyncData(() => listModules());

  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (p = page, mod = moduleFilter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listQueries(p, PAGE_SIZE, mod || null);
      setRecords(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page, moduleFilter); }, [page, moduleFilter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Toolbar — always visible */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? <Skeleton width={80} sx={{ display: "inline-block" }} /> : `${total} total queries`}
        </Typography>
        <Select
          size="small"
          value={moduleFilter}
          onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
          displayEmpty
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All modules</MenuItem>
          {(modulesData.data || []).map((m) => (
            <MenuItem key={m.name} value={m.name}>{m.display_name}</MenuItem>
          ))}
        </Select>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Table — shows skeleton rows during loading */}
      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Module</TableCell>
              <TableCell>Query</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Results</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <SkeletonRows />
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.disabled">No queries found.</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => navigate("/query")}>
                    Run your first query
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id} hover onClick={() => navigate(`/results/${r.id}`)}>
                  <TableCell sx={{ fontFamily: MONO, color: "primary.main" }}>{r.module}</TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.78rem", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.query}
                  </TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small"
                      color={r.status === "success" ? "success" : r.status === "error" ? "error" : "warning"}
                      variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO }}>{r.result?.result_count ?? "—"}</TableCell>
                  <TableCell sx={{ fontFamily: MONO, color: "text.disabled" }}>
                    {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "text.disabled" }}>
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </Button>
          <Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.disabled" }}>
            {page} / {totalPages}
          </Typography>
          <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
