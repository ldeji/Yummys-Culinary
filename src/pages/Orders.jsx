import React, { useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { Link } from 'react-router-dom';

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

 async function fetchOrders() {
    setLoading(true);
    
    // Get the current site's brand (yummys or pantry-co)
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';

    // THE FIX: We filter by user_id AND brand_id
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)           // Only MY orders
      .eq('brand_id', currentBrand)     // Only for THIS brand
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please <Link to="/login" className="text-blue-500 underline">Login</Link> to view your orders.</p>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center">Loading your history...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <h2 className="text-3xl font-bold mb-8" style={{ color: brandConfig.primaryColor }}>
        My Order History
      </h2>

      {orders.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl text-center shadow">
          <p className="text-gray-500">You haven't placed any orders yet.</p>
          <Link to="/menu" style={{ color: brandConfig.primaryColor }} className="font-bold mt-4 block underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Order ID</p>
                  <p className="text-sm font-mono">{order.id.slice(0, 8)}...</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-bold">Date</p>
                  <p className="text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>

              <div className="flex justify-between items-center mb-4 border-b pb-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Order ID</p>
                <p className="text-sm font-mono">{order.id.slice(0, 8)}...</p>
              </div>
              
              <div className="text-right flex flex-col items-end gap-2">
                {/* --- LIVE STATUS BADGE FOR CUSTOMER --- */}
                <span 
                  className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase
                    ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' : 
                      order.status === 'Preparing' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}
                  `}
                >
                  {order.status || 'Processing'}
                </span>
                <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
              </div>

              {/* List of items in this order */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="text-gray-500">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-dashed">
                <span className="font-bold">Total Paid:</span>
                <span className="text-xl font-bold" style={{ color: brandConfig.primaryColor }}>
                  ₦{order.total_amount.toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Ref: {order.payment_reference}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}