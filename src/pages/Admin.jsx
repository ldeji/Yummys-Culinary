import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression'; // 1. Ensure this is imported

export default function Admin({ user }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  const [settings, setSettings] = useState({
    hero_title: '', hero_subtitle: '', cta_button_text: '', about_story: ''
  });

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', long_description: '', 
    image_url: '', ingredients: '', 
    category: 'General', is_available: true 
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  async function checkAdmin() {
    if (!user) { navigate('/login'); return; }
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, brand_id')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error("Profile check failed");
      navigate('/');
      return;
    }

    const isSuperAdmin = profile.brand_id === 'all';
    const isBrandOwner = profile.brand_id === currentBrand;

    if (profile.role === 'admin' && (isSuperAdmin || isBrandOwner)) {
      fetchData(); 
    } else {
      const brandMessage = isSuperAdmin ? "Super Admin" : profile.brand_id;
      alert(`Access Denied: You are registered as a ${brandMessage} admin. This site is ${currentBrand}.`);
      navigate('/');
    }
  }

  async function fetchData() {
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, brand_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      setUserProfile(profile);
      const isSuperAdmin = profile.brand_id === 'all';
      const currentSiteBrand = import.meta.env.VITE_BRAND || 'yummys';

      let productQuery = supabase.from('products').select('*');
      let orderQuery = supabase.from('orders').select('*');
      let settingsQuery = supabase.from('site_settings').select('*').eq('brand_id', isSuperAdmin ? currentSiteBrand : profile.brand_id).single();

      if (!isSuperAdmin) {
        productQuery = productQuery.eq('brand_id', profile.brand_id);
        orderQuery = orderQuery.eq('brand_id', profile.brand_id);
      }

      const [prodRes, ordRes, setRes] = await Promise.all([
        productQuery,
        orderQuery.order('created_at', { ascending: false }),
        settingsQuery
      ]);

      setProducts(prodRes.data || []);
      setOrders(ordRes.data || []);
      if (setRes.data) setSettings(setRes.data);

    } catch (error) {
      console.error("Critical Dashboard Error:", error.message);
      alert("Error loading dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const getImageUrl = (product) => {
    const url = product.image_url;
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    const folder = product.brand_id === 'pantry-co' ? 'pantry' : 'yummys';
    return `/images/${folder}/${url}`;
  };

 // --- OPTIMIZED IMAGE UPLOAD WITH DEBUGGING ---
async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setUploading(true);
    console.log("1. Trying direct upload (No compression)...");

    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file); // Uploading the raw file directly

    if (error) {
      console.error("2. Supabase Error:", error);
      alert("Upload failed: " + error.message);
      return;
    }

    console.log("3. Success! Getting URL...");
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
    
    setNewProduct({ ...newProduct, image_url: urlData.publicUrl });
    alert("Image uploaded! ✅");

  } catch (err) {
    console.error("4. Javascript Error:", err);
  } finally {
    setUploading(false);
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);

  const brandId = import.meta.env.VITE_BRAND || 'yummys';

  // 1. Clean the ingredients string back into a real Array
  const ingredientsArray = typeof newProduct.ingredients === 'string'
    ? newProduct.ingredients.split(',').map(i => i.trim()).filter(i => i !== "")
    : [];

  // 2. Prepare the payload
  const productData = {
    name: newProduct.name,
    price: Number(newProduct.price),
    description: newProduct.description,
    image_url: newProduct.image_url,
    ingredients: ingredientsArray, // Real Array []
    category: newProduct.category,
    is_available: newProduct.is_available,
    brand_id: brandId
  };

  try {
    if (editingId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingId);
      if (error) throw error;
      alert("Updated! ✅");
    } else {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) throw error;
      alert("Created! ✨");
    }

    // 3. Reset state and REFRESH data (This unfreezes the UI)
    setEditingId(null);
    setNewProduct({ name: '', price: '', description: '', image_url: '', ingredients: '', category: 'General', is_available: true });
    fetchData(); 

  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    setLoading(false);
  }
}

  // --- EDIT PRODUCT FUNCTION ---
  const startEdit = (product) => {
  setEditingId(product.id);

  // 1. Get ingredients from product
  let rawIng = product.ingredients;

  // 2. If it's a messy string, try to turn it into a real list first
  if (typeof rawIng === 'string' && rawIng.startsWith('[')) {
    try {
      rawIng = JSON.parse(rawIng);
      if (typeof rawIng === 'string') rawIng = JSON.parse(rawIng); // Handle double-wrapped
    } catch (e) {
      console.error("Cleaning messy string...");
    }
  }

  // 3. Convert to a clean string for the input box (e.g., "Salt, Pepper")
  const cleanIngredients = Array.isArray(rawIng) 
    ? rawIng.join(', ') 
    : (rawIng || "");

  // 4. Fill the form state
  setNewProduct({
    name: product.name || "",
    price: product.price || "",
    description: product.description || "",
    image_url: product.image_url || "",
    ingredients: cleanIngredients,
    category: product.category || "General",
    is_available: product.is_available ?? true
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

  async function deleteProduct(id) {
    if (window.confirm("Delete this item?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  }

  async function toggleAvailability(id, currentStatus) {
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p)
    );
    const { error } = await supabase.from('products').update({ is_available: !currentStatus }).eq('id', id);
    if (error) { alert("Error: " + error.message); fetchData(); }
  }

  async function updateProductCategory(id, newCategory) {
    const { error } = await supabase.from('products').update({ category: newCategory }).eq('id', id);
    if (error) alert("Error: " + error.message); else fetchData();
  }

  // --- ANALYTICS ---
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const revenueByBrand = {};
  const productSales = {};

  orders.forEach(order => {
    const bId = order.brand_id || 'Unknown';
    revenueByBrand[bId] = (revenueByBrand[bId] || 0) + (Number(order.total_amount) || 0);
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + (item.quantity || 1);
    });
  });

  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const isSuperAdmin = userProfile?.brand_id === 'all';

  if (loading) return <div className="p-20 text-center">Loading Dashboard...</div>;

return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold" style={{ color: brandConfig.primaryColor }}>Admin Panel</h1>
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('products')} className={`px-4 md:px-6 py-2 rounded-full font-bold transition whitespace-nowrap ${activeTab === 'products' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>Products</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 md:px-6 py-2 rounded-full font-bold transition whitespace-nowrap ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>Orders</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 md:px-6 py-2 rounded-full font-bold transition whitespace-nowrap ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Analytics</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 md:px-6 py-2 rounded-full font-bold whitespace-nowrap transition ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Settings</button>
        </div>
      </div>

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg h-fit space-y-4 border-2" style={{ borderColor: editingId ? brandConfig.primaryColor : 'transparent' }}>
            <h3 className="text-xl font-bold">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <div className="space-y-3">
              <input 
              id="name"
              name="name"
              type="text" 
              value={newProduct.name || ""} 
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
              className="w-full border p-3 rounded-xl focus:outline-none transition-all" // transition is INSIDE quotes
            />
              <input type="number" placeholder="Price (₦)" className="w-full border p-3 rounded-xl focus:outline-none" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              <textarea 
                id="description"
                name="description"
                value={newProduct.description || ""} 
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full border p-3 rounded-xl h-24 focus:outline-none transition-all" 
              />
              <input type="text"  placeholder="Ingredients (comma separated)" className="w-full border p-3 rounded-xl focus:outline-none" value={newProduct.ingredients || ""} // Use || "" to prevent null errors
                onChange={e => setNewProduct({...newProduct, ingredients: e.target.value})}/>
            </div>
            <div className="border-2 border-dashed p-4 text-center rounded-2xl bg-gray-50 mt-4">
               <label className="cursor-pointer block">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Product Photo</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div style={{ backgroundColor: brandConfig.primaryColor }} className="inline-block px-4 py-2 text-white text-xs rounded-lg font-bold">
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </div>
               </label>
               {newProduct.image_url && (
                 <img src={getImageUrl({ 
                    image_url: newProduct.image_url, 
                    brand_id: import.meta.env.VITE_BRAND 
                  })} 
                  loading="lazy"
                  className="h-32 w-full object-contain rounded-lg mt-4 bg-white p-2 border" 
                  alt="preview" 
                />
              )}
            </div>
            <button type="submit" disabled={uploading} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 disabled:opacity-50">
              {editingId ? 'Update Product' : 'Save Product'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setNewProduct({name:'', price:'', description:'', long_description:'', image_url:'', ingredients:''}); }} className="w-full bg-gray-200 py-3 rounded-xl font-bold text-gray-600">Cancel</button>
            )}
          </form>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-400 uppercase text-sm mb-4">Inventory ({products.length})</h3>
            
            {/* UPDATED PRODUCT CARDS WITH QUICK CONTROLS */}
            <div className="grid grid-cols-1 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Grayscale if sold out */}
                      <img 
                        src={getImageUrl(p)} 
                        loading="lazy"
                        className={`h-16 w-16 object-contain bg-gray-50 rounded-xl p-1 border ${!p.is_available ? 'grayscale opacity-50' : ''}`} 
                        alt={p.name} 
                      />
                      <div>
                        <p className="font-bold text-gray-800">{p.name}</p>
                        <p className="text-sm font-bold" style={{ color: brandConfig.primaryColor }}>₦{p.price.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* QUICK AVAILABILITY TOGGLE */}
                    <button 
          type="button" // <--- CRITICAL: Prevents form submission/jumps
          onClick={(e) => {
            e.preventDefault(); // Prevents any default browser scroll actions
            toggleAvailability(p.id, p.is_available);
          }}
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all
            ${p.is_available 
              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
              : 'bg-red-100 text-red-600 hover:bg-red-200'}
          `}
        >
          {p.is_available ? '● In Stock' : '○ Sold Out'}
        </button>
                  </div>

                  {/* QUICK CATEGORY & ACTIONS BAR */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cat:</span>
                      <select 
                        value={p.category || 'General'}
                        onChange={(e) => updateProductCategory(p.id, e.target.value)}
                        className="text-xs bg-gray-50 border-none rounded-md px-2 py-1 font-bold text-gray-600 focus:ring-1 focus:ring-gray-300 cursor-pointer"
                      >
                        <option value="General">General</option>
                        <option value="Main Dish">Main Dish</option>
                        <option value="Sides">Sides</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Grocery">Grocery</option>
                        <option value="Soap">Soap</option>
                        <option value="Baking">Baking</option>
                        <option value="Cooking Oil">Cooking Oil</option>
                        <option value="Starter">Starter</option>
                        <option value="Honey">Cooking Honey</option>
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => startEdit(p)} className="text-blue-500 text-xs font-bold hover:underline transition">Edit Info</button>
                      <button onClick={() => deleteProduct(p.id)} className="text-red-400 text-xs font-bold hover:underline transition">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- ORDERS TAB --- */}
      {activeTab === 'orders' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <h3 className="font-bold text-gray-400 uppercase text-sm mb-4 tracking-widest">Recent Transactions</h3>
          {orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span 
                    className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm
                      ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                        o.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' : 
                        o.status === 'Preparing' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}
                    `}
                  >
                    {o.status || 'Paid'}
                  </span>
                  <p className="text-sm font-mono text-gray-400">ID: {o.id.toString().slice(0,8)}</p>
                </div>
                
                <div className="space-y-1 mb-4">
                  {o.items.map((item, i) => (
                    <p key={i} className="text-sm text-gray-700">
                      <span className="font-bold" style={{ color: brandConfig.primaryColor }}>{item.quantity}x</span> {item.name}
                    </p>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Update Progress:</p>
                  <select 
                    value={o.status || 'Paid'}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', o.id);
                      if (!error) fetchData();
                      else alert("Failed to update status");
                    }}
                    className="bg-gray-50 border border-gray-200 text-sm rounded-lg p-2 focus:outline-none cursor-pointer hover:border-gray-400 transition"
                  >
                    <option value="Paid">Paid (New)</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="md:text-right flex flex-col justify-between items-end">
                <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                <div>
                  <p className="text-2xl font-black" style={{ color: brandConfig.primaryColor }}>₦{o.total_amount.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-300 font-mono uppercase">Ref: {o.payment_reference}</p>
                  {userProfile?.brand_id === 'all' && (
                     <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 uppercase font-bold">Brand: {o.brand_id}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</p>
              <h2 className="text-4xl font-black" style={{ color: brandConfig.primaryColor }}>₦{totalRevenue.toLocaleString()}</h2>
              {isSuperAdmin && (
                <>
                  <p className="text-[10px] text-blue-500 font-bold mt-2 uppercase tracking-tighter">Combined Brand Earnings</p>
                  <div className="mt-6 pt-4 border-t border-dashed border-gray-100 space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Earnings by Brand:</p>
                    {Object.entries(revenueByBrand).map(([brandName, amount]) => (
                      <div key={brandName} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-500">
                          {brandName === 'pantry-co' ? '📦 Pantry' : brandName === 'yummys' ? '🍴 Yummys' : brandName}
                        </span>
                        <span className="text-sm font-bold text-gray-800">₦{amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Orders</p>
              <h2 className="text-4xl font-black text-gray-800">{totalOrders}</h2>
              <p className="text-xs text-gray-400 mt-2">Completed sales</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Avg. Order Value</p>
              <h2 className="text-4xl font-black text-gray-800">₦{Math.round(averageOrderValue).toLocaleString()}</h2>
              <p className="text-xs text-gray-400 mt-2">Per unique visit</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><span>🏆</span> Top Selling Items Across Brands</h3>
            <div className="space-y-4">
              {topProducts.length > 0 ? topProducts.map(([name, qty], index) => {
                const itemBrand = products.find((p) => p.name === name)?.brand_id;
                return (
                  <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <div>
                      <p className="font-bold text-gray-700">{name}</p>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-400">{itemBrand || "Unknown"}</span>
                    </div>
                    <span style={{ backgroundColor: brandConfig.lightColor, color: brandConfig.accentColor }} className="px-3 py-1 rounded-full text-xs font-black">{qty} Sold</span>
                  </div>
                );
              }) : <p className="text-gray-400 italic">No sales data yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto animate-fade-in">
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const bId = userProfile?.brand_id === 'all' ? import.meta.env.VITE_BRAND : userProfile.brand_id;
              const { error } = await supabase.from('site_settings').upsert({ brand_id: bId, ...settings });
              if (!error) alert("Website updated successfully! 🚀");
              else alert(error.message);
            }}
            className="bg-white p-8 rounded-3xl shadow-lg space-y-6"
          >
            <h3 className="text-xl font-bold mb-4">Edit Website Content</h3>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hero Title</label>
              <input type="text" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} className="w-full border p-3 rounded-xl focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hero Subtitle</label>
              <textarea value={settings.hero_subtitle} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full border p-3 rounded-xl h-24 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">About Our Story</label>
              <textarea value={settings.about_story} onChange={e => setSettings({...settings, about_story: e.target.value})} className="w-full border p-3 rounded-xl h-32 focus:outline-none" />
            </div>
            <button style={{ backgroundColor: brandConfig.primaryColor }} className="w-full py-4 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition">Update Live Website</button>
          </form>
        </div>
      )}
    </div>
  );
}