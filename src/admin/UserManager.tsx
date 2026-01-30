import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      const r = await fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : []);
    };
    load();
  }, []);

  return (
    <div className="space-y-2 pb-24">
      {users.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">No users yet</div>
      ) : (
        users.map(u => (
          <div key={u._id} className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <img src={u.avatarUrl || 'https://picsum.photos/seed/u/50/50'} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-slate-200" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm truncate">{u.email || u.phone || 'Unknown'}</div>
                <div className="text-xs text-slate-500">{u.nickname || u.role || 'User'}</div>
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
          </div>
        ))
      )}
    </div>
  );
};

export default UserManager;
