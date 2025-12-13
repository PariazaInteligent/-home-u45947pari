import React, { useState } from 'react';
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

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'register' | 'login' | 'dashboard' | 'profile' | 'deposit' | 'withdraw'>('landing');
  const [userRole, setUserRole] = useState<'investor' | 'admin'>('investor');
  // State nou pentru a gestiona ce view vede userul în dashboard (admin sau investitor)
  const [activeDashboardMode, setActiveDashboardMode] = useState<'investor' | 'admin'>('investor');

  const navigateToRegister = () => {
    window.scrollTo(0, 0);
    setCurrentView('register');
  };

  const navigateToLogin = () => {
    window.scrollTo(0, 0);
    setCurrentView('login');
  };

  const navigateToHome = () => {
    window.scrollTo(0, 0);
    setCurrentView('landing');
  };

  const navigateToProfile = () => {
    window.scrollTo(0, 0);
    setCurrentView('profile');
  };
  
  const navigateToDeposit = () => {
    window.scrollTo(0, 0);
    setCurrentView('deposit');
  };

  const navigateToWithdraw = () => {
    window.scrollTo(0, 0);
    setCurrentView('withdraw');
  };

  const handleLoginSuccess = (role: 'investor' | 'admin') => {
    setUserRole(role);
    // Dacă e admin, implicit deschidem consola de admin
    if (role === 'admin') {
      setActiveDashboardMode('admin');
    } else {
      setActiveDashboardMode('investor');
    }
    window.scrollTo(0, 0);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('landing');
    setActiveDashboardMode('investor');
  };

  if (currentView === 'deposit') {
     return <DepositPage onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'withdraw') {
    return <WithdrawPage onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'profile') {
     return <ProfilePage userType={userRole} onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'dashboard') {
    // Dacă e admin și este pe modul admin, arată consola
    if (userRole === 'admin' && activeDashboardMode === 'admin') {
      return (
        <AdminConsolePage 
          onLogout={handleLogout} 
          onSwitchToInvestor={() => setActiveDashboardMode('investor')}
          onNavigateToProfile={navigateToProfile}
        />
      );
    }
    
    // Altfel arată dashboard-ul standard (investitor sau admin în modul investitor)
    return (
      <DashboardPage 
        userType={userRole} 
        onLogout={handleLogout}
        onSwitchToAdmin={userRole === 'admin' ? () => setActiveDashboardMode('admin') : undefined}
        onNavigateToProfile={navigateToProfile}
        onNavigateToDeposit={navigateToDeposit}
        onNavigateToWithdraw={navigateToWithdraw}
      />
    );
  }

  if (currentView === 'register') {
    return <RegisterPage onBack={navigateToHome} onSwitchToLogin={navigateToLogin} onLoginSuccess={() => handleLoginSuccess('investor')} />;
  }

  if (currentView === 'login') {
    return <LoginPage onBack={navigateToHome} onSwitchToRegister={navigateToRegister} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="font-sans antialiased text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar onJoin={navigateToRegister} onLogin={navigateToLogin} />
      <main>
        <Hero onJoin={navigateToRegister} />
        <HowItWorks />
        <Stats />
        <Advantages />
        <Community />
        <CTA onJoin={navigateToRegister} />
      </main>
      <Footer />
    </div>
  );
}

export default App;