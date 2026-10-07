import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PatientDashboard from './pages/Patient/PatientDashboard';
import FamilyDashboard from './pages/Family/FamilyDashboard';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';

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

              {/* Protected Patient Mode */}
              <Route 
                path="/patient" 
                element={
                  <ProtectedRoute allowedRoles={['patient', 'grandpa']}>
                    <PatientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/grandpa" element={<Navigate to="/patient" replace />} />

              {/* Protected Family Dashboard */}
              <Route 
                path="/family" 
                element={
                  <ProtectedRoute allowedRoles={['family']}>
                    <FamilyDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Doctor Dashboard */}
              <Route 
                path="/doctor" 
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorDashboard />
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
