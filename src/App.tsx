import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import Home from './pages/Home';
import Register from './pages/Registration';
import Dashboard from './pages/Dashboard';
import DocumentAnalysis from './pages/DocumentAnalysis';
import DocumentProcessing from './pages/DocumentProcessing';
import AnalysisDetails from './pages/AnalysisDetails';
import OcrResults from './pages/OcrResultsDetailed';
import AnalysisHistory from '@/pages/AnalysisHistory';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { useAuthContext } from '@/context/auth-context';
import { PROCESSING_ROUTE } from '@/lib/analysisStatus';

function App() {
  const authContext = useAuthContext();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
          credentials: 'include',
        });

        authContext?.setIsAuthenticated(response.ok);
      } catch {
        authContext?.setIsAuthenticated(false);
      }
    };

    void checkAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

        {/* Test route */}
        <Route path="/test" element={<h1>TEST</h1>} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/history" element={<AnalysisHistory />} />

          <Route path="/document-analysis" element={<DocumentAnalysis />} />

          <Route path={PROCESSING_ROUTE} element={<DocumentProcessing />} />

          <Route path="/rule-profiles" element={<div>Rule profiles</div>} />

          <Route path="/account-details" element={<div>Account details</div>} />

          <Route path="/analysis/:analysisId" element={<AnalysisDetails />} />

          <Route path="/analysis/:analysisId/ocr" element={<OcrResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
