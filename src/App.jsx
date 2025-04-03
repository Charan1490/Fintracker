// Add these imports
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';

const AppLayout = ({ children, user }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  // If we're on the auth page, we return the children directly
  if (isAuthPage) {
    return children;
  }

  // Otherwise, we wrap the children in our standard layout
  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50">
      <Navbar />
      <main className="flex-grow w-full px-4 py-6 sm:px-6 md:px-8 lg:px-16 xl:px-24 max-w-full mx-auto">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout user={user}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<PrivateRoute user={user}><Dashboard /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute user={user}><Transactions /></PrivateRoute>} />
          <Route path="/budget" element={<PrivateRoute user={user}><Budget /></PrivateRoute>} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

// Add PrivateRoute component
const PrivateRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};