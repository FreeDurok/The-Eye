import { useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Toast from "../common/Toast.jsx";

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
  const title = TITLES[base] ?? "The Eye";

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
        <Toolbar variant="dense" sx={{ minHeight: 48 }}>
          <Typography variant="h6" sx={{ fontSize: "0.92rem" }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      <Toast />
    </>
  );
}
