import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/toast-context';
import { AppShell } from '@/components/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import MyIdeas from '@/pages/MyIdeas';
import AddIdea from '@/pages/AddIdea';
import EditIdea from '@/pages/EditIdea';
import ViewIdea from '@/pages/ViewIdea';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import SessionLimit from '@/pages/SessionLimit';
import NotFound from '@/pages/NotFound';
import { PrivacyPolicy, TermsOfService } from '@/pages/Legal';

export default function App() {
  useEffect(() => {
    fetch('/api/health').catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/session-limit" element={<SessionLimit />} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="ideas" element={<MyIdeas />} />
              <Route path="ideas/add" element={<AddIdea />} />
              <Route path="ideas/:id" element={<ViewIdea />} />
              <Route path="ideas/edit/:id" element={<EditIdea />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
