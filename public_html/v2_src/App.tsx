
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Stats } from './components/Stats';
import { Advantages } from './components/Advantages';
// Community imported as LandingCommunity to avoid clash with Dashboard Community
import { Community as LandingCommunity } from './components/Community';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { RegisterPage } from './components/RegisterPage';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminConsolePage } from './components/AdminConsolePage';
import { ProfilePage } from './components/ProfilePage';
import { DepositPage } from './components/DepositPage';
import { WithdrawPage } from './components/WithdrawPage';

// Import Dashboard Sub-Components
import { Overview } from './components/dashboard/Overview';
import { Wallet } from './components/dashboard/Wallet';
import { History } from './components/dashboard/History';
import { LiveScanner } from './components/dashboard/LiveScanner';
import { Settings } from './components/dashboard/Settings';
import { Analytics } from './components/dashboard/Analytics';
import { ProfitCalculator } from './components/dashboard/ProfitCalculator';
import { Academy } from './components/dashboard/Academy';
import { Community as DashboardCommunity } from './components/dashboard/Community';
import { Support } from './components/dashboard/Support';

// Import Admin Sub-Components
import { AdminOverview } from './components/admin/AdminOverview';
import { UserManagement } from './components/admin/UserManagement';
import { BettingEngine } from './components/admin/BettingEngine';
import { SecurityLogs } from './components/admin/SecurityLogs';
import { Treasury } from './components/admin/Treasury';
import { RiskManagement } from './components/admin/RiskManagement';
import { ContentStudio } from './components/admin/ContentStudio';
import { SupportCRM } from './components/admin/SupportCRM';
import { BroadcastAlerts } from './components/admin/BroadcastAlerts';
import { SystemConfig } from './components/admin/SystemConfig';


// Wrapper component to use hooks securely inside Router
function AppContent() {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const location = useLocation();
  const [userRole, setUserRole] = useState<'investor' | 'admin'>('investor');

  // Helper functions that match the previous interface props
  const navigateToRegister = () => {
    window.scrollTo(0, 0);
    navigate('/register');
  };

  const navigateToLogin = () => {
    window.scrollTo(0, 0);
    navigate('/login');
  };

  const navigateToHome = () => {
    window.scrollTo(0, 0);
    navigate('/');
  };

  const navigateToProfile = () => {
    window.scrollTo(0, 0);
    navigate('/profile');
  };

  const navigateToDeposit = () => {
    window.scrollTo(0, 0);
    navigate('/deposit');
  };

  const navigateToWithdraw = () => {
    window.scrollTo(0, 0);
    navigate('/withdraw');
  };

  const handleLoginSuccess = (role: 'investor' | 'admin') => {
    setUserRole(role);
    window.scrollTo(0, 0);
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setUserRole('investor'); // reset default
    navigate('/');
  };

  // Define components for clean Route usage
  const Home = () => (
    <div className="font-sans antialiased text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar onJoin={navigateToRegister} onLogin={navigateToLogin} />
      <main>
        <Hero onJoin={navigateToRegister} />
        <HowItWorks />
        <Stats />
        <Advantages />
        <LandingCommunity />
        <CTA onJoin={navigateToRegister} />
      </main>
      <Footer />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<RegisterPage onBack={navigateToHome} onSwitchToLogin={navigateToLogin} onLoginSuccess={() => handleLoginSuccess('investor')} />} />
      <Route path="/login" element={<LoginPage onBack={navigateToHome} onSwitchToRegister={navigateToRegister} onLoginSuccess={handleLoginSuccess} />} />

      {/* Investor Dashboard Routes */}
      <Route path="/dashboard" element={
        <DashboardPage
          userType={userRole}
          onLogout={handleLogout}
          onSwitchToAdmin={userRole === 'admin' ? () => navigate('/admin') : undefined}
          onNavigateToProfile={navigateToProfile}
        />
      }>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={
          <Overview
            onNavigateToDeposit={navigateToDeposit}
            onNavigateToWithdraw={navigateToWithdraw}
          />
        } />
        <Route path="wallet" element={<Wallet onNavigateToDeposit={navigateToDeposit} onNavigateToWithdraw={navigateToWithdraw} />} />
        <Route path="history" element={<History />} />
        <Route path="scanner" element={<LiveScanner />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="calculator" element={<ProfitCalculator />} />
        <Route path="academy" element={<Academy />} />
        <Route path="community" element={<DashboardCommunity />} />
        <Route path="support" element={<Support />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Admin Console Routes */}
      <Route path="/admin" element={
        <AdminConsolePage
          onLogout={handleLogout}
          onSwitchToInvestor={() => navigate('/dashboard')}
          onNavigateToProfile={navigateToProfile}
        />
      }>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="bets" element={<BettingEngine />} />
        <Route path="logs" element={<SecurityLogs />} />
        <Route path="treasury" element={<Treasury />} />
        <Route path="risk" element={<RiskManagement />} />
        <Route path="content" element={<ContentStudio />} />
        <Route path="support" element={<SupportCRM />} />
        <Route path="broadcast" element={<BroadcastAlerts />} />
        <Route path="config" element={<SystemConfig />} />
      </Route>

      {/* Shared/Standalone Pages */}
      <Route path="/profile" element={<ProfilePage userType={userRole} onBack={() => navigate(-1)} />} />
      <Route path="/deposit" element={<DepositPage onBack={() => navigate('/dashboard/wallet')} />} />
      <Route path="/withdraw" element={<WithdrawPage onBack={() => navigate('/dashboard/wallet')} />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter basename="/v2">
      <div style={{ display: 'none' }}>{console.log("V2_LOADED_VERSION_3_DEBUG")}</div>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;