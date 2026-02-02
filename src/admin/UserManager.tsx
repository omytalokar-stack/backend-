import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { Phone } from 'lucide-react';

type UserItem = {
  _id: string;
  email?: string;
  phone?: string;
  role?: string;
  nickname?: string;
  avatarUrl?: string;
  isOfferClaimed?: boolean;
  isOfferUsed?: boolean;
};

const DEFAULT_CALLER_ID = '8767619160';

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const r = await fetch(`${API_BASE}/api/admin/users`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : []);
    };
    load();
  }, []);

  const handleCallNow = (userPhone?: string) => {
    const phoneToCall = userPhone || DEFAULT_CALLER_ID;
    // Clean phone number: remove all non-digit characters
    const cleanPhone = phoneToCall.replace(/\D/g, '');
    // Ensure it's at least 10 digits
    if (cleanPhone.length >= 10) {
      // Use tel: scheme to open native phone dialer
      window.location.href = `tel:+91${cleanPhone}`;
    } else {
      alert(`Invalid phone number: ${phoneToCall}`);
    }
  };

  return (
    <div className="space-y-2 pb-24">
      {users.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">No users yet</div>
      ) : (
        users.map(u => (
          <div key={u._id} className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <img src={u.avatarUrl || 'https://picsum.photos/seed/u/50/50'} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-slate-200" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/u/50/50'; }} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{u.email || u.phone || 'Unknown'}</div>
                <div className="text-xs text-slate-500">
                  {u.phone ? `📱 ${u.phone}` : 'No phone number'}
                </div>
                <div className="text-xs text-slate-400">{u.nickname || u.role || 'User'}</div>
              </div>
            </div>
            <div className="flex gap-2 text-xs pt-2 border-t border-slate-100">
              <span className={`px-2.5 py-1.5 rounded-[10px] font-bold flex-1 text-center ${u.isOfferClaimed ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                {u.isOfferClaimed ? '✓ Claimed' : 'Not Claimed'}
              </span>
              <span className={`px-2.5 py-1.5 rounded-[10px] font-bold flex-1 text-center ${u.isOfferUsed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {u.isOfferUsed ? '✓ Used' : 'Unused'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCallNow(u.phone)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-400 to-blue-500 text-white font-bold rounded-[15px] flex items-center justify-center gap-2 hover:shadow-lg active:scale-95 transition-all text-sm"
              >
                <Phone size={18} />
                📞 Call Now
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserManager;
