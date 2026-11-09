import React, { useEffect, useState } from 'react';
import { fetchMenuItems, fetchDailySummary, fetchStockOverview } from '../services/dataService';
import { supabase } from '../services/supabase';
import { Utensils, ShoppingBag, DollarSign, PackageAlert, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [cookedData, setCookedData] = useState({});
  const [soldData, setSoldData] = useState({});
  const [totalSales, setTotalSales] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const menu = await fetchMenuItems();
      const { cookedMap, soldMap, totalSalesValue } = await fetchDailySummary();
      const stock = await fetchStockOverview();

      const { data: payData } = await supabase.from('payments').select('amount');
      const paidSum = payData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setItems(menu);
      setCookedData(cookedMap);
      setSoldData(soldMap);
      setTotalSales(totalSalesValue);
      setTotalPayments(paidSum);
      setStockItems(stock);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCookedQty = Object.values(cookedData).reduce((a, b) => a + b, 0);
  const totalSoldQty = Object.values(soldData).reduce((a, b) => a + b, 0);
  const totalRemainingQty = totalCookedQty - totalSoldQty;
  const outstandingAmount = Math.max(0, totalSales - totalPayments);
  const lowStockCount = stockItems.filter(s => s.isLow).length;

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Restaurant Dashboard</h1>
        <p className="text-xs text-slate-400">Live operational oversight, sales value, and stock statistics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Cooked</span>
            <Utensils className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCookedQty} <span className="text-xs font-normal text-slate-400">items</span></div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Sold</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalSoldQty} <span className="text-xs font-normal text-slate-400">items</span></div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Total Sales Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">৳{totalSales.toFixed(2)}</div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase">
            <span>Outstanding</span>
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">৳{outstandingAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-950/80 border border-amber-800 text-amber-200 px-4 py-3 rounded-xl flex items-center space-x-3 text-sm">
          <PackageAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span><strong>Attention:</strong> {lowStockCount} inventory items have reached minimum safety stock levels!</span>
        </div>
      )}

      {/* Cooking vs Sales Breakdown Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <h2 className="font-bold text-slate-200">Daily Inventory & Sales Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4 text-center">Cooked</th>
                <th className="py-3 px-4 text-center">Sold</th>
                <th className="py-3 px-4 text-center">Remaining</th>
                <th className="py-3 px-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.map(item => {
                const cooked = cookedData[item.id] || 0;
                const sold = soldData[item.id] || 0;
                const remaining = cooked - sold;
                const revenue = sold * item.price;

                if (cooked === 0 && sold === 0) return null;

                return (
                  <tr key={item.id} className="hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-semibold text-white">{item.item_name}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{item.category}</td>
                    <td className="py-3 px-4 text-slate-300">৳{item.price}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{cooked}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">{sold}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-400">{remaining}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">৳{revenue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
                  }
