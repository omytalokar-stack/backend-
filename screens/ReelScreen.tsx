
import React, { useRef, useState } from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { Heart, MessageCircle, Bookmark, Gift, Play, X, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  lang: Language;
  services: Service[];
  onBook: (service: Service) => void;
  onClose?: () => void;
  onBack?: () => void;
  getDisplayRate?: (service: Service) => string;
}

const ReelScreen: React.FC<Props> = ({ lang, services, onBook, onClose, onBack, getDisplayRate }) => {
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
    <div className="h-full snap-y-mandatory scroll-smooth overflow-y-scroll no-scrollbar bg-black relative" style={{ scrollBehavior: 'smooth', scrollSnapType: 'y mandatory' }}>
      {/* Navigation buttons */}
      <div className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center pointer-events-none">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2.5 rounded-full transition-all active:scale-95 pointer-events-auto"
            title="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2.5 rounded-full transition-all active:scale-95 pointer-events-auto ml-auto"
            title="Close reels"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      {validReels.map((service, idx) => (
        <ReelItem key={`${(service as any)._id || service.id}-${idx}`} service={service} lang={lang} t={t} onBook={onBook} getDisplayRate={getDisplayRate} />
      ))}
    </div>
  );
};

const ReelItem: React.FC<{ service: Service; lang: Language; t: any; onBook: (s: Service) => void; getDisplayRate?: (service: Service) => string }> = ({ service, lang, t, onBook, getDisplayRate }) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reelId = (service as any)._id || service.id;

  // Likes: show count and poll backend so admin changes reflect quickly
  const [likesCount, setLikesCount] = useState<number>((service as any).likes || 0);

  React.useEffect(() => {
    let mounted = true;
    const fetchMeta = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reels/${reelId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (typeof data.likes === 'number') setLikesCount(data.likes);
      } catch (e) {
        // ignore
      }
    };

    // Initial fetch + interval polling for admin-updated likes
    fetchMeta();
    const iv = setInterval(fetchMeta, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, [reelId]);

  // Fetch comments from backend when component mounts or when showComments changes
  React.useEffect(() => {
    if (showComments && reelId) {
      fetchComments();
    }
  }, [showComments, reelId]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`${API_BASE}/api/reels/${reelId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
        console.log(`✅ Loaded ${data.length} comments for reel ${reelId}`);
      }
    } catch (e) {
      console.error('❌ Error fetching comments:', e);
      // Fallback to empty array
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Use Intersection Observer to auto-play when 50%+ visible
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // At least 50% visible
          try {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
          } catch {}
        } else {
          // Less than 50% visible or out of view
          try {
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
            }
          } catch {}
        }
      },
      { threshold: [0.5] } // Trigger when 50% is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Handle unmute on user interaction
  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      try {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      } catch {}
    };
  }, []);

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

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text) return;

    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    const userName = user.name || 'User';

    try {
      const response = await fetch(`${API_BASE}/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text, userName })
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([newComment, ...comments]);
        setCommentInput('');
        console.log('✅ Comment posted successfully');
      } else {
        alert('Failed to post comment');
      }
    } catch (e) {
      console.error('❌ Error posting comment:', e);
      alert('Error posting comment');
    }
  };

  return (
    <div className="h-full w-full snap-start relative bg-black overflow-hidden" ref={containerRef} style={{ scrollSnapAlign: 'start' }}>
      {/* Video Container */}
      <div className="h-full w-full flex items-center justify-center bg-black relative">
        {/* Video Element - WITH AUTOPLAY, LOOP, MUTED */}
        {service.videoUrl ? (
          <video
            ref={videoRef}
            src={service.videoUrl}
            className="h-screen w-full object-cover"
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
            onLoadedMetadata={() => {
              console.log('✅ Video loaded:', service.videoUrl);
              if (videoRef.current) {
                videoRef.current.play().catch((e) => {
                  console.warn('⚠️ Autoplay blocked:', e);
                });
              }
            }}
            onError={(e) => {
              console.error('❌ Video load error:', e);
            }}
          />
        ) : (
          <div className="text-white font-bold text-center">No video available</div>
        )}

      {/* Right-side engagement vertical bar (icons + counts) */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-6 items-center z-30 pointer-events-auto">
        <button onClick={() => setLiked(!liked)} className="flex flex-col items-center gap-2">
          <Heart size={28} fill={liked ? '#FFB7C5' : 'none'} className={liked ? 'text-[#FFB7C5]' : 'text-white drop-shadow-lg'} />
          <span className="text-xs font-bold text-white drop-shadow-sm">{likesCount}</span>
        </button>

        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-2">
          <MessageCircle size={26} className="text-white drop-shadow-lg" />
          <span className="text-xs font-bold text-white drop-shadow-sm">{/* comments count not tracked here */}</span>
        </button>

        <button onClick={handleSaveReel} className="flex flex-col items-center gap-2">
          <Bookmark size={24} className="text-white drop-shadow-lg" />
          <span className="text-xs font-bold text-white drop-shadow-sm">{t.save}</span>
        </button>
      </div>

      {/* Left-side Title + Description + Prominent Book Now (no big black box, subtle gradient) */}
      <div className="absolute left-4 bottom-24 z-30 max-w-[62%] text-white pointer-events-auto">
        <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent p-3 rounded-xl backdrop-blur-sm">
          <h3 className="font-extrabold text-lg leading-tight drop-shadow-md">{(service as any).serviceName || (service as any).title || (service as any).name || (service as any).service || 'Service'}</h3>
          {service.description ? (
            <p className="mt-1 text-sm text-white/90 leading-snug drop-shadow-sm">{service.description}</p>
          ) : null}

          {(service as any).serviceId ? (
            <div className="mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); onBook(service); }}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-full font-extrabold text-white text-base shadow-lg hover:scale-[0.99] transition-transform"
                style={{ background: 'linear-gradient(90deg,#FF3CAC 0%, #FFD166 100%)' }}
                title={t.bookNow}
              >
                <Play size={18} className="inline-block" />
                {t.bookNow}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[30px] border-t-4 border-slate-100 shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-800">Comments ({comments.length})</h4>
            <button onClick={() => setShowComments(false)} className="text-slate-400 font-bold">Close</button>
          </div>
          <div className="flex gap-2">
            <input 
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-[20px]"
              disabled={loadingComments}
            />
            <button onClick={handleAddComment} className="px-4 py-2 bg-[#FFB7C5] text-white rounded-[20px] font-black active:scale-95" disabled={loadingComments}>Post</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {loadingComments ? (
              <p className="text-slate-400 text-sm font-bold">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-slate-400 text-sm font-bold">No comments yet. Be the first!</p>
            ) : (
              comments.map((c) => (
                <div key={c._id || c} className="p-3 border-2 border-slate-100 rounded-[15px] space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-700 text-sm">{c.userName || 'User'}</p>
                    <p className="text-xs text-slate-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                  <p className="text-slate-700 text-sm">{typeof c === 'string' ? c : c.text}</p>
                </div>
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
