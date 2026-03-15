import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function PageHeader({ icon, title, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon && (
          <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
            {icon}
          </Box>
        )}
        <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {children && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {children}
        </Box>
      )}
    </Box>
  );
}
