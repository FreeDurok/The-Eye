import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import useUiStore from "../../store/uiStore.js";

const SEVERITY_MAP = { info: "info", success: "success", error: "error", warning: "warning" };

export default function Toast() {
  const { toast, clearToast } = useUiStore();

  return (
    <Snackbar
      open={!!toast}
      autoHideDuration={4000}
      onClose={clearToast}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      {toast ? (
        <Alert
          onClose={clearToast}
          severity={SEVERITY_MAP[toast.type] || "info"}
          variant="filled"
          sx={{ fontSize: "0.84rem" }}
        >
          {toast.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
