import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Sidebar from "./Sidebar.jsx";
import Toast from "../common/Toast.jsx";

export default function PageShell() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Box>
      <Toast />
    </Box>
  );
}
