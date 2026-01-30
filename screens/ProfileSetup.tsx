import React, { useState } from 'react';
import { translations } from '../translations';
import { Language } from '../types';
import { Camera, User, Save, Mail } from 'lucide-react';

interface Props {
  lang: Language;
  onSetupComplete: (nickname: string, avatarUrl: string) => void;
}

const ProfileSetup: React.FC<Props> = ({ lang, onSetupComplete }) => {
  const t = translations[lang];
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://picsum.photos/seed/default/200/200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get user email from localStorage
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
  const userEmail = user.email || 'Unknown';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, use a placeholder. In production, upload to cloud storage
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetupComplete = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/auth/setup-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nickname,
          avatarUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        onSetupComplete(nickname, avatarUrl);
      } else {
        setError('Failed to setup profile. Please try again.');
      }
    } catch (err: any) {
      console.error('Error setting up profile:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-700">
        {/* Header */}
        <div className="text-center space-y-3 py-8">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            {lang === 'en' ? 'Welcome! 🎀' : 'स्वागत है! 🎀'}
          </h1>
          <p className="text-slate-500 font-bold">
            {lang === 'en' ? 'Complete your profile' : 'अपनी प्रोफाइल पूरी करें'}
          </p>
        </div>

        {/* Profile Setup Card */}
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[30px] border-2 border-slate-50 shadow-2xl space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-[20px] text-red-700 font-bold text-sm">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-pink-200 shadow-lg"
              />
              <label className="absolute bottom-2 right-2 p-3 bg-pink-400 rounded-full cursor-pointer shadow-md hover:bg-pink-500 transition-colors active:scale-90">
                <Camera size={20} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 font-bold">
              {lang === 'en' ? 'Click to upload profile picture' : 'प्रोफ़ाइल तस्वीर अपलोड करने के लिए क्लिक करें'}
            </p>
          </div>

          {/* Email Display */}
          <div className="p-4 bg-slate-50 rounded-[20px] border-2 border-slate-200 flex items-center gap-3">
            <Mail className="text-slate-400" size={20} />
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                {lang === 'en' ? 'Registered Email' : 'पंजीकृत ईमेल'}
              </p>
              <p className="text-sm font-black text-slate-800 break-all">{userEmail}</p>
            </div>
          </div>

          {/* Nickname Input */}
          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
              {lang === 'en' ? 'Your Nickname' : 'आपका निकनेम'}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-4 text-slate-400" size={20} />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={lang === 'en' ? 'Enter your name' : 'अपना नाम दर्ज करें'}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-[20px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
              />
            </div>
          </div>

          {/* Complete Setup Button */}
          <button
            onClick={handleSetupComplete}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-black rounded-[20px] shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {loading ? (lang === 'en' ? 'Setting up...' : 'सेटअप जारी है...') : (lang === 'en' ? 'Complete Setup' : 'सेटअप पूरा करें')}
          </button>

          {/* Info */}
          <div className="text-center text-xs text-slate-500 font-bold">
            {lang === 'en' 
              ? 'You can change this later in settings' 
              : 'आप बाद में सेटिंग्स में इसे बदल सकते हैं'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
