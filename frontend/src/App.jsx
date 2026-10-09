import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router';
import GetTicketPage from './pages/GetTicketPage';
import { LoginPage } from './pages/LoginPage';
import OfficerPage from './pages/OfficerPage';
import { getUserInfo, logout } from './API/api';

function AppRoutes() {
  const navigate = useNavigate();
  // undefined while we ask the server if there is a session, null if nobody is logged in
  const [user, setUser] = useState(undefined);

  // The state is lost when the page is reloaded, the session cookie is not
  useEffect(() => {
    getUserInfo()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    navigate('/officer');
  };

  // Once nobody is logged in, the /officer route sends the user to the login page
  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (user === undefined) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<GetTicketPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/officer" replace /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/officer"
        element={user ? <OfficerPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
