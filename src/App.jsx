import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Navbar from './components/Navbar'; 
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import Profile from './pages/Profile'
import Orders from './pages/Orders'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import { brandConfig } from "./config/brands";
import ScrollToTop from "./components/ScrollToTop";
import { supabase } from './config/supabaseClient';
import { FaWhatsapp } from 'react-icons/fa';
import Cart from './pages/Cart';

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]) 
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);

  // --- 1. SESSION RECOVERY (Fixed the "Spinning Circle/Freeze" issue) ---
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setUser({ ...session.user, role: profile?.role });
      } else { 
        setUser(null); 
      }
    } catch (e) { 
      console.warn("Session check suppressed"); 
    }
  }, []);

  useEffect(() => {
    refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else { 
        setUser(null); 
      }
    });

    // This wakes up the app when you switch tabs back to the site
    const handleVisibility = () => { 
      if (document.visibilityState === "visible") refreshSession(); 
    };

    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshSession]);

  // --- 2. CART & STOCK LOGIC ---
  const addToCart = (product) => {
    if (product.stock_quantity <= 0 || product.is_available === false) {
      alert("This item is currently out of stock.");
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          alert(`Limit reached. Only ${product.stock_quantity} available.`);
          return prevCart;
        }
        return prevCart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, amount) => {
    setCart((prevCart) => prevCart.map((item) => {
      if (item.id === id) {
        const newQty = item.quantity + amount;
        if (amount > 0 && newQty > item.stock_quantity) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const removeFromCart = (id) => setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- 3. WHATSAPP & CHECKOUT LOGIC ---
  const sendWhatsAppNotification = (profile, items, total) => {
    const itemList = items.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
    const customerName = profile?.full_name || profile?.name || 'Customer';
    const text = `🔥 *New Order from ${brandConfig.name}!*\n\n*Customer:* ${customerName}\n*Phone:* ${profile?.phone || 'N/A'}\n*Address:* ${profile?.address || 'N/A'}\n\n*Items:*\n${itemList}\n\n*Total:* ₦${total.toLocaleString()}\n*Status:* Paid ✅`;
    window.open(`https://wa.me/${brandConfig.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const saveOrderToDatabase = async (paymentResponse, total) => {
    try {
      const currentBrandID = import.meta.env.VITE_BRAND || 'yummys';
      const orderItemsCopy = [...cart];
      
      const { error } = await supabase.from('orders').insert([{
        brand_id: currentBrandID,
        items: orderItemsCopy.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total_amount: total, 
        status: 'Paid', 
        user_id: user?.id
      }]);
      if (error) throw error;

      // Deduct stock in database
      for (const item of orderItemsCopy) {
        const { data: p } = await supabase.from('products').select('stock_quantity').eq('id', item.id).single();
        if (p) await supabase.from('products').update({ stock_quantity: Math.max(0, p.stock_quantity - item.quantity) }).eq('id', item.id);
      }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setLastOrderData({ profile, items: orderItemsCopy, total });
      setCart([]); 
      setIsCartOpen(false); 
      setShowSuccessModal(true); 
    } catch (e) { alert("Checkout Error: " + e.message); }
  };

  const handleCheckout = () => {
    if (!user) { window.location.href = "/login"; return; }
    const handler = window.PaystackPop.setup({
      key: brandConfig.paystackKey,
      email: user.email,
      amount: Math.round(cartTotal * 100),
      currency: "NGN",
      callback: (res) => saveOrderToDatabase(res, cartTotal),
    });
    handler.openIframe();
  };
 
  // --- 4. NEWSLETTER FORM LOGIC ---
   const [status, setStatus] = useState("idle"); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    // Capture the form data
    const formData = new FormData(e.target);
    
    // Inject the brand-specific key into the form data
    formData.append("access_key", brandConfig.web3FormsKey);
    formData.append("subject", `New Subscriber - ${brandConfig.name}`);
    formData.append("from_name", brandConfig.name);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        e.target.reset(); // Clear the input
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
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
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/admin" element={<Admin user={user} />} />
            <Route path="/cart" element={<Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} cartTotal={cartTotal} handleCheckout={handleCheckout} />} />      
          </Routes>
        </main>

        {/* --- ANIMATED FLOATING WHATSAPP ICON --- */}
        <a
          href={`https://wa.me/${brandConfig.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 z-[100] flex items-center justify-center group"
        >
          {/* Tooltip: Appears on hover */}
          <span className="absolute right-16 bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-gray-100">
            Chat with us! 👋
          </span>

          {/* The Icon Circle */}
          <div className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl animate-bounce hover:animate-none hover:scale-110 transition-all duration-300">
            <FaWhatsapp size={32} />
          </div>
        </a>

        {/* --- FOOTER SECTION --- */}
        <footer style={{ backgroundColor: brandConfig.primaryColor }} className="text-white pt-24 pb-12">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <Link to="/"><img src={brandConfig.logo} className="h-16 w-16 rounded-full mb-4 object-cover" alt="logo"/></Link>
              <h4 style={{ color: brandConfig.accentColor }}className="font-bold text-lg mb-2">{brandConfig.name}</h4>
              <p style={{ color: brandConfig.accentColor }} className="text-xs opacity-70 leading-relaxed max-w-[200px]">
                {brandConfig.address || "Lagos, Nigeria."}
              </p>
            </div>
            
            <div>
              <h3 style={{ color: brandConfig.accentColor }} className="font-bold text-lg mb-6 uppercase tracking-widest">Explore</h3>
              <ul style={{ color: brandConfig.accentColor }}className="text-sm space-y-3 opacity-90">
                <li><Link to="/" className="hover:underline">Home</Link></li>
                <li><Link to="/menu" className="hover:underline">Shop Menu</Link></li>
              </ul>
            </div>
  
                            
              {/* Phone Link */}
            <div>   
              <h3 style={{ color: brandConfig.accentColor }} className="font-bold text-lg mb-6 uppercase tracking-widest">Support</h3>
              <p style={{ color: brandConfig.accentColor }}className="text-sm opacity-90 mb-1"><a href={`tel:+${brandConfig.whatsapp.replace(/\D/g, '')}`}> +{brandConfig.whatsapp}</a></p>
              

              {/* Email Link */}
              <p style={{ color: brandConfig.accentColor }}className="text-sm opacity-90 lowercase">
                <a 
                  href={`mailto:${brandConfig.supportEmail || `hello@${brandConfig.name.toLowerCase()}.com`}`}
                  className="hover:underline"
                >
                  {brandConfig.supportEmail || `hello@${brandConfig.name.toLowerCase()}.com`}
                </a>
              </p>
            </div>

            <div>
              <h3 style={{ color: brandConfig.accentColor }} className="font-bold text-lg mb-6 uppercase tracking-widest">Newsletter</h3>
              <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        {/* Anti-Spam Honeypot (Required by Web3Forms for security) */}
        <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }} />

        <div className="flex">
          <input 
            type="email" 
            name="email" // Web3Forms will capture this automatically
            required
            placeholder="Your Email"
           style={{ borderColor: brandConfig.accentColor }} className="p-3 w-full bg-transparent border-y-2 border-l-2 rounded-l-lg text-sm focus:outline-none" 
          />
          <button 
            type="submit"
            disabled={status === "loading"}
            style={{ 
                backgroundColor: brandConfig.accentColor,
                fontFamily: brandConfig.titleFont 
            }} 
            className="px-5 rounded-r-lg font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "..." : "Go"}
          </button>
        </div>

            {/* Status Messages */}
            {status === "success" && (
              <p className="text-xs text-green-400 font-medium">
                You've been added to the {brandConfig.name} list!
              </p>
            )}
            {status === "error" && (
              <p className="text-xs text-red-400 font-medium">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center">
            <p style={{ color: brandConfig.accentColor }}className="text-[10px] uppercase tracking-widest">
              © {new Date().getFullYear()} {brandConfig.name} All rights reserved.
            </p>
            <p style={{ color: brandConfig.accentColor }}className="mt-4 text-[10px] uppercase tracking-widest">
              Built by  <p style={{ color: brandConfig.accentColor }}className="mt-4 text-[10px] uppercase tracking-widest">
              <a 
                href="https://lateefpeleowo.vercel.app/Portfolio.html" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: brandConfig.accentColor }} 
                className="font-bold hover:underline transition-all"
              >
                Lateef Peleowo
              </a>
            </p>
            </p>

             

          </div>
        </footer>

        {/* --- SUCCESS WHATSAPP MODAL --- */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl animate-scale-in">
              <div className="text-7xl mb-6">✅</div>
              <h2 className="text-3xl font-black text-gray-800 mb-2 uppercase tracking-tighter">Order Placed!</h2>
              <p className="text-gray-500 text-sm mb-10 leading-relaxed">Payment was successful. Tap below to send your order details to {brandConfig.name} on WhatsApp for processing.</p>
              <button 
                onClick={() => {
                  sendWhatsAppNotification(lastOrderData.profile, lastOrderData.items, lastOrderData.total);
                  setShowSuccessModal(false);
                }}
                className="w-full bg-[#25D366] text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 hover:brightness-110 transition-all active:scale-95 shadow-lg text-lg uppercase tracking-widest"
              >
                <FaWhatsapp size={24} /> Send WhatsApp
              </button>
              <button onClick={() => setShowSuccessModal(false)} className="mt-6 text-gray-400 text-xs font-bold uppercase tracking-widest">Close</button>
            </div>
          </div>
        )}

        {/* --- CART DRAWER --- */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="hidden lg:flex flex-1 bg-black/80 items-center justify-center p-10" onClick={() => setIsCartOpen(false)}>
              <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h3 style={{ color: brandConfig.primaryColor }} className="text-3xl font-bold mb-6 text-center underline decoration-wavy">Recommended</h3>
                <div className="grid grid-cols-2 gap-6">
                  {(brandConfig?.upsells || []).map((item) => {
                    const out = item.stock_quantity <= 0;
                    return (
                      <div key={item.id} className={`bg-white rounded-2xl p-4 flex items-center gap-4 ${out ? 'opacity-50 grayscale' : 'hover:scale-105 transition-transform'}`}>
                        <img src={`${brandConfig.imageFolder}/${item.image}`} className="w-16 h-16 object-contain" alt="" />
                        <div>
                          <h4 className="font-bold text-xs">{item.name}</h4>
                          <button disabled={out} onClick={() => addToCart(item)} style={{ backgroundColor: out ? '#ccc' : brandConfig.primaryColor }} className="mt-2 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm">{out ? 'Out' : 'Add +'}</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: brandConfig.lightColor }} className="w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-slide-in relative border-l border-white/20">
              <div className="flex justify-between items-center mb-6 border-b pb-4 border-black/5">
                <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-2xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {cart.length === 0 ? <p className="text-center py-20 text-gray-400 font-medium">Your cart is empty.</p> : cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-black/5">
                    <div className="flex items-center gap-4">
                      <img src={item.image_url?.startsWith('http') ? item.image_url : `${brandConfig.imageFolder}/${item.image_url || item.image}`} className="w-12 h-12 object-contain rounded-xl" alt="" />
                      <div>
                        <h4 className="font-bold text-xs text-gray-800 leading-tight">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-bold">-</button>
                          <span className="text-xs font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-bold">+</button>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: brandConfig.primaryColor }} className="font-bold text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-6 border-black/5">
                <div className="flex justify-between text-2xl font-black mb-6 tracking-tighter text-gray-800 uppercase">
                  <span>TOTAL</span>
                  <span>₦{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-5 rounded-3xl font-bold shadow-xl active:scale-95 transition-all text-lg uppercase tracking-widest">Checkout Now</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}
export default App;