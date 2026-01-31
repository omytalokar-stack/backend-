import React, { useEffect, useState } from 'react';
import { translations } from '../translations';
import { Language } from '../types';
import { Gift, CheckCircle, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  lang: Language;
}

const OfferPage: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  const [status, setStatus] = useState<'idle' | 'claiming' | 'active' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const updateLocalUserActive = () => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    user.isOfferActive = true;
    user.isOfferClaimed = true;
    localStorage.setItem('user', JSON.stringify(user));
  };

  const claim = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      updateLocalUserActive();
      setStatus('active');
      setMessage('Offer claimed locally (no token).');
      return;
    }
    try {
      setStatus('claiming');
      const res = await fetch(`${API_BASE}/api/auth/claim-offer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await res.json();
      console.log('📬 Claim offer response:', res.status, data);
      if (!res.ok) {
        if (res.status === 404) {
          updateLocalUserActive();
          setStatus('active');
          setMessage('Offer claimed locally (server route unavailable).');
          return;
        }
        setStatus('error');
        setMessage(data.error || `Failed to claim offer (${res.status})`);
        return;
      }
      updateLocalUserActive();
      setStatus('active');
      setMessage('Offer claimed. 20% OFF is active until first use.');
    } catch (e: any) {
      console.error('❌ Claim offer error:', e);
      setStatus('error');
      setMessage('Failed to claim offer: ' + e.message);
    }
  };

  useEffect(() => {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    if (!user.isOfferActive && !user.isOfferUsed) {
      claim();
    } else if (user.isOfferUsed) {
      setStatus('error');
      setMessage('Offer already used');
    } else {
      setStatus('active');
      setMessage('Offer already active');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-pink-100 rounded-[20px] text-pink-500">
          <Gift size={24} />
        </div>
        <h2 className="text-2xl font-black text-slate-800">{t.offers}</h2>
      </div>
      <div className="p-4 rounded-[25px] border-2 border-slate-100 space-y-3">
        <p className="font-bold text-slate-700">First-Time Offer: 20% OFF</p>
        <p className="text-sm text-slate-500 font-medium">Discount applies once on your next booking.</p>
        {status === 'active' && (
          <div className="flex items-center gap-2 text-teal-700 font-bold">
            <CheckCircle size={18} />
            <span>Offer is active on your account</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-yellow-700 font-bold">
            <AlertTriangle size={18} />
            <span>{message || 'Something went wrong'}</span>
          </div>
        )}
        {status !== 'active' && status !== 'claiming' && (
          <button 
            onClick={claim}
            className="w-full py-3 bg-[#FFB7C5] text-white font-black rounded-[25px] active:scale-95"
          >
            Claim 20% OFF
          </button>
        )}
        {status === 'claiming' && (
          <button className="w-full py-3 bg-[#FFB7C5]/60 text-white font-black rounded-[25px]" disabled>
            Claiming...
          </button>
        )}
      </div>
    </div>
  );
};

export default OfferPage;
