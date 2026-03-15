import { useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Toast from "../common/Toast.jsx";
import logoSvg from "../../assets/logo-sidebar.svg";

const TITLES = {
  "/":         "Dashboard",
  "/cases":    "Cases",
  "/query":    "New Query",
  "/history":  "Query History",
  "/export":   "Export",
  "/api-keys": "API Keys",
};

export default function TopBar() {
  const { pathname } = useLocation();
  const base = "/" + pathname.split("/")[1];
  const title = TITLES[base] ?? "";

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 48, gap: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img src={logoSvg} alt="The Eye" width={22} height={22} />
            <Typography
              sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontWeight: 500,
                fontSize: "0.9rem",
                color: "primary.main",
                letterSpacing: "0.05em",
              }}
            >
              The Eye
            </Typography>
          </Box>
          {title && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Typography sx={{ fontSize: "0.84rem", color: "text.secondary" }}>
                {title}
              </Typography>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Toast />
    </>
  );
}
