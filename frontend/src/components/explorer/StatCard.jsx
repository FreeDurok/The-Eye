import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const MONO = "'IBM Plex Mono', monospace";

/**
 * A compact card showing a top-N distribution as horizontal bars.
 *
 * Props:
 *   title: string — card heading (e.g. "Top Ports")
 *   items: [{ value: string, count: number }] — sorted desc by count
 *   color: string — bar color (defaults to primary.main)
 */
export default function StatCard({ title, items, color = "primary.main" }) {
  if (!items || items.length === 0) return null;

  const max = items[0].count;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography
        variant="overline"
        sx={{ display: "block", mb: 1.5, letterSpacing: "0.06em" }}
      >
        {title}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8 }}>
        {items.map(({ value, count }) => (
          <Box
            key={value}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            {/* Label */}
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.75rem",
                color: "text.primary",
                width: 140,
                flexShrink: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={value}
            >
              {value}
            </Typography>

            {/* Bar */}
            <Box sx={{ flex: 1, height: 14, bgcolor: "action.hover", borderRadius: 0.5, overflow: "hidden" }}>
              <Box
                sx={{
                  height: "100%",
                  width: `${(count / max) * 100}%`,
                  bgcolor: color,
                  borderRadius: 0.5,
                  opacity: 0.75,
                  transition: "width 0.3s ease",
                }}
              />
            </Box>

            {/* Count */}
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: "0.72rem",
                color: "text.secondary",
                width: 44,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {count}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
