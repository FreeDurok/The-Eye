import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Toolbar from "@mui/material/Toolbar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import SearchIcon from "@mui/icons-material/SearchOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import FileDownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import KeyIcon from "@mui/icons-material/KeyOutlined";

const SIDEBAR_WIDTH = 200;

const NAV_ITEMS = [
  { to: "/",         label: "Dashboard",  icon: <DashboardIcon fontSize="small" /> },
  { to: "/cases",    label: "Cases",      icon: <FolderIcon fontSize="small" /> },
  { to: "/query",    label: "Query",      icon: <SearchIcon fontSize="small" /> },
  { to: "/history",  label: "History",    icon: <HistoryIcon fontSize="small" /> },
  { to: "/export",   label: "Export",     icon: <FileDownloadIcon fontSize="small" /> },
  { to: "/api-keys", label: "API Keys",   icon: <KeyIcon fontSize="small" /> },
];

export default function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: SIDEBAR_WIDTH,
          bgcolor: "background.paper",
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar variant="dense" />

      {/* Nav */}
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            end={to === "/"}
            sx={{
              borderRadius: 1,
              mb: 0.3,
              py: 0.8,
              color: "text.secondary",
              "&.active": {
                color: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
              {icon}
            </ListItemIcon>
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontSize: "0.84rem", fontWeight: 500 }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
        <Typography variant="caption" sx={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem" }}>
          v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
}

export { SIDEBAR_WIDTH };
