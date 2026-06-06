import { Navigate, Route, Routes } from 'react-router-dom';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { AuthProvider } from './context/AuthContext';
import { AdminPage } from './pages/AdminPage';
import { PublicPage } from './pages/PublicPage';

function App() {
  return (
    <AuthProvider>
      <GoogleAnalytics />
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
