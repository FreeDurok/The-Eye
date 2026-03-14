import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0a0e14",
      paper: "#111820",
    },
    primary: {
      main: "#00d4ff",
      dark: "#00a8cc",
    },
    secondary: {
      main: "#a6e3a1",
    },
    error: {
      main: "#f38ba8",
    },
    warning: {
      main: "#fab387",
    },
    success: {
      main: "#a6e3a1",
    },
    info: {
      main: "#89b4fa",
    },
    text: {
      primary: "#cdd6f4",
      secondary: "#a6adc8",
      disabled: "#6c7086",
    },
    divider: "#1e2d3d",
  },

  typography: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    h5: { fontWeight: 600, letterSpacing: "0.02em" },
    h6: { fontWeight: 600, letterSpacing: "0.02em" },
    subtitle2: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: "0.8rem",
      fontWeight: 400,
    },
    body2: { fontSize: "0.84rem" },
    caption: { color: "#6c7086" },
    overline: {
      fontSize: "0.68rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      color: "#6c7086",
    },
  },

  shape: { borderRadius: 8 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0a0e14",
          "&::-webkit-scrollbar": { width: 6, height: 6 },
          "&::-webkit-scrollbar-track": { background: "#0a0e14" },
          "&::-webkit-scrollbar-thumb": {
            background: "#1e2d3d",
            borderRadius: 3,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #1e2d3d",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.84rem",
        },
        containedPrimary: {
          color: "#0a0e14",
          "&:hover": { backgroundColor: "#00b8d9" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          height: 24,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#6c7086",
          borderBottom: "1px solid #1e2d3d",
        },
        body: {
          fontSize: "0.84rem",
          borderBottom: "1px solid #1e2d3d",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { backgroundColor: "#1a2332" },
          cursor: "pointer",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: "0.84rem",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#00d4ff66",
          },
        },
        notchedOutline: {
          borderColor: "#1e2d3d",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { fontSize: "0.84rem" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: "none",
          borderRight: "1px solid #1e2d3d",
        },
      },
    },
  },
});

export default theme;
