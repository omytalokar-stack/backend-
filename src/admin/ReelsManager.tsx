import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ReelItem = {
  id: string;
  videoUrl: string;
  description: string;
  pinnedComment?: string;
  replies?: string[];
};

const ReelsManager: React.FC<{ showFormDefault?: boolean }> = ({ showFormDefault }) => {
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [form, setForm] = useState({ videoUrl: '', description: '' });
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analyticsText, setAnalyticsText] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState<boolean>(!!showFormDefault);
  useEffect(() => { setShowForm(!!showFormDefault); }, [showFormDefault]);

  const load = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/admin/reels`, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        console.error('❌ Failed to fetch reels:', r.status);
        const raw = localStorage.getItem('adminReels');
        setReels(raw ? JSON.parse(raw) : []);
        return;
      }
      const d = await r.json();
      if (Array.isArray(d)) {
        console.log('✅ Reels loaded:', d.length);
        setReels(d.map((x: any) => ({ id: x._id || x.id, videoUrl: x.videoUrl || '', description: x.description || '', pinnedComment: x.pinnedComment || '', replies: Array.isArray(x.replies) ? x.replies : [], likes: x.likes || 0, views: x.views || 0 })));
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

  const saveLocal = (next: ReelItem[]) => {
    localStorage.setItem('adminReels', JSON.stringify(next));
    setReels(next);
  };

  const uploadVideo = async (file: File) => {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('file', file);
    console.log('📤 Uploading video file:', file.name, 'Size:', file.size);
    const r = await fetch(`${API_BASE}/api/admin/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token!}` },
      body: fd
    });
    const text = await r.text();
    console.log('Response status:', r.status, 'Body:', text);
    if (r.ok) {
      try {
        const d = JSON.parse(text);
        console.log('✅ Upload successful');
        return d.url as string;
      } catch (parseErr) {
        console.error('Failed to parse response:', parseErr);
        throw new Error('Invalid response format');
      }
    }
    throw new Error(`Upload failed: ${r.status} - ${text}`);
  };

  const addReel = async () => {
    let videoUrl = form.videoUrl;
    if (videoFile) {
      try {
        videoUrl = await uploadVideo(videoFile);
      } catch (e) {
        console.error('Upload failed:', e);
        return;
      }
    }
    if (!videoUrl) return;
    const token = localStorage.getItem('token');
    try {
      const r = await fetch(`${API_BASE}/api/admin/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
        body: JSON.stringify({ videoUrl, description: form.description })
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
        body: JSON.stringify({ replies: [...(reels.find(r => r.id === id)?.replies || []), text] })
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
      const r = await fetch(`${API_BASE}/api/admin/reels/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token!}` } });
      if (r.ok) {
        load();
        return;
      }
    } catch {}
    const next = reels.filter(r => r.id !== id);
    saveLocal(next);
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
        body: JSON.stringify({ description: desc, videoUrl })
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
        <h3 className="text-lg font-black text-slate-800 truncate">Reels</h3>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 bg-[#FFB7C5] text-white rounded-[15px] font-black active:scale-95 text-sm whitespace-nowrap">
          {showForm ? 'Close' : 'Add'}
        </button>
      </div>
      
      {showForm && (
        <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Video (MP4)</label>
              <input type="file" accept="video/*" className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-xs" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
            </div>
            <textarea className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button onClick={addReel} className="w-full py-3 bg-[#FFB7C5] text-white font-black rounded-[12px] active:scale-95 text-sm">Submit</button>
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
                  const res = await fetch(`${API_BASE}/api/admin/reels/${r.id}/likes`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` }, body: JSON.stringify({ likes: val }) });
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
    </div>
  );
};

export default ReelsManager;
