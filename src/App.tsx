import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DocumentAnalysis from "./pages/DocumentAnalysis";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* opcjonalnie zostawiasz testówkę */}
        <Route path="/test" element={<h1>TEST</h1>} />

        {/* protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/history"
            element={<div>History of analysis</div>}
          />

          <Route
            path="/document-analysis"
            element={<DocumentAnalysis />}
          />

          <Route
            path="/rule-profiles"
            element={<div>Rule profiles</div>}
          />

          <Route
            path="/account-details"
            element={<div>Account details</div>}
          />

          <Route
            path="/history/analysis-details"
            element={
              <div>
                Analysis Details - temporary for breadcrumbs testing
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;