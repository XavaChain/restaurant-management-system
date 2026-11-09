import React, { useEffect, useState } from 'react';
import { fetchMenuItems, fetchDailySummary, submitSalesTicket, recordPayment } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Plus, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';

export default function WaiterDashboard() {
  const { profile } = useAuth();
  const [items, setItems] = useState([]);
  const [cookedData, setCookedData] = useState({});
  const [soldData, setSoldData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  const loadData = async () => {
    try {
      const menu = await fetchMenuItems();
      const { cookedMap, soldMap } = await fetchDailySummary();
      setItems(menu);
      setCookedData(cookedMap);
      setSoldData(soldMap);
    } catch (err) {
      console.error('Waiter load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime Subscriptions
    const cookChannel = supabase.channel('waiter_cook')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cooking_tickets' }, (p) => {
        setCookedData(prev => ({ ...prev, [p.new.menu_item_id]: (prev[p.new.menu_item_id] || 0) + p.new.quantity }));
      }).subscribe();

    const saleChannel = supabase.channel('waiter_sale')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales_tickets' }, (p) => {
        setSoldData(prev => ({ ...prev, [p.new.menu_item_id]: (prev[p.new.menu_item_id] || 0) + p.new.quantity }));
      }).subscribe();

    return () => {
      supabase.removeChannel(cookChannel);
      supabase.removeChannel(saleChannel);
    };
  }, []);

  const handleSellIncrement = async (item) => {
    const cooked = cookedData[item.id] || 0;
    const sold = soldData[item.id] || 0;
    const remaining = cooked - sold;

    if (remaining <= 0) {
      alert(`Cannot sell ${item.item_name}! Out of remaining stock.`);
      return;
    }

    setSubmittingId(item.id);
    try {
      await submitSalesTicket(item.id, 1, item.price, profile.id);
    } catch (err) {
      alert('Error recording sale: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    try {
      await recordPayment(`POS-${Date.now().toString().slice(-6)}`, Number(payAmount), payMethod, profile.id);
      alert('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPayAmount('');
    } catch (err) {
      alert('Payment record error: ' + err.message);
    }
  };

  const categories = ['All', ...new Set(items.map(i => i.category))];
  const filteredItems = filterCategory === 'All' ? items : items.filter(i => i.category === filterCategory);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Waiter Sales Interface</h1>
          <p className="text-xs text-slate-400">Record item sales & track real-time stock availability.</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center space-x-1 shadow-md"
        >
          <CreditCard className="w-4 h-4" /> <span>Collect Payment</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              filterCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sales Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Food Item</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 text-center">Cooked</th>
                <th className="py-3 px-4 text-center">Sold</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredItems.map((item) => {
                const cooked = cookedData[item.id] || 0;
                const sold = soldData[item.id] || 0;
                const remaining = cooked - sold;

                return (
                  <tr key={item.id} className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{item.item_code}</td>
                    <td className="py-3 px-4 font-semibold text-white">{item.item_name}</td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">৳{item.price}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{cooked}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">{sold}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md font-bold text-sm border ${
                        remaining > 5 ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' :
                        remaining > 0 ? 'bg-amber-950/60 text-amber-400 border-amber-800' :
                        'bg-red-950/60 text-red-400 border-red-800'
                      }`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSellIncrement(item)}
                        disabled={submittingId === item.id || remaining <= 0}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:opacity-40 text-white font-bold py-2 px-4 rounded-lg active:scale-95 transition flex items-center justify-center ml-auto gap-1 shadow-md"
                      >
                        <Plus className="w-4 h-4" /> <span>+1 Sell</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Record Customer Payment</h2>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="qr">bKash / Nagad / QR</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/2 bg-slate-700 text-slate-200 py-2.5 rounded-lg hover:bg-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-semibold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
