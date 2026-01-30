
import React, { useRef, useState } from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { Heart, MessageCircle, Bookmark, Gift, Play } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Props {
  lang: Language;
  services: Service[];
  onBook: (service: Service) => void;
  getDisplayRate?: (service: Service) => string;
}

const ReelScreen: React.FC<Props> = ({ lang, services, onBook, getDisplayRate }) => {
  const t = translations[lang];
  
  // Check for sessionStorage reels (from saved reels click)
  const sessionReels = typeof window !== 'undefined' ? sessionStorage.getItem('reelServices') : null;
  let reelsToShow = services || [];
  
  if (sessionReels) {
    try {
      const parsed = JSON.parse(sessionReels);
      reelsToShow = parsed;
      console.log('✅ Loaded', parsed.length, 'reels from sessionStorage');
    } catch (e) {
      console.error('❌ Failed to parse sessionStorage reels:', e);
    }
  } else {
    console.log('📝 Using prop services:', services?.length || 0, 'reels');
  }
  
  // Clear sessionStorage after reading (one-time use)
  React.useEffect(() => {
    if (sessionReels) {
      sessionStorage.removeItem('reelServices');
      console.log('🗑️ Cleared sessionStorage reelServices');
    }
  }, [sessionReels]);

  // Defensive: if reels data not available yet, show loading placeholder
  if (!reelsToShow || (Array.isArray(reelsToShow) && reelsToShow.length === 0)) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-white font-bold">Loading reels...</div>
      </div>
    );
  }

  const validReels = reelsToShow.filter(s => !!(s && (s as any).videoUrl));
  
  if (validReels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-white font-bold">No videos available</div>
      </div>
    );
  }

  return (
    <div className="h-full snap-y snap-mandatory overflow-y-auto no-scrollbar bg-black">
      {validReels.map((service, idx) => (
        <ReelItem key={`${(service as any)._id || service.id}-${idx}`} service={service} lang={lang} t={t} onBook={onBook} isActive={idx === 0} getDisplayRate={getDisplayRate} />
      ))}
    </div>
  );
};

const ReelItem: React.FC<{ service: Service; lang: Language; t: any; onBook: (s: Service) => void; isActive: boolean; getDisplayRate?: (service: Service) => string }> = ({ service, lang, t, onBook, isActive, getDisplayRate }) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<string[]>(() => {
    const raw = localStorage.getItem(`comments:${service.id}`);
    return raw ? JSON.parse(raw) : [];
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Pause video when this component is unmounted or when it becomes inactive
  React.useEffect(() => {
    if (isActive) {
      try { videoRef.current?.play(); } catch {}
    } else {
      try { videoRef.current?.pause(); } catch {}
    }
    return () => {
      try {
        if (videoRef.current) {
          videoRef.current.pause();
          // clear source to release memory
          videoRef.current.src = '';
        }
      } catch {}
    };
  }, [isActive]);

  const handleSaveReel = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        const res = await fetch(`${API_BASE}/api/reels/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reelId: service.id })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to save');
          return;
        }
        await Promise.resolve().then(() => {
          const userRaw = localStorage.getItem('user');
          const user = userRaw ? JSON.parse(userRaw) : {};
          user.savedReels = data.savedReels || [];
          localStorage.setItem('user', JSON.stringify(user));
        });
      } else {
        // Fallback: local-only
        const userRaw = localStorage.getItem('user');
        const user = userRaw ? JSON.parse(userRaw) : {};
        const current = Array.from(new Set([...(user.savedReels || [])]));
        if (current.length >= 15 && !current.includes(service.id)) {
          alert('Storage Full! 15 reels limit reached.');
          return;
        }
        const set = new Set([...current, service.id]);
        user.savedReels = Array.from(set);
        localStorage.setItem('user', JSON.stringify(user));
      }
      alert('Saved!');
    } catch {}
  };

  const handleAddComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    const next = [text, ...comments];
    setComments(next);
    localStorage.setItem(`comments:${service.id}`, JSON.stringify(next));
    setCommentInput('');
  };

  return (
    <div className="h-full w-full snap-start relative bg-black flex items-center justify-center">
      <video 
        ref={videoRef}
        src={service.videoUrl} 
        className="h-full w-full object-cover opacity-80"
        loop 
        autoPlay={isActive}
        controls
        playsInline
      />
      
      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

      {/* Interactions */}
      <div className="absolute right-2 bottom-20 flex flex-col gap-3 items-center">
        <InteractionButton 
          icon={<Heart size={24} fill={liked ? '#FFB7C5' : 'none'} className={liked ? 'text-[#FFB7C5]' : 'text-white'} />} 
          label={t.like}
          onClick={() => setLiked(!liked)}
        />
        <InteractionButton 
          icon={<MessageCircle size={24} className="text-white" />} 
          label={t.comment}
          onClick={() => setShowComments(true)}
        />
        <InteractionButton 
          icon={<Bookmark size={24} className="text-white" />} 
          label={t.save}
          onClick={handleSaveReel}
        />
        <InteractionButton 
          icon={<Gift size={24} className="text-yellow-400" />} 
          label={t.offers}
        />
      </div>

      {/* Info & CTA */}
      <div className="absolute bottom-10 left-6 right-20 space-y-4">
        <div className="space-y-1">
          <h3 className="text-white font-black text-2xl drop-shadow-lg">{typeof service.name === 'object' ? service.name[lang] : service.name}</h3>
          <p className="text-white/80 text-sm line-clamp-2 drop-shadow-md">{typeof service.features === 'object' ? service.features[lang] : service.features}</p>
          <div className="text-white/70 text-xs font-bold flex gap-3 mt-2">
            <span>👁️ {(service as any).views || 0} views</span>
            <span>❤️ {(service as any).likes || 0} likes</span>
          </div>
        </div>
        <button 
          onClick={() => onBook(service)}
          className="px-8 py-3 bg-[#FFB7C5] text-white font-black rounded-[30px] shadow-xl active:scale-95 transition-all flex items-center gap-2"
        >
          <Play size={18} fill="currentColor" />
          {t.bookNow} - {(getDisplayRate ? getDisplayRate(service) : (() => {
            const userRaw = localStorage.getItem('user');
            const user = userRaw ? JSON.parse(userRaw) : {};
            const base = typeof service.baseRate === 'number' ? service.baseRate : parseInt(service.rate.replace(/[^\d]/g, ''), 10);
            const isFirstTime = (typeof user.orderCount === 'number' ? user.orderCount === 0 : true);
            const discounted = service.offerOn || (user.isOfferActive && !user.isOfferUsed && isFirstTime);
            const price = discounted ? Math.round(base * 0.8) : base;
            return `₹${price}`;
          })())}
        </button>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[30px] border-t-4 border-slate-100 shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800">Comments</h4>
            <button onClick={() => setShowComments(false)} className="text-slate-400 font-bold">Close</button>
          </div>
          <div className="flex gap-2">
            <input 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-[20px]"
            />
            <button onClick={handleAddComment} className="px-4 py-2 bg-[#FFB7C5] text-white rounded-[20px] font-black active:scale-95">Post</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-slate-400 text-sm font-bold">No comments yet</p>
            ) : (
              comments.map((c, i) => (
                <div key={i} className="p-2 border-2 border-slate-100 rounded-[15px] text-slate-700">{c}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const InteractionButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 group active:scale-90 transition-transform">
    <div className="p-1 group-hover:scale-110 transition-transform drop-shadow-lg">
      {icon}
    </div>
    <span className="text-[10px] text-white font-bold uppercase tracking-widest drop-shadow-md">{label}</span>
  </button>
);

export default ReelScreen;
