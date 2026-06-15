import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'; 
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import { brandConfig } from "./config/brands";
import ScrollToTop from "./components/ScrollToTop";
import Auth from './pages/Auth';
import { supabase } from './config/supabaseClient';
import Orders from './pages/Orders';
import { FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa'; // Import the icons
import Admin from './pages/Admin';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]) 
  const [isCartOpen, setIsCartOpen] = useState(false)

  // --- AUTH LOGIC ---
 useEffect(() => {
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // THIS IS THE KEY: We fetch the role from the profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      // We save the user AND their role into the state
      setUser({ ...session.user, role: profile?.role });
    } else {
      setUser(null);
    }
  };

  getSession();

  // Also listen for login/logout changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      setUser({ ...session.user, role: profile?.role });
    } else {
      setUser(null);
    }
  });

  return () => subscription.unsubscribe();
}, []);

  // --- CART CALCULATIONS ---
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
  }

  const updateQuantity = (id, amount) => {
    setCart((prevCart) => prevCart.map((item) => 
      item.id === id ? { ...item, quantity: item.quantity + amount } : item
    ).filter((item) => item.quantity > 0))
  }

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  // --- PAYSTACK & CHECKOUT ---
  // 1. Create a separate function to handle the database part
const saveOrderToDatabase = async (response, amount) => {
  console.log("Saving order... Checking for reference:", response.reference);
  
  // Create the object exactly
  const newOrder = {
    user_id: user.id,
    items: cart,
    total_amount: amount,
    brand_id: import.meta.env.VITE_BRAND || 'yummys',
    payment_reference: response.reference, // Check this matches Step 2
    status: "paid"
  };

  const { data, error } = await supabase
    .from('orders')
    .insert([newOrder]);

  if (error) {
    console.error("FULL ERROR OBJECT:", error);
    
    // If it still fails, let's try a fallback column name just in case
    if (error.message.includes("payment_reference")) {
       alert("Database Error: The column 'payment_reference' isn't recognized. Please check Step 2 again!");
    } else {
       alert("Error: " + error.message);
    }
  } else {
    alert("Order Placed Successfully!");
    setCart([]);
    setIsCartOpen(false);
  }
};

// 2. The Updated handleCheckout (Pure Function for Paystack)
const handleCheckout = () => {
  if (cart.length === 0) return alert("Cart is empty!");
  
  if (!user) {
    alert("Please login to place an order.");
    window.location.href = "/login";
    return;
  }

  if (!window.PaystackPop) {
    alert("Payment system is loading... please refresh.");
    return;
  }

  // We use a regular function here (no 'async' keyword)
  const handler = window.PaystackPop.setup({
    key: brandConfig.paystackKey,
    email: user.email,
    amount: Math.round(cartTotal * 100),
    currency: "NGN",
    callback: function(response) {
      // We call our async database function from here
      saveOrderToDatabase(response, cartTotal);
    },
    onClose: function() {
      console.log("User closed payment window");
    }
  });

  handler.openIframe();
};

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <ScrollToTop />
        <Navbar user={user} cartCount={cart.length} setIsCartOpen={setIsCartOpen} />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/menu" element={<Menu addToCart={addToCart} />} />
            <Route path="/about" element={<About />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/admin" element={<Admin user={user} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </main>

        {/* --- FOOTER --- */}
       <footer 
  style={{ backgroundColor: brandConfig.backColor }} 
  className="text-white pt-10 pb-12 mt-20"
>
  {/* --- INFINITE SCROLLING TICKER (Remains the same) --- */}
  <div className="relative overflow-hidden mb-16 border-y border-white/10 py-4 bg-black/10">
    <style>
      {`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}
    </style>
    <div className="animate-marquee flex gap-10 text-sm font-bold uppercase tracking-[0.2em]">
      {[1, 2].map((i) => (
        <div key={i} className="flex gap-10 items-center">
          <span>{brandConfig.name === "Yummys" ? "🔥 Fresh Meals Daily" : "📦 Premium Global Imports"}</span>
          <span className="opacity-30">•</span>
          <span>{brandConfig.name === "Yummys" ? "⚡ Fast Delivery in Ikoyi" : "🌾 Quality Dry Goods"}</span>
          <span className="opacity-30">•</span>
          <span>{brandConfig.name === "Yummys" ? "🍗 Grilled to Perfection" : "🌍 Sourced Globally"}</span>
          <span className="opacity-30">•</span>
          <span>{brandConfig.name === "Yummys" ? "👨‍Chef's Specials" : "🏠 Essentials for your Home"}</span>
          <span className="opacity-30">•</span>
        </div>
      ))}
    </div>
  </div>

  <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
    
    {/* Column 1: Brand & Logo */}
    <div className="flex flex-col items-start">
      <Link to="/" className="hover:opacity-80 transition mb-4">
        <img 
          src={brandConfig.logo} 
          className="h-16 w-16 rounded-full object-cover border-2 border-white/20 shadow-lg" 
          alt="logo" 
        />
      </Link>
      <p className="text-sm opacity-80 leading-relaxed">
        {brandConfig.name} <br /> 
        Quality products and exceptional service since 2024.
      </p>
    </div>

    {/* Column 2: Navigation */}
    <div>
      <h3 style={{ color: brandConfig.primaryColor }} className="font-bold text-lg mb-6 uppercase tracking-wider">
        Navigation
      </h3>
      <ul className="text-sm space-y-3 opacity-90">
        <li><Link to="/" className="hover:underline transition">Home</Link></li>
        <li><Link to="/menu" className="hover:underline transition">{brandConfig.name === "Yummys" ? "Full Menu" : "Our Shop"}</Link></li>
        <li><Link to="/about" className="hover:underline transition">About Us</Link></li>
        <li><Link to="/orders" className="hover:underline transition">My Orders</Link></li>
      </ul>
    </div>

    {/* Column 3: Contact (NOW WITH REACT ICONS) */}
    <div>
      <h3 style={{ color: brandConfig.primaryColor }} className="font-bold text-lg mb-6 uppercase tracking-wider">
        Contact Us
      </h3>
      <ul className="text-sm space-y-5 opacity-90">
        <li className="flex items-start gap-4">
      <a 
        href="https://www.google.com/maps/dir/?api=1&destination=Suite+95+Dolphin+Plaza+Ikoyi+Lagos" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-start gap-4 group transition"
      >
        {/* The icon scales up slightly when the row is hovered */}
        <FaMapMarkerAlt 
          style={{ color: brandConfig.primaryColor }} 
          className="text-xl flex-shrink-0 mt-1 group-hover:scale-120 transition-transform" 
        />
        <span className="group-hover:underline leading-relaxed">
          Suite 95, Dolphin Plaza, Ikoyi, Lagos
        </span>
      </a>
    </li>
        <li>
          <a href="https://wa.me/2348057080703" className="flex items-center gap-4 group transition">
            <FaWhatsapp className="text-2xl text-green-500 group-hover:scale-120 transition-transform" />
            <span className="group-hover:underline">+234 805 708 0703</span>
          </a>
        </li>
        <li>
          <a href={`mailto:support@${brandConfig.name.toLowerCase().replace(/\s/g, '')}.com`} className="flex items-center gap-4 group transition">
            <FaEnvelope style={{ color: brandConfig.primaryColor }} className="text-xl group-hover:scale-120 transition-transform" />
            <span className="group-hover:underline">support@{brandConfig.name.toLowerCase().replace(/\s/g, '')}.com</span>
          </a>
        </li>
      </ul>
    </div>

    {/* Column 4: Newsletter */}
    <div>
      <h3 style={{ color: brandConfig.primaryColor }} className="font-bold text-lg mb-6 uppercase tracking-wider">
        Newsletter
      </h3>
      <div className="flex relative items-center">
        <input 
          type="email" 
          className="p-3 w-full text-white bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none pr-12" 
          placeholder="Email Address" 
        />
        <button 
          style={{ backgroundColor: brandConfig.primaryColor }} 
          className="absolute right-1 p-2 rounded-md text-white hover:brightness-110 transition active:scale-90"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  </div>

      {/* BOTTOM BAR */}
      <div className="max-w-6xl mx-auto px-4 mt-20 pt-8 border-t border-white/10 text-center">
        <p className="text-xs opacity-50 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {brandConfig.name}. All Rights Reserved.
        </p>
      </div>
    </footer>

        {/* --- CART MODAL --- */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex">
            {/* 1. LEFT SIDE: UPSELLS (Desktop Only) */}
            <div className="hidden lg:flex flex-1 bg-black bg-opacity-80 items-center justify-center p-10">
              <div className="max-w-2xl w-full">
                <button 
                  onClick={() => { setIsCartOpen(false); window.location.href='/menu'; }} 
                  style={{ backgroundColor: brandConfig.primaryColor }}
                  className="text-white px-4 py-2 rounded-lg mb-6 font-bold"
                >
                  ← {brandConfig.name === "Yummys" ? "Back to Menu" : "Back to Shop"}
                </button>
                
                <h3 style={{ color: brandConfig.primaryColor }} className="text-3xl font-bold mb-6">You might also like...</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {(brandConfig?.upsells || []).map((item) => (
                    <div key={item.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-xl">
                      <img 
                        src={`${brandConfig.imageFolder}/${item.image}`} 
                        className="w-20 h-20 object-contain bg-gray-50 p-2 rounded-lg" 
                        alt={item.name} 
                      />
                      <div>
                        <h4 className="font-bold text-gray-800">{item.name}</h4>
                        <p style={{ color: brandConfig.primaryColor }} className="font-bold">₦{item.price.toLocaleString()}</p>
                        <button 
                          onClick={() => addToCart(item)}
                          style={{ backgroundColor: brandConfig.primaryColor }}
                          className="mt-2 text-white px-3 py-1 rounded text-xs font-bold"
                        >
                          Add +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. RIGHT SIDE: CART SIDEBAR */}
            <div style={{ backgroundColor: brandConfig.lightColor }} className="w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-slide-in relative">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold">Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-2xl">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-gray-500">Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image_url?.startsWith('http') ? item.image_url : `${brandConfig.imageFolder}/${item.image_url || item.image}`} 
                          className="w-16 h-16 object-contain bg-gray-50 rounded-lg p-1" 
                          alt={item.name}
                        />
                        <div>
                          <h4 className="font-bold text-xs">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 bg-gray-100 rounded">-</button>
                            <span className="text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 bg-gray-100 rounded">+</button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ color: brandConfig.primaryColor }} className="font-bold text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-red-500 underline">Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total:</span>
                {/* .toLocaleString makes the price look pretty */}
                <span>₦{cartTotal.toLocaleString()}</span>
              </div>
              
              <button 
                type="button" 
                onClick={() => handleCheckout()} 
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="w-full text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 active:scale-95 transition"
              >
                Checkout Now
              </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}

export default App;
