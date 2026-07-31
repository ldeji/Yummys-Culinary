import React, { useState } from 'react';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';

// Notice it now receives your exact requested props
export default function Cart({ cart, updateQuantity, removeFromCart, cartTotal, handleCheckout }) {
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const navigate = useNavigate();

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.includes('supabase.co')) return url;
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
    return `/images/${currentBrand === 'pantry-co' ? 'pantry' : 'yummys'}/${url}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Your cart is empty!");
    
    setLoading(true);
    try {
      // Pass the customer details up to App.jsx to process the checkout
      await handleCheckout(customer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
        <button onClick={() => navigate('/menu')} style={{ backgroundColor: brandConfig.primaryColor }} className="px-8 py-3 text-white rounded-full font-bold shadow-lg">
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 min-h-screen">
      <h1 className="text-4xl font-black mb-10" style={{ color: brandConfig.primaryColor }}>Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* CART ITEMS LIST */}
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4 border-b pb-4">
            <h3 className="font-bold text-gray-400 uppercase tracking-widest text-sm">Items ({cart.length})</h3>
          </div>

          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <img src={getImageUrl(item.image_url)} alt={item.name} className="w-20 h-20 object-contain bg-gray-50 rounded-xl" />
              
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <p className="text-sm font-bold text-gray-500">₦{item.price?.toLocaleString()} each</p>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded text-xs font-bold">-</button>
                  <span className="font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded text-xs font-bold">+</button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition">✕</button>
                <div className="text-sm font-black" style={{ color: brandConfig.primaryColor }}>
                  ₦{(item.price * item.quantity).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CHECKOUT FORM */}
        <div className="bg-gray-50 p-8 rounded-3xl h-fit border border-gray-100 shadow-sm">
          <h3 className="font-black text-2xl mb-6">Order Summary</h3>
          
          <div className="flex justify-between text-xl font-bold mb-8 pb-6 border-b-2 border-gray-200 border-dashed">
            <span>Total to Pay:</span>
            <span style={{ color: brandConfig.primaryColor }}>₦{cartTotal.toLocaleString()}</span>
          </div>

         {/* CHECKOUT BUTTON SECTION */}
            <div className="bg-gray-50 p-8 rounded-3xl h-fit border border-gray-100 shadow-sm">
            <h3 className="font-black text-2xl mb-6">Order Summary</h3>
            
            <div className="flex justify-between text-xl font-bold mb-8 pb-6 border-b-2 border-gray-200 border-dashed">
                <span>Total to Pay:</span>
                <span style={{ color: brandConfig.primaryColor }}>₦{cartTotal.toLocaleString()}</span>
            </div>

            {/* We just call your existing App.jsx handleCheckout directly! */}
            <button 
                onClick={handleCheckout} 
                disabled={loading} 
                style={{ backgroundColor: brandConfig.primaryColor }} 
                className="w-full text-white py-4 mt-4 rounded-xl font-black text-lg shadow-xl hover:brightness-110 disabled:opacity-50 transition-all"
            >
                {loading ? 'Opening Secure Payment...' : `Pay ₦${cartTotal.toLocaleString()} with Paystack`}
            </button>
            </div>
        </div>
      </div>
    </div>
  );
}