
import React, { useState } from 'react';
import { translations } from '../translations';
import { Order, Language } from '../types';
import { CheckCircle2, Clock, Box } from 'lucide-react';

interface Props {
  orders: Order[];
  lang: Language;
}

const MyOrdersScreen: React.FC<Props> = ({ orders, lang }) => {
  const t = translations[lang];
  const [tab, setTab] = useState<'Pending' | 'Done'>('Pending');

  const filteredOrders = orders.filter(o => o.status === tab);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex gap-4 p-2 bg-slate-100 rounded-[30px]">
        <button 
          onClick={() => setTab('Pending')}
          className={`flex-1 py-3 rounded-[25px] font-black text-sm uppercase tracking-wider transition-all ${
            tab === 'Pending' ? 'bg-[#FFB7C5] text-white shadow-md' : 'text-slate-400'
          }`}
        >
          {t.pending}
        </button>
        <button 
          onClick={() => setTab('Done')}
          className={`flex-1 py-3 rounded-[25px] font-black text-sm uppercase tracking-wider transition-all ${
            tab === 'Done' ? 'bg-[#E0F2F1] text-teal-800 shadow-md' : 'text-slate-400'
          }`}
        >
          {t.done}
        </button>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 space-y-4 opacity-40">
            <Box size={60} className="mx-auto" />
            <p className="font-bold">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="bg-white p-6 rounded-[30px] border-2 border-slate-50 shadow-sm flex items-center justify-between group hover:border-[#FFB7C5]/30 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">#{order.id}</span>
                  <span className="text-xs font-bold text-slate-400">{order.date}</span>
                </div>
                <h4 className="font-black text-slate-800 text-lg">{order.serviceName}</h4>
                <div className="flex items-center gap-4">
                  <span className="text-pink-500 font-black">{order.rate}</span>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${tab === 'Done' ? 'text-teal-600' : 'text-yellow-600'}`}>
                    {tab === 'Done' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {tab === 'Done' ? t.done : t.pending}
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-[20px] transition-transform group-hover:rotate-12 ${tab === 'Done' ? 'bg-[#E0F2F1]' : 'bg-[#FFF9C4]'}`}>
                {tab === 'Done' ? <CheckCircle2 className="text-teal-500" /> : <Clock className="text-yellow-600" />}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrdersScreen;
