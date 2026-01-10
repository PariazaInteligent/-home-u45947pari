import React, { useState, useEffect } from 'react';
import {
   ArrowLeft,
   Settings,
   Zap,
   Flame,
   Target,
   Edit3,
   LogOut,
   Mail,
   Wallet,
   Globe,
   Fingerprint,
   Smartphone,
   CheckCircle2,
   PieChart,
   Activity,
   Volume2,
   FileText,
   CreditCard,
   Key,
   Shield,
   Lock,
   Award,
   AlertTriangle,
   XCircle
} from 'lucide-react';
import { TiltCard } from './ui/TiltCard';
import { Button3D } from './ui/Button3D';
import { AvatarUploadModal } from './modals/AvatarUploadModal';
import { BenefitsModal } from './modals/BenefitsModal';
import { TierProgress } from './TierProgress';
import { PaymentMethodsModal } from './modals/PaymentMethodsModal';
import { getApiUrl } from '../config';
import { SoundManager } from '../utils/SoundManager';
import { ToastManager } from '../utils/ToastManager';
import { ChangePasswordModal } from './modals/ChangePasswordModal';

interface ProfilePageProps {
   userType: 'investor' | 'admin';
   onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userType, onBack }) => {
   const [activeSection, setActiveSection] = useState<'overview' | 'settings'>('overview');

   // User Data State
   const [profileData, setProfileData] = useState<any>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showAvatarModal, setShowAvatarModal] = useState(false);
   const [showBenefitsModal, setShowBenefitsModal] = useState(false);
   const [showPaymentModal, setShowPaymentModal] = useState(false);
   const [paymentModalView, setPaymentModalView] = useState<'LIST' | 'ADD'>('LIST');
   const [isCheckingIn, setIsCheckingIn] = useState(false);

   // Settings State
   const [notifications, setNotifications] = useState(true);
   const [dailyReports, setDailyReports] = useState(true);
   const [uiSounds, setUiSounds] = useState(true);
   const [twoFactor, setTwoFactor] = useState(false);
   const [isSaving, setIsSaving] = useState(false);

   // Security Center States
   const [passwordStats, setPasswordStats] = useState({
      lastPasswordChangeDate: null as string | null,
      daysSinceChange: 0,
      colorCode: 'green' as 'green' | 'yellow' | 'orange' | 'red'
   });
   const [showPasswordModal, setShowPasswordModal] = useState(false);
   const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
   const [biometricEnabled, setBiometricEnabled] = useState(false);
   const [biometricSupported, setBiometricSupported] = useState(false);
   const [biometricType, setBiometricType] = useState<'face' | 'touch' | null>(null);

   // Theme
   const theme = userType === 'admin' ? {
      primary: 'bg-[#FF4B4B]',
      text: 'text-[#EA2B2B]',
      border: 'border-[#FF4B4B]',
      glow: 'red' as const,
   } : {
      primary: 'bg-[#58CC02]',
      text: 'text-[#46A302]',
      border: 'border-[#58CC02]',
      glow: 'green' as const,
   };

   // Fetch /me data
   const fetchProfile = async () => {
      try {
         const token = localStorage.getItem('accessToken');
         if (!token) {
            window.location.href = '/login';
            return;
         }

         const response = await fetch(getApiUrl('/api/users/me'), {
            headers: { 'Authorization': `Bearer ${token}` },
         });

         if (response.status === 401) {
            window.location.href = '/login';
            return;
         }

         if (!response.ok) {
            setError(`Error ${response.status}: Please try again.`);
            setIsLoading(false);
            return;
         }

         const data = await response.json();
         console.log('✅ [ProfilePage] /me data:', data);
         setProfileData(data);

         // Apply preferences if present
         if (data.user?.preferences) {
            setNotifications(data.user.preferences.emailNotifications);
            setDailyReports(data.user.preferences.dailyReports);
            setUiSounds(data.user.preferences.uiSounds);
            SoundManager.setEnabled(data.user.preferences.uiSounds);
         }

         // Initialize 2FA state from API
         if (data.user?.twoFAEnabled !== undefined) {
            setTwoFactorEnabled(data.user.twoFAEnabled);
         }

         // Initialize Biometric state from API
         if (data.user?.biometricEnabled !== undefined) {
            setBiometricEnabled(data.user.biometricEnabled);
         }

         setIsLoading(false);
      } catch (err) {
         console.error('❌ [ProfilePage] Error:', err);
         setError('Failed to load profile. Please try again.');
         setIsLoading(false);
      }
   };

   // Fetch password stats from API
   const fetchPasswordStats = async () => {
      try {
         const token = localStorage.getItem('accessToken');
         if (!token) return;

         const res = await fetch(getApiUrl('/api/users/password-stats'), {
            headers: { 'Authorization': `Bearer ${token}` }
         });

         if (res.ok) {
            const data = await res.json();
            setPasswordStats({
               lastPasswordChangeDate: data.lastPasswordChangeDate,
               daysSinceChange: data.daysSinceChange,
               colorCode: data.colorCode
            });
         }
      } catch (err) {
         console.error('Failed to fetch password stats:', err);
      }
   };

   useEffect(() => {
      fetchProfile();
      fetchPasswordStats();

      // Check WebAuthn support for biometric login
      const checkBiometricSupport = async () => {
         if (!window.PublicKeyCredential) {
            setBiometricSupported(false);
            return;
         }

         try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            setBiometricSupported(available);

            // Detect biometric type based on user agent
            const ua = navigator.userAgent;
            if (/iPhone|iPad/.test(ua)) {
               setBiometricType('face'); // iOS = FaceID/TouchID
            } else if (/Mac/.test(ua)) {
               setBiometricType('touch'); // macOS = TouchID
            } else {
               setBiometricType('face'); // Windows Hello, Android
            }
         } catch (err) {
            console.error('WebAuthn check failed:', err);
            setBiometricSupported(false);
         }
      };

      checkBiometricSupport();
   }, []);

   // Checkin handler
   const handleCheckin = async () => {
      setIsCheckingIn(true);
      try {
         const token = localStorage.getItem('accessToken');
         const response = await fetch(getApiUrl('/api/users/profile/checkin'), {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
         });

         if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
         }

         const data = await response.json();

         if (data.success) {
            if (data.alreadyCheckedIn) {
               ToastManager.showWithSound('info', data.message || 'Deja verificat azi!');
            } else {
               setProfileData((prev: any) => ({
                  ...prev,
                  activity: { ...prev.activity, todayCheckedIn: true }
               }));
               ToastManager.showWithSound('success', data.message || `Check-in reușit! +${data.pointsAwarded} Puncte`);
            }
         } else {
            ToastManager.showWithSound('error', data.error || 'A apărut o eroare.');
         }

      } catch (err: any) {
         console.error('❌ [ProfilePage] Checkin error:', err);
         ToastManager.showWithSound('error', 'Conexiune eșuată. Încearcă din nou.');
      } finally {
         setIsCheckingIn(false);
      }
   };

   // Toggle Preferences
   const togglePreference = async (key: 'emailNotifications' | 'dailyReports' | 'uiSounds') => {
      const currentVal = key === 'emailNotifications' ? notifications : key === 'dailyReports' ? dailyReports : uiSounds;
      const newVal = !currentVal;

      // Optimistic Update
      if (key === 'emailNotifications') setNotifications(newVal);
      if (key === 'dailyReports') setDailyReports(newVal);
      if (key === 'uiSounds') {
         setUiSounds(newVal);
         SoundManager.setEnabled(newVal);
      }

      if (newVal) SoundManager.play('click');
      setIsSaving(true);

      try {
         const token = localStorage.getItem('accessToken');
         const response = await fetch(getApiUrl('/api/users/preferences'), {
            method: 'PATCH',
            headers: {
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ [key]: newVal })
         });

         if (!response.ok) throw new Error('Update failed');

      } catch (err) {
         console.error('Pref save failed', err);
         // Rollback
         if (key === 'emailNotifications') setNotifications(!newVal);
         if (key === 'dailyReports') setDailyReports(!newVal);
         if (key === 'uiSounds') {
            setUiSounds(!newVal);
            SoundManager.setEnabled(currentVal);
         }
         ToastManager.showWithSound('error', 'Eroare la salvare. Încearcă din nou.');
      } finally {
         setIsSaving(false);
      }
   };

   // Copy Investor ID (Stable)
   const copyHash = () => {
      if (user?.id) {
         navigator.clipboard.writeText(user.id);
         ToastManager.showWithSound('success', 'ID Investitor copiat în clipboard!');
      }
   };

   // Format currency EUR
   const formatEUR = (value: number) => {
      return new Intl.NumberFormat('ro-RO', {
         style: 'decimal',
         minimumFractionDigits: 2,
         maximumFractionDigits: 2
      }).format(value) + ' EUR';
   };

   if (isLoading) {
      return <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
         <div className="text-xl font-bold text-[#AFAFAF] flex items-center gap-2">
            <div className="w-6 h-6 border-4 border-[#1CB0F6] border-t-transparent rounded-full animate-spin"></div>
            Loading...
         </div>
      </div>;
   }

   if (error) {
      return <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
         <div className="text-xl font-bold text-red-500">{error}</div>
      </div>;
   }

   const user = profileData?.user;
   const stats = profileData?.stats;
   const league = profileData?.league;
   const activity = profileData?.activity;
   const paymentMethods = profileData?.paymentMethods || [];
   const activeMethod = paymentMethods.find((m: any) => m.isDefault) || paymentMethods[0];

   return (
      <div className="min-h-screen bg-[#F7F7F7] font-sans relative">
         {/* Top Nav */}
         <div className="max-w-4xl mx-auto pt-6 px-4 flex items-center justify-between">
            <button onClick={onBack} className="group flex items-center gap-3 text-[#AFAFAF] hover:text-[#4B4B4B] transition-colors font-bold uppercase tracking-wider text-sm">
               <div className="bg-white border-2 border-[#E5E5E5] rounded-xl p-2 group-hover:border-[#D4D4D4] transition-colors shadow-[0_4px_0_#E5E5E5]">
                  <ArrowLeft className="w-5 h-5" />
               </div>
               <span>Înapoi</span>
            </button>

            <button onClick={() => setActiveSection(activeSection === 'overview' ? 'settings' : 'overview')} className={`p-2 rounded-xl border-2 transition-all shadow-[0_4px_0_#E5E5E5] ${activeSection === 'settings' ? 'bg-[#1CB0F6] border-[#1CB0F6] text-white' : 'bg-white border-[#E5E5E5] text-[#AFAFAF]'}`}>
               <Settings className="w-6 h-6" />
            </button>
         </div>

         <div className="max-w-4xl mx-auto p-4 pb-20 space-y-8 mt-4">
            {/* Hero - Avatar + Identity */}
            <div className="grid md:grid-cols-12 gap-6 items-start">
               <div className="md:col-span-4">
                  <TiltCard glowColor={theme.glow} noPadding>
                     <div className="bg-white rounded-3xl p-6 border-b-4 border-[#E5E5E5] flex flex-col items-center relative">
                        <div className={`absolute top-0 w-full h-2 ${theme.primary}`}></div>

                        <div className="relative group cursor-pointer mb-4">
                           <div className={`w-32 h-32 rounded-full border-4 ${theme.border} bg-white relative overflow-hidden shadow-lg`}>
                              <img src={user?.avatarFinalUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="Avatar" className="w-full h-full object-cover" />
                              <div className={`absolute top-0 left-0 w-full h-1 ${theme.primary} opacity-50 animate-[scan_2s_linear_infinite]`}></div>
                           </div>
                           <div className="absolute -bottom-1 -right-1" onClick={() => setShowAvatarModal(true)}>
                              <div className="bg-white p-2 rounded-full border-2 border-[#E5E5E5] shadow-sm cursor-pointer hover:bg-[#F0F0F0]">
                                 <Edit3 className="w-4 h-4 text-[#1CB0F6]" />
                              </div>
                           </div>
                        </div>

                        <h1 className="text-2xl font-black text-[#4B4B4B] mb-1">{user?.name || 'User'}</h1>
                        <p className="text-[#AFAFAF] font-bold uppercase tracking-widest text-xs mb-2">{league?.name || 'ENTRY'} LEAGUE</p>

                        <div className="flex items-center gap-2 mb-4 cursor-pointer hover:bg-slate-100 p-2 rounded-lg transition-colors border-2 border-transparent hover:border-slate-200 group" onClick={copyHash}>
                           <Fingerprint className="w-4 h-4 text-[#AFAFAF] group-hover:text-[#1CB0F6] transition-colors" />
                           <span className="font-mono text-xs text-[#AFAFAF] font-bold group-hover:text-[#4B4B4B] transition-colors" title="Investor ID (Stabil)">
                              {user?.id ? `${user.id.substring(0, 12)}...` : 'ID-Unknown'}
                           </span>
                           <span className="text-[10px] text-[#1CB0F6] font-bold opacity-0 group-hover:opacity-100 transition-opacity">COPY</span>
                        </div>


                        <div className="w-full bg-[#F7F7F7] rounded-xl p-3 space-y-2 text-xs">
                           <div className="flex justify-between">
                              <span className="text-[#AFAFAF] font-bold">MEMBRU DIN</span>
                              <span className="font-mono text-[#4B4B4B] font-bold">{user?.memberSinceLabel || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-[#AFAFAF] font-bold">CLEARANCE</span>
                              <span className={`font-black ${theme.text}`}>LEVEL {user?.clearanceLevel || 1}</span>
                           </div>
                        </div>
                     </div>
                  </TiltCard>
               </div>

               <div className="md:col-span-8 grid grid-cols-2 gap-4">
                  {/* Stats Cards - REAL DATA */}
                  <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 shadow-[0_4px_0_#E5E5E5] flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#FF9600]/10 rounded-xl flex items-center justify-center">
                        <Flame className="w-7 h-7 text-[#FF9600]" />
                     </div>
                     <div>
                        <div className="text-2xl font-black text-[#4B4B4B]">{user?.streakDays || 0}</div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase">Zile Streak</div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 shadow-[0_4px_0_#E5E5E5] flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#FFD900]/10 rounded-xl flex items-center justify-center">
                        <Zap className="w-7 h-7 text-[#FFD900]" />
                     </div>
                     <div>
                        <div className="text-2xl font-black text-[#4B4B4B]">{user?.loyaltyPoints || 0}</div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase">Puncte Loyalty</div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 shadow-[0_4px_0_#E5E5E5] flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#58CC02]/10 rounded-xl flex items-center justify-center">
                        <Target className="w-7 h-7 text-[#58CC02]" />
                     </div>
                     <div>
                        <div className="text-2xl font-black text-[#4B4B4B]">{stats?.netReturnPercent || 0}%</div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase">Randament</div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 shadow-[0_4px_0_#E5E5E5] flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#1CB0F6]/10 rounded-xl flex items-center justify-center">
                        <Activity className="w-7 h-7 text-[#1CB0F6]" />
                     </div>
                     <div>
                        <div className="text-2xl font-black text-[#4B4B4B]">{stats?.totalSessions || 0}</div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase">Sesiuni</div>
                     </div>
                  </div>

                  {/* Total Days Card (New) */}
                  <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 shadow-[0_4px_0_#E5E5E5] flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#94A3B8]/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-7 h-7 text-[#94A3B8]" />
                     </div>
                     <div>
                        <div className="text-2xl font-black text-[#4B4B4B]">{user?.totalDays || 0}</div>
                        <div className="text-xs font-bold text-[#AFAFAF] uppercase">Total Zile</div>
                     </div>
                  </div>

                  {/* League Card */}
                  <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-4 shadow-[0_4px_0_#E5E5E5] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#9333EA]/10 rounded-xl flex items-center justify-center">
                           <span className="text-2xl">{league?.iconEmoji || '🏆'}</span>
                        </div>
                        <div>
                           <div className="text-xl font-black text-[#4B4B4B]">{league?.name || 'Entry'}</div>
                           <div className="text-[10px] font-bold text-[#AFAFAF] uppercase">D {league?.feeDiscountPercent || 0}% FEES</div>
                        </div>
                     </div>
                     <Button3D variant="outline" size="sm" onClick={() => setShowBenefitsModal(true)}>INFO</Button3D>
                  </div>
               </div>
            </div>

            {/* Tier Progress Module */}
            {activeSection === 'overview' && (
               <TierProgress
                  currentTier={{
                     code: league?.code || 'ENTRY',
                     name: league?.name || 'Entry League',
                     iconEmoji: league?.iconEmoji || '🌱'
                  }}
                  nextTier={(() => {
                     const tierOrder = ['ENTRY', 'SILVER', 'GOLD', 'PRO'];
                     const currentIndex = tierOrder.indexOf(league?.code || 'ENTRY');

                     if (currentIndex === -1 || currentIndex >= tierOrder.length - 1) {
                        return null;
                     }

                     const nextTierThresholds: Record<string, any> = {
                        'SILVER': { minInvestment: 1000, minStreak: 7, minLoyalty: 100 },
                        'GOLD': { minInvestment: 5000, minStreak: 30, minLoyalty: 500 },
                        'PRO': { minInvestment: 25000, minStreak: 90, minLoyalty: 2000 }
                     };

                     const nextTierCode = tierOrder[currentIndex + 1];
                     const iconMap: Record<string, string> = {
                        'SILVER': '⚡',
                        'GOLD': '💰',
                        'PRO': '💎'
                     };

                     return {
                        code: nextTierCode,
                        name: `${nextTierCode.charAt(0)}${nextTierCode.slice(1).toLowerCase()} League`,
                        iconEmoji: iconMap[nextTierCode] || '🏆',
                        thresholds: nextTierThresholds[nextTierCode] || { minInvestment: 0, minStreak: 0, minLoyalty: 0 }
                     };
                  })()}
                  currentProgress={{
                     totalInvestment: stats?.investmentValue || 0,
                     currentStreak: user?.streakDays || 0,
                     loyaltyPoints: user?.loyaltyPoints || 0
                  }}
               />
            )}

            {activeSection === 'overview' ? (
               <div className="grid md:grid-cols-2 gap-6">
                  {/* Portfolio */}
                  <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-6 shadow-[0_4px_0_#E5E5E5]">
                     <h3 className="text-xl font-black text-[#4B4B4B] mb-6 flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-[#AFAFAF]" />
                        Portofoliu
                     </h3>
                     <div className="space-y-4">
                        {/* Principal Invested */}
                        <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl">
                           <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm uppercase text-[#AFAFAF]">Principal Investit</span>
                              <CreditCard className="w-5 h-5 text-[#AFAFAF]" />
                           </div>
                           <div className="text-xl font-black text-[#4B4B4B]">{formatEUR(stats?.principalInvested || 0)}</div>
                        </div>

                        {/* Profit Generated */}
                        <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl">
                           <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm uppercase text-[#AFAFAF]">Profit Generat</span>
                              <Activity className="w-5 h-5 text-[#AFAFAF]" />
                           </div>
                           <div className={`text-xl font-black ${(stats?.profitGenerated || 0) >= 0 ? 'text-[#58CC02]' : 'text-[#FF4B4B]'}`}>
                              {(stats?.profitGenerated || 0) >= 0 ? '+' : ''}{formatEUR(stats?.profitGenerated || 0)}
                           </div>
                        </div>

                        {/* Current Value */}
                        <div className="p-4 rounded-2xl bg-[#E5F6D3] border-2 border-[#58CC02] text-[#46A302]">
                           <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm uppercase opacity-80">Valoare Curentă</span>
                              <Wallet className="w-5 h-5" />
                           </div>
                           <div className="text-2xl font-black">{formatEUR(stats?.currentValue || 0)}</div>
                        </div>

                        <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl">
                           <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                 <PieChart className="w-5 h-5 text-[#9333EA]" />
                                 <span className="font-bold text-[#4B4B4B]">Cota ta</span>
                              </div>
                              <span
                                 className="font-black text-[#9333EA] cursor-help"
                                 title={`Precizie exactă: ${stats?.sharePercentExact || 0}%`}
                              >
                                 {stats?.sharePercentExact?.toFixed(4) || 0}%
                              </span>
                           </div>
                           <div className="w-full h-3 bg-[#F3E8FF] rounded-full overflow-hidden">
                              <div className="h-full bg-[#9333EA] rounded-full" style={{ width: `${Math.min(stats?.sharePercentExact || 0, 100)}%` }}></div>
                           </div>
                           <div className="mt-2 text-xs text-[#AFAFAF] font-bold cursor-help" title="Valoarea fondului calculată din momentul intrării tale (toate acțiunile × NAV curent)">
                              Fond calculat din intrarea ta: {formatEUR(stats?.totalFundValue || 0)}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 border-2 border-[#E5E5E5] rounded-2xl flex flex-col items-center">
                              <Globe className="w-6 h-6 text-slate-500 mb-2" />
                              <div className="font-bold text-[#4B4B4B]">EUR</div>
                              <div className="text-[10px] font-bold text-[#AFAFAF]">MONEDĂ</div>
                           </div>
                           <div className="p-3 border-2 border-[#E5E5E5] rounded-2xl flex flex-col items-center relative">
                              <CreditCard className="w-6 h-6 text-[#1CB0F6] mb-2" />
                              <div className="font-bold text-[#4B4B4B] text-sm text-center truncate w-full px-1">
                                 {activeMethod ? activeMethod.type : 'N/A'}
                              </div>
                              <div className="text-[10px] font-bold text-[#AFAFAF] font-mono text-center w-full truncate px-1">
                                 {activeMethod ? activeMethod.detailsMasked : 'NEDEFINIT'}
                              </div>
                              {paymentMethods.length > 0 && (
                                 <button
                                    onClick={() => { setPaymentModalView('LIST'); setShowPaymentModal(true); }}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 border shadow-sm hover:bg-gray-50"
                                    title="Schimbă"
                                 >
                                    <Edit3 className="w-3 h-3 text-orange-500" />
                                 </button>
                              )}
                           </div>
                        </div>

                        {!activeMethod && (
                           <Button3D variant="secondary" size="sm" className="w-full" onClick={() => { setPaymentModalView('ADD'); setShowPaymentModal(true); }}>
                              Adaugă Metodă Plată
                           </Button3D>
                        )}
                     </div>
                  </div>

                  {/* Activity */}
                  <div className="space-y-6">
                     <div className="bg-[#1CB0F6] rounded-3xl p-6 shadow-[0_4px_0_#1899D6] text-white">
                        <div className="flex justify-between items-start mb-4">
                           <h3 className="text-xl font-black">Activitate Zilnică</h3>
                           <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {activity?.todayCheckedIn ? 'VERIFICAT' : 'DISPONIBIL'}
                           </span>
                        </div>
                        <p className="font-bold mb-6 opacity-90">{activity?.nextGoalText || 'Verifică randamentul astăzi!'}</p>

                        <Button3D
                           variant={activity?.todayCheckedIn ? "success" : "cyan"}
                           className={`w-full ${activity?.todayCheckedIn
                              ? "opacity-100 cursor-default"
                              : "bg-white text-[#1CB0F6] hover:bg-white/90"
                              }`}
                           onClick={handleCheckin}
                           disabled={activity?.todayCheckedIn || isCheckingIn}
                        >
                           {isCheckingIn ?
                              <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> SE PROCESEAZĂ...</div>
                              : activity?.todayCheckedIn ? 'VERIFICAT AZI ✓' : 'VERIFICĂ RAPORTUL'}
                        </Button3D>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="bg-white rounded-3xl border-2 border-[#E5E5E5] p-6 shadow-[0_4px_0_#E5E5E5]">
                  <h2 className="text-2xl font-black text-[#4B4B4B] mb-6 flex items-center gap-2">
                     <Settings className="w-6 h-6 text-[#AFAFAF]" />
                     Preferințe
                  </h2>
                  <div className="space-y-6">
                     {/* Email Notifications */}
                     <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-[#1CB0F6]/10 rounded-xl flex items-center justify-center">
                              <Mail className="w-5 h-5 text-[#1CB0F6]" />
                           </div>
                           <div>
                              <div className="font-black text-[#4B4B4B]">Notificări Email</div>
                              <div className="text-xs font-bold text-[#AFAFAF]">Actualizări importante</div>
                           </div>
                        </div>
                        <div onClick={() => togglePreference('emailNotifications')} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${notifications ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
                           <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-6' : ''}`}></div>
                        </div>
                     </div>

                     {/* Daily Reports */}
                     <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-[#FF9600]/10 rounded-xl flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#FF9600]" />
                           </div>
                           <div>
                              <div className="font-black text-[#4B4B4B]">Rapoarte Zilnice</div>
                              <div className="text-xs font-bold text-[#AFAFAF]">Sumar activitate</div>
                           </div>
                        </div>
                        <div onClick={() => togglePreference('dailyReports')} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${dailyReports ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
                           <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${dailyReports ? 'translate-x-6' : ''}`}></div>
                        </div>
                     </div>

                     {/* UI Sounds */}
                     <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-[#9333EA]/10 rounded-xl flex items-center justify-center">
                              <Volume2 className="w-5 h-5 text-[#9333EA]" />
                           </div>
                           <div>
                              <div className="font-black text-[#4B4B4B]">Sunete Interfață</div>
                              <div className="text-xs font-bold text-[#AFAFAF]">Efecte sonore (Sfx)</div>
                           </div>
                        </div>
                        <div onClick={() => togglePreference('uiSounds')} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${uiSounds ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`}>
                           <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${uiSounds ? 'translate-x-6' : ''}`}></div>
                        </div>
                     </div>

                     {/* SECURITY CENTER */}
                     <div className="mt-8 pt-8 border-t-2 border-[#E5E5E5]">
                        <h3 className="text-xl font-black text-[#4B4B4B] mb-4 flex items-center gap-2">
                           <Shield className="w-6 h-6 text-red-600" />
                           Centru de Securitate
                        </h3>

                        {/* Security Score Card */}
                        <div className={`relative overflow-hidden p-6 rounded-2xl border-2 mb-4 ${(() => {
                           const score = Math.min(
                              10 + // Base
                              (passwordStats.daysSinceChange < 30 ? 25 : passwordStats.daysSinceChange < 90 ? 15 : 5) +
                              (twoFactorEnabled ? 35 : 0) +
                              (biometricEnabled ? 20 : 0) +
                              10, // Mock: email verified
                              100
                           );
                           if (score >= 71) return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300';
                           if (score >= 41) return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300';
                           return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300';
                        })()
                           }`}>
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                 <div className={`w-12 h-12 rounded-full flex items-center justify-center ${(() => {
                                    const score = Math.min(
                                       10 +
                                       (passwordStats.daysSinceChange < 30 ? 25 : passwordStats.daysSinceChange < 90 ? 15 : 5) +
                                       (twoFactorEnabled ? 35 : 0) +
                                       (biometricEnabled ? 20 : 0) +
                                       10,
                                       100
                                    );
                                    if (score >= 71) return 'bg-green-500';
                                    if (score >= 41) return 'bg-yellow-500';
                                    return 'bg-red-500';
                                 })()
                                    }`}>
                                    {(() => {
                                       const score = Math.min(
                                          10 +
                                          (passwordStats.daysSinceChange < 30 ? 25 : passwordStats.daysSinceChange < 90 ? 15 : 5) +
                                          (twoFactorEnabled ? 35 : 0) +
                                          (biometricEnabled ? 20 : 0) +
                                          10,
                                          100
                                       );
                                       if (score >= 71) return <Award className="w-6 h-6 text-white" />;
                                       if (score >= 41) return <AlertTriangle className="w-6 h-6 text-white" />;
                                       return <Lock className="w-6 h-6 text-white" />;
                                    })()}
                                 </div>
                                 <div>
                                    <div className="text-2xl font-black text-gray-900">
                                       {Math.min(
                                          10 +
                                          (passwordStats.daysSinceChange < 30 ? 25 : passwordStats.daysSinceChange < 90 ? 15 : 5) +
                                          (twoFactorEnabled ? 35 : 0) +
                                          (biometricEnabled ? 20 : 0) +
                                          10,
                                          100
                                       )}/100
                                    </div>
                                    <div className="text-xs font-bold text-gray-600">Security Score</div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <div className="text-sm font-black text-gray-900">
                                    {(() => {
                                       const score = Math.min(
                                          10 +
                                          (passwordStats.daysSinceChange < 30 ? 25 : passwordStats.daysSinceChange < 90 ? 15 : 5) +
                                          (twoFactorEnabled ? 35 : 0) +
                                          (biometricEnabled ? 20 : 0) +
                                          10,
                                          100
                                       );
                                       if (score >= 71) return '🎉 Excelent!';
                                       if (score >= 41) return '😐 Poate fi mai bine';
                                       return '⚠️ Îmbunătățește!';
                                    })()}
                                 </div>
                              </div>
                           </div>

                           {/* Checklist */}
                           <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                 <CheckCircle2 className="w-3 h-3 text-green-600" />
                                 <span className="text-gray-700 font-medium">Email verificat</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 {passwordStats.daysSinceChange < 90 ?
                                    <CheckCircle2 className="w-3 h-3 text-green-600" /> :
                                    <XCircle className="w-3 h-3 text-red-600" />
                                 }
                                 <span className="text-gray-700 font-medium">Parolă recentă</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 {twoFactorEnabled ?
                                    <CheckCircle2 className="w-3 h-3 text-green-600" /> :
                                    <XCircle className="w-3 h-3 text-red-600" />
                                 }
                                 <span className="text-gray-700 font-medium">2FA activată</span>
                              </div>
                              <div className="flex items-center gap-1">
                                 {biometricEnabled ?
                                    <CheckCircle2 className="w-3 h-3 text-green-600" /> :
                                    <XCircle className="w-3 h-3 text-red-600" />
                                 }
                                 <span className="text-gray-700 font-medium">Login biometric</span>
                              </div>
                           </div>
                        </div>

                        {/* Security Features */}
                        <div className="space-y-3">
                           {/* Change Password */}
                           <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl flex items-center justify-between hover:border-[#FF9600] transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-[#FF9600]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Key className="w-5 h-5 text-[#FF9600]" />
                                 </div>
                                 <div>
                                    <div className="font-black text-[#4B4B4B]">Schimbă Parola</div>
                                    <div className={`text-xs font-bold ${passwordStats.daysSinceChange > 90 ? 'text-red-600' :
                                       passwordStats.daysSinceChange > 30 ? 'text-yellow-600' :
                                          'text-green-600'
                                       }`}>
                                       Ultima schimbare: {passwordStats.daysSinceChange} zile în urmă
                                    </div>
                                 </div>
                              </div>
                              <button
                                 onClick={() => {
                                    SoundManager.play('click');
                                    setShowPasswordModal(true);
                                 }}
                                 className="px-4 py-2 bg-[#FF9600] text-white font-bold text-sm rounded-xl hover:bg-[#E08600] transition-colors shadow-[0_2px_0_#CC7700]"
                              >
                                 Schimbă
                              </button>
                           </div>

                           {/* 2FA */}
                           <div className="p-4 border-2 border-[#E5E5E5] rounded-2xl flex items-center justify-between hover:border-[#7C3AED] transition-colors group">
                              <div className="flex items-center gap-4 flex-1">
                                 <div className="w-10 h-10 bg-[#7C3AED]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Shield className="w-5 h-5 text-[#7C3AED]" />
                                 </div>
                                 <div className="flex-1">
                                    <div className="font-black text-[#4B4B4B] flex items-center gap-2">
                                       Autentificare 2FA
                                       {!twoFactorEnabled && (
                                          <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                             RECOMANDAT
                                          </span>
                                       )}
                                    </div>
                                    <div className="text-xs font-bold text-[#AFAFAF]">
                                       Protecție avansată Pariaza Inteligent™
                                    </div>
                                 </div>
                              </div>
                              <div
                                 onClick={async () => {
                                    const newValue = !twoFactorEnabled;

                                    // Optimistic UI
                                    setTwoFactorEnabled(newValue);

                                    try {
                                       const token = localStorage.getItem('accessToken');

                                       if (newValue) {
                                          // ENABLE 2FA FLOW
                                          const password = prompt('Introdu parola pentru a activa 2FA:');
                                          if (!password) {
                                             setTwoFactorEnabled(false);
                                             return;
                                          }

                                          // Step 1: Request secret
                                          const reqRes = await fetch(getApiUrl('/api/users/2fa/enable-request'), {
                                             method: 'POST',
                                             headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                             },
                                             body: JSON.stringify({ currentPassword: password })
                                          });

                                          if (!reqRes.ok) {
                                             const err = await reqRes.json();
                                             ToastManager.showWithSound('error', err.error || 'Eroare activare 2FA');
                                             setTwoFactorEnabled(false);
                                             return;
                                          }


                                          const { manualSecret, qrCodeDataUrl } = await reqRes.json();

                                          // Step 2: Show QR code modal
                                          const overlay = document.createElement('div');
                                          overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
                                          overlay.innerHTML = `
                                             <div style="background:white;padding:32px;border-radius:24px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.3);">
                                                <h3 style="font-size:24px;font-weight:900;color:#4B4B4B;margin-bottom:8px;">🔐 Activare 2FA</h3>
                                                <p style="color:#AFAFAF;font-size:14px;margin-bottom:24px;font-weight:600;">Scanează cu Google Authenticator</p>
                                                <div style="background:#F7F7F7;padding:16px;border-radius:16px;margin-bottom:20px;">
                                                   <img src="${qrCodeDataUrl}" alt="QR Code" style="width:100%;max-width:240px;height:auto;border-radius:12px;" />
                                                </div>
                                                <details style="margin-bottom:24px;text-align:left;cursor:pointer;">
                                                   <summary style="font-weight:bold;color:#1CB0F6;font-size:13px;padding:8px;list-style:none;user-select:none;">📋 Cod Manual (backup)</summary>
                                                   <div style="margin-top:12px;padding:12px;background:#FFF9E6;border:2px dashed#FFD900;border-radius:8px;">
                                                      <code style="display:block;font-size:11px;word-break:break-all;color:#4B4B4B;font-weight:600;letter-spacing:1px;">${manualSecret}</code>
                                                   </div>
                                                </details>
                                                <button id="qr-done-btn" style="width:100%;padding:16px;background:linear-gradient(135deg,#58CC02,#46A302);color:white;font-weight:900;border:none;border-radius:12px;cursor:pointer;font-size:16px;box-shadow:0 4px 12px rgba(88,204,2,0.3);transition:transform 0.2s;">✓ AM SCANAT QR CODE-UL</button>
                                             </div>
                                          `;
                                          document.body.appendChild(overlay);

                                          // Hover effect for button
                                          const btn = document.getElementById('qr-done-btn')!;
                                          btn.onmouseover = () => btn.style.transform = 'scale(1.02)';
                                          btn.onmouseout = () => btn.style.transform = 'scale(1)';

                                          // Wait for user to confirm scan
                                          await new Promise((resolve) => {
                                             btn.onclick = () => {
                                                document.body.removeChild(overlay);
                                                resolve(true);
                                             };
                                          });


                                          // Step 3: Get TOTP code
                                          const totpCode = prompt('Introdu codul de 6 cifre din Google Authenticator:');
                                          if (!totpCode || totpCode.length !== 6) {
                                             ToastManager.showWithSound('error', 'Cod invalid');
                                             setTwoFactorEnabled(false);
                                             return;
                                          }

                                          // Step 4: Confirm
                                          const confirmRes = await fetch(getApiUrl('/api/users/2fa/enable-confirm'), {
                                             method: 'POST',
                                             headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                             },
                                             body: JSON.stringify({ totpCode, secret: manualSecret })
                                          });

                                          if (!confirmRes.ok) {
                                             const err = await confirmRes.json();
                                             ToastManager.showWithSound('error', err.error || 'Cod TOTP invalid');
                                             setTwoFactorEnabled(false);
                                             return;
                                          }

                                          const { backupCodes } = await confirmRes.json();
                                          alert(`✅ 2FA ACTIVATĂ!\n\n🔑 CODURI BACKUP:\n\n${backupCodes.join('\n')}\n\nSalvează aceste coduri într-un loc sigur!`);
                                          ToastManager.showWithSound('success', '🎉 2FA activată! Cont mai securizat!');

                                       } else {
                                          // DISABLE 2FA FLOW
                                          const password = prompt('Introdu parola pentru a dezactiva 2FA:');
                                          if (!password) {
                                             setTwoFactorEnabled(true);
                                             return;
                                          }

                                          const res = await fetch(getApiUrl('/api/users/2fa/disable'), {
                                             method: 'POST',
                                             headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                             },
                                             body: JSON.stringify({ currentPassword: password })
                                          });

                                          if (!res.ok) {
                                             const err = await res.json();
                                             ToastManager.showWithSound('error', err.error || 'Eroare dezactivare');
                                             setTwoFactorEnabled(true);
                                             return;
                                          }

                                          ToastManager.showWithSound('info', '2FA dezactivată');
                                       }
                                    } catch (error) {
                                       console.error('2FA error:', error);
                                       ToastManager.showWithSound('error', 'Eroare procesare 2FA');
                                       setTwoFactorEnabled(!newValue); // Revert
                                    }
                                 }}
                                 className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${twoFactorEnabled ? 'bg-[#7C3AED]' : 'bg-[#E5E5E5]'
                                    }`}
                              >
                                 <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${twoFactorEnabled ? 'translate-x-6' : ''
                                    }`}></div>
                              </div>
                           </div>

                           {/* Biometric Login */}
                           <div className={`p-4 border-2 border-[#E5E5E5] rounded-2xl flex items-center justify-between transition-colors group ${biometricSupported ? 'hover:border-[#58CC02]' : 'opacity-60 cursor-not-allowed'
                              }`}>
                              <div className="flex items-center gap-4 flex-1">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${biometricSupported ? 'bg-[#58CC02]/10' : 'bg-[#D4D4D4]/10'
                                    }`}>
                                    <Smartphone className={`w-5 h-5 ${biometricSupported ? 'text-[#58CC02]' : 'text-[#AFAFAF]'}`} />
                                 </div>
                                 <div className="flex-1">
                                    <div className="font-black text-[#4B4B4B] flex items-center gap-2">
                                       Login Biometric
                                       {!biometricSupported && (
                                          <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                             INDISPONIBIL
                                          </span>
                                       )}
                                       {!biometricEnabled && biometricSupported && (
                                          <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                             RECOMANDAT
                                          </span>
                                       )}
                                    </div>
                                    <div className="text-xs font-bold text-[#AFAFAF]">
                                       {biometricSupported
                                          ? `Autentificare cu ${biometricType === 'face' ? 'FaceID' : 'TouchID'}`
                                          : 'Dispozitiv incompatibil'}
                                    </div>
                                 </div>
                              </div>
                              <div
                                 onClick={async () => {
                                    if (!biometricSupported) {
                                       ToastManager.showWithSound('error', 'Dispozitivul tău nu suportă autentificare biometrică');
                                       return;
                                    }

                                    const newValue = !biometricEnabled;
                                    setBiometricEnabled(newValue); // Optimistic UI
                                    SoundManager.play('click');

                                    try {
                                       const token = localStorage.getItem('accessToken');

                                       if (newValue) {
                                          // ENABLE BIOMETRIC FLOW
                                          const password = prompt('Introdu parola pentru a activa Login Biometric:');
                                          if (!password) {
                                             setBiometricEnabled(false);
                                             return;
                                          }

                                          // Create WebAuthn credential
                                          try {
                                             const challenge = new Uint8Array(32);
                                             crypto.getRandomValues(challenge);

                                             const publicKeyOptions: PublicKeyCredentialCreationOptions = {
                                                challenge,
                                                rp: {
                                                   name: 'Pariază Inteligent',
                                                   id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
                                                },
                                                user: {
                                                   id: new Uint8Array(16),
                                                   name: profileData?.user?.email || 'user@example.com',
                                                   displayName: profileData?.user?.name || 'User'
                                                },
                                                pubKeyCredParams: [
                                                   { alg: -7, type: 'public-key' }, // ES256
                                                   { alg: -257, type: 'public-key' } // RS256
                                                ],
                                                authenticatorSelection: {
                                                   authenticatorAttachment: 'platform',
                                                   userVerification: 'required'
                                                },
                                                timeout: 60000,
                                                attestation: 'direct'
                                             };

                                             const credential = await navigator.credentials.create({
                                                publicKey: publicKeyOptions
                                             }) as PublicKeyCredential;

                                             if (!credential) {
                                                throw new Error('Credential creation failed');
                                             }

                                             // Convert credential to base64 for transmission
                                             const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
                                             const challengeBase64 = btoa(String.fromCharCode(...challenge));

                                             // Send to backend
                                             const response = await fetch(getApiUrl('/api/users/biometric/enable'), {
                                                method: 'POST',
                                                headers: {
                                                   'Authorization': `Bearer ${token}`,
                                                   'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({
                                                   currentPassword: password,
                                                   publicKey: publicKeyBase64,
                                                   challenge: challengeBase64
                                                })
                                             });

                                             if (!response.ok) {
                                                const err = await response.json();
                                                ToastManager.showWithSound('error', err.error || 'Eroare activare biometric');
                                                setBiometricEnabled(false);
                                                return;
                                             }

                                             ToastManager.showWithSound('success', '🎉 Login Biometric activat! Cont mai securizat!');
                                          } catch (webauthnError: any) {
                                             console.error('WebAuthn error:', webauthnError);
                                             if (webauthnError.name === 'NotAllowedError') {
                                                ToastManager.showWithSound('error', 'Autentificare biometrică anulată');
                                             } else {
                                                ToastManager.showWithSound('error', 'Eroare la configurarea biometric. Încearcă din nou.');
                                             }
                                             setBiometricEnabled(false);
                                          }
                                       } else {
                                          // DISABLE BIOMETRIC FLOW
                                          const password = prompt('Introdu parola pentru a dezactiva Login Biometric:');
                                          if (!password) {
                                             setBiometricEnabled(true);
                                             return;
                                          }

                                          const response = await fetch(getApiUrl('/api/users/biometric/disable'), {
                                             method: 'POST',
                                             headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                             },
                                             body: JSON.stringify({ currentPassword: password })
                                          });

                                          if (!response.ok) {
                                             const err = await response.json();
                                             ToastManager.showWithSound('error', err.error || 'Eroare dezactivare');
                                             setBiometricEnabled(true);
                                             return;
                                          }

                                          ToastManager.showWithSound('info', 'Login Biometric dezactivat');
                                       }
                                    } catch (error) {
                                       console.error('Biometric error:', error);
                                       ToastManager.showWithSound('error', 'Eroare procesare Login Biometric');
                                       setBiometricEnabled(!newValue); // Revert
                                    }
                                 }}
                                 className={`w-14 h-8 rounded-full p-1 transition-colors ${biometricSupported
                                       ? `cursor-pointer ${biometricEnabled ? 'bg-[#58CC02]' : 'bg-[#E5E5E5]'}`
                                       : 'bg-[#D4D4D4] cursor-not-allowed opacity-50'
                                    }`}
                              >
                                 <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${biometricEnabled ? 'translate-x-6' : ''}`}></div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="h-4"></div>

                     <Button3D variant="danger" className="w-full" onClick={() => { localStorage.removeItem('accessToken'); window.location.href = '/login'; }}>
                        <LogOut className="w-5 h-5 mr-2" />
                        DECONECTARE
                     </Button3D>
                  </div>
               </div>
            )}
         </div>

         {/* Benefits Modal - Reusable Component */}
         <BenefitsModal
            isOpen={showBenefitsModal}
            onClose={() => setShowBenefitsModal(false)}
            league={league}
         />

         <PaymentMethodsModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onUpdate={fetchProfile}
            initialView={paymentModalView}
         />

         {user && (
            <AvatarUploadModal
               isOpen={showAvatarModal}
               onClose={() => setShowAvatarModal(false)}
               currentAvatarUrl={user.avatarFinalUrl}
               userGender={user.gender || 'NEUTRAL'}
               avatarType={user.avatarType || 'DEFAULT'}
               onUploadSuccess={() => { setShowAvatarModal(false); fetchProfile(); }}
            />
         )}

         {/* Change Password Modal */}
         <ChangePasswordModal
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            onSuccess={fetchPasswordStats}
         />
      </div>
   );
};
