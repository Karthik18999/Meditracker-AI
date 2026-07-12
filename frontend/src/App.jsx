import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import GrandpaDashboard from './pages/Grandpa/GrandpaDashboard';
import FamilyDashboard from './pages/Family/FamilyDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Grandpa Mode */}
              <Route 
                path="/grandpa" 
                element={
                  <ProtectedRoute allowedRoles={['grandpa']}>
                    <GrandpaDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Family Dashboard */}
              <Route 
                path="/family" 
                element={
                  <ProtectedRoute allowedRoles={['family']}>
                    <FamilyDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Root Redirect Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
