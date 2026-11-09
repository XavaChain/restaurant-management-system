import React, { useEffect, useState } from 'react';
import { fetchMenuItems, fetchDailySummary, submitCookingTicket } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Plus, Check, RefreshCw } from 'lucide-react';

export default function ChefDashboard() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [cookedData, setCookedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  const loadData = async () => {
    try {
      const menu = await fetchMenuItems();
      const { cookedMap } = await fetchDailySummary();
      setItems(menu);
      setCookedData(cookedMap);
    } catch (err) {
      console.error('Chef load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('realtime_cooking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cooking_tickets' }, (payload) => {
        setCookedData(prev => ({
          ...prev,
          [payload.new.menu_item_id]: (prev[payload.new.menu_item_id] || 0) + payload.new.quantity
        }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const handleCookIncrement = async (menuItemId) => {
    setSubmittingId(menuItemId);
    try {
      await submitCookingTicket(menuItemId, 1, profile.id);
    } catch (err) {
      alert('Error recording cooking ticket: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const categories = ['All', ...new Set(items.map(i => i.category))];

  const filteredItems = filterCategory === 'All' 
    ? items 
    : items.filter(i => i.category === filterCategory);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Chef Cooking Interface</h1>
          <p className="text-xs text-slate-400">Record food cooked today. Append-only system.</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filterCategory === cat 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">Cooked Today</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.item_code}</td>
                  <td className="py-3 px-4 font-semibold text-white">{item.item_name}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">৳{item.price}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block bg-slate-900 text-emerald-400 font-bold px-3 py-1 rounded-md text-base border border-slate-700">
                      {cookedData[item.id] || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCookIncrement(item.id)}
                      disabled={submittingId === item.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg active:scale-95 transition flex items-center justify-center ml-auto gap-1 shadow-md disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> <span>+1</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
