import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { API_BASE } from '../api';
import { Trash2, Phone, Bell, ArrowLeft } from 'lucide-react';

type BookingItem = {
  _id: string;
  userId: string;
  serviceId: string;
  date: string;
  startHour: number;
  endHour: number;
  status: string;
  customerName?: string;
  address?: string;
  totalPrice?: number;
  totalDuration?: string;
  userName?: string;
};
type ServiceItem = { _id: string; name: string };
type UserItem = { _id: string; email?: string; phone?: string; name?: string };

const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<BookingItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [view, setView] = useState<'list' | 'chart'>('list');
  const [chartServiceId, setChartServiceId] = useState('');
  const [chartDate, setChartDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailPageOrder, setDetailPageOrder] = useState<any>(null);
  const token = localStorage.getItem('token');

  const load = async () => {
    if (!token) return;
    try {
      console.log('📥 Fetching orders, services, users...');
      const r1 = await fetch(`${API_BASE}/api/admin/orders`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const r2 = await fetch(`${API_BASE}/api/admin/services`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const r3 = await fetch(`${API_BASE}/api/admin/users`, { 
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      if (!r1.ok) console.error('❌ Orders fetch failed:', r1.status);
      if (!r2.ok) console.error('❌ Services fetch failed:', r2.status);
      if (!r3.ok) console.error('❌ Users fetch failed:', r3.status);
      
      const d1 = r1.ok ? await r1.json() : [];
      const d2 = r2.ok ? await r2.json() : [];
      const d3 = r3.ok ? await r3.json() : [];
      
      console.log('✅ Orders:', Array.isArray(d1) ? d1.length : 0);
      console.log('✅ Services:', Array.isArray(d2) ? d2.length : 0);
      console.log('✅ Users:', Array.isArray(d3) ? d3.length : 0);
      
      setOrders(Array.isArray(d1) ? d1 : []);
      setServices(Array.isArray(d2) ? d2 : []);
      setUsers(Array.isArray(d3) ? d3 : []);
    } catch (e) {
      console.error('❌ Order fetch error:', e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cleanup = async () => {
    if (!token) return;
    await fetch(`${API_BASE}/api/admin/cleanup-orders`, { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include'
    });
    load();
  };

  const handleDelete = async (orderId: string) => {
    const ok = window.confirm('Are you sure you want to delete this order?');
    if (!ok) return;
    if (!token) return alert('❌ Not authenticated');
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        alert('✅ Order deleted');
        // Close modal if it was the selected booking
        if (selectedBooking && selectedBooking._id === orderId) setSelectedBooking(null);
        // Reload orders and refresh chart if visible
        await load();
        if (view === 'chart') {
          try { await loadChart(); } catch (e) { console.warn('Chart reload failed after delete', e); }
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown' }));
        alert('❌ Failed to delete order: ' + (err.error || res.statusText));
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('❌ Delete request failed');
    }
  };

  const loadChart = async () => {
    if (!chartServiceId || !chartDate || !token) {
      console.warn('⚠️ Missing: serviceId, date, or token');
      return;
    }
    try {
      console.log('📊 Loading chart for:', { serviceId: chartServiceId, date: chartDate });
      const url = `${API_BASE}/api/admin/booking-chart?serviceId=${chartServiceId}&date=${chartDate}`;
      console.log('🔗 API URL:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      if (!res.ok) {
        console.error('❌ Chart API error:', res.status, res.statusText);
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error details:', error);
        alert(`Error: ${error.error || res.statusText}`);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Chart data loaded:', data.slots?.length || 0, 'slots');
      console.log('📈 Chart response:', data);
      setChartData(data);
    } catch (e) {
      console.error('❌ Chart load error:', e);
      alert('Failed to load chart: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const nameByService = (id: string) => {
    const service = services.find(s => s._id === id);
    if (!service) return id;
    const svcName = (service && (service as any).name) || null;
    if (svcName && typeof svcName === 'object') return svcName.en || svcName.hi || 'Unknown';
    return svcName || id;
  };
  const userLabel = (id: string) => {
    const u = users.find(x => x._id === id);
    if (!u) return id;
    return u.email || u.phone || id;
  };
  const getCustomerDetails = (userId: string) => {
    const u = users.find(x => x._id === userId);
    return {
      name: u?.name || 'Unknown Customer',
      phone: u?.phone || 'No phone',
      email: u?.email || 'No email'
    };
  };
  const labelTime = (o: BookingItem) => {
    const convert24To12 = (hour: number) => {
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    };
    return `${convert24To12(o.startHour)}-${convert24To12(o.endHour)}`;
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      alert('📱 No phone number available');
      return;
    }
    
    // Remove any non-digit characters and clean up
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('❌ Invalid phone number');
      return;
    }
    
    // Trigger native call dialer with tel: protocol
    console.log('📞 Initiating call to:', cleanPhone);
    // Format: tel:+91XXXXXXXXXX for Indian numbers, or just tel:+CCNUMBER
    window.location.href = `tel:+91${cleanPhone}`;
  };

  const handleNotification = async (booking: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('❌ Not authenticated');
        return;
      }

      const message = 'Aap tayar ho jaiye, aapka service time aa gaya hai! Jaldi parlor mein aa jaiye. ✨';
      const title = `🔔 Service Alert - ${nameByService(booking.serviceId)}`;
      
      // Play notification sound and vibration locally for admin
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
        console.log('📳 Admin notification vibration sent');
      }

      // Create audio notification
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      const response = await fetch(`${API_BASE}/api/admin/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: booking.userId,
          bookingId: booking._id,
          message,
          title,
          notificationOptions: {
            body: message,
            icon: '/icons/icon-192.svg',
            badge: '/icons/icon-192.svg',
            tag: `booking-${booking._id}`,
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true
          }
        }),
        credentials: 'include'
      });

      if (response.ok) {
        // Play sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        alert(`✅ Notification sent to ${booking.userName}!`);
        setSelectedBooking(null);
      } else {
        alert('❌ Failed to send notification');
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Error sending notification');
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-3 pb-24 w-full max-w-full overflow-hidden px-2">
        <div className="flex justify-between items-center gap-2">
          <h3 className="text-base font-black text-slate-800 truncate flex-1">Orders ({orders.length})</h3>
          <div className="flex gap-1 flex-shrink-0">
            <button 
              onClick={() => setView(view === 'list' ? 'chart' : 'list')} 
              className="px-2 py-1.5 bg-teal-100 text-teal-700 rounded-[12px] font-black active:scale-95 text-xs whitespace-nowrap"
            >
              {view === 'list' ? '📊' : '📋'}
            </button>
            <button onClick={cleanup} className="px-2 py-1.5 bg-[#FFB7C5] text-white rounded-[12px] font-black active:scale-95 text-xs whitespace-nowrap">⚙️</button>
          </div>
        </div>

        {view === 'chart' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <h4 className="font-bold text-slate-800">Booking Chart</h4>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Service</label>
                  <select 
                    value={chartServiceId} 
                    onChange={(e) => setChartServiceId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[10px] text-sm"
                  >
                    <option value="">Select Service</option>
                    {services.map(s => (
                      <option key={s._id} value={s._id}>
                        {nameByService(s._id)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Date</label>
                  <input 
                    type="date" 
                    value={chartDate}
                    onChange={(e) => setChartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-[10px] text-sm"
                  />
                </div>
                <button 
                  onClick={loadChart}
                  className="w-full py-2.5 bg-teal-500 text-white font-bold rounded-[10px] active:scale-95"
                >
                  Load Chart
                </button>
              </div>
            </div>

            {chartData && (
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-bold text-slate-800">{chartData.serviceName} - {chartData.date}</h4>
                <div className="grid gap-2">
                  {chartData.slots?.map((slot: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => slot.booking && setSelectedBooking(slot.booking)}
                      className={`p-3 rounded-[12px] border-2 text-left transition-all ${
                        slot.status === 'Booked' 
                          ? 'border-red-300 bg-red-50 hover:shadow-md cursor-pointer' 
                          : 'border-green-300 bg-green-50'
                      }`}
                    >
                      <div className="font-bold text-sm">{slot.timeLabel}</div>
                      <div className={`text-xs font-bold ${slot.status === 'Booked' ? 'text-red-600' : 'text-green-600'}`}>
                        {slot.status === 'Booked' ? `✅ ${slot.booking.userName}` : '🟢 Free'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : detailPageOrder ? (
          // DETAIL PAGE VIEW
          <div className="space-y-4 pb-6 w-full">
            <button 
              onClick={() => setDetailPageOrder(null)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-[10px] text-sm active:scale-95"
            >
              <ArrowLeft size={16} />
              Back to Orders
            </button>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-lg space-y-5">
              {/* Customer Info - PROMINENT */}
              <div className="border-b border-slate-200 pb-4">
                <div className="text-3xl font-black text-slate-900">
                  {detailPageOrder.customerName || getCustomerDetails(detailPageOrder.userId).name}
                </div>
                <div className="text-2xl font-bold text-green-600 mt-1">📱 {getCustomerDetails(detailPageOrder.userId).phone}</div>
                <div className="text-xs text-slate-500 mt-2 font-bold">Order ID: {detailPageOrder._id.slice(-8).toUpperCase()}</div>
                <div className="text-xs text-slate-500 font-bold">{getCustomerDetails(detailPageOrder.userId).email}</div>
                
                {/* Address if present */}
                {detailPageOrder.address && (
                  <div className="text-sm font-bold text-slate-700 mt-3 p-3 bg-blue-50 rounded-[12px] border-l-4 border-blue-400">
                    📍 <span className="font-black">{detailPageOrder.address}</span>
                  </div>
                )}
              </div>

              {/* Service Details */}
              <div className="space-y-3">
                <div className="bg-indigo-50 p-3 rounded-[12px]">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Service</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{nameByService(detailPageOrder.serviceId)}</div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-teal-50 p-3 rounded-[12px]">
                    <div className="text-xs font-bold text-slate-500 uppercase">Date</div>
                    <div className="text-base font-black text-slate-800 mt-1">{new Date(detailPageOrder.date).toLocaleDateString()}</div>
                  </div>
                  <div className="bg-teal-50 p-3 rounded-[12px]">
                    <div className="text-xs font-bold text-slate-500 uppercase">Time</div>
                    <div className="text-base font-black text-slate-800 mt-1">{labelTime(detailPageOrder)}</div>
                  </div>
                </div>

                {/* Status */}
                <div className={`p-3 rounded-[12px] text-center ${detailPageOrder.status === 'Confirmed' ? 'bg-green-100' : detailPageOrder.status === 'Pending' ? 'bg-yellow-100' : 'bg-slate-100'}`}>
                  <div className="text-xs font-bold text-slate-500 uppercase">Status</div>
                  <div className={`text-lg font-black mt-1 ${detailPageOrder.status === 'Confirmed' ? 'text-green-600' : detailPageOrder.status === 'Pending' ? 'text-yellow-600' : 'text-slate-600'}`}>
                    {detailPageOrder.status === 'Confirmed' ? '✅' : detailPageOrder.status === 'Pending' ? '⏳' : '🔔'} {detailPageOrder.status}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-200 pt-5 space-y-3">
                <button 
                  onClick={() => handleNotification(detailPageOrder)}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-black rounded-[12px] flex items-center justify-center gap-2 active:scale-95 text-base transition-all"
                >
                  <Bell size={20} />
                  Send Notification
                </button>

                <button 
                  onClick={() => handleCall(getCustomerDetails(detailPageOrder.userId).phone)}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black rounded-[12px] flex items-center justify-center gap-2 active:scale-95 text-base transition-all"
                >
                  <Phone size={20} />
                  Call Customer
                </button>

                <button 
                  onClick={() => {
                    if (window.confirm('Delete this order?')) {
                      handleDelete(detailPageOrder._id);
                      setDetailPageOrder(null);
                    }
                  }}
                  className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-700 font-black rounded-[12px] active:scale-95 text-base transition-all"
                >
                  🗑️ Delete Order
                </button>
              </div>
            </div>
          </div>
        ) : (
          // LIST VIEW
          <div className="space-y-2 w-full">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No orders yet</div>
            ) : (
              orders.map(o => {
                const customer = getCustomerDetails(o.userId);
                return (
                  <div 
                    key={o._id} 
                    onClick={() => setDetailPageOrder(o)}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer active:scale-98 w-full overflow-hidden"
                  >
                    <div className="flex flex-col gap-3">
                      {/* Customer Name & Phone - LARGEST */}
                      <div>
                        <div className="text-2xl font-black text-slate-900 leading-tight">
                          {o.customerName || customer.name}
                        </div>
                        <div className="text-lg font-bold text-green-600 mt-0.5">📱 {customer.phone}</div>
                        {o.address && (
                          <div className="text-xs font-bold text-slate-600 mt-2">📍 {o.address}</div>
                        )}
                      </div>

                      {/* Service & Order ID - Small in corner */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-600 truncate">{nameByService(o.serviceId)}</div>
                          <div className="text-xs text-slate-400 truncate">Order: {o._id.slice(-6).toUpperCase()}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm flex-shrink-0 whitespace-nowrap ${o.status === 'Confirmed' ? 'bg-green-500' : o.status === 'Pending' ? 'bg-yellow-500' : 'bg-slate-400'}`}>{o.status}</span>
                      </div>
                      
                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">{labelTime(o)}</span>
                        <span className="text-slate-500 truncate">{new Date(o.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-[30px] p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800">Booking Details</h3>
                <button onClick={() => setSelectedBooking(null)} className="text-slate-400 font-bold text-2xl">×</button>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-[20px]">
                <div>
                  <p className="text-xs text-slate-500 font-bold">User</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.userName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">Service</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.serviceName || nameByService(selectedBooking.serviceId)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">Date & Time</p>
                  <p className="text-sm font-black text-slate-800">{selectedBooking.date} • {labelTime(selectedBooking)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCall(selectedBooking.userPhone)}
                  className="py-3 bg-green-500 text-white font-bold rounded-[15px] active:scale-95"
                >
                  📞 Call Now
                </button>
                <button
                  onClick={() => handleNotification(selectedBooking)}
                  className="py-3 bg-blue-500 text-white font-bold rounded-[15px] active:scale-95"
                >
                  🔔 Notify
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default OrderManager;
