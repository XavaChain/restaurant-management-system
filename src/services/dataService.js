import { supabase } from './supabase';

export const fetchMenuItems = async () => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_active', true)
    .order('item_code', { ascending: true });
  if (error) throw error;
  return data;
};

export const fetchDailySummary = async (targetDate = new Date().toISOString().split('T')[0]) => {
  const [cookingRes, salesRes] = await Promise.all([
    supabase.from('cooking_tickets').select('menu_item_id, quantity').eq('business_date', targetDate),
    supabase.from('sales_tickets').select('menu_item_id, quantity, unit_price_snapshot').eq('business_date', targetDate)
  ]);

  if (cookingRes.error) throw cookingRes.error;
  if (salesRes.error) throw salesRes.error;

  const cookedMap = {};
  cookingRes.data.forEach(t => {
    cookedMap[t.menu_item_id] = (cookedMap[t.menu_item_id] || 0) + t.quantity;
  });

  const soldMap = {};
  let totalSalesValue = 0;
  salesRes.data.forEach(t => {
    soldMap[t.menu_item_id] = (soldMap[t.menu_item_id] || 0) + t.quantity;
    totalSalesValue += (t.quantity * Number(t.unit_price_snapshot));
  });

  return { cookedMap, soldMap, totalSalesValue };
};

export const submitCookingTicket = async (menuItemId, quantity, chefId) => {
  const { data, error } = await supabase.from('cooking_tickets').insert([{
    menu_item_id: menuItemId,
    quantity: quantity,
    chef_id: chefId
  }]).select();
  if (error) throw error;
  return data;
};

export const submitSalesTicket = async (menuItemId, quantity, price, waiterId) => {
  const { data, error } = await supabase.from('sales_tickets').insert([{
    menu_item_id: menuItemId,
    quantity: quantity,
    unit_price_snapshot: price,
    waiter_id: waiterId
  }]).select();
  if (error) throw error;
  return data;
};

export const recordPayment = async (reference, amount, method, userId) => {
  const { data, error } = await supabase.from('payments').insert([{
    sales_reference: reference,
    amount: amount,
    payment_method: method,
    recorded_by: userId
  }]).select();
  if (error) throw error;
  return data;
};

export const fetchStockOverview = async () => {
  const { data: stockItems, error: stockErr } = await supabase
    .from('stock_items')
    .select('*')
    .eq('is_active', true);
  if (stockErr) throw stockErr;

  const { data: movements, error: movErr } = await supabase
    .from('stock_movements')
    .select('*');
  if (movErr) throw movErr;

  const formattedStock = stockItems.map(item => {
    const itemMovs = movements.filter(m => m.stock_item_id === item.id);
    const received = itemMovs.filter(m => m.movement_type === 'received').reduce((sum, m) => sum + Number(m.quantity), 0);
    const used = itemMovs.filter(m => m.movement_type === 'used').reduce((sum, m) => sum + Number(m.quantity), 0);
    const currentStock = received - used;

    return {
      ...item,
      received,
      used,
      currentStock,
      isLow: currentStock <= item.minimum_stock
    };
  });

  return formattedStock;
};

export const logStockMovement = async (stockItemId, type, quantity, userId, notes = '') => {
  const { data, error } = await supabase.from('stock_movements').insert([{
    stock_item_id: stockItemId,
    movement_type: type,
    quantity: quantity,
    user_id: userId,
    notes: notes
  }]).select();
  if (error) throw error;
  return data;
};
      
