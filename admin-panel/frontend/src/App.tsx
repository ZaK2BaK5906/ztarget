import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Whitelists from '@/pages/Whitelists';
import WhitelistDetail from '@/pages/WhitelistDetail';
import NewWhitelist from '@/pages/NewWhitelist';
import Templates from '@/pages/Templates';
import Admins from '@/pages/Admins';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import LoadingScreen from '@/components/LoadingScreen';

function App() {
  const { isLoading, isAuthenticated, verifyToken } = useAuthStore();

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="whitelists" element={<Whitelists />} />
        <Route path="whitelists/:id" element={<WhitelistDetail />} />
        <Route path="whitelists/new" element={<NewWhitelist />} />
        <Route path="templates" element={<Templates />} />
        <Route path="admins" element={<Admins />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
