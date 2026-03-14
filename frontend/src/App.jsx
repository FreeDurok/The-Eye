import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PageShell from "./components/layout/PageShell.jsx";
import ApiKeysPage from "./pages/ApiKeysPage.jsx";
import CaseDetailPage from "./pages/CaseDetailPage.jsx";
import CasesPage from "./pages/CasesPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ExportPage from "./pages/ExportPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import QueryPage from "./pages/QueryPage.jsx";
import ResultPage from "./pages/ResultPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageShell />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:id" element={<CaseDetailPage />} />
          <Route path="query" element={<QueryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="results/:id" element={<ResultPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
