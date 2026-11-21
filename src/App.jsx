import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Gift,
  QrCode,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Share2,
  MessageCircle,
  Mail,
  Smartphone,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Receipt,
  Users,
  TrendingUp,
  Award,
  Wine,
  LogOut,
  Search,
  Plus,
  DollarSign,
  Lock,
  X,
  ArrowRight,
  Fingerprint,
  Crown,
  ShieldAlert
} from 'lucide-react';

// Deterministic visual QR matrix generator so every 60s token visibly rotates the QR pattern
function LiveQrMatrix({ seed, size = 160, expired = false }) {
  const grid = 21;
  const cells = useMemo(() => {
    let hash = 2166136261;
    const str = String(seed || 'SLIDE-BAR');
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const matrix = [];
    for (let r = 0; r < grid; r++) {
      const row = [];
      for (let c = 0; c < grid; c++) {
        // Finder patterns (3 corners)
        const inTopLeft = r < 7 && c < 7;
        const inTopRight = r < 7 && c >= grid - 7;
        const inBottomLeft = r >= grid - 7 && c < 7;

        if (inTopLeft || inTopRight || inBottomLeft) {
          const lr = inBottomLeft ? r - (grid - 7) : r;
          const lc = inTopRight ? c - (grid - 7) : c;
          const isBorder = lr === 0 || lr === 6 || lc === 0 || lc === 6;
          const isCenter = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
          row.push(isBorder || isCenter);
        } else {
          // Pseudo-random deterministic cell from seed
          const v = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
          row.push((v % 100) < 48);
        }
      }
      matrix.push(row);
    }
    return matrix;
  }, [seed]);

  const cellSize = size / grid;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-xl bg-white p-2 shadow-inner transition-opacity ${expired ? 'opacity-40 grayscale' : 'opacity-100'}`}
    >
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill={expired ? '#64748B' : '#090D16'}
              rx={cellSize * 0.12}
            />
          ) : null
        )
      )}
    </svg>
  );
}

const generateTokenSuffix = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
};

export default function App() {
  // Navigation & Auth state (Defaults directly to RM 0 Login Page)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authRole, setAuthRole] = useState('guest'); // 'guest' | 'ba'
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'dashboard' | 'vouchers' | 'ba-account' | 'ba-hub' | 'pos'

  // Login flow state (Zero-cost Google / Apple / Passkey + Free Email OTP)
  const [loginRoleMode, setLoginRoleMode] = useState('guest'); // 'guest' | 'ba'
  const [loginStep, setLoginStep] = useState('choose'); // 'choose' | 'email-otp' | 'onboarding'
  const [emailInput, setEmailInput] = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [simulatedInboxBanner, setSimulatedInboxBanner] = useState(null);
  const [pendingAuthProvider, setPendingAuthProvider] = useState('Google');

  // BA Login state
  const [baLoginInput, setBaLoginInput] = useState('BA-CHLOE');
  const [activeBaId, setActiveBaId] = useState('BA-1');

  // Onboarding Profile state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    whatsapp: '+60 12-884 9021',
    referralCodeInput: ''
  });

  // Toast notification state
  const [toast, setToast] = useState(null);
  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 4200);
  };

  // Member User Profile
  const [user, setUser] = useState({
    name: 'Alex Mercer',
    initials: 'AM',
    email: 'alex.mercer@gmail.com',
    whatsapp: '+60 12-884 9021',
    authProvider: 'Google One-Tap',
    tier: 'Slide Gold Member',
    referralCode: 'SLIDE-ALEX99',
    joinedDate: 'Oct 2026'
  });

  // Live 60-Second Rotating Anti-Screenshot QR Engine
  const [qrSecondsLeft, setQrSecondsLeft] = useState(60);
  const [liveQrToken, setLiveQrToken] = useState(() => generateTokenSuffix());
  const [liveClock, setLiveClock] = useState(() => new Date().toLocaleTimeString());
  const [presentingVoucher, setPresentingVoucher] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString());
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          setLiveQrToken(generateTokenSuffix());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const handleManualRotateQr = () => {
    const nextToken = generateTokenSuffix();
    setLiveQrToken(nextToken);
    setQrSecondsLeft(60);
    triggerToast(`Live QR rotated to #${nextToken}. Previous screenshots invalidated.`);
  };

  // Vouchers state (Referrer gets 10% vouchers, new referred customers get 1x Free Ladies Drink with min. 1 bottle purchase)
  const [vouchers, setVouchers] = useState([
    {
      id: 'VOUCH-LD-NEW1',
      title: '1x Free Ladies Drink',
      type: 'ladies_drink',
      discount: 'FREE DRINK',
      status: 'Available',
      expiry: 'Valid for 30 Days',
      code: 'SLIDE-LADIES-01',
      reason: 'New Customer Referral Welcome Pass',
      requiresBottle: true,
      terms: 'Minimum purchase of 1 bottle required to redeem'
    },
    {
      id: 'VOUCH-10-88A',
      title: '10% OFF Next Visit',
      type: 'referrer',
      discount: '10%',
      status: 'Available',
      expiry: '30 Days left',
      code: 'SLIDE-10-88A92',
      reason: 'Referred friend Samantha visited'
    },
    {
      id: 'VOUCH-10-44B',
      title: '10% OFF Next Visit',
      type: 'referrer',
      discount: '10%',
      status: 'Available',
      expiry: '45 Days left',
      code: 'SLIDE-10-44B12',
      reason: 'Referred friend Marcus visited'
    },
    {
      id: 'VOUCH-10-01C',
      title: '10% OFF Bar Tab',
      type: 'referrer',
      discount: '10%',
      status: 'Redeemed',
      expiry: 'Redeemed on Nov 5',
      code: 'SLIDE-10-USED9',
      reason: 'Referred friend David visited'
    }
  ]);

  // List of Invited Friends (Regular Customer Referrals)
  const [referredFriends, setReferredFriends] = useState([
    {
      id: 1,
      name: 'Samantha Vance',
      phone: '+60 11-*** 4310',
      date: '2026-10-28',
      status: 'Visited & Tab Paid',
      earnedReward: '10% Voucher Unlocked'
    },
    {
      id: 2,
      name: 'Marcus Chen',
      phone: '+60 14-*** 9822',
      date: '2026-10-31',
      status: 'Visited & Tab Paid',
      earnedReward: '10% Voucher Unlocked'
    },
    {
      id: 3,
      name: 'Elena Rostova',
      phone: '+60 17-*** 7701',
      date: '2026-11-01',
      status: 'Registered (Free Ladies Drink Ready)',
      earnedReward: 'Pending Min. 1 Bottle Visit'
    },
    {
      id: 4,
      name: 'David K.',
      phone: '+60 19-*** 1239',
      date: '2026-10-15',
      status: 'Visited & Tab Paid',
      earnedReward: '10% Voucher (Claimed)'
    }
  ]);

  // Brand Ambassadors & Nett Profit Commission State
  const [barDefaultNettMarginPct, setBarDefaultNettMarginPct] = useState(45);
  const [brandAmbassadors, setBrandAmbassadors] = useState([
    {
      id: 'BA-1',
      name: 'Chloe Tan',
      initials: 'CT',
      email: 'chloe.tan@gmail.com',
      instagram: '@chloetan.kl',
      code: 'BA-CHLOE',
      profitCutPct: 15,
      guestDiscountPct: 5
    },
    {
      id: 'BA-2',
      name: 'Ryan Lim',
      initials: 'RL',
      email: 'ryan.lim@gmail.com',
      instagram: '@ryanlim.nights',
      code: 'BA-RYAN',
      profitCutPct: 12,
      guestDiscountPct: 5
    },
    {
      id: 'BA-3',
      name: 'Nadia Sofia',
      initials: 'NS',
      email: 'nadia.sofia@gmail.com',
      instagram: '@nadiasofia_',
      code: 'BA-NADIA',
      profitCutPct: 18,
      guestDiscountPct: 8
    }
  ]);

  const [baRedemptions, setBaRedemptions] = useState([
    {
      id: 'TX-901',
      baId: 'BA-1',
      baCode: 'BA-CHLOE',
      guestName: 'Table 4 — Jason & Crew',
      date: '2026-11-18 11:20 PM',
      grossBill: 1200,
      guestDiscountPct: 5,
      netBill: 1140,
      nettProfit: 513,
      commissionEarned: 76.95,
      status: 'Unpaid'
    },
    {
      id: 'TX-902',
      baId: 'BA-1',
      baCode: 'BA-CHLOE',
      guestName: 'VIP Booth 2 — Melissa W.',
      date: '2026-11-14 10:45 PM',
      grossBill: 2400,
      guestDiscountPct: 5,
      netBill: 2280,
      nettProfit: 1026,
      commissionEarned: 153.9,
      status: 'Paid'
    },
    {
      id: 'TX-903',
      baId: 'BA-2',
      baCode: 'BA-RYAN',
      guestName: 'Table 9 — Kevin Ong',
      date: '2026-11-17 09:50 PM',
      grossBill: 850,
      guestDiscountPct: 5,
      netBill: 807.5,
      nettProfit: 363.38,
      commissionEarned: 43.61,
      status: 'Unpaid'
    },
    {
      id: 'TX-904',
      baId: 'BA-3',
      baCode: 'BA-NADIA',
      guestName: 'VIP Booth 1 — Farhan Group',
      date: '2026-11-19 12:15 AM',
      grossBill: 3100,
      guestDiscountPct: 8,
      netBill: 2852,
      nettProfit: 1283.4,
      commissionEarned: 231.01,
      status: 'Unpaid'
    }
  ]);

  // BA Account Search & Filter state
  const [baSearchQuery, setBaSearchQuery] = useState('');
  const [baStatusFilter, setBaStatusFilter] = useState('All');

  // New BA creation form (Owner BA Hub)
  const [newBaForm, setNewBaForm] = useState({
    name: '',
    code: '',
    email: '',
    instagram: '',
    profitCutPct: '15',
    guestDiscountPct: '5'
  });

  // Bartender POS Validation & Nett Profit Calculator State
  const [posCodeInput, setPosCodeInput] = useState('');
  const [posResult, setPosResult] = useState(null);
  const [posBottleConfirmed, setPosBottleConfirmed] = useState(false);
  const [posBillAmount, setPosBillAmount] = useState('500');
  const [posGuestName, setPosGuestName] = useState('Walk-in Table');
  const [posUseCustomProfit, setPosUseCustomProfit] = useState(false);
  const [posCustomNettProfit, setPosCustomNettProfit] = useState('');

  // --- AUTH HANDLERS ---
  const handleOneTapLogin = (provider) => {
    setPendingAuthProvider(provider);
    setProfileForm({
      fullName: provider === 'Google One-Tap' ? 'Alex Mercer' : 'Jordan Tan',
      whatsapp: '+60 12-884 9021',
      referralCodeInput: ''
    });
    setLoginStep('onboarding');
    triggerToast(`Authenticated in 1 tap via ${provider} (RM 0 cost)!`);
  };

  const handleRequestEmailOtp = (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      triggerToast('Please enter a valid email address.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedEmailOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpCountdown(45);
    setPendingAuthProvider('Free Email OTP');
    setLoginStep('email-otp');
    setSimulatedInboxBanner({ email: emailInput.trim(), code });
  };

  const handleAutoFillEmailOtp = () => {
    if (!generatedEmailOtp) return;
    setOtpDigits(generatedEmailOtp.split(''));
  };

  const handleVerifyEmailOtp = (e) => {
    e.preventDefault();
    const entered = otpDigits.join('');
    if (entered !== generatedEmailOtp) {
      triggerToast('Incorrect 6-digit code. Try the Auto-fill button in the banner above.');
      return;
    }
    setSimulatedInboxBanner(null);
    setProfileForm({
      fullName: emailInput.split('@')[0].replace(/[._-]/g, ' '),
      whatsapp: '+60 12-884 9021',
      referralCodeInput: ''
    });
    setLoginStep('onboarding');
    triggerToast('Email verified! Complete your 1-time Slide Lounge profile.');
  };

  const handleCompleteOnboarding = (e) => {
    e.preventDefault();
    const cleanName = profileForm.fullName.trim() || 'Slide VIP Guest';
    const initials = cleanName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const cleanRef = profileForm.referralCodeInput.trim().toUpperCase();

    setUser((prev) => ({
      ...prev,
      name: cleanName,
      initials: initials || 'SG',
      email: emailInput.trim() || prev.email,
      whatsapp: profileForm.whatsapp.trim() || prev.whatsapp,
      authProvider: pendingAuthProvider
    }));

    // Check if referred by Brand Ambassador or regular friend
    const matchedBa = brandAmbassadors.find((ba) => ba.code === cleanRef);
    if (matchedBa) {
      const baWelcomeVoucher = {
        id: `VOUCH-BA-${Date.now()}`,
        title: `${matchedBa.guestDiscountPct}% OFF Ambassador VIP Pass`,
        type: 'ba_welcome',
        discount: `${matchedBa.guestDiscountPct}%`,
        status: 'Available',
        expiry: 'Valid Tonight & 30 Days',
        code: `${matchedBa.code}-VIP${Math.floor(10 + Math.random() * 89)}`,
        reason: `Invited by Brand Ambassador ${matchedBa.name}`
      };
      setVouchers((prev) => [baWelcomeVoucher, ...prev]);
      triggerToast(`VIP Pass unlocked via ${matchedBa.name} (${matchedBa.guestDiscountPct}% OFF)!`);
    } else if (cleanRef) {
      const welcomeVoucher = {
        id: `VOUCH-LD-NEW-${Date.now()}`,
        title: '1x Free Ladies Drink',
        type: 'ladies_drink',
        discount: 'FREE DRINK',
        status: 'Available',
        expiry: 'Valid for 30 Days',
        code: `SLIDE-LADIES-${Math.floor(1000 + Math.random() * 9000)}`,
        reason: `Referred by code ${cleanRef}`,
        requiresBottle: true,
        terms: 'Minimum purchase of 1 bottle required to redeem'
      };
      setVouchers((prev) => [welcomeVoucher, ...prev]);
      triggerToast('Welcome bonus: 1x Free Ladies Drink voucher (min. 1 bottle purchase) added!');
    } else {
      triggerToast('Welcome to Slide Bar & Lounge!');
    }

    setIsLoggedIn(true);
    setAuthRole('guest');
    setLoginStep('choose');
    setActiveTab('dashboard');
  };

  const handleBaSignIn = (e, presetBaId = null) => {
    if (e) e.preventDefault();
    let matched = null;
    if (presetBaId) {
      matched = brandAmbassadors.find((b) => b.id === presetBaId);
    } else {
      const q = baLoginInput.trim().toUpperCase();
      matched = brandAmbassadors.find(
        (b) => b.code.toUpperCase() === q || b.email.toUpperCase() === q || b.name.toUpperCase().includes(q)
      );
    }

    if (!matched) {
      triggerToast('Ambassador account not found. Try BA-CHLOE, BA-RYAN, or BA-NADIA.');
      return;
    }

    setActiveBaId(matched.id);
    setIsLoggedIn(true);
    setAuthRole('ba');
    setActiveTab('ba-account');
    triggerToast(`Signed in to ${matched.name}'s Brand Ambassador Account`);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setAuthRole('guest');
    setLoginStep('choose');
    setActiveTab('login');
    triggerToast('Signed out safely.');
  };

  // --- SHARE & COPY HELPERS ---
  const copyToClipboard = (text, label = 'Copied') => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    triggerToast(`${label}: ${text}`);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Join me at Slide Bar & Lounge. Use my referral link or code ${user.referralCode} to get a FREE Ladies Drink (with min. 1 bottle purchase) on your first visit! https://slidebar.com/join?ref=${user.referralCode}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // --- OWNER BA HUB HANDLERS ---
  const handleCreateBa = (e) => {
    e.preventDefault();
    const cleanName = newBaForm.name.trim();
    const cleanCode = newBaForm.code.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanName || !cleanCode) {
      triggerToast('Please enter both Ambassador Name and Referral Code.');
      return;
    }
    if (brandAmbassadors.some((b) => b.code === cleanCode)) {
      triggerToast('That referral code is already taken.');
      return;
    }
    const initials = cleanName
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newBa = {
      id: `BA-${Date.now()}`,
      name: cleanName,
      initials: initials || 'BA',
      email: newBaForm.email.trim() || `${cleanCode.toLowerCase()}@slidebar.com`,
      instagram: newBaForm.instagram.trim() || `@${cleanName.toLowerCase().replace(/\s+/g, '')}`,
      code: cleanCode,
      profitCutPct: Math.max(1, Math.min(50, Number(newBaForm.profitCutPct) || 15)),
      guestDiscountPct: Math.max(0, Math.min(30, Number(newBaForm.guestDiscountPct) || 5))
    };

    setBrandAmbassadors((prev) => [newBa, ...prev]);
    setNewBaForm({ name: '', code: '', email: '', instagram: '', profitCutPct: '15', guestDiscountPct: '5' });
    triggerToast(`Created Brand Ambassador ${newBa.name} (${newBa.code})!`);
  };

  const handleMarkBaPaid = (baId) => {
    setBaRedemptions((prev) =>
      prev.map((tx) => (tx.baId === baId && tx.status === 'Unpaid' ? { ...tx, status: 'Paid' } : tx))
    );
    const ba = brandAmbassadors.find((b) => b.id === baId);
    triggerToast(`Marked all unpaid commissions for ${ba?.name || 'Ambassador'} as PAID!`);
  };

  // --- BARTENDER POS VALIDATION & REDEMPTION ---
  const handleValidatePos = (e, overrideCode = null) => {
    if (e) e.preventDefault();
    const rawCode = (overrideCode ?? posCodeInput).trim().toUpperCase();
    if (!rawCode) {
      triggerToast('Enter or scan a QR token, Voucher, or BA Code.');
      return;
    }

    const [baseCode, tokenSuffix] = rawCode.split('#');
    setPosUseCustomProfit(false);
    setPosCustomNettProfit('');
    setPosBottleConfirmed(false);

    // 1. Check Brand Ambassador Code Match First
    const baMatch = brandAmbassadors.find((ba) => ba.code === baseCode);
    if (baMatch) {
      setPosResult({
        valid: true,
        isBaCode: true,
        ba: baMatch,
        discount: `${baMatch.guestDiscountPct}%`,
        type: `BRAND AMBASSADOR • ${baMatch.name}`,
        details: `Apply ${baMatch.guestDiscountPct}% guest discount on the bill. ${baMatch.name} earns ${baMatch.profitCutPct}% of the nett profit automatically upon confirmation.`
      });
      return;
    }

    // 2. Check Voucher Match (Supports Live 60s Anti-Screenshot QR Token #XXXX)
    const voucherMatch = vouchers.find((v) => v.code.toUpperCase() === baseCode);
    if (voucherMatch) {
      if (voucherMatch.status !== 'Available') {
        setPosResult({
          valid: false,
          type: 'VOUCHER ALREADY REDEEMED',
          details: `Voucher ${voucherMatch.code} was already used (${voucherMatch.expiry}). Single-use vouchers cannot be redeemed twice.`
        });
        return;
      }

      if (tokenSuffix) {
        if (tokenSuffix !== liveQrToken) {
          setPosResult({
            valid: false,
            isScreenshotBlocked: true,
            type: 'EXPIRED SCREENSHOT BLOCKED',
            details: `Dynamic token #${tokenSuffix} does NOT match the live 60-second server token (#${liveQrToken}). Ask the guest to open their live Slide Lounge app on their phone.`
          });
          return;
        }

        setPosResult({
          valid: true,
          isLiveTokenVerified: true,
          discount: voucherMatch.discount,
          requiresBottle: Boolean(voucherMatch.requiresBottle),
          terms: voucherMatch.terms || null,
          type: `LIVE QR VERIFIED • ${voucherMatch.title}`,
          details: voucherMatch.requiresBottle
            ? `60-second dynamic token #${tokenSuffix} matched! Confirm the guest purchased a minimum of 1 bottle and matches the Identity Flash below before serving 1x Free Ladies Drink.`
            : `60-second dynamic token #${tokenSuffix} matched! Confirm the guest's face/name matches the Identity Flash below, then deduct ${voucherMatch.discount}.`,
          voucher: voucherMatch,
          memberIdentity: {
            name: user.name,
            initials: user.initials,
            authProvider: user.authProvider,
            tier: user.tier,
            whatsapp: user.whatsapp
          }
        });
        return;
      }

      setPosResult({
        valid: true,
        isLiveTokenVerified: false,
        discount: voucherMatch.discount,
        requiresBottle: Boolean(voucherMatch.requiresBottle),
        terms: voucherMatch.terms || null,
        type: voucherMatch.title,
        details: voucherMatch.requiresBottle
          ? 'Manual voucher lookup succeeded. Verify min. 1 bottle purchase on the table tab and confirm the member Identity Flash below.'
          : 'Manual voucher lookup succeeded. Verify the member Identity Flash below and ensure they are viewing the live pass on their phone.',
        voucher: voucherMatch,
        memberIdentity: {
          name: user.name,
          initials: user.initials,
          authProvider: user.authProvider,
          tier: user.tier,
          whatsapp: user.whatsapp
        }
      });
      return;
    }

    // 3. Check Regular Customer Referral Code (e.g., SLIDE-ALEX99)
    if (baseCode.startsWith('SLIDE-')) {
      setPosResult({
        valid: true,
        discount: '1x FREE LADIES DRINK',
        requiresBottle: true,
        terms: 'Minimum purchase of 1 bottle required to redeem',
        type: 'Referred Friend First Visit',
        details: `Referral code ${baseCode} valid! Confirm the new customer purchased a minimum of 1 bottle to serve 1x Free Ladies Drink and unlock a 10% OFF voucher for the referrer.`,
        isReferralFirstVisit: true,
        refCode: baseCode
      });
      return;
    }

    // 4. Invalid Code
    setPosResult({
      valid: false,
      type: 'INVALID OR UNKNOWN CODE',
      details: `Code "${rawCode}" was not recognized as an active Slide voucher, referral code, or Brand Ambassador code.`
    });
  };

  // Live BA commission calculation on POS
  const posBaCalc = useMemo(() => {
    if (!posResult?.isBaCode || !posResult.ba) return null;
    const gross = Math.max(0, Number(posBillAmount) || 0);
    const discountAmt = gross * (posResult.ba.guestDiscountPct / 100);
    const netBill = gross - discountAmt;
    const estimatedProfit = netBill * (barDefaultNettMarginPct / 100);
    const nettProfit =
      posUseCustomProfit && posCustomNettProfit !== ''
        ? Math.max(0, Number(posCustomNettProfit) || 0)
        : estimatedProfit;
    const commission = nettProfit * (posResult.ba.profitCutPct / 100);
    return { gross, discountAmt, netBill, nettProfit, commission };
  }, [posResult, posBillAmount, barDefaultNettMarginPct, posUseCustomProfit, posCustomNettProfit]);

  const confirmRedemption = () => {
    if (!posResult) return;

    if (posResult.requiresBottle && !posBottleConfirmed) {
      triggerToast('T&C Check: Please confirm a minimum 1 bottle purchase before redeeming!');
      return;
    }

    if (posResult.isBaCode && posResult.ba && posBaCalc) {
      const newTx = {
        id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
        baId: posResult.ba.id,
        baCode: posResult.ba.code,
        guestName: posGuestName.trim() || 'Walk-in Guest',
        date: 'Just now',
        grossBill: Number(posBaCalc.gross.toFixed(2)),
        guestDiscountPct: posResult.ba.guestDiscountPct,
        netBill: Number(posBaCalc.netBill.toFixed(2)),
        nettProfit: Number(posBaCalc.nettProfit.toFixed(2)),
        commissionEarned: Number(posBaCalc.commission.toFixed(2)),
        status: 'Unpaid'
      };
      setBaRedemptions((prev) => [newTx, ...prev]);
      setPosResult({
        valid: true,
        isBaCode: true,
        ba: posResult.ba,
        discount: posResult.discount,
        type: 'BA Bill Logged & Commission Credited',
        details: `RM ${newTx.commissionEarned.toFixed(2)} credited to ${posResult.ba.name}'s Brand Ambassador Account (Net Bill: RM ${newTx.netBill.toFixed(2)}).`,
        isCompleted: true
      });
      triggerToast(`Logged! RM ${newTx.commissionEarned.toFixed(2)} synced to ${posResult.ba.name}'s BA Account.`);
      return;
    }

    if (posResult.voucher) {
      setVouchers((prev) =>
        prev.map((v) =>
          v.id === posResult.voucher.id ? { ...v, status: 'Redeemed', expiry: 'Redeemed just now' } : v
        )
      );
      setPosResult({
        valid: true,
        discount: posResult.discount,
        requiresBottle: Boolean(posResult.requiresBottle),
        type: 'Redemption Success',
        details: posResult.requiresBottle
          ? 'Min. 1 bottle purchase confirmed! 1x Free Ladies Drink logged and single-use voucher permanently locked.'
          : `${posResult.discount} discount logged and single-use voucher permanently locked.`,
        isCompleted: true,
        memberIdentity: posResult.memberIdentity
      });
      triggerToast('Voucher verified & marked redeemed on POS!');
    } else if (posResult.isReferralFirstVisit) {
      const unlockedVoucher = {
        id: `VOUCH-10-NEW-${Date.now()}`,
        title: '10% OFF Next Visit',
        type: 'referrer',
        discount: '10%',
        status: 'Available',
        expiry: 'Valid for 60 Days',
        code: `SLIDE-10-${Math.floor(1000 + Math.random() * 9000)}`,
        reason: 'Friend completed their first bottle visit'
      };
      setVouchers((prev) => [unlockedVoucher, ...prev]);

      setReferredFriends((prev) => [
        {
          id: Date.now(),
          name: 'Walk-in Friend (1 Bottle)',
          phone: '+60 12-*** 0091',
          date: 'Just now',
          status: 'Visited & Tab Paid',
          earnedReward: '10% Voucher Unlocked'
        },
        ...prev
      ]);

      setPosResult({
        valid: true,
        discount: '1x FREE LADIES DRINK',
        requiresBottle: true,
        type: 'First Visit Confirmed',
        details:
          'Min. 1 bottle purchase confirmed! Serve 1x Free Ladies Drink to the new guest — Slide has unlocked a 10% OFF voucher for the referrer.',
        isCompleted: true
      });
      triggerToast('Free Ladies Drink redeemed & referrer rewarded with 10% voucher!');
    }
  };

  // --- DERIVED STATS FOR BA ACCOUNT & OWNER HUB ---
  const currentBa = brandAmbassadors.find((b) => b.id === activeBaId) || brandAmbassadors[0];
  const currentBaTransactions = useMemo(() => {
    return baRedemptions
      .filter((tx) => tx.baId === currentBa?.id)
      .filter((tx) => (baStatusFilter === 'All' ? true : tx.status === baStatusFilter))
      .filter((tx) => {
        if (!baSearchQuery.trim()) return true;
        const q = baSearchQuery.toLowerCase();
        return tx.guestName.toLowerCase().includes(q) || tx.id.toLowerCase().includes(q);
      });
  }, [baRedemptions, currentBa, baStatusFilter, baSearchQuery]);

  const currentBaStats = useMemo(() => {
    const mine = baRedemptions.filter((tx) => tx.baId === currentBa?.id);
    const unpaid = mine.filter((t) => t.status === 'Unpaid').reduce((s, t) => s + t.commissionEarned, 0);
    const paid = mine.filter((t) => t.status === 'Paid').reduce((s, t) => s + t.commissionEarned, 0);
    const totalSales = mine.reduce((s, t) => s + t.netBill, 0);
    return { count: mine.length, unpaid, paid, totalSales };
  }, [baRedemptions, currentBa]);

  const ownerBaStats = useMemo(() => {
    const totalRevenue = baRedemptions.reduce((s, t) => s + t.netBill, 0);
    const totalProfit = baRedemptions.reduce((s, t) => s + t.nettProfit, 0);
    const unpaidComm = baRedemptions
      .filter((t) => t.status === 'Unpaid')
      .reduce((s, t) => s + t.commissionEarned, 0);
    const paidComm = baRedemptions
      .filter((t) => t.status === 'Paid')
      .reduce((s, t) => s + t.commissionEarned, 0);
    return { totalRevenue, totalProfit, unpaidComm, paidComm };
  }, [baRedemptions]);

  const availableVoucherCount = vouchers.filter((v) => v.status === 'Available').length;

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 font-sans pb-16 selection:bg-amber-500/30">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900/95 border border-amber-500/50 text-amber-100 px-4 py-3 rounded-2xl shadow-2xl shadow-amber-500/10 flex items-center gap-3 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold leading-snug">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Full-Screen Live Pass Presentation Modal (Staff Counter View) */}
      {presentingVoucher && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#131B2B] to-[#090D16] border-2 border-emerald-400/70 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-1000"
                style={{ width: `${(qrSecondsLeft / 60) * 100}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => setPresentingVoucher(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE ANTI-SCREENSHOT PASS • {liveClock}
            </div>

            <h3 className="text-2xl font-black text-white">{presentingVoucher.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{presentingVoucher.reason}</p>

            {presentingVoucher.requiresBottle && (
              <div className="mt-3 bg-rose-500/15 border border-rose-500/40 text-rose-200 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5">
                <Wine className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>T&C: Min. 1 bottle purchase required</span>
              </div>
            )}

            <div className="my-5 flex justify-center">
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <LiveQrMatrix seed={`${presentingVoucher.code}#${liveQrToken}`} size={196} />
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 mb-4">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Live Rotating Token (Expires in {qrSecondsLeft}s)
              </p>
              <p className="text-base font-mono font-black text-amber-300 tracking-wider mt-0.5">
                {presentingVoucher.code}#{liveQrToken}
              </p>
            </div>

            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-left mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  {user.initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[10px] text-emerald-400 font-semibold">{user.authProvider} Verified</p>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <button
              type="button"
              onClick={() => {
                const fullToken = `${presentingVoucher.code}#${liveQrToken}`;
                setPresentingVoucher(null);
                setPosCodeInput(fullToken);
                setActiveTab('pos');
                handleValidatePos(null, fullToken);
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
            >
              Simulate Bartender Scan Now
            </button>
          </div>
        </div>
      )}

      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#070A0F]/90 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab(isLoggedIn ? (authRole === 'ba' ? 'ba-account' : 'dashboard') : 'login')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Wine className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-none flex items-center gap-1.5">
                SLIDE <span className="text-amber-400 font-light">BAR</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                RM 0 Rewards & BA Hub
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex flex-wrap items-center gap-1.5">
            {isLoggedIn && authRole === 'guest' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vouchers')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    activeTab === 'vouchers'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live QR ({availableVoucherCount})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    activeTab === 'login'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>RM 0 Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vouchers')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    activeTab === 'vouchers'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Live QR Demo</span>
                </button>
              </>
            )}

            {/* Brand Ambassador Self-Service Account Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('ba-account')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'ba-account'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              <span>BA Account</span>
            </button>

            {/* Owner Brand Ambassador Hub */}
            <button
              type="button"
              onClick={() => setActiveTab('ba-hub')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'ba-hub'
                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Owner BA Hub</span>
            </button>

            {/* Bartender POS */}
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'pos'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-sky-400" />
              <span>Bartender POS</span>
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 pt-8">
        {/* ============================================================
            TAB 1: RM 0 LOW-RESISTANCE LOGIN PAGE
        ============================================================ */}
        {activeTab === 'login' && (
          <div className="max-w-md mx-auto">
            {/* Simulated Free Email Inbox Banner */}
            {simulatedInboxBanner && loginStep === 'email-otp' && (
              <div className="mb-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                        Simulated Inbox • RM 0 Email Delivery
                      </p>
                      <p className="text-xs text-slate-200 mt-0.5">
                        Your Slide Bar code for <strong>{simulatedInboxBanner.email}</strong> is{' '}
                        <span className="font-mono font-black text-amber-300 text-sm tracking-widest">
                          {simulatedInboxBanner.code}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillEmailOtp}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase shrink-0"
                  >
                    Auto-Fill
                  </button>
                </div>
              </div>
            )}

            <div className="bg-[#0F1622]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

              {/* Role Switcher */}
              {loginStep === 'choose' && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginRoleMode('guest')}
                    className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      loginRoleMode === 'guest'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wine className="w-3.5 h-3.5" />
                    Guest Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRoleMode('ba')}
                    className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      loginRoleMode === 'ba'
                        ? 'bg-purple-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Brand Ambassador
                  </button>
                </div>
              )}

              {/* GUEST LOGIN: STEP 1 (CHOOSE METHOD) */}
              {loginRoleMode === 'guest' && loginStep === 'choose' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-3">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      RM 0 Cost • Anti-Screenshot Pass
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Join Slide Lounge</h2>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Sign in once in 3 seconds to unlock a{' '}
                      <strong className="text-rose-400">Free Ladies Drink</strong> (min. 1 bottle) &{' '}
                      <strong className="text-amber-400">10% referral</strong> passes. No SMS delays.
                    </p>
                  </div>

                  {/* 1-Tap OAuth & Passkey Buttons */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleOneTapLogin('Google One-Tap')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 transition shadow-lg"
                    >
                      <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 via-red-500 to-amber-400 text-white text-[11px] font-black flex items-center justify-center">
                        G
                      </span>
                      Continue with Google
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Fastest
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOneTapLogin('Sign in with Apple')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white border border-slate-700 font-bold text-sm flex items-center justify-center gap-2.5 transition"
                    >
                      <Smartphone className="w-4 h-4 text-slate-300" />
                      Continue with Apple
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOneTapLogin('Face ID / Passkey')}
                      className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Fingerprint className="w-4 h-4" />
                      Instant Sign-In with Face ID / Passkey
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-slate-800" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Or Free Email 6-Digit Code
                    </span>
                    <div className="flex-1 h-px bg-slate-800" />
                  </div>

                  {/* Free Email OTP Form */}
                  <form onSubmit={handleRequestEmailOtp} className="space-y-3">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                    >
                      Send Free 6-Digit Email Code
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

              {/* GUEST LOGIN: STEP 2 (EMAIL OTP VERIFICATION) */}
              {loginRoleMode === 'guest' && loginStep === 'email-otp' && (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-white">Check Your Email</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the 6-digit verification code sent to <strong className="text-white">{emailInput}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const next = [...otpDigits];
                          next[idx] = val;
                          setOtpDigits(next);
                        }}
                        className="w-full h-12 text-center text-lg font-mono font-black bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-amber-300 outline-none"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg"
                  >
                    Verify & Continue
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setLoginStep('choose')}
                      className="text-slate-400 hover:text-white"
                    >
                      ← Change Method
                    </button>
                    <span className="text-slate-500">
                      {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Ready to resend'}
                    </span>
                  </div>
                </form>
              )}

              {/* GUEST LOGIN: STEP 3 (1-TIME ONBOARDING + REFERRAL CODE) */}
              {loginRoleMode === 'guest' && loginStep === 'onboarding' && (
                <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                  <div className="text-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                      Verified via {pendingAuthProvider}
                    </span>
                    <h2 className="text-xl font-black text-white mt-3">Finish Your Member Pass</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Your name appears on our POS Identity Flash so only you can redeem your passes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Your Full Name"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      WhatsApp Number (For Table & Reward Alerts)
                    </label>
                    <input
                      type="tel"
                      value={profileForm.whatsapp}
                      onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                      placeholder="+60 12-345 6789"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                    />
                  </div>

                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        Friend or BA Code
                      </label>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                        Free Ladies Drink
                      </span>
                    </div>
                    <input
                      type="text"
                      value={profileForm.referralCodeInput}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, referralCodeInput: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. SLIDE-ALEX99 or BA-CHLOE"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-amber-300 font-mono text-sm uppercase rounded-xl px-3 py-2.5 outline-none tracking-wider placeholder-slate-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      Friend referral gives <strong className="text-rose-300">1x Free Ladies Drink</strong> (T&C: min. 1 bottle purchase required).
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20"
                  >
                    Activate My Slide Lounge Account
                  </button>
                </form>
              )}

              {/* BRAND AMBASSADOR LOGIN */}
              {loginRoleMode === 'ba' && loginStep === 'choose' && (
                <form onSubmit={handleBaSignIn} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest mb-3">
                      <Crown className="w-3.5 h-3.5" />
                      Partner Portal
                    </div>
                    <h2 className="text-2xl font-black text-white">Ambassador Sign In</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Track every customer who redeems your code and monitor your live payouts.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Ambassador Code or Registered Email
                    </label>
                    <input
                      type="text"
                      value={baLoginInput}
                      onChange={(e) => setBaLoginInput(e.target.value)}
                      placeholder="e.g. BA-CHLOE or chloe.tan@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-400 rounded-xl px-3.5 py-3 text-sm font-mono text-purple-200 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20"
                  >
                    Sign In to Ambassador Account
                  </button>

                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Quick Demo Ambassador Accounts:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {brandAmbassadors.map((ba) => (
                        <button
                          key={ba.id}
                          type="button"
                          onClick={(e) => handleBaSignIn(e, ba.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-xs font-mono text-purple-300 transition"
                        >
                          {ba.code} ({ba.name.split(' ')[0]})
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: MEMBER DASHBOARD
        ============================================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Member Welcome Banner */}
            <div className="bg-gradient-to-r from-[#121A2B] via-[#0F1622] to-[#1A1410] border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
                  {user.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-black text-white">{user.name}</h2>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {user.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {user.authProvider}
                    </span>
                    <span>•</span>
                    <span>{user.whatsapp}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('vouchers')}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <QrCode className="w-4 h-4" />
                Open Live QR Wallet ({availableVoucherCount})
              </button>
            </div>

            {/* Dual Reward Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Referrer Reward Card */}
              <div className="bg-[#0F1622]/90 border border-amber-500/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 inline-block mb-3">
                      Your Referrer Reward
                    </span>
                    <h3 className="text-2xl font-black text-white">10% OFF NEXT VISIT</h3>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      Every time a referred friend visits Slide Bar and completes their qualifying bottle tab, a fresh{' '}
                      <strong className="text-amber-300">10% OFF</strong> live QR voucher unlocks in your wallet.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                    <Award className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* New Customer Welcome Reward Card */}
              <div className="bg-[#0F1622]/90 border border-rose-500/30 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30 inline-block mb-3">
                      New Customer Welcome Reward
                    </span>
                    <h3 className="text-2xl font-black text-white flex flex-wrap items-center gap-2">
                      1x FREE LADIES DRINK
                    </h3>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                      New guests you invite immediately unlock a{' '}
                      <strong className="text-rose-300">Free Ladies Drink</strong> live QR voucher upon signing in with your referral code.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                      <Wine className="w-3.5 h-3.5 shrink-0" />
                      <span>T&C: Minimum purchase of 1 bottle required to redeem</span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30 shrink-0">
                    <Wine className="w-7 h-7" />
                  </div>
                </div>
              </div>
            </div>

            {/* Share Your Referral Code Panel */}
            <div className="bg-[#0F1622]/90 border border-slate-800 rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Your Personal Invite Code
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-wider">
                      {user.referralCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(user.referralCode, 'Referral code copied')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Share on WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Join me at Slide Bar! Use code ${user.referralCode} for a FREE Ladies Drink (with min. 1 bottle purchase): https://slidebar.com/join?ref=${user.referralCode}`;
                      window.open(`sms:?body=${encodeURIComponent(text)}`);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-slate-700"
                  >
                    <Share2 className="w-4 h-4" />
                    Send via SMS
                  </button>
                </div>
              </div>
            </div>

            {/* Invited Friends Ledger */}
            <div className="bg-[#0F1622]/90 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Invited Friends ({referredFriends.length})
              </h3>
              <div className="space-y-2.5">
                {referredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{friend.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {friend.phone} • {friend.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                        {friend.status}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {friend.earnedReward}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: LIVE 60-SECOND ANTI-SCREENSHOT QR WALLET
        ============================================================ */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            {/* Live Rotating Security Bar */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2 flex-wrap">
                    Live Anti-Screenshot QR Wallet
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      TOKEN #{liveQrToken}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Every voucher rotates its cryptographic QR token every 60 seconds so forwarded screenshots expire immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    Rotates in {qrSecondsLeft}s
                  </p>
                  <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-1000"
                      style={{ width: `${(qrSecondsLeft / 60) * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualRotateQr}
                  title="Force rotate QR token now"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vouchers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {vouchers.map((vouch) => {
                const isAvailable = vouch.status === 'Available';
                const dynamicCode = `${vouch.code}#${liveQrToken}`;

                return (
                  <div
                    key={vouch.id}
                    className={`rounded-3xl p-5 border transition relative overflow-hidden ${
                      isAvailable
                        ? 'bg-[#0F1622] border-slate-800 hover:border-amber-500/40 shadow-xl'
                        : 'bg-slate-950/60 border-slate-900 opacity-65'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          isAvailable
                            ? vouch.requiresBottle
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : vouch.discount === '10%'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {vouch.status} • {vouch.requiresBottle ? vouch.discount : `${vouch.discount} OFF`}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{vouch.expiry}</span>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <LiveQrMatrix seed={isAvailable ? dynamicCode : vouch.code} size={148} expired={!isAvailable} />

                      <div>
                        <h4 className="text-xl font-black text-white">{vouch.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{vouch.reason}</p>
                      </div>

                      {vouch.requiresBottle && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2 text-[11px] font-bold text-rose-200 flex items-center justify-center gap-1.5">
                          <Wine className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>T&C: Min. 1 bottle purchase required to redeem</span>
                        </div>
                      )}

                      {/* Live Token Readout */}
                      <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-amber-300">
                          {isAvailable ? dynamicCode : vouch.code}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">{liveClock}</span>
                      </div>

                      {isAvailable && (
                        <div className="w-full grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPresentingVoucher(vouch)}
                            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition"
                          >
                            Tap to Present
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPosCodeInput(dynamicCode);
                              setActiveTab('pos');
                              handleValidatePos(null, dynamicCode);
                            }}
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs transition"
                          >
                            Test on POS
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: PRIVATE BRAND AMBASSADOR SELF-SERVICE ACCOUNT
        ============================================================ */}
        {activeTab === 'ba-account' && currentBa && (
          <div className="space-y-6">
            {/* BA Account Switcher & Privacy Notice */}
            <div className="bg-gradient-to-r from-purple-950/60 via-[#0F1622] to-indigo-950/50 border border-purple-500/30 rounded-3xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                  {currentBa.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-black text-white">{currentBa.name}</h2>
                    <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      {currentBa.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>{currentBa.instagram}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Private Ambassador View (Bar COGS & Margins Hidden)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeBaId}
                  onChange={(e) => setActiveBaId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs font-bold text-purple-200 rounded-xl px-3 py-2.5 outline-none"
                >
                  {brandAmbassadors.map((ba) => (
                    <option key={ba.id} value={ba.id}>
                      Switch BA Preview: {ba.name} ({ba.code})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setPosCodeInput(currentBa.code);
                    setActiveTab('pos');
                    handleValidatePos(null, currentBa.code);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs transition flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Simulate Guest Redemption on POS
                </button>
              </div>
            </div>

            {/* BA KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0F1622] border border-slate-800 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Customers Redeemed</p>
                <p className="text-3xl font-black text-white mt-1">{currentBaStats.count}</p>
                <p className="text-[11px] text-purple-300 mt-1">Guests brought via {currentBa.code}</p>
              </div>
              <div className="bg-[#0F1622] border border-slate-800 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Guest Sales Driven</p>
                <p className="text-3xl font-black text-white mt-1">RM {currentBaStats.totalSales.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Guest perk: {currentBa.guestDiscountPct}% OFF</p>
              </div>
              <div className="bg-[#0F1622] border border-amber-500/30 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Unpaid Commission</p>
                <p className="text-3xl font-black text-amber-400 mt-1">RM {currentBaStats.unpaid.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Ready for payout settlement</p>
              </div>
              <div className="bg-[#0F1622] border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Total Paid Out</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">RM {currentBaStats.paid.toFixed(2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Your Tier: {currentBa.profitCutPct}% of Nett Profit</p>
              </div>
            </div>

            {/* BA Invite Toolkit & Customer Redemption Tracker */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal QR & Share Card */}
              <div className="bg-[#0F1622] border border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/15 border border-purple-500/30 px-3 py-1 rounded-full mb-3">
                  Your Personal Ambassador QR
                </span>
                <LiveQrMatrix seed={`SLIDE-BA-${currentBa.code}`} size={160} />
                <p className="font-mono font-black text-xl text-purple-300 mt-4">{currentBa.code}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Guests who show this code receive <strong>{currentBa.guestDiscountPct}% OFF</strong> their tab.
                </p>
                <div className="w-full space-y-2 mt-4">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentBa.code, 'BA Code copied')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(`https://slidebar.com/vip/${currentBa.code}`, 'Bio invite link copied')
                    }
                    className="w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Copy Instagram Bio Link
                  </button>
                </div>
              </div>

              {/* Isolated Customer Redemption Log */}
              <div className="lg:col-span-2 bg-[#0F1622] border border-slate-800 rounded-3xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Customers Who Redeemed {currentBa.code}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={baSearchQuery}
                        onChange={(e) => setBaSearchQuery(e.target.value)}
                        placeholder="Search guest..."
                        className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none w-36"
                      />
                    </div>
                    <select
                      value={baStatusFilter}
                      onChange={(e) => setBaStatusFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                    >
                      <option value="All">All</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                {currentBaTransactions.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No customer redemptions match your filter yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentBaTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-4 rounded-2xl bg-slate-950/75 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{tx.guestName}</span>
                            <span className="text-[10px] font-mono text-slate-500">{tx.id}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tx.date} • Net Bill: <strong className="text-slate-200">RM {tx.netBill.toFixed(2)}</strong> ({tx.guestDiscountPct}% guest discount)
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Your Cut</p>
                            <p className="text-sm font-black text-amber-400">RM {tx.commissionEarned.toFixed(2)}</p>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                              tx.status === 'Paid'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 5: OWNER BRAND AMBASSADOR NETT PROFIT HUB
        ============================================================ */}
        {activeTab === 'ba-hub' && (
          <div className="space-y-6">
            {/* Owner KPI Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0F1622] border border-slate-800 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total BA Nett Revenue</p>
                <p className="text-2xl font-black text-white mt-1">RM {ownerBaStats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-[#0F1622] border border-indigo-500/30 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Total Nett Profit</p>
                <p className="text-2xl font-black text-indigo-300 mt-1">RM {ownerBaStats.totalProfit.toFixed(2)}</p>
              </div>
              <div className="bg-[#0F1622] border border-amber-500/30 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">Unpaid BA Payouts</p>
                <p className="text-2xl font-black text-amber-400 mt-1">RM {ownerBaStats.unpaidComm.toFixed(2)}</p>
              </div>
              <div className="bg-[#0F1622] border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Settled Payouts</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">RM {ownerBaStats.paidComm.toFixed(2)}</p>
              </div>
            </div>

            {/* Bar Nett Margin Setting & Create BA Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Default Nett Margin Control */}
              <div className="bg-[#0F1622] border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  Bar Nett Profit Margin
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Used automatically at the POS to calculate each Brand Ambassador&apos;s cut of nett profit (can also be overridden per bill).
                </p>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">Default Nett Margin</span>
                    <span className="text-xl font-black text-amber-400">{barDefaultNettMarginPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    value={barDefaultNettMarginPct}
                    onChange={(e) => setBarDefaultNettMarginPct(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>15%</span>
                    <span>45% (Avg Bar)</span>
                    <span>80%</span>
                  </div>
                </div>
              </div>

              {/* Create New Brand Ambassador */}
              <form
                onSubmit={handleCreateBa}
                className="lg:col-span-2 bg-[#0F1622] border border-slate-800 rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" />
                  Add New Brand Ambassador
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newBaForm.name}
                    onChange={(e) => setNewBaForm({ ...newBaForm, name: e.target.value })}
                    placeholder="Ambassador Full Name"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    required
                    value={newBaForm.code}
                    onChange={(e) => setNewBaForm({ ...newBaForm, code: e.target.value.toUpperCase() })}
                    placeholder="Code (e.g. BA-JESSICA)"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-purple-300 outline-none focus:border-purple-400"
                  />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newBaForm.profitCutPct}
                    onChange={(e) => setNewBaForm({ ...newBaForm, profitCutPct: e.target.value })}
                    placeholder="Nett Profit Cut %"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400"
                  />
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={newBaForm.guestDiscountPct}
                    onChange={(e) => setNewBaForm({ ...newBaForm, guestDiscountPct: e.target.value })}
                    placeholder="Guest Discount %"
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-purple-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider transition"
                >
                  Create Ambassador & Generate Account
                </button>
              </form>
            </div>

            {/* Active Brand Ambassadors List */}
            <div className="bg-[#0F1622] border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-black text-white mb-4">Active Brand Ambassadors</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {brandAmbassadors.map((ba) => {
                  const txs = baRedemptions.filter((t) => t.baId === ba.id);
                  const unpaid = txs.filter((t) => t.status === 'Unpaid').reduce((s, t) => s + t.commissionEarned, 0);
                  return (
                    <div
                      key={ba.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{ba.name}</span>
                          <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded">
                            {ba.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Cut: <strong className="text-white">{ba.profitCutPct}% nett profit</strong> • Guest:{' '}
                          <strong className="text-white">{ba.guestDiscountPct}% OFF</strong>
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs bg-slate-900 rounded-xl px-3 py-2">
                          <span className="text-slate-400">Unpaid Balance</span>
                          <span className="font-black text-amber-400">RM {unpaid.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBaId(ba.id);
                            setActiveTab('ba-account');
                          }}
                          className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px]"
                        >
                          Open BA Portal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPosCodeInput(ba.code);
                            setActiveTab('pos');
                            handleValidatePos(null, ba.code);
                          }}
                          className="py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-bold text-[11px]"
                        >
                          Test on POS
                        </button>
                        {unpaid > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMarkBaPaid(ba.id)}
                            className="col-span-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px]"
                          >
                            Mark RM {unpaid.toFixed(2)} as Paid
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 6: BARTENDER POS SCANNER & NETT PROFIT CALCULATOR
        ============================================================ */}
        {activeTab === 'pos' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#0F1622] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-sky-400" />
                    Bartender POS Scanner & Validator
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Validate Live 60s QR Passes, enforce the Min. 1 Bottle Free Ladies Drink rule, and log Brand Ambassador bills.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                  LIVE TOKEN #{liveQrToken}
                </span>
              </div>

              {/* Search / Scan Input */}
              <form onSubmit={handleValidatePos} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={posCodeInput}
                  onChange={(e) => setPosCodeInput(e.target.value.toUpperCase())}
                  placeholder="Scan QR Token (e.g. SLIDE-LADIES-01#XXXX) or enter BA-CHLOE"
                  className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider transition"
                >
                  Validate Code
                </button>
              </form>

              {/* Quick Demo Presets */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1-Click Staff Simulator Presets:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const code = `SLIDE-LADIES-01#${liveQrToken}`;
                      setPosCodeInput(code);
                      handleValidatePos(null, code);
                    }}
                    className="text-xs font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Live 60s QR (Free Ladies Drink)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const code = `SLIDE-10-88A92#${liveQrToken}`;
                      setPosCodeInput(code);
                      handleValidatePos(null, code);
                    }}
                    className="text-xs font-mono bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    Live 60s QR (10% OFF)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const expiredCode = 'SLIDE-LADIES-01#EXPD';
                      setPosCodeInput(expiredCode);
                      handleValidatePos(null, expiredCode);
                    }}
                    className="text-xs font-mono bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Test Screenshot Block
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPosCodeInput('BA-CHLOE');
                      handleValidatePos(null, 'BA-CHLOE');
                    }}
                    className="text-xs font-mono bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    BA-CHLOE (Nett Profit Cut)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPosCodeInput(user.referralCode);
                      handleValidatePos(null, user.referralCode);
                    }}
                    className="text-xs font-mono bg-slate-950 hover:bg-slate-800 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Wine className="w-3.5 h-3.5 text-rose-400" />
                    {user.referralCode} (New Guest • Free Ladies Drink)
                  </button>
                </div>
              </div>

              {/* POS Validation Result Card */}
              {posResult && (
                <div
                  className={`mt-6 rounded-2xl p-5 border ${
                    posResult.valid
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-rose-950/40 border-rose-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                          posResult.valid
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {posResult.valid ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {posResult.type}
                      </span>
                      <h4 className="text-2xl font-black mt-2 text-white">
                        {posResult.valid
                          ? posResult.requiresBottle
                            ? '1x FREE LADIES DRINK'
                            : `${posResult.discount} GUEST DISCOUNT`
                          : 'REDEMPTION DENIED'}
                      </h4>
                      <p className="text-xs mt-1 text-slate-300 leading-relaxed">{posResult.details}</p>
                    </div>
                  </div>

                  {/* POS Member Identity Flash */}
                  {posResult.memberIdentity && (
                    <div className="mt-4 bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center">
                          {posResult.memberIdentity.initials}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            POS Member Identity Flash
                          </p>
                          <p className="text-sm font-black text-white">{posResult.memberIdentity.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {posResult.memberIdentity.tier} • {posResult.memberIdentity.authProvider}
                          </p>
                        </div>
                      </div>
                      <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                    </div>
                  )}

                  {/* Brand Ambassador Nett Profit Calculator on POS */}
                  {posResult.valid && posResult.isBaCode && posResult.ba && !posResult.isCompleted && posBaCalc && (
                    <div className="mt-4 bg-slate-950/90 border border-purple-500/40 rounded-2xl p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Guest / Table Name
                          </label>
                          <input
                            type="text"
                            value={posGuestName}
                            onChange={(e) => setPosGuestName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Gross Bill Amount (RM)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={posBillAmount}
                            onChange={(e) => setPosBillAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                          <input
                            type="checkbox"
                            checked={posUseCustomProfit}
                            onChange={(e) => setPosUseCustomProfit(e.target.checked)}
                            className="accent-purple-500"
                          />
                          Override exact nett profit manually
                        </label>
                        {posUseCustomProfit && (
                          <input
                            type="number"
                            min="0"
                            value={posCustomNettProfit}
                            onChange={(e) => setPosCustomNettProfit(e.target.value)}
                            placeholder="Exact Nett Profit (RM)"
                            className="w-40 bg-slate-900 border border-purple-500/50 rounded-lg px-2.5 py-1 text-xs font-mono text-white outline-none"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
                        <div className="bg-slate-900 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Guest -{posResult.ba.guestDiscountPct}%</p>
                          <p className="text-xs font-black text-rose-300">-RM {posBaCalc.discountAmt.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Nett Bill</p>
                          <p className="text-xs font-black text-white">RM {posBaCalc.netBill.toFixed(2)}</p>
                        </div>
                        <div className="bg-slate-900 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-400">Bar Nett Profit</p>
                          <p className="text-xs font-black text-indigo-300">RM {posBaCalc.nettProfit.toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl p-2.5">
                          <p className="text-[10px] text-purple-200">
                            {posResult.ba.name.split(' ')[0]} ({posResult.ba.profitCutPct}%)
                          </p>
                          <p className="text-xs font-black text-amber-300">RM {posBaCalc.commission.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandatory Bottle Purchase Verification Gate for Free Ladies Drink */}
                  {posResult.valid && posResult.requiresBottle && !posResult.isCompleted && (
                    <div
                      className={`mt-4 rounded-2xl p-4 border transition ${
                        posBottleConfirmed
                          ? 'bg-emerald-950/60 border-emerald-500/50'
                          : 'bg-rose-950/40 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Wine
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            posBottleConfirmed ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-wider text-white">
                            Mandatory Redemption Term — Bottle Purchase Check
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {posResult.terms ||
                              'Customer must purchase a minimum of 1 bottle to redeem the Free Ladies Drink.'}
                          </p>
                          <label className="mt-3 flex items-center gap-2.5 cursor-pointer select-none bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5">
                            <input
                              type="checkbox"
                              checked={posBottleConfirmed}
                              onChange={(e) => setPosBottleConfirmed(e.target.checked)}
                              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                            />
                            <span className="text-xs font-bold text-white">
                              Confirmed: Customer has ordered a minimum of 1 bottle on this tab
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {posResult.valid && !posResult.isCompleted && (
                    <button
                      type="button"
                      onClick={confirmRedemption}
                      disabled={Boolean(posResult.requiresBottle && !posBottleConfirmed)}
                      className={`mt-4 w-full font-black py-3.5 rounded-xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg ${
                        posResult.requiresBottle && !posBottleConfirmed
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none border border-slate-700'
                          : posResult.isBaCode
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-purple-500/25'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      {posResult.isBaCode ? (
                        <Receipt className="w-4 h-4" />
                      ) : posResult.requiresBottle ? (
                        <Wine className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>
                        {posResult.isBaCode
                          ? `Confirm Bill & Credit ${posResult.ba.name}`
                          : posResult.requiresBottle
                            ? posBottleConfirmed
                              ? 'Confirm Bottle Tab & Serve Free Ladies Drink'
                              : 'Tick Min. 1 Bottle Purchase Above to Unlock'
                            : 'Confirm Member Match & Lock Voucher'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Slide Lounge Footer */}
      <footer className="mt-16 text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
        <p>© 2026 Slide Bar & Lounge. Zero-Cost Customer Referral & Brand Ambassador Revenue-Share Platform.</p>
      </footer>
    </div>
  );
}
