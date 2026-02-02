import React, { useEffect, useState } from 'react';
import { API_BASE, uploadFile, uploadFileWithProgress, apiCall } from '../api';

type ServiceItem = {
  _id: string;
  name: string;
  description: string;
  category?: string;
  imageUrl: string;
  videoUrl: string;
  durationMinutes: number;
  baseRate: number;
  offerOn: boolean;
};

const ServiceManager: React.FC<{ showFormDefault?: boolean }> = ({ showFormDefault }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [form, setForm] = useState<Omit<ServiceItem, '_id' | 'imageUrl' | 'videoUrl'> & { category: string }>({
    name: '',
    description: '',
    category: 'Waxing',
    durationMinutes: 60,
    baseRate: 0,
    offerOn: false
  });
  const token = localStorage.getItem('token');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceItem>>({});
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState<boolean>(!!showFormDefault);
  useEffect(() => { setShowForm(!!showFormDefault); }, [showFormDefault]);

  const load = async () => {
    if (!token) return;
    const r = await fetch(`${API_BASE}/api/admin/services`, { 
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    const d = await r.json();
    setServices(Array.isArray(d) ? d : []);
    try {
      const mapped = (Array.isArray(d) ? d : []).map((s: ServiceItem) => {
        const base = Math.round(s.baseRate || 0);
        const duration = Math.round(s.durationMinutes || 0);
        const finalRate = s.offerOn ? Math.round(base * 0.8) : base;
        return {
          id: s._id,
          name: { en: s.name, hi: s.name },
          features: { en: s.description || '', hi: s.description || '' },
          time: `${duration} min`,
          rate: `₹${finalRate}`,
          videoUrl: s.videoUrl || '',
          thumbnail: s.imageUrl || s.videoUrl || 'https://picsum.photos/seed/service/400/600',
          category: 'Admin',
          baseRate: base,
          offerOn: !!s.offerOn,
        };
      });
      localStorage.setItem('customServices', JSON.stringify(mapped));
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const uploadViaBackend = async (file: File) => {
    try {
      console.log('📤 Uploading file:', file.name, 'Size:', file.size);
      setIsUploading(true);
      setUploadProgress(0);
      const url = await uploadFileWithProgress(file, (p) => setUploadProgress(p));
      setUploadProgress(100);
      console.log('✅ Upload successful');
      return url;
    } catch (err) {
      console.error('❌ Upload error:', err);
      throw err;
    }
  };

  const addService = async () => {
    if (!token) return;
    let imageUrl = '';
    let videoUrl = '';
    try {
      if (imageFile) imageUrl = await uploadViaBackend(imageFile);
      if (videoFile) videoUrl = await uploadViaBackend(videoFile);
    } catch (e) {
      setIsUploading(false);
      setUploadProgress(0);
      return;
    } finally {
      setIsUploading(false);
    }
    const r = await fetch(`${API_BASE}/api/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, imageUrl, videoUrl }),
      credentials: 'include'
    });
    if (r.ok) {
      setForm({ name: '', description: '', category: 'Waxing', durationMinutes: 60, baseRate: 0, offerOn: false });
      setImageFile(null);
      setVideoFile(null);
      load();
    }
  };

  const toggleOffer = async (id: string, offerOn: boolean) => {
    if (!token) return;
    await fetch(`${API_BASE}/api/admin/services/${id}/toggle-offer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ offerOn }),
      credentials: 'include'
    });
    load();
  };

  const startEdit = (s: ServiceItem) => {
    setEditingId(s._id);
    setEditForm({ ...s });
    setEditImageFile(null);
    setEditVideoFile(null);
  };

  const saveEdit = async () => {
    if (!token || !editingId) return;
    let imageUrl = editForm.imageUrl || '';
    let videoUrl = editForm.videoUrl || '';
    try {
      if (editImageFile) imageUrl = await uploadViaBackend(editImageFile);
      if (editVideoFile) videoUrl = await uploadViaBackend(editVideoFile);
    } catch (e) {
      setIsUploading(false);
      setUploadProgress(0);
      return;
    } finally {
      setIsUploading(false);
    }
    const payload = { 
      name: editForm.name, 
      description: editForm.description, 
      durationMinutes: editForm.durationMinutes, 
      baseRate: editForm.baseRate, 
      offerOn: !!editForm.offerOn,
      imageUrl, 
      videoUrl 
    };
    await fetch(`${API_BASE}/api/admin/services/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    setEditingId(null);
    load();
  };

  const deleteService = async (id: string) => {
    if (!token) return;
    await fetch(`${API_BASE}/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    load();
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-black text-slate-800 truncate">Services</h3>
        <button onClick={() => setShowForm(v => !v)} className="px-3 py-2 bg-[#FFB7C5] text-white rounded-[15px] font-black active:scale-95 text-sm whitespace-nowrap">
          {showForm ? 'Close' : 'Add'}
        </button>
      </div>
      
      {showForm && (
        <div className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm">
          <div className="space-y-3">
            <input className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" placeholder="Service Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Category</label>
              <select className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option>Waxing</option>
                <option>Hair Cut</option>
                <option>Hair Style</option>
                <option>Polishing</option>
                <option>Bleach</option>
                <option>Makeup</option>
                <option>Facial</option>
                <option>Cleanup</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Price (₹)</label>
              <input className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" type="number" placeholder="0" value={form.baseRate} onChange={e => setForm({ ...form, baseRate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Duration (min)</label>
              <input className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-sm" type="number" placeholder="60" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Image</label>
              <input type="file" accept="image/*" className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-xs" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Video</label>
              <input type="file" accept="video/*" className="px-3 py-2.5 border border-slate-200 rounded-[12px] w-full text-xs" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
            </div>
            {isUploading && (
              <div className="w-full mb-2">
                <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                  <div className="h-2 bg-pink-400" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-xs text-slate-600 text-right mt-1">Uploading: {uploadProgress}%</div>
              </div>
            )}
            <button onClick={addService} className="w-full py-3 bg-[#FFB7C5] text-white font-black rounded-[12px] active:scale-95 text-sm">Submit</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Services ({services.length})</h4>
        {services.map(s => (
          <div key={s._id} className="p-4 rounded-2xl border border-slate-200 space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex gap-3">
              <img src={s.imageUrl || 'https://picsum.photos/seed/service/80/80'} className="w-16 h-16 rounded-[12px] object-cover flex-shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/service/80/80'; }} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-sm line-clamp-1">{s.name}</div>
                <div className="text-xs text-slate-500">₹{Math.round(s.baseRate)} • {Math.round(s.durationMinutes)}m</div>
                <label className="flex items-center gap-2 text-xs font-bold mt-1 text-slate-600">
                  <input type="checkbox" checked={s.offerOn} onChange={e => toggleOffer(s._id, e.target.checked)} className="w-3 h-3 rounded" />
                  <span>Offer 20%</span>
                </label>
              </div>
            </div>
            
            {editingId === s._id ? (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <input className="px-3 py-2 border border-slate-200 rounded-[10px] w-full text-sm" placeholder="Name" value={editForm.name as string} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                <textarea className="px-3 py-2 border border-slate-200 rounded-[10px] w-full text-sm" placeholder="Description" rows={2} value={editForm.description as string} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                <input className="px-3 py-2 border border-slate-200 rounded-[10px] w-full text-sm" type="number" value={Number(editForm.baseRate)} onChange={e => setEditForm({ ...editForm, baseRate: Number(e.target.value) })} />
                <input className="px-3 py-2 border border-slate-200 rounded-[10px] w-full text-sm" type="number" value={Number(editForm.durationMinutes)} onChange={e => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="flex-1 px-3 py-2.5 bg-[#FFB7C5] text-white rounded-[10px] font-black active:scale-95 text-xs">Save</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 px-3 py-2.5 bg-slate-100 text-slate-700 rounded-[10px] font-black active:scale-95 text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => startEdit(s)} className="flex-1 py-2.5 bg-[#E0F2F1] text-teal-700 rounded-[10px] font-black active:scale-95 text-xs">Edit</button>
                <button onClick={() => deleteService(s._id)} className="flex-1 py-2.5 bg-red-100 text-red-700 rounded-[10px] font-black active:scale-95 text-xs">Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceManager;
