import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingNew from './pages/LandingNew';
import DashboardRealTime from './pages/DashboardRealTime';
import DashboardNew from './pages/DashboardNew';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import TransactionBuilder from './components/TransactionBuilder';
import ReSimulate from './pages/ReSimulate';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingNew />} />
        <Route path="/dashboard" element={<DashboardRealTime />} />
        <Route path="/dashboard-v2" element={<DashboardNew />} />
        <Route path="/old-landing" element={<Landing />} />
        <Route path="/old-dashboard" element={<Dashboard />} />
        <Route path="/builder" element={<TransactionBuilder />} />
        <Route path="/resimulate" element={<ReSimulate />} />
      </Routes>
    </Router>
  );
}

export default App;
