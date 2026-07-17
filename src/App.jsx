import { useEffect, useState } from 'react'
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

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]) 
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);

  // --- AUTH LOGIC ---
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setUser({ ...session.user, role: profile?.role });
      } else {
        setUser(null);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setUser({ ...session.user, role: profile?.role });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
  };

  const updateQuantity = (id, amount) => {
    setCart((prevCart) => prevCart.map((item) => 
      item.id === id ? { ...item, quantity: item.quantity + amount } : item
    ).filter((item) => item.quantity > 0))
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  };

  // --- WHATSAPP LOGIC ---
  const sendWhatsAppNotification = (profile, orderItems, total) => {
    const adminNumber = brandConfig.whatsapp;
    const itemList = orderItems.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
    const text = `🔥 *New Order from ${brandConfig.name}!*\n\n*Customer:* ${profile?.full_name}\n*Phone:* ${profile?.phone}\n*Address:* ${profile?.address}\n\n*Items:*\n${itemList}\n\n*Total:* ₦${total.toLocaleString()}\n*Status:* Paid ✅`;
    window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const saveOrderToDatabase = async (response, amount) => {
    try {
      const { error } = await supabase.from('orders').insert([{
        user_id: user.id,
        items: cart,
        total_amount: amount,
        brand_id: import.meta.env.VITE_BRAND || 'yummys',
        payment_reference: response.reference,
        status: "Paid"
      }]);
      if (error) throw error;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      setLastOrderData({ profile, items: [...cart], total: amount });
      setShowSuccessModal(true);
      setCart([]);
      setIsCartOpen(false);
    } catch (error) {
      alert("Error saving order: " + error.message);
    }
  };

  const handleCheckout = async () => {
    if (!user) { window.location.href = "/login"; return; }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    
    if (!profile?.phone || !profile?.address) {
      alert("Please fill your profile details first!");
      window.location.href = "/profile";
      return;
    }

    const handler = window.PaystackPop.setup({
      key: brandConfig.paystackKey,
      email: user.email,
      amount: Math.round(cartTotal * 100),
      currency: "NGN",
      callback: (res) => saveOrderToDatabase(res, cartTotal),
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
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/orders" element={<Orders user={user} />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin user={user} />} />
          </Routes>
        </main>

        {/* --- FIXED FOOTER --- */}
        <footer style={{ backgroundColor: brandConfig.backColor }} className="text-white pt-24 pb-12">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <Link to="/"><img src={brandConfig.logo} className="h-16 w-16 rounded-full mb-4 object-cover" alt="logo" /></Link>
              <p className="text-sm opacity-80">{brandConfig.name} - Excellence since 2024.</p>
            </div>
            <div>
              <h3 style={{ color: brandConfig.primaryColor }} className="font-bold text-lg mb-6 uppercase">Navigation</h3>
              <ul className="text-sm space-y-3 opacity-90">
                <li><Link to="/" className="hover:underline transition-all">Home</Link></li>
                <li><Link to="/menu" className="hover:underline transition-all">Shop</Link></li>
                <li><Link to="/about" className="hover:underline transition-all">About</Link></li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: brandConfig.primaryColor }} className="font-bold text-lg mb-6 uppercase">Contact</h3>
              <p className="text-sm opacity-90">Lagos, Nigeria</p>
              <p className="text-sm opacity-90">+{brandConfig.whatsapp}</p>
            </div>
            <div>
              <h3 style={{ color: brandConfig.primaryColor }} className="font-bold text-lg mb-6 uppercase">Newsletter</h3>
              <div className="flex">
                <input type="text" className="p-3 w-full text-black rounded-l-lg text-sm" placeholder="Email" />
                <button style={{ backgroundColor: brandConfig.primaryColor }} className="px-5 rounded-r-lg font-bold hover:brightness-110 transition-all">Go</button>
              </div>
            </div>
          </div>
        </footer>

        {/* --- FIXED CART MODAL --- */}
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex">
            <div className="hidden lg:flex flex-1 bg-black/80 items-center justify-center p-10" onClick={() => setIsCartOpen(false)}>
              <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <h3 style={{ color: brandConfig.primaryColor }} className="text-3xl font-bold mb-6 text-center">Recommended for you</h3>
                <div className="grid grid-cols-2 gap-6">
                  {(brandConfig?.upsells || []).map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                      <img src={`${brandConfig.imageFolder}/${item.image}`} className="w-16 h-16 object-contain" alt={item.name} />
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{item.name}</h4>
                        <p style={{ color: brandConfig.primaryColor }} className="font-bold text-xs">₦{item.price.toLocaleString()}</p>
                        <button onClick={() => addToCart(item)} style={{ backgroundColor: brandConfig.primaryColor }} className="mt-2 text-white px-3 py-1 rounded-lg text-[10px] font-bold">Add +</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: brandConfig.lightColor }} className="w-full max-w-md h-full shadow-2xl flex flex-col p-6 animate-slide-in relative">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-2xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {cart.length === 0 ? <p className="text-center py-20 text-gray-400">Cart is empty</p> : cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={item.image_url?.startsWith('http') ? item.image_url : `${brandConfig.imageFolder}/${item.image_url || item.image}`} className="w-14 h-14 object-contain bg-gray-50 rounded-xl" alt={item.name} />
                      <div>
                        <h4 className="font-bold text-xs text-gray-800">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-gray-100 rounded-md font-bold">-</button>
                          <span className="text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-gray-100 rounded-md font-bold">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p style={{ color: brandConfig.primaryColor }} className="font-bold text-sm text-gray-800">₦{(item.price * item.quantity).toLocaleString()}</p>
                      <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-red-500 underline font-bold">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between text-xl font-black mb-4 text-gray-800">
                  <span>Total:</span>
                  <span>₦{cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={handleCheckout} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-4 rounded-2xl font-bold shadow-lg hover:brightness-110 transition-all active:scale-95">Checkout Now</button>
              </div>
            </div>
          </div>
        )}

        {/* --- SUCCESS MODAL --- */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="text-6xl mb-4 text-green-500">🎉</div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Order Confirmed!</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">Payment was successful. Please click the button below to notify us on WhatsApp for priority processing.</p>
              <button 
                onClick={() => {
                  sendWhatsAppNotification(lastOrderData.profile, lastOrderData.items, lastOrderData.total);
                  setShowSuccessModal(false);
                }}
                className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95"
              >
                <FaWhatsapp size={20} /> Notify WhatsApp
              </button>
              <button onClick={() => setShowSuccessModal(false)} className="mt-4 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors">Skip for now</button>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  )
}

export default App;