import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Analytics from './pages/Analytics';
import TeamOverview from './pages/TeamOverview';

const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-smartops-bg">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <header className="lg:hidden p-4 flex items-center justify-between glass-panel rounded-none border-x-0 border-t-0 z-30 sticky top-0">
          <span className="font-space font-bold text-xl text-white">SmartOps</span>
          <button onClick={() => setMobileOpen(true)} className="text-gray-300 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            {React.cloneElement(children, { key: location.pathname })}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/kanban" element={<ProtectedRoute><KanbanBoard /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamOverview /></ProtectedRoute>} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
};

export default App;
