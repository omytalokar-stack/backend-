import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { translations } from '../translations';
import { Language } from '../types';
import { Globe } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (isNewUser: boolean) => void;
}

const LoginScreen: React.FC<Props> = ({ lang, onLanguageChange, onLoginSuccess }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch user info from Google using access token
  const handleGoogleLoginSuccess = async (response: any) => {
    setLoading(true);
    setError('');

    try {
      // useGoogleLogin returns { access_token, ... }
      const accessToken = response?.access_token;
      
      if (!accessToken) {
        throw new Error('No access token received from Google');
      }

      // Fetch user info from Google using access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();

      if (!userInfo.email || !userInfo.id) {
        throw new Error('Invalid user info from Google');
      }

      // Send to backend for verification/creation
      const payload = {
        email: userInfo.email,
        name: userInfo.name || 'User',
        picture: userInfo.picture || '',
        googleId: userInfo.id,
        idToken: accessToken
      };

      const response_backend = await fetch(`${API_BASE}/api/auth/verify-google`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response_backend.json();

      if (response_backend.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('googleEmail', data.user.email);
        sessionStorage.setItem('loggedIn', 'true');
        onLoginSuccess(data.isNewUser);
      } else {
        setError(data.error || 'Failed to login. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: (error) => {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
    },
    flow: 'implicit'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 flex flex-col items-center justify-center p-6">
      {/* Language Selector */}
      <button 
        onClick={() => onLanguageChange(lang === 'en' ? 'hi' : 'en')}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white rounded-[20px] border-2 border-yellow-200 shadow-md hover:shadow-lg transition-all"
      >
        <Globe size={18} className="text-yellow-600" />
        <span className="font-bold text-yellow-700">{lang === 'en' ? 'हिन्दी' : 'English'}</span>
      </button>

      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-700">
        {/* Logo Section */}
        <div className="text-center space-y-3 py-12">
          <div className="inline-block p-4 bg-gradient-to-br from-pink-100 to-teal-100 rounded-[30px] shadow-lg">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Princess</h1>
          <p className="text-slate-500 font-bold">{lang === 'en' ? 'Your beauty, our passion 💄' : 'आपकी सुंदरता, हमारा जुनून 💄'}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[30px] border-2 border-slate-50 shadow-2xl space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-[20px] text-red-700 font-bold text-sm">
              {error}
            </div>
          )}

          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <p className="text-sm font-black text-slate-700 uppercase tracking-wider">
              {lang === 'en' ? 'Welcome to Princess' : 'Princess में स्वागत है'}
            </p>
            <p className="text-xs text-slate-500 font-bold">
              {lang === 'en' ? 'Sign in with your Google account' : 'अपने Google खाते से साइन इन करें'}
            </p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={() => login()}
            disabled={loading}
            className="w-full py-4 bg-white border-2 border-slate-200 text-slate-800 font-black rounded-[20px] shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-slate-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? (lang === 'en' ? 'Signing in...' : 'साइन इन हो रहे हैं...') : (lang === 'en' ? 'Sign in with Google' : 'Google से साइन इन करें')}
          </button>

          {/* Info */}
          <div className="text-center text-xs text-slate-500 font-bold space-y-1">
            <p>{lang === 'en' ? 'We will create your account with your Google information' : 'हम आपकी Google जानकारी के साथ आपका खाता बनाएंगे'}</p>
            <p>{lang === 'en' ? 'No password needed - just one click!' : 'कोई पासवर्ड की जरूरत नहीं - बस एक क्लिक!'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 font-bold space-y-2">
          <p>{lang === 'en' ? 'By signing in, you agree to our' : 'साइन इन करके, आप हमारे सहमत हैं'}</p>
          <p className="text-slate-500">
            {lang === 'en' ? 'Terms & Conditions • Privacy Policy' : 'शर्तें और शर्तें • गोपनीयता नीति'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
