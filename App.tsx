
import React, { useState, useMemo, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { translations } from './translations';
import { Service, Order, Language } from './types';
import LoginScreen from './screens/LoginScreen';
import ProfileSetup from './screens/ProfileSetup';
import HomeScreen from './screens/HomeScreen';
import ReelScreen from './screens/ReelScreen';
import TrendingScreen from './screens/TrendingScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductDetails from './screens/ProductDetails';
import MyOrdersScreen from './screens/MyOrdersScreen';
import BookingPage from './screens/BookingPage';
import OfferPage from './screens/OfferPage';
import NotificationsScreen from './screens/NotificationsScreen';
import ServiceManager from './src/admin/ServiceManager';
import OrderManager from './src/admin/OrderManager';
import UserManager from './src/admin/UserManager';
import ReelsManager from './src/admin/ReelsManager';
import PushNotificationService from './src/pushNotifications';
import { 
  Home as HomeIcon, 
  PlayCircle, 
  TrendingUp, 
  User, 
  Globe,
  ArrowLeft,
  Menu
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Mock services as fallback
const mockServices: Service[] = [
  {
    id: '1',
    name: { en: 'Luxury Spa', hi: 'लक्जरी स्पा' },
    features: { en: 'Body massage, Steam, Glow', hi: 'बॉडी मसाज, स्टीम, ग्लो' },
    time: '60 min',
    rate: '₹1500',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-getting-a-facial-massage-at-a-spa-32750-large.mp4',
    thumbnail: 'https://picsum.photos/seed/spa/400/600',
    category: 'Spa'
  },
  {
    id: '2',
    name: { en: 'House Cleaning', hi: 'घर की सफाई' },
    features: { en: 'Deep clean, Vacuuming, Sanitizing', hi: 'डीप क्लीन, वैक्यूमिंग, सैनिटाइजिंग' },
    time: '120 min',
    rate: '₹800',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-cleaning-glass-with-a-spray-and-rag-41618-large.mp4',
    thumbnail: 'https://picsum.photos/seed/clean/400/600',
    category: 'Cleaning'
  },
  {
    id: '3',
    name: { en: 'Makeup Artistry', hi: 'मेकअप आर्टिस्ट्री' },
    features: { en: 'Bridal, Party, Minimal', hi: 'ब्राइडल, पार्टी, मिनिमल' },
    time: '90 min',
    rate: '₹2500',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-applying-makeup-to-her-face-with-a-brush-34533-large.mp4',
    thumbnail: 'https://picsum.photos/seed/makeup/400/600',
    category: 'Makeup'
  }
];

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'pastel' | 'dark'>(() => (localStorage.getItem('theme') as any) || 'pastel');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true); // Track auth check in progress
  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    return localStorage.getItem('isNewUser') === 'true';
  });
  const [pendingBooking, setPendingBooking] = useState<boolean>(false);
  const [userPhone, setUserPhone] = useState<string>(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).phone : '';
  });
  const [activeTab, setActiveTab] = useState<'home' | 'reels' | 'trending' | 'profile'>('home');
  const [view, setView] = useState<'main' | 'product' | 'my-orders' | 'booking' | 'offers' | 'notifications' | 'security' | 'settings' | 'admin' | 'saved'>('main');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [orders, setOrders] = useState<Order[]>([
    { id: '101', serviceName: 'Luxury Spa', status: 'Done', date: '2023-10-01', rate: '₹1500' },
    { id: '102', serviceName: 'House Cleaning', status: 'Pending', date: '2023-10-05', rate: '₹800' }
  ]);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'services' | 'reels' | 'orders' | 'users'>('dashboard');
  const [adminShowServiceForm, setAdminShowServiceForm] = useState(false);
  const [adminShowReelForm, setAdminShowReelForm] = useState(false);
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const [adminServices, setAdminServices] = useState<any[]>([]);
  const [adminReels, setAdminReels] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [publicReels, setPublicReels] = useState<any[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<Array<{ view: string; activeTab: string }>>([]);
  const [playedOpeningSound, setPlayedOpeningSound] = useState<boolean>(() => {
    return localStorage.getItem('hasPlayedOpeningSound') === 'true';
  });

  const t = translations[lang];
  const isAdminUser = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.email === 'omrtalokar146@gmail.com' || user.role === 'admin';
    } catch {
      return false;
    }
  }, [isLoggedIn]);

  // Sync theme class
  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Check for persistent auth token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('✅ Token found in localStorage, restoring session...');
      setIsLoggedIn(true);
      setIsCheckingAuth(false);
    } else {
      console.log('⚠️ No token found, user needs to login');
      setIsLoggedIn(false);
      setIsCheckingAuth(false);
    }
  }, []);

  // Play opening sound on first app load and sync with animation
  useEffect(() => {
    if (isCheckingAuth === false && !playedOpeningSound) {
      const timer = setTimeout(() => {
        try {
          const audio = new Audio('/sounds/app-opening.mp3');
          audio.volume = 0.5; // 50% volume
          audio.play().catch(err => {
            console.log('🔇 Sound disabled or not available:', err);
          });
          setPlayedOpeningSound(true);
          localStorage.setItem('hasPlayedOpeningSound', 'true');
        } catch (err) {
          console.error('❌ Error playing opening sound:', err);
        }
      }, 100); // Small delay to ensure DOM is ready
      
      return () => clearTimeout(timer);
    }
  }, [isCheckingAuth, playedOpeningSound]);

  // Intercept browser back button to prevent app exit
  useEffect(() => {
    // Push initial state to history
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = () => {
      console.log('📱 Back button detected, navigating within app');
      handleBackNavigation();
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, view, navigationHistory]);

  // Fetch services from database on app load
  useEffect(() => {
    console.log('📦 Fetching services from database...');
    fetch(`${API_BASE}/api/admin/services-public`)
      .then(r => r.json())
      .then(services => {
        if (Array.isArray(services) && services.length > 0) {
          console.log('✅ Loaded', services.length, 'services from database');
          setDbServices(services);
        } else {
          console.warn('⚠️ No services available from database; leaving services empty (no mock data)');
          setDbServices([]);
        }
        setServicesLoaded(true);
      })
      .catch(err => {
        console.error('❌ Failed to load services:', err);
        // Do NOT fall back to mock data. Surface the error and expose empty services.
        setDbServices([]);
        setServicesLoaded(true);
      });
  }, []);

  // Pull latest server-side profile to get isOfferUsed/savedReels
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      const u = data.user || {};
      const localU = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
      localStorage.setItem('user', JSON.stringify({ ...localU, ...u }));
    }).catch(() => {});
  }, [isLoggedIn]);

  // Initialize push notifications when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      console.log('🔔 Initializing push notifications for user...');
      // Request permission on first login
      if (Notification.permission === 'default') {
        console.log('🔔 Showing notification permission popup...');
        PushNotificationService.registerForPushNotifications()
          .then(success => {
            if (success) {
              console.log('✅ Push notifications enabled successfully');
              // Send test notification to confirm
              setTimeout(() => {
                PushNotificationService.sendLocalNotification(
                  '🔔 Princess Parlor',
                  { 
                    body: 'Push notifications are now active! You will receive alerts for your bookings.',
                    sound: true,
                    vibrate: [100, 50, 100]
                  }
                ).catch(() => {});
              }, 500);
            }
          })
          .catch(err => console.error('❌ Error initializing push notifications:', err));
        // Start listening for messages from service worker
        try { PushNotificationService.listenForWorkerMessages(); } catch (e) {}
      } else if (Notification.permission === 'granted') {
        // Already permitted, just initialize
        PushNotificationService.initialize().catch(err => {
          console.error('❌ Error initializing push notifications:', err);
        });
      }
    }
  }, [isLoggedIn]);

  // Fetch public reels for the reels view
  useEffect(() => {
    fetch(`${API_BASE}/api/reels`).then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      if (Array.isArray(data)) setPublicReels(data);
    }).catch(() => {});
  }, []);

  // Load admin data when viewing admin panel
  useEffect(() => {
    if (view !== 'admin' || !isAdminUser) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    
    Promise.all([
      fetch(`${API_BASE}/api/admin/services`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/reels`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([services, reels, orders, users]) => {
      setAdminServices(Array.isArray(services) ? services : []);
      setAdminReels(Array.isArray(reels) ? reels : []);
      setAdminOrders(Array.isArray(orders) ? orders : []);
      setAdminUsers(Array.isArray(users) ? users : []);
    }).catch(() => {});
  }, [view, isAdminUser]);

  // Close admin sidebar on Escape key (mobile friendly)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && adminSidebarOpen) {
        setAdminSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [adminSidebarOpen]);

  const parsePrice = (str: string) => {
    const num = parseInt(str.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };
  const formatPrice = (num: number) => `₹${num}`;
  const getDisplayRate = (service: Service) => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    // only apply the one-time 20% offer when the user has no previous orders
    const isFirstTime = (typeof user.orderCount === 'number' ? user.orderCount === 0 : true);
    const claimed = !!user.isOfferClaimed && !user.isOfferUsed && isFirstTime;
    const hasServiceOffer = !!service.offerOn;
    const base = typeof service.baseRate === 'number' ? service.baseRate : parsePrice(service.rate);
    const final = hasServiceOffer || claimed ? Math.round(base * 0.8) : base;
    return formatPrice(final);
  };

  const handleLoginSuccess = (isNew: boolean = false) => {
    // Token should already be in localStorage from LoginScreen
    console.log('✅ Login successful, token is persisted in localStorage');
    setIsLoggedIn(true);
    setIsNewUser(isNew);
    if (isNew) {
      localStorage.setItem('isNewUser', 'true');
    } else {
      localStorage.removeItem('isNewUser');
    }
  };

  const handleProfileSetupComplete = () => {
    setIsNewUser(false);
    localStorage.removeItem('isNewUser');
    setActiveTab('home');
    if (pendingBooking) {
      setPendingBooking(false);
      setView('booking');
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    setIsLoggedIn(false);
    // Clear all auth-related data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isNewUser');
    sessionStorage.clear();
    // Redirect to home to show login screen
    setView('main');
    setActiveTab('home');
    setNavigationHistory([]); // Clear history on logout
  };

  // Handle back navigation - always goes to home first
  const handleBackNavigation = () => {
    console.log('🔙 Back button pressed');
    if (activeTab === 'reels') {
      // From reels → go to home
      setActiveTab('home');
      setView('main');
      setNavigationHistory([]);
    } else if (view !== 'main') {
      // From any other view → go back to main
      setView('main');
      setNavigationHistory(navigationHistory.slice(0, -1));
    } else if (activeTab !== 'home') {
      // Already in main view but not home tab → go to home
      setActiveTab('home');
      setNavigationHistory([]);
    }
    // Prevent default browser behavior
    window.history.pushState(null, '', window.location.href);
  };

  const handleServiceSelect = (service: Service) => {
    // Track clicks for trending
    const raw = localStorage.getItem('serviceClicks');
    const clicks = raw ? JSON.parse(raw) : {};
    clicks[service.id] = (clicks[service.id] || 0) + 1;
    localStorage.setItem('serviceClicks', JSON.stringify(clicks));
    setSelectedService(service);
    setView('product');
  };

  const handleBookingStart = () => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    if (!user || !user.phone) {
      setIsNewUser(true);
      setPendingBooking(true);
      return;
    }
    setView('booking');
  };

  const handleBookingConfirm = (newOrder: Partial<Order>) => {
    const token = localStorage.getItem('token');
    if (!token || !selectedService) {
      alert('Please login to make a booking');
      return;
    }

    const serviceId = (selectedService as any)._id || selectedService.id;
    const date = newOrder.date || new Date().toISOString().slice(0, 10);

    const bookingPayload = {
      serviceId,
      date,
      startHour: newOrder.startHour,
      endHour: newOrder.endHour,
    };

    console.log('🔄 Sending booking request to:', `${API_BASE}/api/bookings`);
    console.log('📦 Payload:', bookingPayload);

    // Send booking to backend
    fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingPayload)
    })
    .then(async res => {
      const data = await res.json();
      console.log('📬 Response status:', res.status);
      console.log('📬 Response data:', data);
      
      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 409) {
          // Slot conflict - another user booked it
          throw new Error('❌ Oops! Another user just booked this slot. Please refresh and select a different time.');
        } else if (res.status === 400) {
          throw new Error(data.error || 'Invalid booking request');
        } else {
          throw new Error(data.error || `Server error: ${res.status}`);
        }
      }
      return data;
    })
    .then(data => {
      console.log('✅ Booking received:', data);
      
      // Create local order record for UI
      const order: Order = {
        id: data._id || Math.random().toString(36).substr(2, 9),
        serviceName: selectedService?.name[lang] || 'Service',
        status: 'Pending',
        date: date,
        rate: selectedService?.rate || '₹0',
      };
      setOrders([order, ...orders]);
      
      // If discount was applied, mark offer used
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : {};
      const isFirstTime = (typeof user.orderCount === 'number' ? user.orderCount === 0 : true);
      const discounted = !!user.isOfferClaimed && !user.isOfferUsed && isFirstTime;
      if (discounted) {
        fetch(`${API_BASE}/api/auth/mark-offer-used`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
        user.isOfferUsed = true;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      alert('✅ Booking confirmed! Refresh Admin Panel Orders to see it');
      setView('my-orders');
    })
    .catch(err => {
      console.error('❌ Booking error:', err.message);
      alert('❌ Booking failed: ' + err.message);
    });
  };

  const renderContent = () => {
    // Show loading while checking auth
    if (isCheckingAuth) {
      return (
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 overflow-hidden">
          <style>{`
            @keyframes slideInDown {
              from {
                opacity: 0;
                transform: translateY(-40px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            @keyframes pulse-glow {
              0%, 100% {
                box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
              }
              50% {
                box-shadow: 0 0 40px rgba(236, 72, 153, 0.6);
              }
            }
            
            .app-logo-opening {
              animation: slideInDown 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), pulse-glow 1.2s ease-in-out 0.6s;
            }
            
            .loading-text {
              animation: slideInDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
            }
          `}</style>
          <div className="text-center space-y-4">
            <div className="app-logo-opening text-5xl font-black text-transparent bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text px-6 py-3">
              👑 Princess
            </div>
            <div className="loading-text text-slate-600 font-semibold">Loading your session...</div>
          </div>
        </div>
      );
    }
    
    // Show login screen if not logged in
    if (!isLoggedIn) {
      return <LoginScreen lang={lang} onLanguageChange={setLang} onLoginSuccess={handleLoginSuccess} />;
    }
    if (view === 'offers') {
      return <OfferPage lang={lang} />;
    }

    // Show profile setup if new user
    if (isNewUser) {
      return <ProfileSetup lang={lang} phone={userPhone} onSetupComplete={handleProfileSetupComplete} />;
    }

    if (view === 'product' && selectedService) {
      return <ProductDetails service={selectedService} lang={lang} onBook={handleBookingStart} displayRate={getDisplayRate(selectedService)} />;
    }
    if (view === 'my-orders') {
      return <MyOrdersScreen orders={orders} lang={lang} />;
    }
    if (view === 'booking' && selectedService) {
      return <BookingPage service={selectedService} lang={lang} onConfirm={handleBookingConfirm} getDisplayRate={getDisplayRate} />;
    }
    if (view === 'admin') {
      if (!isAdminUser) {
        return (
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
            <p className="text-slate-500 font-bold">You do not have admin privileges.</p>
          </div>
        );
      }
      return (
        <div className="relative w-full h-full flex flex-col bg-white">
          {/* Main Content - Always full width */}
          <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
            {/* Header with Navigation Tabs */}
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 flex-shrink-0">
              {/* Top Bar */}
              <div className="px-4 py-3 flex items-center gap-3">
                <h1 className="text-lg font-black text-slate-800 flex-1">
                  {adminTab === 'dashboard' ? '📊 Dashboard' : adminTab === 'services' ? '🛍️ Services' : adminTab === 'reels' ? '🎬 Reels' : adminTab === 'orders' ? '📦 Orders' : '👥 Users'}
                </h1>
              </div>
              
              {/* Tab Navigation */}
              <div className="px-2 py-2 flex gap-2 overflow-x-auto border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdminTab('dashboard')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    adminTab === 'dashboard'
                      ? 'bg-[#FFB7C5] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('services')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    adminTab === 'services'
                      ? 'bg-[#FFB7C5] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  🛍️ Services
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('reels')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    adminTab === 'reels'
                      ? 'bg-[#FFB7C5] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  🎬 Reels
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('orders')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    adminTab === 'orders'
                      ? 'bg-[#FFB7C5] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  📦 Orders
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('users')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                    adminTab === 'users'
                      ? 'bg-[#FFB7C5] text-white shadow-md'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  👥 Users
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto w-full">
              <div className="p-4 space-y-4 pb-24">
                {/* Dashboard Tab */}
                {adminTab === 'dashboard' && (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Services</div>
                      <div className="text-4xl font-black text-blue-600 mt-2">{adminServices.length}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-purple-50 to-white shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reels</div>
                      <div className="text-4xl font-black text-purple-600 mt-2">{adminReels.length}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-green-50 to-white shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Orders</div>
                      <div className="text-4xl font-black text-green-600 mt-2">{adminOrders.length}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-br from-yellow-50 to-white shadow-sm">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Users</div>
                      <div className="text-4xl font-black text-yellow-600 mt-2">{adminUsers.length}</div>
                    </div>
                  </div>
                )}

                {/* Services Tab */}
                {adminTab === 'services' && <ServiceManager showFormDefault={adminShowServiceForm} />}

                {/* Reels Tab */}
                {adminTab === 'reels' && <ReelsManager showFormDefault={adminShowReelForm} />}

                {/* Orders Tab */}
                {adminTab === 'orders' && <OrderManager />}

                {/* Users Tab */}
                {adminTab === 'users' && <UserManager />}
              </div>
            </div>

            {/* FAB Button - Services/Reels only */}
            {(adminTab === 'services' || adminTab === 'reels') && (
              <button 
                onClick={() => adminTab === 'services' ? setAdminShowServiceForm(v => !v) : setAdminShowReelForm(v => !v)}
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-[#FFB7C5] text-white shadow-xl flex items-center justify-center text-3xl font-black active:scale-95 hover:shadow-2xl transition-all z-20"
              >
                {(adminTab === 'services' ? adminShowServiceForm : adminShowReelForm) ? '✕' : '+'}
              </button>
            )}
          </div>
        </div>
      );
    }
    if (view === 'offers') {
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-black text-slate-800">{t.offers}</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-[30px] border-2 border-[#FFF9C4] bg-[#FFF9C4]/40">
              <p className="font-black text-slate-800">20% OFF on first booking</p>
              <p className="text-xs font-bold text-yellow-800/60 uppercase tracking-widest">Limited time</p>
            </div>
          </div>
        </div>
      );
    }
    if (view === 'services') {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : {};
      const customRaw = localStorage.getItem('customServices');
      const customServices: Service[] = customRaw ? JSON.parse(customRaw) : [];
      const allServices: Service[] = [...dbServices, ...customServices];
      const categories = Array.from(new Set(allServices.map(s => s.category || 'Other')));
      const [selectedCat] = [categories[0]];
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-black text-slate-800">Services</h2>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => {
                localStorage.setItem('selectedCategory', cat);
              }} className="px-3 py-2 rounded-[20px] border-2 border-slate-100 bg-white font-black text-sm active:scale-95">
                {cat}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {(allServices.filter(s => (localStorage.getItem('selectedCategory') || selectedCat) === (s.category || 'Other'))).map(s => (
              <div key={s.id} className="flex gap-3 bg-white p-3 rounded-[25px] border-2 border-slate-50 shadow-sm active:scale-[0.99]">
                <img src={s.thumbnail} className="w-20 h-20 rounded-[15px] object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/icons/icon-192.svg'; }} />
                <div className="flex-1">
                  <h4 className="font-black text-slate-800">{s.name[lang]}</h4>
                  <p className="text-slate-400 text-xs">{s.features[lang]}</p>
                </div>
                <button onClick={() => handleServiceSelect(s)} className="px-3 py-2 bg-[#FFB7C5] text-white rounded-[20px] font-black">Details</button>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (view === 'saved') {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : {};
      const savedIds: string[] = user.savedReels || [];
      const savedReels = publicReels ? publicReels.filter(r => savedIds.includes(r._id)) : [];
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-black text-slate-800">Saved Reels</h2>
          <div className="space-y-4">
            {!savedReels || savedReels.length === 0 ? (
              <p className="text-slate-400 font-bold">No saved reels yet</p>
            ) : (
              savedReels.map((r, idx) => {
                if (!r || !(r as any).videoUrl) return null;
                return (
                  <div 
                    key={r._id || idx} 
                    onClick={() => {
                      try {
                        console.log('✅ Saved Reel clicked:', r._id, 'videoUrl:', (r as any).videoUrl);
                        // Reorder publicReels to show clicked reel first
                        const reordered = [r, ...(publicReels || []).filter(reel => reel._id !== r._id)];
                        // Create a mini-service for ReelScreen
                        const reelServices: Service[] = reordered.map(reel => ({
                          id: reel._id,
                          name: { en: reel.description || 'Reel' },
                          features: { en: '' },
                          time: '0 min',
                          rate: '₹0',
                          videoUrl: (reel as any).videoUrl || '',
                          thumbnail: '',
                          likes: (reel as any).likes || 0,
                          views: (reel as any).views || 0
                        }));
                        console.log('📝 Storing reelServices:', reelServices.length, 'reels');
                        console.log('🎬 First reel:', reelServices[0]?.name);
                        // Store in sessionStorage and navigate
                        sessionStorage.setItem('reelServices', JSON.stringify(reelServices));
                        console.log('🔄 Navigating to reels tab...');
                        setActiveTab('reels');
                      } catch (e) {
                        console.error('❌ Error in saved reel click:', e);
                      }
                    }} 
                    className="flex gap-4 bg-white p-4 rounded-[30px] border-2 border-slate-50 shadow-sm cursor-pointer hover:shadow-lg hover:border-[#FFB7C5] transition-all active:scale-[0.98]"
                  >
                    <video src={(r as any).videoUrl} className="w-24 h-24 rounded-[20px] object-cover" />
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800">{r.description || 'Saved Reel'}</h4>
                      <p className="text-slate-400 text-sm">👁️ {(r as any).views || 0} • ❤️ {(r as any).likes || 0}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }
    if (view === 'notifications') {
      return <NotificationsScreen onClose={() => setView('main')} />;
    }
    if (view === 'security') {
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-black text-slate-800">Security</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-[25px] border-2 border-slate-100">Password change placeholder</div>
            <div className="p-4 rounded-[25px] border-2 border-slate-100">Two-factor auth placeholder</div>
          </div>
        </div>
      );
    }
    if (view === 'settings') {
      return (
        <div className="p-6 space-y-6">
          <h2 className="text-2xl font-black text-slate-800">Settings</h2>
          <div className="space-y-3">
            <div className="p-4 rounded-[25px] border-2 border-slate-100">Language: {lang === 'en' ? 'English' : 'हिन्दी'}</div>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'pastel' : 'dark')}
              className="p-4 rounded-[25px] border-2 border-slate-100 w-full text-left font-black"
            >
              Theme: {theme === 'dark' ? 'Dark' : 'Pastel'}
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        {
          const customRaw = localStorage.getItem('customServices');
          const customServices: Service[] = customRaw ? JSON.parse(customRaw) : [];
          const allServices: Service[] = [...dbServices, ...customServices];
          return <HomeScreen 
            lang={lang} 
            services={allServices} 
            onNavigate={(target) => setView(target)} 
            onServiceSelect={handleServiceSelect}
            getDisplayRate={getDisplayRate}
          />;
        }
      case 'reels':
        {
          // Check if user clicked a saved reel (sessionStorage has priority)
          const stored = sessionStorage.getItem('reelServices');
          let reelServices: Service[];
          if (stored) {
            reelServices = JSON.parse(stored);
            sessionStorage.removeItem('reelServices'); // clear after use
          } else {
            // Map public reels with COMPLETE service data into Service objects
            // The backend now returns full service data in each reel
            reelServices = (publicReels || []).map(r => {
              // Check if reel has complete service data from backend
              if (r.name && r.rate && r.time) {
                // Reel already has complete service data - use it directly
                return {
                  id: r._id || r.id,
                  name: r.name,
                  features: r.features || r.description,
                  time: r.time,
                  rate: r.rate,
                  baseRate: r.baseRate || 0,
                  durationMinutes: r.durationMinutes || 0,
                  videoUrl: r.videoUrl || '',
                  thumbnail: r.thumbnail || r.imageUrl || '',
                  description: r.description || r.features || '',
                  category: r.category || '',
                  imageUrl: r.imageUrl || '',
                  likes: r.likes || 0,
                  views: r.views || 0,
                  serviceId: r.serviceId || null,
                  offerOn: r.offerOn || false
                };
              } else {
                // Fallback for reels without complete data
                return {
                  id: r._id || r.id,
                  name: r.serviceName || { en: 'Service', hi: 'सेवा' },
                  features: r.description || { en: 'Loading...', hi: 'लोड हो रहा है...' },
                  time: '60 min',
                  rate: '₹0',
                  videoUrl: r.videoUrl || '',
                  thumbnail: r.thumbnail || '',
                  serviceId: r.serviceId || null,
                  baseRate: 0
                };
              }
            });
          }
          return <ReelScreen lang={lang} services={reelServices} onBook={handleServiceSelect} onBack={handleBackNavigation} onClose={() => setActiveTab('home')} getDisplayRate={getDisplayRate} />;
        }
      case 'trending':
        // Sort by click counts
        {
          const customRaw = localStorage.getItem('customServices');
          const customServices: Service[] = customRaw ? JSON.parse(customRaw) : [];
          const allServices: Service[] = [...dbServices, ...customServices];
          const rawClicks = localStorage.getItem('serviceClicks');
          const clicks = rawClicks ? JSON.parse(rawClicks) : {};
          const sorted = [...allServices].sort((a, b) => (clicks[b.id || b._id] || 0) - (clicks[a.id || a._id] || 0));
          return <TrendingScreen lang={lang} services={sorted} onSelect={handleServiceSelect} getDisplayRate={getDisplayRate} />;
        }
      case 'profile':
        return (
          <ProfileScreen 
            lang={lang} 
            onLogout={handleLogout}
            onViewAllOffers={() => setView('offers')}
            onNotifications={() => setView('notifications')}
            onSecurity={() => setView('security')}
            onSettings={() => setView('settings')}
            onAdminOpen={() => setView('admin')}
            onSavedOpen={() => setView('saved')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GoogleOAuthProvider clientId="468951644581-vg4g2h17p37qdq3o02aa8i5dlkb8krn8.apps.googleusercontent.com">
      <>
        {!isLoggedIn ? (
          // Full screen login
          renderContent()
        ) : (
          // Logged in app layout
          <div className={`max-w-md mx-auto h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white'} flex flex-col relative overflow-hidden shadow-2xl`}>
          {/* Top Navbar */}
          {(activeTab === 'reels' && view === 'main') ? null : (
          <div className={`px-6 py-4 flex items-center justify-between ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-md sticky top-0 z-50`}>
            <div className="flex items-center gap-2">
              {view !== 'main' && (
                <button 
                  onClick={() => setView('main')}
                  className="p-2 bg-[#E0F2F1] rounded-full text-slate-600 active:scale-90 transition-transform"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <h1 className="brand-heading navbar-brand font-extrabold tracking-tight">
                <span className="brand-pulse brand-glow"><span className="mr-2">👑</span>{view === 'main' ? 'Princess' : view === 'admin' ? 'Admin Panel' : t.serviceDetails}</span>
              </h1>
            </div>
            
            <button 
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-2 px-4 py-2 bg-[#FFF9C4] rounded-[30px] border-2 border-yellow-200 shadow-sm active:scale-95 transition-all"
            >
              <Globe size={18} className="text-yellow-700" />
              <span className="font-bold text-yellow-800 text-sm">{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>
          </div>
          )}

          {/* Main Area */}
          <div className={`flex-1 overflow-y-auto ${activeTab === 'reels' && view === 'main' ? '' : 'pb-24'} scroll-smooth`}>
            {renderContent()}
          </div>

          {/* Bottom Navigation */}
          {view === 'main' && activeTab !== 'reels' && (
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg border border-slate-100 rounded-[30px] p-3 flex justify-between items-center shadow-xl z-50">
              <NavItem 
                active={activeTab === 'home'} 
                onClick={() => setActiveTab('home')} 
                icon={<HomeIcon size={24} />} 
                label={t.home}
              />
              <NavItem 
                active={activeTab === 'reels'} 
                onClick={() => setActiveTab('reels')} 
                icon={<PlayCircle size={24} />} 
                label={t.reels}
              />
              <NavItem 
                active={activeTab === 'trending'} 
                onClick={() => setActiveTab('trending')} 
                icon={<TrendingUp size={24} />} 
                label={t.trending}
              />
              <NavItem 
                active={activeTab === 'profile'} 
                onClick={() => setActiveTab('profile')} 
                icon={<User size={24} />} 
                label={t.profile}
              />
            </div>
          )}
        </div>
      )}
      </>
    </GoogleOAuthProvider>
  );
};

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 px-4 py-1 rounded-[25px] ${active ? 'bg-[#FFB7C5] text-white scale-110 shadow-md' : 'text-slate-400'}`}
  >
    {icon}
    <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'block' : 'hidden'}`}>{label}</span>
  </button>
);

export default App;
