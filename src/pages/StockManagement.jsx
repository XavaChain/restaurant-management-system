import React, { useEffect, useState } from 'react';
import { fetchStockOverview, logStockMovement } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { Package, PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';

export default function StockManagement() {
  const { profile } = useAuth();
  const [stock, setStock] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [movementType, setMovementType] = useState('received');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStock = async () => {
    try {
      const data = await fetchStockOverview();
      setStock(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!selectedStock || !quantity || Number(quantity) <= 0) return;

    try {
      await logStockMovement(selectedStock, movementType, Number(quantity), profile.id, notes);
      alert('Stock movement logged successfully!');
      setQuantity('');
      setNotes('');
      loadStock();
    } catch (err) {
      alert('Error updating stock: ' + err.message);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Store Inventory Management</h1>
        <p className="text-xs text-slate-400">Track incoming and outgoing raw materials (oil, bread, rice, etc.).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Record Movement Form */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg h-fit">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Record Movement</span>
          </h2>
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1">Stock Item</label>
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Item</option>
                {stock.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.stock_name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1">Movement Type</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="received">Received (+)</option>
                <option value="used">Used (-)</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-400 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Supplier or reason"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-md transition"
            >
              Submit Stock Entry
            </button>
          </form>
        </div>

        {/* Stock Overview Table */}
        <div className="md:col-span-2 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <h2 className="font-bold text-slate-200">Current Inventory Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4">Used</th>
                  <th className="py-3 px-4">Closing Stock</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {stock.map(item => (
                  <tr key={item.id} className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-semibold text-white">{item.stock_name}</td>
                    <td className="py-3 px-4 text-emerald-400">{item.received} {item.unit}</td>
                    <td className="py-3 px-4 text-amber-400">{item.used} {item.unit}</td>
                    <td className="py-3 px-4 font-bold text-white">{item.currentStock} {item.unit}</td>
                    <td className="py-3 px-4">
                      {item.isLow ? (
                        <span className="inline-flex items-center space-x-1 bg-red-950/80 text-red-400 border border-red-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low Stock</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
                }
