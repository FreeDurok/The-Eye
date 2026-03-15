import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StatCard from "./StatCard.jsx";
import { computeStats, STAT_ORDER } from "./statsUtils.js";

const COLORS = {
  port:      "#00d4ff",
  org:       "#89b4fa",
  country:   "#a6e3a1",
  isp:       "#cba6f7",
  os:        "#fab387",
  transport: "#f9e2af",
  software:  "#f38ba8",
};

/**
 * Stats overview panel for query results.
 * Displays a grid of StatCards computed from raw OSINT data.
 *
 * Props:
 *   module: "shodan" | "censys"
 *   data: the raw_data object from the query result
 */
export default function ResultStats({ module, data }) {
  const stats = useMemo(
    () => (data ? computeStats(module, data) : {}),
    [module, data]
  );

  const keys = STAT_ORDER.filter((k) => stats[k]);

  if (keys.length === 0) {
    return (
      <Typography color="text.disabled" sx={{ py: 4, textAlign: "center" }}>
        No statistics available for this result.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2,
        py: 1,
      }}
    >
      {keys.map((key) => (
        <StatCard
          key={key}
          title={stats[key].label}
          items={stats[key].items}
          color={COLORS[key] || "#00d4ff"}
        />
      ))}
    </Box>
  );
}
