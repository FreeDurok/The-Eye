import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import TreeNode from "./TreeNode.jsx";
import { extractPaths, getByPath } from "./pathUtils.js";

const MONO = "'IBM Plex Mono', monospace";

export default function DataExplorer({ data }) {
  const [tab, setTab] = useState(0);

  if (!data) return <Typography color="text.disabled">No data.</Typography>;

  const paths = extractPaths(data);
  const arrayPaths = paths.filter((p) => p.includes("[]"));
  const rootArrayKey = arrayPaths.length > 0
    ? arrayPaths[0].split("[]")[0].replace(/\.$/, "")
    : null;
  const items = rootArrayKey ? getByPath(data, rootArrayKey) : null;
  const tableItems = Array.isArray(items) ? items : [data];

  const columnPaths = arrayPaths.length > 0
    ? [...new Set(arrayPaths.map((p) => p.split("[]").slice(1).join("").replace(/^\./, "")))]
    : paths.filter((p) => !p.includes("[]"));

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2, minHeight: 36 }}
      >
        <Tab label="Tree" sx={{ minHeight: 36, textTransform: "none", fontSize: "0.84rem" }} />
        <Tab
          label={`Table${items ? ` (${tableItems.length})` : ""}`}
          sx={{ minHeight: 36, textTransform: "none", fontSize: "0.84rem" }}
        />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ py: 0.5 }}>
          <TreeNode value={data} depth={0} />
        </Box>
      )}

      {tab === 1 && (
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columnPaths.map((p) => (
                  <TableCell key={p} sx={{ fontFamily: MONO, fontSize: "0.72rem", bgcolor: "background.paper" }}>
                    {p || "(root)"}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableItems.map((item, i) => (
                <TableRow key={i} hover>
                  {columnPaths.map((p) => {
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
                        {display}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
