import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
import { SetPasswordPage } from './components/SetPasswordPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { SessionExpiredPage } from './components/SessionExpiredPage';
import ScrollToTop from './components/ScrollToTop';
import { SoundManager } from './utils/SoundManager';
import { ToastContainer } from './components/ui/ToastContainer';

// Landing Page Component
// Landing Page Component
// Define shared stats interface
export interface LandingStats {
  investorCount: number;
  equity: string;
  averageRoi: string;
  totalProfit: string;
  monthProfitPct: string;
  totalTrades: number;
}

const LandingPage = ({ stats }: { stats: LandingStats | null }) => {
  const navigate = useNavigate();

  return (
    <main>
      <Hero onJoin={() => navigate('/register')} />
      <HowItWorks />
      <Stats />
      <Advantages stats={stats} />
      <Community stats={stats} />
      <CTA onJoin={() => navigate('/register')} stats={stats} />
    </main>
  );
};



// Route Guards with 3-state logic
interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole: 'investor' | 'admin';
  userRole: 'investor' | 'admin' | null;
  isLoading: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredRole, userRole, isLoading }) => {
  // State 1: Loading - wait for user data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-slate-400 font-mono text-sm">VERIFYING SESSION...</div>
        </div>
      </div>
    );
  }

  // State 2: Unauthenticated - Redirect to Login
  if (userRole === null) {
    // If trying to access admin, show session expired to be explicit
    if (requiredRole === 'admin') {
      // Changed from /session-expired to /login to prevent false positives on reload
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // State 3: Authenticated + Wrong Role - Redirect to Dashboard
  if (requiredRole === 'admin' && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // State 4: Authenticated + Correct Role - Allow
  return <>{children}</>;
};

// Define User Type
interface User {
  id: string;
  email: string;
  name?: string;
  role: 'investor' | 'admin';
}

// AppContent must be inside BrowserRouter to use useLocation
const AppContent: React.FC<{
  currentUser: User | null;
  isLoading: boolean;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}> = ({ currentUser, isLoading, onLoginSuccess, onLogout }) => {
  const location = useLocation();
  const isStandaloneRoute = location.pathname.startsWith('/admin') ||
    location.pathname === '/set-password' ||
    location.pathname === '/login' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/session-expired' ||
    location.pathname === '/profile';

  const [stats, setStats] = useState<LandingStats | null>(null);

  React.useEffect(() => {
    fetch('http://localhost:3001/public/metrics')
      .then(res => res.json())
      .then(data => {
        setStats({
          investorCount: data.investorCount || 0,
          equity: data.equity || '0',
          averageRoi: data.averageRoi || '0%',
          totalProfit: data.totalProfit || '0 EUR',
          monthProfitPct: data.monthProfitPct || '0%',
          totalTrades: data.totalTrades || 0
        });
      })
      .catch(err => console.error('Failed to fetch public metrics', err));
  }, []);

  return (
    <div className="font-sans antialiased text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      {!isStandaloneRoute && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage stats={stats} />} />

        <Route path="/register" element={
          <RegisterPage
            onBack={() => window.location.href = '/'}
            onSwitchToLogin={() => window.location.href = '/login'}
            onLoginSuccess={(user) => onLoginSuccess(user as User)}
          />
        } />

        <Route path="/login" element={
          <LoginPage
            onBack={() => window.location.href = '/'}
            onSwitchToRegister={() => window.location.href = '/register'}
            onLoginSuccess={(user) => onLoginSuccess(user as User)}
          />
        } />

        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/session-expired" element={<SessionExpiredPage />} />

        {/* Investor Routes */}
        <Route path="/dashboard" element={
          <RouteGuard requiredRole="investor" userRole={currentUser?.role || null} isLoading={isLoading}>
            <DashboardPage
              userType={currentUser?.role || 'investor'}
              onLogout={() => { onLogout(); window.location.href = '/'; }}
              onSwitchToAdmin={currentUser?.role === 'admin' ? () => window.location.href = '/admin' : undefined}
              onNavigateToProfile={() => window.location.href = '/profile'}
              onNavigateToDeposit={() => window.location.href = '/deposit'}
              onNavigateToWithdraw={() => window.location.href = '/withdraw'}
            />
          </RouteGuard>
        } />

        {/* Admin Routes - Separate Namespace */}
        <Route path="/admin/*" element={
          <RouteGuard requiredRole="admin" userRole={currentUser?.role || null} isLoading={isLoading}>
            <AdminConsolePage
              user={currentUser}
              onLogout={() => { onLogout(); window.location.href = '/'; }}
              onSwitchToInvestor={() => window.location.href = '/dashboard'}
              onNavigateToProfile={() => window.location.href = '/profile'}
            />
          </RouteGuard>
        } />

        <Route path="/profile" element={
          <ProfilePage userType={currentUser?.role || 'investor'} onBack={() => window.history.back()} />
        } />

        {/* ... other routes ... */}
        <Route path="/deposit" element={<DepositPage onBack={() => window.history.back()} />} />
        <Route path="/withdraw" element={<WithdrawPage onBack={() => window.history.back()} />} />
        <Route path="/terms" element={<TermsPage onBack={() => window.location.href = '/'} />} />
        <Route path="/privacy" element={<PrivacyPage onBack={() => window.location.href = '/'} />} />
        <Route path="/responsible-gaming" element={<ResponsibleGamingPage onBack={() => window.location.href = '/'} />} />
        <Route path="/contact" element={<ContactPage onBack={() => window.location.href = '/'} />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isStandaloneRoute && <Footer stats={stats} />}
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check valid session on mount
  React.useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('accessToken');

      if (!storedToken) {
        setCurrentUser(null);
        setIsLoading(false);
        // No user - init sounds as disabled by default
        SoundManager.init(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/auth/verify', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid && data.user) {
            setCurrentUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role === 'ADMIN' ? 'admin' : 'investor'
            });
          } else {
            throw new Error('Invalid session');
          }
        } else {
          throw new Error('Session check failed');
        }
      } catch (e) {
        console.error('Session verification failed:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  // Initialize SoundManager when user is authenticated
  React.useEffect(() => {
    if (currentUser) {
      // Fetch user preferences and init SoundManager
      const token = localStorage.getItem('accessToken');
      if (token) {
        fetch('http://localhost:3001/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            const uiSounds = data.user?.preferences?.uiSounds ?? true;
            SoundManager.init(uiSounds);
          })
          .catch(err => {
            console.error('[App] Failed to fetch user preferences:', err);
            // Fallback - init with sounds enabled
            SoundManager.init(true);
          });
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch('http://localhost:3001/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      window.location.href = '/';
    }
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppContent
        currentUser={currentUser}
        isLoading={isLoading}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
      {/* Global Toast Notifications */}
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
