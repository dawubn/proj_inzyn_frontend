import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import Home from './pages/Home';
import Register from './pages/Registration';
import Dashboard from './pages/Dashboard';
import DocumentAnalysis from './pages/DocumentAnalysis';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { useAuthContext } from '@/context/auth-context';
import { useGetMeApiV1UsersMeGet } from '@/api/generated/users/users';

function App() {
  const authContext = useAuthContext();
  const { data: user } = useGetMeApiV1UsersMeGet({ query: { enabled: false } });

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

    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />

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

          <Route path="/history" element={<div>History of analysis</div>} />

          <Route path="/document-analysis" element={<DocumentAnalysis />} />

          <Route path="/rule-profiles" element={<div>Rule profiles</div>} />

          <Route path="/account-details" element={<div>Account details</div>} />

          <Route
            path="/history/analysis-details"
            element={<div>Analysis Details - temporary for breadcrumbs testing</div>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
