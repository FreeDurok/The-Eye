import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const MONO = "'IBM Plex Mono', monospace";

const VALUE_COLORS = {
  string: "secondary.main",
  number: "primary.main",
  boolean: "info.main",
  null: "text.disabled",
};

function ValueDisplay({ value }) {
  if (value === null)
    return <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: VALUE_COLORS.null, fontStyle: "italic" }}>null</Typography>;
  if (typeof value === "boolean")
    return <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: VALUE_COLORS.boolean }}>{String(value)}</Typography>;
  if (typeof value === "number")
    return <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: VALUE_COLORS.number }}>{value}</Typography>;
  if (typeof value === "string")
    return <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: VALUE_COLORS.string, wordBreak: "break-all" }}>"{value}"</Typography>;
  return <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.secondary" }}>{String(value)}</Typography>;
}

export default function TreeNode({ nodeKey, value, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2);

  const isObject = value !== null && typeof value === "object";
  const isArray = Array.isArray(value);
  const indent = depth * 16;

  if (!isObject) {
    return (
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, pl: `${indent}px`, py: "1px" }}>
        {nodeKey !== undefined && (
          <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "info.main" }}>
            {nodeKey}:&nbsp;
          </Typography>
        )}
        <ValueDisplay value={value} />
      </Box>
    );
  }

  const entries = isArray ? value.map((v, i) => [i, v]) : Object.entries(value);
  const summary = isArray ? `Array[${value.length}]` : `{${Object.keys(value).length} keys}`;

  return (
    <Box>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.3,
          pl: `${indent}px`,
          py: "1px",
          cursor: "pointer",
          borderRadius: 0.5,
          "&:hover": { bgcolor: "action.hover" },
          userSelect: "none",
        }}
      >
        <IconButton size="small" sx={{ p: 0, width: 16, height: 16, color: "text.disabled" }}>
          {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
        </IconButton>
        {nodeKey !== undefined && (
          <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "info.main" }}>
            {nodeKey}:&nbsp;
          </Typography>
        )}
        <Typography component="span" sx={{ fontFamily: MONO, fontSize: "0.72rem", color: "text.disabled", fontStyle: "italic" }}>
          {summary}
        </Typography>
      </Box>

      {open &&
        entries.map(([k, v]) => (
          <TreeNode key={k} nodeKey={k} value={v} depth={depth + 1} />
        ))}
    </Box>
  );
}
