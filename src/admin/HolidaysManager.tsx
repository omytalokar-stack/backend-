import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Holiday {
  _id?: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

const HolidaysManager: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/holidays`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Failed to fetch holidays:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const addHoliday = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/admin/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ date })
      });
      if (!res.ok) throw new Error(`Add failed ${res.status}`);
      const saved = await res.json();
      setHolidays(prev => [saved, ...prev]);
    } catch (e) {
      console.error('Failed to add holiday:', e);
      alert('Failed to add holiday');
    }
  };

  const removeHoliday = async (id?: string, dateVal?: string) => {
    try {
      const token = localStorage.getItem('token');
      const target = id ? `${API_BASE}/api/admin/holidays/${id}` : `${API_BASE}/api/admin/holidays?date=${encodeURIComponent(dateVal || '')}`;
      const res = await fetch(target, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(`Delete failed ${res.status}`);
      // Remove locally
      setHolidays(prev => prev.filter(h => (h._id ? h._id !== id : h.date !== dateVal)));
    } catch (e) {
      console.error('Failed to delete holiday:', e);
      alert('Failed to delete holiday');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-black mb-4">Manage Holidays</h2>

      <div className="flex gap-3 items-center mb-4">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2 rounded-lg border" />
        <button onClick={addHoliday} className="px-4 py-2 bg-[#FFB7C5] text-white rounded-lg font-bold">Add Holiday</button>
        <button onClick={fetchHolidays} className="px-3 py-2 bg-white border rounded-lg">Refresh</button>
      </div>

      <div>
        {loading ? (
          <div>Loading...</div>
        ) : holidays.length === 0 ? (
          <div className="text-slate-500">No holidays defined</div>
        ) : (
          <div className="space-y-2">
            {holidays.map(h => (
              <div key={h._id || h.date} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>{h.date}{h.note ? ` — ${h.note}` : ''}</div>
                <div className="flex gap-2">
                  <button onClick={() => removeHoliday(h._id, h.date)} className="px-3 py-1 bg-red-500 text-white rounded-lg">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidaysManager;
