import { useNavigate } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listCases } from "../api/cases.js";
import { getModuleBreakdown, getOverview, getTimeline } from "../api/stats.js";
import { listQueries } from "../api/queries.js";
import useAsyncData from "../hooks/useAsyncData.js";
import PageHeader from "../components/common/PageHeader.jsx";

const MONO = "'IBM Plex Mono', monospace";
const MODULE_COLORS = ["#00d4ff", "#a6e3a1", "#cba6f7", "#fab387"];

function StatCard({ label, value }) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: "1.4rem", fontWeight: 500, color: "primary.main" }}>
        {value}
      </Typography>
      <Typography variant="overline">{label}</Typography>
    </Paper>
  );
}

function StatCardSkeleton() {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Skeleton variant="text" width={60} sx={{ fontSize: "1.4rem", mb: 0.5 }} />
      <Skeleton variant="text" width={80} sx={{ fontSize: "0.68rem" }} />
    </Paper>
  );
}

function buildChartData(timeline) {
  const byDay = {};
  for (const row of timeline) {
    if (!byDay[row.day]) byDay[row.day] = { day: row.day };
    byDay[row.day][row.module] = (byDay[row.day][row.module] || 0) + row.count;
  }
  return Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day));
}

export default function Dashboard() {
  const navigate = useNavigate();

  const overview = useAsyncData(getOverview, [], { cacheKey: "dash-overview", ttl: 30000 });
  const timeline = useAsyncData(() => getTimeline(30), [], { cacheKey: "dash-timeline", ttl: 30000 });
  const modules = useAsyncData(getModuleBreakdown, [], { cacheKey: "dash-modules", ttl: 30000 });
  const recent = useAsyncData(() => listQueries(1, 8), [], { cacheKey: "dash-recent", ttl: 15000 });
  const cases = useAsyncData(() => listCases(1, 5, "open"), [], { cacheKey: "dash-cases", ttl: 15000 });

  const chartData = timeline.data ? buildChartData(timeline.data) : [];
  const moduleNames = timeline.data ? [...new Set(timeline.data.map((r) => r.module))] : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <PageHeader icon={<DashboardIcon />} title="Dashboard" />
      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 1.5 }}>
        {overview.loading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : overview.error ? (
          <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>{overview.error}</Alert>
        ) : (
          <>
            <StatCard label="Total Queries" value={overview.data.total_queries} />
            <StatCard label="Successful" value={overview.data.successful} />
            <StatCard label="Failed" value={overview.data.failed} />
            <StatCard label="Success Rate" value={`${overview.data.success_rate}%`} />
            <StatCard label="Avg Duration" value={`${overview.data.avg_duration_ms}ms`} />
          </>
        )}
      </Box>

      {/* Open Cases */}
      {(cases.loading || (cases.data?.items?.length > 0)) && (
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ mb: 1, display: "block" }}>Open Cases</Typography>
          {cases.loading ? (
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width={200} height={60} />
              ))}
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 0.5 }}>
              {cases.data.items.map((c) => (
                <Paper
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}`)}
                  sx={{
                    p: 1.5, minWidth: 200, cursor: "pointer", bgcolor: "background.default",
                    transition: "border-color 0.15s", "&:hover": { borderColor: "primary.main" },
                  }}
                >
                  <Typography sx={{ fontWeight: 500, fontSize: "0.88rem", mb: 0.3 }}>{c.name}</Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.75rem", color: "primary.main" }}>
                    {c.query_count} queries
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Chart */}
      <Paper sx={{ p: 2.5 }}>
        <Typography variant="overline" sx={{ mb: 2, display: "block" }}>
          Queries — Last 30 Days
        </Typography>
        {timeline.loading ? (
          <Skeleton variant="rounded" height={220} />
        ) : timeline.error ? (
          <Alert severity="error">{timeline.error}</Alert>
        ) : chartData.length === 0 ? (
          <Typography variant="body2" color="text.disabled">No data yet.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d3d" />
              <XAxis dataKey="day" tick={{ fill: "#6c7086", fontSize: 11 }} />
              <YAxis tick={{ fill: "#6c7086", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#1a2332", border: "1px solid #1e2d3d",
                  borderRadius: 8, color: "#cdd6f4", fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#a6adc8" }} />
              {moduleNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name}
                  stroke={MODULE_COLORS[i % MODULE_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {/* Bottom row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "200px 1fr" }, gap: 2 }}>
        {/* Module breakdown */}
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ mb: 1.5, display: "block" }}>By Module</Typography>
          {modules.loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} variant="text" sx={{ mb: 0.5 }} />
            ))
          ) : modules.error ? (
            <Alert severity="error" variant="outlined">{modules.error}</Alert>
          ) : modules.data.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No queries yet.</Typography>
          ) : (
            modules.data.map(({ module, count }) => (
              <Box key={module} sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: "0.82rem", color: "primary.main" }}>{module}</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: "0.82rem", color: "text.secondary" }}>{count}</Typography>
              </Box>
            ))
          )}
        </Paper>

        {/* Recent queries */}
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ mb: 1, display: "block" }}>Recent Queries</Typography>
          {recent.loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="text" height={32} sx={{ mb: 0.3 }} />
            ))
          ) : recent.error ? (
            <Alert severity="error" variant="outlined">{recent.error}</Alert>
          ) : recent.data.items.length === 0 ? (
            <Typography variant="body2" color="text.disabled">No queries yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  <TableCell>Query</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fetched / Total</TableCell>
                  <TableCell>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recent.data.items.map((q) => (
                  <TableRow key={q.id} hover onClick={() => navigate(`/results/${q.id}`)}>
                    <TableCell sx={{ fontFamily: MONO, color: "primary.main" }}>{q.module}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.query}
                    </TableCell>
                    <TableCell>
                      <Chip label={q.status} size="small"
                        color={q.status === "success" ? "success" : q.status === "error" ? "error" : "warning"}
                        variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONO }}>
                      {q.result?.result_count != null
                        ? q.result.total_available && q.result.total_available !== q.result.result_count
                          ? `${q.result.result_count} / ${q.result.total_available}`
                          : q.result.result_count
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: MONO, color: "text.disabled" }}>
                      {q.duration_ms != null ? `${q.duration_ms}ms` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
