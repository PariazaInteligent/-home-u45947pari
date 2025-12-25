import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
import { MethodologyPage } from './components/pages/MethodologyPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { TermsPage } from './components/pages/TermsPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { ResponsibleGamingPage } from './components/pages/ResponsibleGamingPage';

function App() {
  // State for user authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('demo_user_role') !== null;
  });

  // State for user role with simple persistence for demo purposes
  const [userRole, setUserRole] = useState<'investor' | 'admin'>(() => {
    return (localStorage.getItem('demo_user_role') as 'investor' | 'admin') || 'investor';
  });

  const [activeDashboardMode, setActiveDashboardMode] = useState<'investor' | 'admin'>('investor');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleLoginSuccess = (role: 'investor' | 'admin') => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('demo_user_role', role);

    if (role === 'admin') {
      setActiveDashboardMode('admin');
      navigate('/admin');
    } else {
      setActiveDashboardMode('investor');
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('demo_user_role');
    setUserRole('investor');
    setActiveDashboardMode('investor');
    navigate('/');
  };

  // Protected Route Component
  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Landing Page Layout Component
  const LandingLayout = () => (
    <div className="font-sans antialiased text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar onJoin={() => navigate('/register')} onLogin={() => navigate('/login')} />
      <main>
        <Hero onJoin={() => navigate('/register')} />
        <HowItWorks />
        <Stats />
        <Advantages />
        <Community />
        <CTA onJoin={() => navigate('/register')} />
      </main>
      <Footer />
    </div>
  );

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingLayout />} />
      <Route
        path="/register"
        element={
          <RegisterPage
            onBack={() => navigate('/')}
            onSwitchToLogin={() => navigate('/login')}
            onLoginSuccess={() => handleLoginSuccess('investor')}
          />
        }
      />
      <Route
        path="/login"
        element={
          <LoginPage
            onBack={() => navigate('/')}
            onSwitchToRegister={() => navigate('/register')}
            onLoginSuccess={handleLoginSuccess}
          />
        }
      />

      {/* Info Pages */}
      <Route path="/metodologie" element={<MethodologyPage />} />
      <Route path="/rapoarte" element={<ReportsPage />} />
      <Route path="/termeni" element={<TermsPage />} />
      <Route path="/confidentialitate" element={<PrivacyPage />} />
      <Route path="/joc-responsabil" element={<ResponsibleGamingPage />} />

      {/* Protected Routes - Require Authentication */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardPage
              userType={userRole}
              onLogout={handleLogout}
              onSwitchToAdmin={userRole === 'admin' ? () => {
                setActiveDashboardMode('admin');
                navigate('/admin');
              } : undefined}
              onNavigateToProfile={() => navigate('/profile')}
              onNavigateToDeposit={() => navigate('/deposit')}
              onNavigateToWithdraw={() => navigate('/withdraw')}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            {userRole === 'admin' ? (
              <AdminConsolePage
                onLogout={handleLogout}
                onSwitchToInvestor={() => {
                  setActiveDashboardMode('investor');
                  navigate('/dashboard');
                }}
                onNavigateToProfile={() => navigate('/profile')}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage
              userType={userRole}
              onBack={() => navigate('/dashboard')}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/deposit"
        element={
          <ProtectedRoute>
            <DepositPage
              onBack={() => navigate('/dashboard')}
            />
          </ProtectedRoute>
        }
      />

      <Route
        path="/withdraw"
        element={
          <ProtectedRoute>
            <WithdrawPage
              onBack={() => navigate('/dashboard')}
            />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;