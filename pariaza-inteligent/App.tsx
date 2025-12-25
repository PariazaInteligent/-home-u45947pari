import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Stats } from './components/Stats';
import { Advantages } from './components/Advantages';
import { Community } from './components/Community';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import { RegisterPage } from './components/RegisterPage';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminConsolePage } from './components/AdminConsolePage';
import { ProfilePage } from './components/ProfilePage';
import { DepositPage } from './components/DepositPage';
import { WithdrawPage } from './components/WithdrawPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { ResponsibleGamingPage } from './components/ResponsibleGamingPage';
import { ContactPage } from './components/ContactPage';
import ScrollToTop from './components/ScrollToTop';

// Landing Page Component
const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <main>
      <Hero onJoin={() => navigate('/register')} />
      <HowItWorks />
      <Stats />
      <Advantages />
      <Community />
      <CTA onJoin={() => navigate('/register')} />
    </main>
  );
};

// Dashboard Wrapper Component to handle Roles
interface DashboardWrapperProps {
  userRole: 'investor' | 'admin';
  activeDashboardMode: 'investor' | 'admin';
  setActiveDashboardMode: (mode: 'investor' | 'admin') => void;
  onLogout: () => void;
}

const DashboardWrapper: React.FC<DashboardWrapperProps> = ({
  userRole,
  activeDashboardMode,
  setActiveDashboardMode,
  onLogout
}) => {
  const navigate = useNavigate();

  if (userRole === 'admin' && activeDashboardMode === 'admin') {
    return (
      <AdminConsolePage
        onLogout={onLogout}
        onSwitchToInvestor={() => setActiveDashboardMode('investor')}
        onNavigateToProfile={() => navigate('/profile')}
      />
    );
  }

  return (
    <DashboardPage
      userType={userRole}
      onLogout={onLogout}
      onSwitchToAdmin={userRole === 'admin' ? () => setActiveDashboardMode('admin') : undefined}
      onNavigateToProfile={() => navigate('/profile')}
      onNavigateToDeposit={() => navigate('/deposit')}
      onNavigateToWithdraw={() => navigate('/withdraw')}
    />
  );
};

function App() {
  const [userRole, setUserRole] = useState<'investor' | 'admin'>('investor');
  const [activeDashboardMode, setActiveDashboardMode] = useState<'investor' | 'admin'>('investor');

  const handleLoginSuccess = (role: 'investor' | 'admin') => {
    setUserRole(role);
    if (role === 'admin') {
      setActiveDashboardMode('admin');
    } else {
      setActiveDashboardMode('investor');
    }
  };

  const handleLogout = () => {
    setActiveDashboardMode('investor');
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="font-sans antialiased text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />

        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/register" element={
            <RegisterPage
              onBack={() => window.location.href = '/'}
              onSwitchToLogin={() => window.location.href = '/login'}
              onLoginSuccess={() => handleLoginSuccess('investor')}
            />
          } />

          <Route path="/login" element={
            <LoginPage
              onBack={() => window.location.href = '/'}
              onSwitchToRegister={() => window.location.href = '/register'}
              onLoginSuccess={handleLoginSuccess}
            />
          } />

          <Route path="/dashboard" element={
            <DashboardWrapper
              userRole={userRole}
              activeDashboardMode={activeDashboardMode}
              setActiveDashboardMode={setActiveDashboardMode}
              onLogout={() => { handleLogout(); window.location.href = '/'; }}
            />
          } />

          <Route path="/profile" element={
            <ProfilePage userType={userRole} onBack={() => window.history.back()} />
          } />

          <Route path="/deposit" element={
            <DepositPage onBack={() => window.history.back()} />
          } />

          <Route path="/withdraw" element={
            <WithdrawPage onBack={() => window.history.back()} />
          } />

          <Route path="/terms" element={<TermsPage onBack={() => window.location.href = '/'} />} />
          <Route path="/privacy" element={<PrivacyPage onBack={() => window.location.href = '/'} />} />
          <Route path="/responsible-gaming" element={<ResponsibleGamingPage onBack={() => window.location.href = '/'} />} />
          <Route path="/contact" element={<ContactPage onBack={() => window.location.href = '/'} />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;