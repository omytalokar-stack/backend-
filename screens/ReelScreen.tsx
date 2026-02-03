
import React, { useRef, useState } from 'react';
import { translations } from '../translations';
import { Service, Language } from '../types';
import { Heart, MessageCircle, Bookmark, Gift, Play, X, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Props {
  lang: Language;
  services: Service[];
  onBook: (service: Service) => void;
  onClose?: () => void;
  onBack?: () => void;
  getDisplayRate?: (service: Service) => string;
  globalIsMuted?: boolean; // Global mute state from App
  onMuteChange?: (isMuted: boolean) => void; // Callback to update global state
}

const ReelScreen: React.FC<Props> = ({ lang, services, onBook, onClose, onBack, getDisplayRate, globalIsMuted = true, onMuteChange }) => {
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
            className="bg-gray-800 hover:bg-gray-700 text-white p-2.5 rounded-full transition-all active:scale-95 pointer-events-auto"
            title="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2.5 rounded-full transition-all active:scale-95 pointer-events-auto ml-auto"
            title="Close reels"
          >
            <X size={24} />
          </button>
        )}
      </div>
      
      {validReels && validReels.length > 0 ? (
        validReels.map((service, idx) => (
          <ErrorBoundary key={`${(service as any)._id || service.id}-${idx}`}>
            <ReelItem service={service} lang={lang} t={t} onBook={onBook} getDisplayRate={getDisplayRate} globalIsMuted={globalIsMuted} onMuteChange={onMuteChange} />
          </ErrorBoundary>
        ))
      ) : (
        <div className="h-screen w-full snap-start flex items-center justify-center bg-gradient-to-b from-pink-100 to-blue-100">
          <div className="text-center px-6">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">{lang === 'hi' ? 'कोई रील नहीं' : 'No Reels Yet'}</h2>
            <p className="text-gray-600 mb-6">{lang === 'hi' ? 'कुछ समय बाद फिर से आएं' : 'Check back later for new content'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-full font-bold active:scale-95"
            >
              {lang === 'hi' ? 'रीलोड करें' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Error Boundary to prevent full app crash when a Reel item throws
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('Reel ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="font-bold">Something went wrong with this reel.</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ReelItem: React.FC<{ service: Service; lang: Language; t: any; onBook: (s: Service) => void; getDisplayRate?: (service: Service) => string; globalIsMuted?: boolean; onMuteChange?: (isMuted: boolean) => void }> = ({ service, lang, t, onBook, getDisplayRate, globalIsMuted = true, onMuteChange }) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [isMuted, setIsMuted] = useState(globalIsMuted); // Initialize with global state
  const [isPlaying, setIsPlaying] = useState(true); // Manual play/pause state - default: auto-play
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reelId = (service as any)._id || service.id;
  const [userLiked, setUserLiked] = useState(false);
  const [commentCount, setCommentCount] = useState<number>(() => {
    try {
      const base = (service as any).commentsCount || (service as any).comments?.length || 0;
      const local = JSON.parse(localStorage.getItem('localReelComments') || '{}');
      const localForThis = Array.isArray(local[reelId]) ? local[reelId].length : 0;
      return base + localForThis;
    } catch {
      return (service as any).commentsCount || (service as any).comments?.length || 0;
    }
  });

  // Helper to safely localize fields that may be strings or { en, hi } objects
  const localizeField = (field: any) => {
    if (field == null) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object') {
      try {
        return field[lang] || field.en || Object.values(field)[0] || '';
      } catch {
        return '';
      }
    }
    return String(field);
  };

  // Likes: show count and poll backend so admin changes reflect quickly
  const [likesCount, setLikesCount] = useState<number>(() => {
    try {
      let base = (service as any).likes || 0;
      const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
      if (localLikes[reelId]) base += 1; // reflect local-only like in count
      return base;
    } catch {
      return (service as any).likes || 0;
    }
  });

  React.useEffect(() => {
    let mounted = true;
    let iv: NodeJS.Timeout | null = null;
    
    const fetchMeta = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/reels/${reelId}`);
        if (!res.ok) {
          // Silently skip on 404 or other errors - don't block user interactions
          console.warn(`⚠️ Failed to fetch reel metadata (${res.status})`);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        if (typeof data.likes === 'number') {
          // If user has a local-only like, ensure UI reflects it by adding 1
          try {
            const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
            const localLiked = !!localLikes[reelId];
            setLikesCount(localLiked ? data.likes + 1 : data.likes);
            if (localLiked) setUserLiked(true);
          } catch {
            setLikesCount(data.likes);
          }
        }
      } catch (e) {
        // Silently ignore network errors - polling will retry
        console.debug('Network poll skipped:', e);
      }
    };

    // Initial fetch + interval polling for admin-updated likes
    fetchMeta();
    iv = setInterval(fetchMeta, 5000);
    return () => { mounted = false; if (iv) clearInterval(iv); };
  }, [reelId]);

  // Initialize userLiked from local storage (persist local-only likes across navigation)
  React.useEffect(() => {
    try {
      const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
      if (localLikes[reelId]) setUserLiked(true);
    } catch {
      // ignore
    }
  }, [reelId]);

  // Fetch comments from backend when component mounts or when showComments changes
  React.useEffect(() => {
    if (showComments && reelId) {
      setComments([]); // Clear old comments immediately
      fetchComments();
    } else {
      // Clear comments when closing the comment sheet
      setComments([]);
      setCommentInput('');
    }
  }, [showComments, reelId]);

  const fetchComments = async () => {
    if (!reelId) {
      setComments([]);
      setLoadingComments(false);
      return;
    }
    
    setLoadingComments(true);
    try {
      const response = await fetch(`${API_BASE}/api/reels/${reelId}/comments`);
      if (response.ok) {
        const data = await response.json();
        const safeComments = Array.isArray(data) ? data : [];
        // Ensure all comments belong to this reel
        const filtered = safeComments.filter((c: any) => c.reelId === reelId);
        // Merge with any locally-stored comments (unsynced)
        let merged = filtered.slice();
        try {
          const localStore = JSON.parse(localStorage.getItem('localReelComments') || '{}');
          const localForThis = Array.isArray(localStore[reelId]) ? localStore[reelId] : [];
          // Prepend local comments that aren't duplicates
          localForThis.forEach((lc: any) => {
            if (!merged.find((m: any) => m._id === lc._id)) merged.unshift(lc);
          });
        } catch (e) {
          // ignore local storage parse errors
        }
        setComments(merged);
        setCommentCount(merged.length);
        console.log(`✅ Loaded ${merged.length} comments for reel ${reelId}`);
      } else {
        // On error (404, 500, etc), gracefully show local comments only
        console.warn(`⚠️ Failed to fetch comments (${response.status}) - showing local only`);
        try {
          const localStore = JSON.parse(localStorage.getItem('localReelComments') || '{}');
          const localForThis = Array.isArray(localStore[reelId]) ? localStore[reelId] : [];
          setComments(localForThis);
          setCommentCount(localForThis.length);
        } catch {
          setComments([]);
          setCommentCount(0);
        }
      }
    } catch (e) {
      console.error('❌ Error fetching comments:', e);
      // On network error, show local comments if available
      try {
        const localStore = JSON.parse(localStorage.getItem('localReelComments') || '{}');
        const localForThis = Array.isArray(localStore[reelId]) ? localStore[reelId] : [];
        setComments(localForThis);
        setCommentCount(localForThis.length);
      } catch {
        setComments([]);
        setCommentCount(0);
      }
    } finally {
      setLoadingComments(false);
    }
  };

  // AGGRESSIVE: Use 80% visibility threshold + Hard Stop for off-screen reels
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log(`👀 Reel visibility: ${Math.round(entry.intersectionRatio * 100)}%`);
        
        // ONLY play if 80%+ visible AND not manually paused
        if (entry.isIntersecting && entry.intersectionRatio >= 0.8 && isPlaying) {
          console.log('✅ 80%+ visible + user wants to play → AUTO-PLAY');
          try {
            if (videoRef.current) {
              videoRef.current.muted = globalIsMuted;
              videoRef.current.play().catch(err => {
                console.warn('⚠️ Autoplay blocked:', err);
              });
            }
          } catch (e) {
            console.error('❌ Play error:', e);
          }
        } else if (!entry.isIntersecting || entry.intersectionRatio < 0.8) {
          // HARD STOP: Less than 80% visible → KILL audio immediately
          console.log('🛑 <80% visible or out of view → HARD STOP');
          try {
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0;
              console.log(`💀 Killed reel audio at ${Math.round(entry.intersectionRatio * 100)}%`);
            }
          } catch (e) {
            console.error('❌ Stop error:', e);
          }
        }
      },
      { threshold: [0.2, 0.5, 0.8, 1.0] } // Monitor all thresholds for aggressive control
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isPlaying, globalIsMuted]);

  // Manual Play/Pause Toggle on User Click
  const handleVideoClick = () => {
    if (videoRef.current) {
      const newPlayState = !isPlaying;
      setIsPlaying(newPlayState);
      
      if (newPlayState) {
        // User clicked to play
        videoRef.current.muted = globalIsMuted;
        videoRef.current.play().catch(err => {
          console.warn('⚠️ Manual play blocked:', err);
        });
        console.log('▶️ User clicked to PLAY');
      } else {
        // User clicked to pause
        videoRef.current.pause();
        console.log('⏸️ User clicked to PAUSE');
      }
    }
  };

  // Auto-start on first mount (default isPlaying=true for auto-play)
  React.useEffect(() => {
    setIsPlaying(true);
    console.log('🎬 Reel mounted → Auto-play enabled');
  }, [service.id]);

  // Handle toggle mute/unmute on user interaction
  const handleUnmute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      // Update global mute state so all other reels follow
      if (onMuteChange) {
        onMuteChange(newMutedState);
      }
      console.log(`🔊 Audio ${newMutedState ? 'muted' : 'unmuted'} (global state updated)`);
    }
  };

  // Sync with global mute state when it changes
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = globalIsMuted;
      setIsMuted(globalIsMuted);
      console.log(`🔊 Synced to global mute state: ${globalIsMuted ? 'muted' : 'unmuted'}`);
    }
  }, [globalIsMuted]);

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

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    const newLiked = !userLiked;

    // Quick local update for snappy UI
    setUserLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (!token) {
      // Not authenticated - save locally
      try {
        const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
        localLikes[reelId] = newLiked;
        localStorage.setItem('localReelLikes', JSON.stringify(localLikes));
      } catch {}
      return;
    }

    // Authenticated - attempt to sync with backend
    try {
      const res = await fetch(`${API_BASE}/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ liked: newLiked })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.likes === 'number') setLikesCount(data.likes);
        // Remove any local-only like since server has canonical state
        try {
          const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
          if (localLikes && localLikes[reelId]) {
            delete localLikes[reelId];
            localStorage.setItem('localReelLikes', JSON.stringify(localLikes));
          }
        } catch {}
        console.log('✅ Like synced to server');
      } else {
        // On error, keep the like in local storage as fallback
        console.warn(`⚠️ Like sync failed (${res.status}) - saved locally`);
        try {
          const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
          localLikes[reelId] = newLiked;
          localStorage.setItem('localReelLikes', JSON.stringify(localLikes));
        } catch {}
      }
    } catch (e) {
      console.error('❌ Like error:', e);
      // Network error - persist locally
      try {
        const localLikes = JSON.parse(localStorage.getItem('localReelLikes') || '{}');
        localLikes[reelId] = newLiked;
        localStorage.setItem('localReelLikes', JSON.stringify(localLikes));
      } catch {}
    }
  };

  const handleSaveReel = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Save locally when not authenticated
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : {};
      const current = Array.from(new Set([...(user.savedReels || [])]));
      if (current.length >= 15 && !current.includes(reelId)) {
        alert('Storage Full! 15 reels limit reached.');
        return;
      }
      const set = new Set([...current, reelId]);
      user.savedReels = Array.from(set);
      localStorage.setItem('user', JSON.stringify(user));
      try { alert('Saved locally — reel not present on server'); } catch (e) {}
      return;
    }

    try {
      if (token) {
        const res = await fetch(`${API_BASE}/api/reels/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reelId: reelId })
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
        if (current.length >= 15 && !current.includes(reelId)) {
          alert('Storage Full! 15 reels limit reached.');
          return;
        }
        const set = new Set([...current, reelId]);
        user.savedReels = Array.from(set);
        localStorage.setItem('user', JSON.stringify(user));
      }
      alert('Saved!');
    } catch {}
  };

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text) return;

    setPostingComment(true);
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    const userName = user.name || 'User';
    // If user is not authenticated, save the comment locally so it survives navigation
    if (!token) {
      const localComment = {
        _id: `local-${Date.now()}`,
        reelId,
        text,
        userName,
        createdAt: new Date().toISOString()
      };
      try {
        const localStore = JSON.parse(localStorage.getItem('localReelComments') || '{}');
        localStore[reelId] = Array.isArray(localStore[reelId]) ? [localComment, ...localStore[reelId]] : [localComment];
        localStorage.setItem('localReelComments', JSON.stringify(localStore));
      } catch {}
      setComments(prev => [localComment, ...prev]);
      setCommentInput('');
      setCommentCount(c => c + 1);
      setPostingComment(false);
      try { alert('✅ Comment saved locally. Login to sync with server.'); } catch {}
      return;
    }

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
        setCommentCount(c => c + 1);
        console.log('✅ Comment posted successfully');
        alert('✅ Comment Added!');
      } else {
        // Fallback: save locally for 404 or other errors so user doesn't lose input
        console.warn('⚠️ Failed to post comment; saving locally');
        const localComment = {
          _id: `local-${Date.now()}`,
          reelId,
          text,
          userName,
          createdAt: new Date().toISOString()
        };
        try {
          const localStore = JSON.parse(localStorage.getItem('localReelComments') || '{}');
          localStore[reelId] = Array.isArray(localStore[reelId]) ? [localComment, ...localStore[reelId]] : [localComment];
          localStorage.setItem('localReelComments', JSON.stringify(localStore));
        } catch {}
        setComments(prev => [localComment, ...prev]);
        setCommentInput('');
        setCommentCount(c => c + 1);
        try { alert('✅ Comment saved locally. It will sync when possible.'); } catch {}
      }
    } catch (e) {
      console.error('❌ Error posting comment:', e);
      // Network error fallback: save locally
      const localComment = {
        _id: `local-${Date.now()}`,
        reelId,
        text,
        userName,
        createdAt: new Date().toISOString()
      };
      try {
        const localStore = JSON.parse(localStorage.getItem('localReelComments') || '{}');
        localStore[reelId] = Array.isArray(localStore[reelId]) ? [localComment, ...localStore[reelId]] : [localComment];
        localStorage.setItem('localReelComments', JSON.stringify(localStore));
      } catch {}
      setComments(prev => [localComment, ...prev]);
      setCommentInput('');
      setCommentCount(c => c + 1);
      try { alert('⚠️ Network error — comment saved locally'); } catch {}
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="h-full w-full snap-start relative bg-black overflow-hidden" ref={containerRef} style={{ scrollSnapAlign: 'start' }}>
      {/* Video Container */}
      <div className="h-full w-full flex items-center justify-center bg-black relative">
        {/* Video Element - WITH AUTOPLAY, LOOP, MUTED - SMART ORIENTATION WITH CONTAIN */}
        {service.videoUrl ? (
          <video
            ref={videoRef}
            src={service.videoUrl}
            className="h-screen w-full object-contain cursor-pointer"
            autoPlay={true}
            loop={true}
            muted={isMuted}
            playsInline={true}
            onClick={handleVideoClick}
            onLoadedMetadata={() => {
              console.log('✅ Video loaded:', service.videoUrl);
              if (videoRef.current && isPlaying) {
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

      {/* Mute/Unmute Button - Top Left */}
      <button
        onClick={handleUnmute}
        className="absolute top-20 left-6 z-40 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all active:scale-90 backdrop-blur-sm"
        title={isMuted ? 'Unmute audio' : 'Audio is playing'}
      >
        {isMuted ? (
          <VolumeX size={24} className="drop-shadow-lg" />
        ) : (
          <Volume2 size={24} className="drop-shadow-lg" />
        )}
      </button>

      {/* Right-side engagement vertical bar (icons + counts) - moved to bottom-right */}
      <div className="absolute right-6 bottom-[20vh] flex flex-col gap-8 items-center z-30 pointer-events-auto">
        <button onClick={handleLike} className="flex flex-col items-center gap-2 group transition-transform active:scale-90">
          <Heart size={30} fill={userLiked ? '#FF3CAC' : 'none'} className={`transition-all ${
            userLiked ? 'text-[#FF3CAC] drop-shadow-[0_0_12px_rgba(255,60,172,0.6)]' : 'text-white drop-shadow-lg'
          }`} />
          <span className="text-sm font-extrabold text-white drop-shadow-sm">{likesCount}</span>
        </button>

        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-2 group transition-transform active:scale-90">
          <MessageCircle size={28} className="text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          <span className="text-sm font-extrabold text-white drop-shadow-sm">{commentCount}</span>
        </button>

        <button onClick={handleSaveReel} className="flex flex-col items-center gap-2 group transition-transform active:scale-90">
          <Bookmark size={26} className="text-white drop-shadow-lg group-hover:scale-110 transition-transform" />
          <span className="text-sm font-extrabold text-white drop-shadow-sm">{t.save}</span>
        </button>
      </div>

      {/* Left-side Title + Description + Prominent Book Now (5-10% from bottom, NO BLUR) */}
      <div className="absolute left-4 right-20 bottom-8 z-30 max-w-[70%] text-white pointer-events-auto">
        <div className="bg-black/95 p-4 rounded-lg">
          <h3 className="font-black text-base leading-snug drop-shadow-lg">{localizeField((service as any).serviceName || (service as any).title || (service as any).name || (service as any).service) || 'Service'}</h3>
          {localizeField((service as any).description || (service as any).features) ? (
            <p className="mt-1 text-xs text-white/95 leading-tight drop-shadow-sm">{localizeField((service as any).description || (service as any).features)}</p>
          ) : null}

          {(service as any).serviceId ? (
            <div className="mt-2.5">
              <button
                onClick={(e) => { e.stopPropagation(); onBook(service); }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-extrabold text-white text-sm active:scale-95 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg,#FF3CAC 0%, #FFD166 100%)' }}
                title={t.bookNow}
              >
                <Play size={16} className="inline-block" />
                {t.bookNow}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      </div>

      {/* Comments Bottom Sheet (clean solid, NO BLUR) */}
      {showComments && (
        <ErrorBoundary>
          <>
            <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowComments(false)} />
            <div className="fixed inset-x-0 bottom-0 z-40 flex items-end justify-center">
              <div className="w-full max-w-3xl h-[60vh] bg-gray-900 border-t border-gray-700 rounded-t-3xl p-5 text-white shadow-2xl transform transition-transform">
                {/* drag handle */}
                <div className="w-14 h-1.5 bg-gray-700 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-black text-xl">Comments ({commentCount})</h4>
                  <button onClick={() => setShowComments(false)} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full text-sm font-bold transition-colors">Close</button>
                </div>

                <div className="h-[48vh] overflow-y-auto pb-24 space-y-3 pr-2">
                  {loadingComments ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pink-500 border-r-2 border-yellow-500 mb-4"></div>
                      <p className="text-white/60 text-sm font-bold">Loading comments...</p>
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-white/60 text-sm font-bold text-center py-8">✨ No comments yet. Be the first!</p>
                  ) : (
                    comments.map((c) => (
                      <CommentRow key={c._id || c.createdAt || Math.random()} c={c} />
                    ))
                  )}
                </div>

              {/* Input bar - SOLID STYLING, NO BLUR */}
              <div className="absolute left-0 right-0 bottom-0 max-w-3xl mx-auto px-5 py-4 bg-gray-900">
                <div className="flex gap-3 items-center bg-gray-800 rounded-full px-4 py-3 border border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-yellow-400 flex items-center justify-center font-bold text-sm flex-shrink-0 text-white">{(() => {
                    const u = (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null);
                    return u && u.name ? u.name.charAt(0).toUpperCase() : 'U';
                  })()}</div>
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent outline-none px-2 text-white placeholder-white/50"
                    disabled={loadingComments || postingComment}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !postingComment) handleAddComment(); }}
                  />
                  <button onClick={handleAddComment} disabled={loadingComments || postingComment || !commentInput.trim()} className="px-4 py-2 bg-gradient-to-r from-[#FF3CAC] to-[#FFD166] rounded-full font-extrabold text-white hover:shadow-lg disabled:opacity-50 transition-all flex-shrink-0">
                    {postingComment ? '⏳' : '✓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
        </ErrorBoundary>
      )}

      {/* CommentRow component (inline) */}
      
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

// Inline CommentRow component to render each comment with avatar, user name, time-ago, text, and like
const CommentRow: React.FC<{ c: any }> = ({ c }) => {
  const [liked, setLiked] = useState<boolean>(false);
  const created = c && c.createdAt ? new Date(c.createdAt) : null;

  const timeAgo = (d: Date | null) => {
    if (!d) return '';
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  const userInitial = (c && c.userName) ? c.userName.charAt(0).toUpperCase() : 'U';
  const commentText = typeof c === 'string' ? c : c.text || '';

  return (
    <div className="flex gap-3 items-start p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF3CAC] to-[#FFD166] flex items-center justify-center font-bold text-sm flex-shrink-0">{userInitial}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{c.userName || 'User'}</div>
            <div className="text-xs text-white/50 mt-0.5">{timeAgo(created)}</div>
          </div>
          <button onClick={() => setLiked(!liked)} className={`p-1.5 rounded-full transition-all flex-shrink-0 ${
            liked ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
          }`}>
            <Heart size={16} fill={liked ? '#FF3CAC' : 'none'} className={liked ? 'text-[#FF3CAC]' : 'text-white/60'} />
          </button>
        </div>
        <div className="mt-2 text-white text-sm leading-snug break-words">{commentText}</div>
      </div>
    </div>
  );
};

export default ReelScreen;
