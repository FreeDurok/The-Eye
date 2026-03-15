import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import ClearIcon from "@mui/icons-material/ClearOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import ViewColumnIcon from "@mui/icons-material/ViewColumnOutlined";
import ResultStats from "./ResultStats.jsx";
import TreeNode from "./TreeNode.jsx";
import { extractPaths, getByPath } from "./pathUtils.js";

const MONO = "'IBM Plex Mono', monospace";
const PAGE_SIZE = 100;
const HIGHLIGHT_BG = "rgba(0,212,255,0.18)";

function HighlightedText({ text, search }) {
  if (!search || !text) return text;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <Box component="span" sx={{ bgcolor: HIGHLIGHT_BG, borderRadius: 0.5, px: "1px" }}>
        {text.slice(idx, idx + search.length)}
      </Box>
      {text.slice(idx + search.length)}
    </>
  );
}

export default function DataExplorer({ data, module = "shodan" }) {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [colAnchor, setColAnchor] = useState(null);
  const [colFilter, setColFilter] = useState("");
  const [search, setSearch] = useState("");

  const { columnPaths, tableItems } = useMemo(() => {
    if (!data) return { columnPaths: [], tableItems: [] };
    const p = extractPaths(data);
    const ap = p.filter((x) => x.includes("[]"));
    const rk = ap.length > 0 ? ap[0].split("[]")[0].replace(/\.$/, "") : null;
    const raw = rk ? getByPath(data, rk) : null;
    const ti = Array.isArray(raw) ? raw : [data];
    const cp = ap.length > 0
      ? [...new Set(ap.map((x) => x.split("[]").slice(1).join("").replace(/^\./, "")))]
      : p.filter((x) => !x.includes("[]"));
    return { columnPaths: cp, tableItems: ti };
  }, [data]);

  if (!data) return <Typography color="text.disabled">No data.</Typography>;

  const visibleCols = columnPaths.filter((c) => !hiddenCols.has(c));

  // Filter rows by search term across visible columns
  const filteredItems = useMemo(() => {
    if (!search) return tableItems;
    const term = search.toLowerCase();
    return tableItems.filter((item) =>
      visibleCols.some((col) => {
        const val = col ? getByPath(item, col) : item;
        if (val === null || val === undefined) return false;
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return str.toLowerCase().includes(term);
      })
    );
  }, [tableItems, visibleCols, search]);

  const totalRows = filteredItems.length;
  const totalPages = Math.ceil(totalRows / PAGE_SIZE);
  const pageItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleCol = (col) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const filteredColList = columnPaths.filter(
    (c) => !colFilter || c.toLowerCase().includes(colFilter.toLowerCase())
  );

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setPage(0); }}
          sx={{ borderBottom: 1, borderColor: "divider", minHeight: 36, flex: 1 }}
        >
          <Tab label="Stats" sx={{ minHeight: 36, textTransform: "none", fontSize: "0.84rem" }} />
          <Tab label="Tree" sx={{ minHeight: 36, textTransform: "none", fontSize: "0.84rem" }} />
          <Tab
            label={`Table (${tableItems.length})`}
            sx={{ minHeight: 36, textTransform: "none", fontSize: "0.84rem" }}
          />
        </Tabs>

        {tab === 2 && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
            <Chip
              label={`${visibleCols.length}/${columnPaths.length} cols`}
              size="small"
              variant="outlined"
              sx={{ fontFamily: MONO, fontSize: "0.68rem" }}
            />
            <IconButton
              size="small"
              onClick={(e) => setColAnchor(e.currentTarget)}
              title="Show/hide columns"
            >
              <ViewColumnIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Column picker popover */}
      <Popover
        open={Boolean(colAnchor)}
        anchorEl={colAnchor}
        onClose={() => { setColAnchor(null); setColFilter(""); }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box sx={{ width: 280, p: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search columns…"
            value={colFilter}
            onChange={(e) => setColFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                </InputAdornment>
              ),
              sx: { fontSize: "0.78rem", fontFamily: MONO },
            }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
            <Button size="small" onClick={() => setHiddenCols(new Set())}>
              All
            </Button>
            <Button size="small" onClick={() => setHiddenCols(new Set(columnPaths))}>
              None
            </Button>
          </Box>
          <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
            {filteredColList.map((col) => (
              <FormControlLabel
                key={col}
                sx={{ display: "flex", ml: 0, mr: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={!hiddenCols.has(col)}
                    onChange={() => toggleCol(col)}
                  />
                }
                label={
                  <Typography sx={{ fontFamily: MONO, fontSize: "0.72rem" }}>
                    {col || "(root)"}
                  </Typography>
                }
              />
            ))}
          </Box>
        </Box>
      </Popover>

      {tab === 0 && (
        <Box sx={{ mt: 2 }}>
          <ResultStats module={module} data={data} />
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ py: 0.5, mt: 2 }}>
          <TreeNode value={data} depth={0} />
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ mt: 1.5 }}>
          {/* Search bar */}
          <TextField
            size="small"
            fullWidth
            placeholder="Search in visible columns…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <Chip
                    label={`${totalRows} match${totalRows !== 1 ? "es" : ""}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontFamily: MONO, fontSize: "0.68rem", mr: 0.5 }}
                  />
                  <IconButton size="small" onClick={() => handleSearchChange("")}>
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { fontFamily: MONO, fontSize: "0.82rem" },
            }}
            sx={{ mb: 1.5 }}
          />

          <TableContainer sx={{ maxHeight: "calc(100vh - 420px)" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontFamily: MONO, fontSize: "0.68rem", bgcolor: "background.paper", color: "text.disabled", width: 48 }}>
                    #
                  </TableCell>
                  {visibleCols.map((p) => (
                    <TableCell key={p} sx={{ fontFamily: MONO, fontSize: "0.72rem", bgcolor: "background.paper" }}>
                      {p || "(root)"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {pageItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleCols.length + 1} sx={{ textAlign: "center", py: 4 }}>
                      <Typography color="text.disabled" fontSize="0.84rem">
                        No matches found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((item, i) => (
                    <TableRow key={page * PAGE_SIZE + i} hover>
                      <TableCell sx={{ fontFamily: MONO, fontSize: "0.68rem", color: "text.disabled" }}>
                        {page * PAGE_SIZE + i + 1}
                      </TableCell>
                      {visibleCols.map((p) => {
                        const val = p ? getByPath(item, p) : item;
                        const display =
                          val === null || val === undefined
                            ? ""
                            : typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val);
                        return (
                          <TableCell
                            key={p}
                            sx={{
                              fontFamily: MONO,
                              fontSize: "0.78rem",
                              maxWidth: 220,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={display}
                          >
                            <HighlightedText text={display} search={search} />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mt: 1.5 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Typography sx={{ fontFamily: MONO, fontSize: "0.78rem", color: "text.disabled" }}>
                {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalRows)} of {totalRows}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
