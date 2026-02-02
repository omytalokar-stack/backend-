import React, { useEffect, useState } from 'react';
import { API_BASE, uploadFile, uploadFileWithProgress, apiCall } from '../api';

type ReelItem = {
  id: string;
  serviceId?: string | null;
  videoUrl: string;
  description: string;
  pinnedComment?: string;
  replies?: string[];
};

type CommentItem = {
  _id: string;
  reelId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

const ReelsManager: React.FC<{ showFormDefault?: boolean }> = ({ showFormDefault }) => {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [form, setForm] = useState({ videoUrl: '', description: '' });
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [analyticsText, setAnalyticsText] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState<boolean>(!!showFormDefault);
  const [uploadOnlyMode, setUploadOnlyMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'reels' | 'comments'>('reels');
  const [loadingComments, setLoadingComments] = useState(false);
  useEffect(() => { setShowForm(!!showFormDefault); }, [showFormDefault]);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/admin/reels`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (!r.ok) {
        console.error('❌ Failed to fetch reels:', r.status);
        const raw = localStorage.getItem('adminReels');
        setReels(raw ? JSON.parse(raw) : []);
        return;
      }
      const d = await r.json();
      if (Array.isArray(d)) {
        console.log('✅ Reels loaded:', d.length);
        setReels(d.map((x: any) => ({ id: x._id || x.id, serviceId: x.serviceId || null, videoUrl: x.videoUrl || '', description: x.description || '', pinnedComment: x.pinnedComment || '', replies: Array.isArray(x.replies) ? x.replies : [], likes: x.likes || 0, views: x.views || 0 })));
        localStorage.setItem('adminReels', JSON.stringify(d));
        return;
      }
    } catch (e) {
      console.error('❌ Reel fetch error:', e);
    }
    const raw = localStorage.getItem('adminReels');
    setReels(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    load();
  }, []);

  const loadAllComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Fetch comments for each reel
      const allComments: CommentItem[] = [];
      for (const reel of reels) {
        try {
          const response = await fetch(`${API_BASE}/api/reels/${reel.id}/comments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const reelComments = await response.json();
            allComments.push(...reelComments);
          }
        } catch (e) {
          console.error(`❌ Failed to fetch comments for reel ${reel.id}:`, e);
        }
      }
      setComments(allComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      console.log(`✅ Loaded ${allComments.length} comments from all reels`);
    } catch (e) {
      console.error('❌ Error loading comments:', e);
    } finally {
      setLoadingComments(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'comments' && comments.length === 0) {
      loadAllComments();
    }
  }, [activeTab]);

  const saveLocal = (next: ReelItem[]) => {
    localStorage.setItem('adminReels', JSON.stringify(next));
    setReels(next);
  };

  const uploadVideo = async (file: File) => {
    try {
      console.log('📤 Uploading video file:', file.name, 'Size:', file.size);
      setIsUploading(true);
      setUploadProgress(0);
      const url = await uploadFileWithProgress(file, (p) => setUploadProgress(p));
      console.log('✅ Upload successful');
      setUploadProgress(100);
      return url;
    } catch (err) {
      console.error('❌ Upload error:', err);
      throw err;
    }
  };

  const addReel = async () => {
    let videoUrl = form.videoUrl;
    if (videoFile) {
      try {
        videoUrl = await uploadVideo(videoFile);
      } catch (e) {
        console.error('Upload failed:', e);
        setIsUploading(false);
        setUploadProgress(0);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    if (!videoUrl) return;
    const token = localStorage.getItem('token');
    try {
      const payload: any = { videoUrl, description: form.description };
      if (uploadOnlyMode) payload.serviceId = null;

      const r = await fetch(`${API_BASE}/api/admin/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (r.ok) {
        setForm({ videoUrl: '', description: '' });
        setVideoFile(null);
        load();
        return;
      }
    } catch (e) {
      console.error('Post failed:', e);
    }
    const next = [{ id: Math.random().toString(36).slice(2), videoUrl, description: form.description, replies: [] }, ...reels];
    setForm({ videoUrl: '', description: '' });
    setVideoFile(null);
    saveLocal(next);
  };

  const pinComment = (id: string) => {
    const text = prompt('Enter pinned comment') || '';
    const next = reels.map(r => r.id === id ? { ...r, pinnedComment: text } : r);
    saveLocal(next);
  };

  const addReply = async (id: string) => {
    const text = replyText[id]?.trim();
    if (!text) return;
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API_BASE}/api/admin/reels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
        body: JSON.stringify({ replies: [...(reels.find(r => r.id === id)?.replies || []), text] }),
        credentials: 'include'
      });
      if (r.ok) {
        setReplyText({ ...replyText, [id]: '' });
        load();
        return;
      }
    } catch {}
    const next = reels.map(r => r.id === id ? { ...r, replies: [...(r.replies || []), text] } : r);
    saveLocal(next);
    setReplyText({ ...replyText, [id]: '' });
  };

  const removeReel = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API_BASE}/api/admin/reels/${id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token!}` },
        credentials: 'include'
      });
      if (r.ok) {
        load();
        return;
      }
    } catch {}
    const next = reels.filter(r => r.id !== id);
    saveLocal(next);
  };

  const deleteComment = async (commentId: string, reelId: string) => {
    if (!confirm('Delete this comment?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE}/api/reels/${reelId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token!}` }
      });
      if (response.ok) {
        const updated = comments.filter(c => c._id !== commentId);
        setComments(updated);
        console.log('✅ Comment deleted');
      } else {
        alert('Failed to delete comment');
      }
    } catch (e) {
      console.error('❌ Error deleting comment:', e);
      alert('Error deleting comment');
    }
  };

  const editReel = async (id: string) => {
    const target = reels.find(r => r.id === id);
    if (!target) return;
    const desc = prompt('Update description', target.description) ?? target.description;
    let videoUrl = target.videoUrl;
    if (videoFile) {
      videoUrl = await uploadVideo(videoFile);
      setVideoFile(null);
    }
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API_BASE}/api/admin/reels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
        body: JSON.stringify({ description: desc, videoUrl }),
        credentials: 'include'
      });
      if (r.ok) {
        load();
        return;
      }
    } catch {}
    const next = reels.map(r => r.id === id ? { ...r, description: desc, videoUrl } : r);
    saveLocal(next);
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('reels')}
            className={`px-4 py-2 rounded-[15px] font-black active:scale-95 text-sm ${activeTab === 'reels' ? 'bg-[#FFB7C5] text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            Reels ({reels.length})
          </button>
          <button 
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-[15px] font-black active:scale-95 text-sm ${activeTab === 'comments' ? 'bg-[#FFB7C5] text-white' : 'bg-slate-200 text-slate-700'}`}
          >
            Comments ({comments.length})
          </button>
        </div>
        {activeTab === 'reels' && (
          <div className="flex gap-2">
            <button onClick={() => { setUploadOnlyMode(false); setShowForm(v => !v); }} className="px-3 py-2 bg-[#FFB7C5] text-white rounded-[15px] font-black active:scale-95 text-sm whitespace-nowrap">
              {showForm && !uploadOnlyMode ? 'Close' : 'Add Reel'}
            </button>
            <button onClick={() => { setUploadOnlyMode(true); setShowForm(true); }} className="px-3 py-2 bg-[#FDE68A] text-slate-800 rounded-[15px] font-black active:scale-95 text-sm whitespace-nowrap">
              Upload Only Reel
            </button>
          </div>
        )}
      </div>
      
      {showForm && (
        <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Video (MP4)</label>
              <input type="file" accept="video/*" className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-xs" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
            </div>
            <textarea className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            {isUploading && (
              <div className="w-full">
                <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                  <div className="h-2 bg-pink-400" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-xs text-slate-600 text-right mt-1">Uploading: {uploadProgress}%</div>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={addReel} className="flex-1 py-3 bg-[#FFB7C5] text-white font-black rounded-[12px] active:scale-95 text-sm">Submit</button>
              {uploadOnlyMode && <div className="px-3 py-3 text-sm rounded-[12px] bg-yellow-100 text-yellow-800 font-black">Mode: Upload Only</div>}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Reels ({reels.length})</h4>
        {reels.map(r => (
          <div key={r.id} className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <video src={r.videoUrl} className="w-full h-32 rounded-[12px] object-cover bg-slate-900" controls />
            <div className="space-y-1">
              <div className="font-bold text-slate-800 text-sm line-clamp-2">{r.description || 'No description'}</div>
              {r.serviceId ? <div className="text-xs text-slate-500">Linked Service: {r.serviceId}</div> : <div className="text-xs text-amber-600 font-bold">Independent Reel</div>}
              {r.pinnedComment && <div className="text-xs text-slate-600 italic line-clamp-1">📌 {r.pinnedComment}</div>}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="text-xs text-slate-500">👁️ { (r as any).views || 0 }</div>
              <div className="text-xs text-slate-500">❤️ { (r as any).likes || 0 }</div>
              <input value={analyticsText[r.id] || ''} onChange={e => setAnalyticsText({ ...analyticsText, [r.id]: e.target.value })} placeholder="Set likes" className="ml-auto px-2 py-1 border rounded text-sm" />
              <button onClick={async () => {
                const val = parseInt(analyticsText[r.id] || '', 10);
                if (isNaN(val)) return alert('Enter numeric likes');
                const token = localStorage.getItem('token');
                try {
                  const res = await fetch(`${API_BASE}/api/admin/reels/${r.id}/likes`, { 
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` }, 
                    body: JSON.stringify({ likes: val }),
                    credentials: 'include'
                  });
                  if (res.ok) { load(); setAnalyticsText({ ...analyticsText, [r.id]: '' }); }
                  else { alert('Failed to update'); }
                } catch (e) { console.error(e); alert('Failed to update'); }
              }} className="px-3 py-1 bg-[#FFB7C5] text-white rounded text-sm">Set</button>
            </div>
            <div className="flex gap-2 flex-wrap pt-3 border-t border-slate-100">
              <button onClick={() => pinComment(r.id)} className="flex-1 min-w-[60px] py-2.5 bg-[#E0F2F1] text-teal-700 rounded-[10px] font-black active:scale-95 text-xs">Pin</button>
              <button onClick={() => editReel(r.id)} className="flex-1 min-w-[60px] py-2.5 bg-yellow-100 text-yellow-700 rounded-[10px] font-black active:scale-95 text-xs">Edit</button>
              <button onClick={() => removeReel(r.id)} className="flex-1 min-w-[60px] py-2.5 bg-red-100 text-red-700 rounded-[10px] font-black active:scale-95 text-xs">Delete</button>
            </div>
            <div className="flex gap-2">
              <input className="flex-1 px-3 py-2 border border-slate-200 rounded-[10px] text-sm" placeholder="Reply..." value={replyText[r.id] || ''} onChange={e => setReplyText({ ...replyText, [r.id]: e.target.value })} />
              <button onClick={() => addReply(r.id)} className="px-3 py-2 bg-[#FFB7C5] text-white rounded-[10px] font-black active:scale-95 text-xs">Send</button>
            </div>
            {r.replies && r.replies.length > 0 && (
              <div className="pt-3 mt-2 border-t border-slate-100 space-y-1">
                {r.replies.slice(-2).map((reply, i) => (
                  <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-[10px] line-clamp-1">💬 {reply}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">All Reel Comments ({comments.length})</h4>
          <div className="flex gap-2 mb-4">
            <button 
              onClick={loadAllComments} 
              className="px-4 py-2 bg-[#FFB7C5] text-white rounded-[10px] font-black active:scale-95 text-sm"
              disabled={loadingComments}
            >
              {loadingComments ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {comments.length === 0 ? (
            <div className="p-4 text-center text-slate-500 font-bold">No comments yet</div>
          ) : (
            comments.map(c => (
              <div key={c._id} className="p-4 rounded-2xl border border-slate-200 space-y-2 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{c.userName}</p>
                    <p className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button 
                    onClick={() => deleteComment(c._id, c.reelId)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-[8px] font-black active:scale-95 text-xs"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-slate-700">{c.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReelsManager;
