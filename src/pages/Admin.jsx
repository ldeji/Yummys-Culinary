import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

export default function Admin({ user }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false); // FIXED: Added missing saving state
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [settings, setSettings] = useState({ hero_title: '', hero_subtitle: '', cta_button_text: '', about_story: '' });
  const navigate = useNavigate();

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', long_description: '', 
    image_url: '', ingredients: '', category: 'General', 
    is_available: true, brand_id: '' // <-- Added brand_id
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  async function checkAdmin() {
    if (!user) { navigate('/login'); return; }
    try {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile?.role === 'admin') { 
        setUserProfile(profile); 
        await fetchData(profile); 
      } else { 
        navigate('/'); 
      }
    } catch (err) {
      console.error("Admin check error", err);
      navigate('/');
    }
  }

  async function fetchData(currentProfile = userProfile) {
    if (!currentProfile) return;
    try {
      const currentSiteBrand = import.meta.env.VITE_BRAND || 'yummys';
      const isSuper = currentProfile.brand_id === 'all';
      
      let pQuery = supabase.from('products').select('*');
      let oQuery = supabase.from('orders').select('*');
      
      if (!isSuper) {
        pQuery = pQuery.eq('brand_id', currentProfile.brand_id);
        oQuery = oQuery.eq('brand_id', currentProfile.brand_id);
      }

      const [pRes, oRes, sRes] = await Promise.all([
        pQuery.order('id', { ascending: false }), 
        oQuery.order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*').eq('brand_id', currentSiteBrand).single()
      ]);

      setProducts(pRes.data || []);
      setOrders(oRes.data || []);
      if (sRes.data) setSettings(sRes.data);
    } catch (err) { 
      console.error("Data Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  }

  const getImageUrl = (p) => {
    if (!p.image_url) return "https://via.placeholder.com/150";
    if (p.image_url.startsWith('http')) return p.image_url;
    return `/images/${p.brand_id === 'pantry-co' ? 'pantry' : 'yummys'}/${p.image_url}`;
  };

   async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      console.log("1. Starting image compression...");

      // useWebWorker: false makes this more stable if the browser is struggling
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: false };
      const compressed = await imageCompression(file, options);
      const fileName = `${Date.now()}.webp`;

      console.log("2. Sending to Supabase Cloud...");

      // CREATE A TIMEOUT (If network drops, this kills the upload after 15 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Network connection dropped. Please try again.")), 15000)
      );

      const uploadPromise = supabase.storage.from('product-images').upload(fileName, compressed);

      // Race the upload against the timeout
      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) throw error;

      console.log("3. Upload Success! Getting URL...");
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      
      setNewProduct(prev => ({ ...prev, image_url: urlData.publicUrl }));
      alert("Image uploaded successfully! ✅");

    } catch (err) {
      console.error("Upload Error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      // THIS WILL ALWAYS RUN, EVEN IF THE NETWORK DROPS
      setUploading(false);
      console.log("4. Upload cycle finished, UI unlocked.");
    }
  }

  const startEdit = (p) => {
    setEditingId(p.id);
    
    setNewProduct({
      name: p.name || '',
      price: p.price || '',
      description: p.description || '',
      long_description: p.long_description || '',
      image_url: p.image_url || '',
      category: p.category || 'General',
      is_available: p.is_available ?? true,
      ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(', ') : (p.ingredients || ''),
      brand_id: p.brand_id // CRITICAL: This ensures it doesn't get lost
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

 async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return; // Prevent double-clicking
    setSaving(true);
    
    try {
      console.log("1. Preparing data for ID:", editingId);
      const currentSiteBrand = import.meta.env.VITE_BRAND || 'yummys';
      
      // Clean ingredients safely
      const rawIng = newProduct.ingredients || "";
      const ingArray = typeof rawIng === 'string' 
        ? rawIng.split(',').map(i => i.trim()).filter(i => i !== "")
        : rawIng;

      // Build the EXACT payload safely
      const payload = { 
        name: (newProduct.name || "").trim(),
        price: Number(newProduct.price || 0),
        description: (newProduct.description || "").trim(),
        image_url: newProduct.image_url || "",
        ingredients: ingArray, 
        category: newProduct.category || "General",
        is_available: newProduct.is_available ?? true,
        brand_id: editingId ? newProduct.brand_id : currentSiteBrand
      };

      if (newProduct.long_description) {
        payload.long_description = newProduct.long_description.trim();
      }

      console.log("2. Sending payload to database:", payload);

      // --- THE TIMEOUT TRICK ---
      // This forces the app to stop waiting if Supabase hangs for more than 10 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database connection timed out. Please try again.")), 10000)
      );

      let dbRequest;
      if (editingId) {
        dbRequest = supabase.from('products').update(payload).eq('id', editingId);
      } else {
        dbRequest = supabase.from('products').insert([payload]);
      }

      // Race the database request against the 10-second timeout
      const { data, error } = await Promise.race([dbRequest, timeoutPromise]);

      if (error) {
        console.error("3. Supabase Update Error:", error);
        throw error;
      }

      console.log("4. Save successful! Clearing form...");
      alert(editingId ? "Product Updated Successfully! ✅" : "Product Created Successfully! ✨");

      // Reset form
      setEditingId(null);
      setNewProduct({ name:'', price:'', description:'', long_description:'', image_url:'', ingredients:'', category:'General', is_available:true, brand_id:'' });
      
      // Refresh data in background (do not await so it doesn't freeze UI)
      fetchData(userProfile); 
      
    } catch (error) {
      console.error("CRITICAL ERROR:", error);
      alert("Update Failed: " + error.message);
    } finally {
      console.log("5. Unlocking button...");
      setSaving(false); // FORCES the "Saving..." text to disappear
    }
  }

  async function deleteProduct(id) {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await supabase.from('products').delete().eq('id', id);
        await fetchData(userProfile); 
      } catch (err) {
        alert("Delete Error: " + err.message);
      }
    }
  }

  async function toggleAvailability(id, currentStatus) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_available: !currentStatus } : p));
    await supabase.from('products').update({ is_available: !currentStatus }).eq('id', id);
  }

  async function updateProductCategory(id, newCategory) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
    await supabase.from('products').update({ category: newCategory }).eq('id', id);
  }

  // ANALYTICS MATH
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-gray-500">Loading Dashboard Data...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold" style={{ color: brandConfig.primaryColor }}>Admin Panel</h1>
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
          {['products', 'orders', 'analytics', 'settings'].map(tab => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-4 md:px-6 py-2 rounded-full font-bold capitalize transition whitespace-nowrap ${activeTab === tab ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg h-fit space-y-4 border-2" style={{ borderColor: editingId ? brandConfig.primaryColor : 'transparent' }}>
            <h3 className="text-xl font-bold">{editingId ? '📝 Edit Product' : '✨ Add New Product'}</h3>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
              <input id="prod_name" name="prod_name" type="text" placeholder="Name" className="w-full border-2 p-3 rounded-xl focus:outline-none" required value={newProduct.name || ""} onChange={e => setNewProduct({...newProduct, name: e.target.value})} style={{ borderColor: brandConfig.primaryColor }} />
              
              <label className="text-xs font-bold text-gray-500 uppercase">Price (₦)</label>
              <input id="prod_price" name="prod_price" type="number" placeholder="Price" className="w-full border-2 p-3 rounded-xl focus:outline-none" required value={newProduct.price || ""} onChange={e => setNewProduct({...newProduct, price: e.target.value})} style={{ borderColor: brandConfig.primaryColor }} />
              
              <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
              <textarea id="prod_desc" name="prod_desc" placeholder="Description" className="w-full border-2 p-3 rounded-xl h-24 focus:outline-none" value={newProduct.description || ""} onChange={e => setNewProduct({...newProduct, description: e.target.value})} style={{ borderColor: brandConfig.primaryColor }} />
              
              <label className="text-xs font-bold text-gray-500 uppercase">Ingredients (Comma Separated)</label>
              <input id="prod_ing" name="prod_ing" type="text" placeholder="Ingredients" className="w-full border-2 p-3 rounded-xl focus:outline-none" value={newProduct.ingredients || ""} onChange={e => setNewProduct({...newProduct, ingredients: e.target.value})} style={{ borderColor: brandConfig.primaryColor }} />
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
                 <img src={getImageUrl({ image_url: newProduct.image_url, brand_id: import.meta.env.VITE_BRAND })} className="h-32 w-full object-contain rounded-lg mt-4 bg-white p-2 border" alt="preview" />
               )}
            </div>

            <button type="submit" disabled={uploading || saving} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-4 rounded-xl font-bold shadow-lg hover:brightness-110 disabled:opacity-50 transition-all">
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Save Product'}
            </button>
           {editingId && (
            <button 
              type="button" 
              onClick={() => { 
                // Reset all logic
                setEditingId(null); 
                setUploading(false); // Forces the upload spinner to stop
                setSaving(false);    // Forces the save spinner to stop
                
                // Clear the form
                setNewProduct({
                  name: '', price: '', description: '', long_description: '', 
                  image_url: '', ingredients: '', category: 'General', 
                  is_available: true, brand_id: '' 
                }); 
              }} 
                className="w-full bg-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-300 transition-all"
              >
                Cancel Editing
              </button>
            )}
          </form>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-400 uppercase text-sm">Inventory ({products.length})</h3>
              <button type="button" onClick={() => fetchData(userProfile)} className="text-xs font-bold text-blue-500 hover:underline">Force Refresh</button>
            </div>
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={getImageUrl(p)} className={`h-16 w-16 object-contain bg-gray-50 rounded-xl p-1 border ${!p.is_available ? 'grayscale opacity-50' : ''}`} alt="" />
                    <div>
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-sm font-bold" style={{ color: brandConfig.primaryColor }}>₦{p.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.preventDefault(); toggleAvailability(p.id, p.is_available); }} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.is_available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {p.is_available ? '● In Stock' : '○ Sold Out'}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Cat:</span>
                    <select value={p.category || 'General'} onChange={(e) => updateProductCategory(p.id, e.target.value)} className="text-xs bg-gray-50 rounded-md px-2 py-1 font-bold text-gray-600 cursor-pointer">
                      <option value="General">General</option>
                      <option value="Main Dish">Main Dish</option>
                      <option value="Sides">Sides</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Toiletries">Toiletries</option>
                      <option value="Beverages">Beverages</option>
                      <option value="Cookings">Cookings</option>
                      <option value="Cleaning">Cleaning</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => startEdit(p)} className="text-blue-500 text-xs font-bold hover:underline">Edit Info</button>
                    <button type="button" onClick={() => deleteProduct(p.id)} className="text-red-400 text-xs font-bold hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ORDERS TAB --- */}
      {activeTab === 'orders' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${o.status === 'Completed' ? 'bg-green-100 text-green-700' : o.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' : o.status === 'Preparing' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                    {o.status || 'Paid'}
                  </span>
                  <p className="text-sm font-mono text-gray-400">ID: {o.id.toString().slice(0,8)}</p>
                </div>
                <div className="space-y-1 mb-4">
                  {o.items.map((item, i) => (
                    <p key={i} className="text-sm text-gray-700"><span className="font-bold" style={{ color: brandConfig.primaryColor }}>{item.quantity}x</span> {item.name}</p>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <select value={o.status || 'Paid'} onChange={async (e) => { const { error } = await supabase.from('orders').update({ status: e.target.value }).eq('id', o.id); if(!error) fetchData(userProfile); }} className="bg-gray-50 text-sm rounded-lg p-2 cursor-pointer">
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
                  {isSuperAdmin && <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 uppercase font-bold">Brand: {o.brand_id}</span>}
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
              <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Revenue</p>
              <h2 className="text-4xl font-black" style={{ color: brandConfig.primaryColor }}>₦{totalRevenue.toLocaleString()}</h2>
              {isSuperAdmin && (
                <div className="mt-6 pt-4 border-t border-dashed border-gray-100 space-y-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Earnings by Brand:</p>
                  {Object.entries(revenueByBrand).map(([brandName, amount]) => (
                    <div key={brandName} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <span className="text-[10px] font-black uppercase text-gray-500">{brandName}</span>
                      <span className="text-sm font-bold text-gray-800">₦{amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
              <p className="text-gray-400 text-xs font-bold uppercase mb-2">Total Orders</p>
              <h2 className="text-4xl font-black text-gray-800">{totalOrders}</h2>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
              <p className="text-gray-400 text-xs font-bold uppercase mb-2">Avg. Order Value</p>
              <h2 className="text-4xl font-black text-gray-800">₦{Math.round(averageOrderValue).toLocaleString()}</h2>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><span>🏆</span> Top Selling Items</h3>
            <div className="space-y-4">
              {topProducts.length > 0 ? topProducts.map(([name, qty], index) => {
                const itemBrand = products.find((p) => p.name === name)?.brand_id;
                return (
                  <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <div>
                      <p className="font-bold text-gray-700">{name}</p>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-400">{itemBrand || "Unknown"}</span>
                    </div>
                    <span style={{ backgroundColor: brandConfig.lightColor, color: brandConfig.primaryColor }} className="px-3 py-1 rounded-full text-xs font-black">{qty} Sold</span>
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
              setSaving(true);
              const bId = userProfile?.brand_id === 'all' ? import.meta.env.VITE_BRAND : userProfile.brand_id;
              const { error } = await supabase.from('site_settings').upsert({ brand_id: bId, ...settings });
              if (!error) alert("Website updated successfully! 🚀");
              else alert(error.message);
              setSaving(false);
            }}
            className="bg-white p-8 rounded-3xl shadow-lg space-y-6"
          >
            <h3 className="text-xl font-bold mb-4">Edit Website Content</h3>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hero Title</label>
              <input type="text" value={settings.hero_title || ""} onChange={e => setSettings({...settings, hero_title: e.target.value})} className="w-full border-2 p-3 rounded-xl focus:outline-none" style={{ borderColor: brandConfig.primaryColor }} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hero Subtitle</label>
              <textarea value={settings.hero_subtitle || ""} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} className="w-full border-2 p-3 rounded-xl h-24 focus:outline-none" style={{ borderColor: brandConfig.primaryColor }} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">About Our Story</label>
              <textarea value={settings.about_story || ""} onChange={e => setSettings({...settings, about_story: e.target.value})} className="w-full border-2 p-3 rounded-xl h-32 focus:outline-none" style={{ borderColor: brandConfig.primaryColor }} />
            </div>
            <button type="submit" disabled={saving} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full py-4 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition disabled:opacity-50">
              {saving ? 'Updating Site...' : 'Update Live Website'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}