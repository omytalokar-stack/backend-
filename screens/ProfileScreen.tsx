
import React, { useEffect, useState } from 'react';
import { translations } from '../translations';
import { Language } from '../types';
import { Gift, Bell, Shield, Settings, LogOut, Camera, Edit2 } from 'lucide-react';

interface Props {
  lang: Language;
  onLogout?: () => void;
  onViewAllOffers?: () => void;
  onNotifications?: () => void;
  onSecurity?: () => void;
  onSettings?: () => void;
  onAdminOpen?: () => void;
  onSavedOpen?: () => void;
}

const ProfileScreen: React.FC<Props> = ({ lang, onLogout, onViewAllOffers, onNotifications, onSecurity, onSettings, onAdminOpen, onSavedOpen }) => {
  const t = translations[lang];
  const [profile, setProfile] = useState<{ nickname?: string; email?: string; avatarUrl?: string; name?: string; picture?: string }>({});
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    const fallbackUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
    setProfile({
      nickname: fallbackUser.nickname,
      email: fallbackUser.email,
      avatarUrl: fallbackUser.avatarUrl,
      name: fallbackUser.name,
      picture: fallbackUser.picture
    });
    if (token) {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed')))
      .then(data => {
        const u = data.user || {};
        setProfile({
          nickname: u.nickname || fallbackUser.nickname,
          email: u.email || fallbackUser.email,
          avatarUrl: u.avatarUrl || fallbackUser.avatarUrl,
          name: u.name || fallbackUser.name,
          picture: u.picture || fallbackUser.picture
        });
        // Sync local copy
        localStorage.setItem('user', JSON.stringify({ ...(fallbackUser || {}), ...u }));
      })
      .catch(() => {});
    }
  }, []);

  const handleSaveName = async () => {
    if (!editName.trim()) {
      alert('Name cannot be empty');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/auth/update-name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({ ...profile, name: data.user.name });
        const local = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
        local.name = data.user.name;
        localStorage.setItem('user', JSON.stringify(local));
        setShowEditName(false);
        alert('✅ Name updated successfully!');
      } else {
        alert('❌ Failed to update name');
      }
    } catch (err) {
      console.error('Error updating name:', err);
      alert('❌ Error updating name');
    }
  };

  const openEditModal = () => {
    setEditName(profile.name || '');
    setShowEditName(true);
  };

  const isAdmin = (() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.email === 'omrtalokar146@gmail.com' || user.role === 'admin';
    } catch {
      return false;
    }
  })();

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="relative">
          <img 
            src={profile.avatarUrl || profile.picture || 'https://picsum.photos/seed/user/200/200'} 
            alt="Profile" 
            className="w-32 h-32 rounded-full border-4 border-[#FFB7C5] shadow-xl object-cover"
          />
          <label className="absolute bottom-1 right-1 p-2 bg-[#E0F2F1] rounded-full shadow-md text-teal-700 active:scale-90 border-2 border-white cursor-pointer">
            <Camera size={18} />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const token = localStorage.getItem('token');
                  const body = JSON.stringify({ avatarUrl: reader.result });
                  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                  if (token) {
                    await fetch(`${API_BASE}/api/auth/setup-profile`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body
                    })
                    .then(r => r.ok ? r.json() : Promise.reject())
                    .then(d => {
                      const u = d.user || {};
                      setProfile({ ...profile, avatarUrl: (u.avatarUrl as string) || (reader.result as string) });
                      const local = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
                      local.avatarUrl = u.avatarUrl || reader.result;
                      localStorage.setItem('user', JSON.stringify(local));
                    })
                    .catch(() => {
                      setProfile({ ...profile, avatarUrl: reader.result as string });
                      const local = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
                      local.avatarUrl = reader.result;
                      localStorage.setItem('user', JSON.stringify(local));
                    });
                  } else {
                    setProfile({ ...profile, avatarUrl: reader.result as string });
                    const local = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : {};
                    local.avatarUrl = reader.result;
                    localStorage.setItem('user', JSON.stringify(local));
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        <div className="text-center space-y-1 flex items-center justify-center gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{profile.nickname || profile.name || 'User'}</h2>
            <p className="text-slate-400 font-bold">{profile.email || ''}</p>
          </div>
          <button 
            onClick={openEditModal}
            className="p-2 bg-pink-50 hover:bg-pink-100 rounded-full text-pink-500 transition-all active:scale-90"
            title="Edit Name"
          >
            <Edit2 size={16} />
          </button>
        </div>
      </div>

      {/* Offers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-black text-slate-800">{t.myOffers}</h3>
          <button 
            onClick={onViewAllOffers}
            className="text-pink-500 font-bold text-xs uppercase cursor-pointer active:scale-95"
          >
            View All
          </button>
        </div>
        <div className="bg-[#FFF9C4]/40 p-6 rounded-[30px] border-2 border-[#FFF9C4] flex items-center gap-6 relative overflow-hidden group">
          <div className="p-4 bg-white rounded-[20px] shadow-sm text-yellow-600 group-hover:rotate-12 transition-transform">
            <Gift size={32} />
          </div>
          <div className="space-y-1 relative z-10">
            <p className="font-black text-slate-800 text-lg leading-tight">First Service Free</p>
            <p className="text-xs font-bold text-yellow-800/60 uppercase tracking-widest">Valid till Dec 2023</p>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 text-yellow-600">
             <Gift size={100} />
          </div>
        </div>
        <button
          onClick={onSavedOpen}
          className="w-full py-4 bg-white border-2 border-slate-100 rounded-[30px] font-black text-slate-700 shadow-sm active:scale-95"
        >
          Saved Reels
        </button>
        {isAdmin && (
          <button
            onClick={onAdminOpen}
            className="w-full py-4 bg-[#FFB7C5] text-white font-black rounded-[30px] shadow-md active:scale-95"
          >
            Admin Panel
          </button>
        )}
      </div>

      {/* Menu Options */}
      <div className="bg-white rounded-[30px] border-2 border-slate-50 shadow-sm divide-y divide-slate-50 overflow-hidden">
        <MenuOption icon={<Bell size={20} className="text-pink-400" />} label="Notifications" onClick={onNotifications} />
        <MenuOption icon={<Shield size={20} className="text-teal-400" />} label="Security" onClick={onSecurity} />
        <MenuOption icon={<Settings size={20} className="text-slate-400" />} label="Settings" onClick={onSettings} />
        <MenuOption 
          icon={<LogOut size={20} className="text-red-400" />} 
          label="Logout" 
          onClick={onLogout}
          isLogout={true}
        />
      </div>

      {/* Edit Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[30px] p-6 w-full max-w-sm shadow-2xl animate-in fade-in scale-in">
            <h3 className="text-xl font-black text-slate-800 mb-4">✏️ Edit Your Name</h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-[20px] font-bold text-slate-800 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowEditName(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-[20px] active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="flex-1 py-3 bg-pink-400 text-white font-bold rounded-[20px] active:scale-95 transition-transform"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuOption: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; isLogout?: boolean }> = ({ icon, label, onClick, isLogout }) => (
  <button 
    onClick={onClick}
    className={`w-full px-6 py-4 flex items-center justify-between transition-all ${isLogout ? 'hover:bg-red-50 active:scale-[0.99]' : 'hover:bg-slate-50 active:scale-[0.99]'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-[15px] ${isLogout ? 'bg-red-50' : 'bg-slate-50'}`}>
        {icon}
      </div>
      <span className={`font-bold tracking-tight ${isLogout ? 'text-red-600' : 'text-slate-700'}`}>{label}</span>
    </div>
    <div className="w-2 h-2 rounded-full bg-slate-200" />
  </button>
);

export default ProfileScreen;
