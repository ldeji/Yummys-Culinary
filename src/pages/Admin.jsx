import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { FaChartLine, FaBox, FaHistory, FaCog, FaMoneyBillWave, FaCloudUploadAlt, FaUndo, FaTrash } from 'react-icons/fa';

export default function Admin({ user }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  
  const [settings, setSettings] = useState({ 
    hero_title: '', 
    hero_subtitle: '', 
    cta_button_text: '', 
    about_story: '',
    about_hero_title: '',
    about_hero_accent: '',
    about_hero_description: '',
    established_year: '', 
  });

  const navigate = useNavigate();
  const currentSiteBrand = import.meta.env.VITE_BRAND || 'yummys';

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', image_url: '', 
    category: 'General', is_available: true, stock_quantity: 0, ingredients: ''
  });

 useEffect(() => {
  checkAdmin();
}, [user]);

async function checkAdmin() {
  if (!user) {
    navigate("/login");
    return;
  }

  try {
   const { data: profile } = await supabase
  .from("profiles")
  .select("full_name, phone, address, role, brand_id")
  .eq("id", user.id)
  .single();

    const currentBrand = import.meta.env.VITE_BRAND || "yummys";

    const hasAccess =
      profile?.role === "super_admin" ||
      (profile?.role === "admin" &&
        profile?.brand_id === currentBrand);

    if (hasAccess) {
      setUserProfile(profile);
      await fetchData(profile);
    } else {
      navigate("/");
    }
  } catch (err) {
    navigate("/");
  }
}
    // Fetch products, orders, and settings based on the user's profile
  async function fetchData(currentProfile = userProfile) {
    if (!currentProfile) return;
    try {
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
    } finally { setLoading(false); }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: false };
      const compressed = await imageCompression(file, options);
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}.webp`;
      const { error } = await supabase.storage.from('product-images').upload(fileName, compressed);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setNewProduct(prev => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (err) { alert("Upload failed: " + err.message); } finally { setUploading(false); }
  }

  const totalRevenue = orders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
 
  // --- PASTE THIS RIGHT BELOW totalRevenue ---
 const handleResetBrand = async (brandId, currentRevenue) => {
    if (!window.confirm(`⚠️ Permanently archive ${brandId.toUpperCase()} revenue and clear order history?`)) return;
    setSaving(true);
    
    try {
      // 1. Fetch current lifetime revenue
      const { data: stats } = await supabase.from('site_settings').select('lifetime_revenue').eq('brand_id', brandId).single();
      const newLife = (stats?.lifetime_revenue || 0) + currentRevenue;
      
      // 2. Save new lifetime revenue
      const { error: upsertError } = await supabase.from('site_settings').upsert({ brand_id: brandId, lifetime_revenue: newLife });
      if (upsertError) throw upsertError;
      
      // 3. Delete the orders for this brand (Check if it actually deletes)
      const { error: deleteError, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .eq('brand_id', brandId);
        
      if (deleteError) throw deleteError;
      
      // If count is 0, it means the database blocked it!
      if (count === 0) {
        throw new Error("Action blocked by database! Please run the SQL DELETE policy in Supabase.");
      }
      
      // 4. Instantly clear from UI only if database deletion was successful
      setOrders(prev => prev.filter(o => o.brand_id !== brandId));
      alert(`Success! ${count} orders cleared and revenue archived for ${brandId}.`);
      
    } catch (err) {
      console.error("Reset Error:", err);
      alert("Reset failed: " + err.message);
    } finally { 
      setSaving(false); 
    }
  };


  const getTopSellingProducts = () => {
    const counts = {};
    orders.forEach(order => {
      order.items?.forEach(item => { counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1); });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { 
        ...newProduct,
        brand_id: editingId ? newProduct.brand_id : (userProfile.brand_id === 'all' ? currentSiteBrand : userProfile.brand_id)
      };
      let res = editingId ? await supabase.from('products').update(payload).eq('id', editingId) : await supabase.from('products').insert([payload]);
      if (res.error) throw res.error;
      setEditingId(null);
      setNewProduct({ name:'', price:'', description:'', image_url:'', category:'General', stock_quantity: 0, ingredients: '' });
      fetchData();
      alert("Store Updated!");
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

 const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // Instantly update the UI without reloading the page
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    return `/images/${userProfile?.brand_id === 'pantry-co' ? 'pantry' : 'yummys'}/${url}`;
  };

  if (loading) return <div className="p-20 text-center font-bold animate-pulse">Loading Admin Console...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 min-h-screen bg-gray-50 overflow-x-hidden">
      
      {/* 1. RESPONSIVE HEADER & NAVIGATION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter" style={{ color: brandConfig.primaryColor }}>Control Panel</h1>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{userProfile?.brand_id === 'all' ? 'System Administrator' : brandConfig.name}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 w-full lg:w-auto bg-white p-1 rounded-2xl shadow-sm border gap-1">
          {['products', 'orders', 'analytics', 'settings'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-3 py-3 rounded-xl font-black text-[9px] sm:text-xs uppercase tracking-tighter sm:tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PRODUCTS TAB */}
      {activeTab === 'products' && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
    
    {/* LEFT SIDE: FORM */}
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[40px] shadow-xl border border-gray-100 h-fit space-y-5">
      <h3 className="text-xl font-black uppercase tracking-tighter">{editingId ? 'Edit Item' : 'New Item'}</h3>
      
      <div className="relative w-full h-48 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden">
        {newProduct.image_url ? (
          <img src={newProduct.image_url} className="w-full h-full object-contain p-4" alt="preview" />
        ) : (
          <div className="text-center"><FaCloudUploadAlt className="text-3xl text-gray-300 mx-auto" /><p className="text-[9px] font-bold text-gray-400 uppercase mt-2">Upload Photo</p></div>
        )}
        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-[10px] font-black uppercase">Uploading...</div>}
      </div>

      <input type="text" placeholder="Name" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="Price" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
        <input type="number" placeholder="Stock" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm" required value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} />
      </div>

      <select value={newProduct.category || ""} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm font-bold cursor-pointer">
        <option value="">Category</option>
        {brandConfig.categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
      </select>

      <textarea placeholder="Ingredients" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm h-20" value={newProduct.ingredients} onChange={e => setNewProduct({...newProduct, ingredients: e.target.value})} />
      <textarea placeholder="Description" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm h-20" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
      
      <button type="submit" disabled={saving || uploading} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">
        {saving ? 'Syncing...' : 'Save Product'}
      </button>
      {editingId && <button type="button" onClick={() => { setEditingId(null); setNewProduct({ name:'', price:'', description:'', image_url:'', category:'General', stock_quantity: 0, ingredients: '' }); }} className="w-full text-gray-400 font-bold text-xs uppercase pt-2">Cancel</button>}
    </form>

    {/* RIGHT SIDE: SEARCH & LIST */}
    <div className="lg:col-span-2 space-y-4">
      
      {/* SEARCH BAR COMPONENT */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <FaBox className="text-gray-300 group-focus-within:text-black transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="SEARCH PRODUCTS BY NAME..." 
          className="w-full bg-white border border-gray-100 p-5 pl-12 rounded-[32px] font-black text-[10px] uppercase tracking-widest shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
        />
        {adminSearch && (
          <button 
            onClick={() => setAdminSearch('')}
            className="absolute inset-y-0 right-5 text-[10px] font-black text-gray-300 hover:text-red-500 uppercase"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        {products
          .filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase()))
          .map(p => (
          <div key={p.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-4">
              <img src={getImageUrl(p.image_url)} className="h-14 w-14 object-contain rounded-2xl bg-gray-50" alt="" />
              <div>
                <h4 className="font-black text-xs uppercase tracking-tight">{p.name}</h4>
                <p className="font-bold text-[10px]" style={{ color: brandConfig.primaryColor }}>₦{p.price.toLocaleString()} • {p.stock_quantity} Left</p>
                {p.category && <span className="bg-gray-100 text-[8px] px-2 py-0.5 rounded-full font-black uppercase text-gray-400 mt-1 inline-block">{p.category}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingId(p.id); setNewProduct(p); window.scrollTo(0,0); }} className="p-3 bg-gray-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors"><FaCog /></button>
              <button onClick={async () => { if(confirm("Delete product?")) { await supabase.from('products').delete().eq('id', p.id); fetchData(); } }} className="p-3 bg-gray-50 rounded-xl text-red-500 hover:bg-red-100 transition-colors"><FaTrash /></button>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {products.filter(p => p.name.toLowerCase().includes(adminSearch.toLowerCase())).length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.2em]">No products match "{adminSearch}"</p>
          </div>
        )}
      </div>
    </div>
  </div>
)}

  {/* 3. ORDERS TAB (Month Grouping & Brand Stats) */}
      {activeTab === 'orders' && (
        <div className="space-y-10">
          <div
            className={`grid gap-6 ${
              userProfile?.brand_id === "all"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 lg:grid-cols-3"
            }`}
          >
            {userProfile?.brand_id === 'all' ? (
              <>
                {Object.entries(
                  orders.reduce((acc, o) => {
                    acc[o.brand_id] = (acc[o.brand_id] || 0) + (o.total_amount || 0);
                    return acc;
                  }, {})
                ).map(([bid, rev]) => (
                  <div
                    key={bid}
                    className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative group"
                  >
                    {/* THE RESET BUTTON IS BACK 👇 */}
          <button 
            onClick={() => handleResetBrand(bid, rev)} 
            disabled={rev === 0} 
            className="absolute top-5 right-5 text-gray-200 hover:text-red-500 transition-colors disabled:opacity-0"
            title="Archive & Reset Brand"
          >
            <FaUndo size={14} />
          </button>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">
                      {bid} Income
                    </p>
                    <p className="text-2xl font-black tracking-tighter">
                      ₦{rev.toLocaleString()}
                    </p>
                  </div>
                ))}

                <div className="bg-black text-white p-6 rounded-[32px] shadow-lg">
                  <p className="text-[10px] font-black uppercase text-gray-500 mb-1">
                    Total Platform
                  </p>
                  <p className="text-2xl font-black tracking-tighter">
                    ₦{totalRevenue.toLocaleString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="lg:col-span-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white p-8 rounded-[32px] shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] font-bold opacity-80">
                    Total Revenue
                  </p>
                  <h2 className="text-4xl lg:text-5xl font-black mt-3">
                    ₦{totalRevenue.toLocaleString()}
                  </h2>
                  <p className="text-sm opacity-80 mt-2 uppercase">
                    {userProfile?.brand_id}
                  </p>
                </div>
                <div className="hidden lg:flex items-center justify-center w-24 h-24 rounded-full bg-white/20 text-6xl font-black">
                  ₦
                </div>
              </div>
            )}
          </div>

          {/* ORDERS GROUPED BY MONTH */}
          {Object.entries(
            orders.reduce((acc, o) => {
              const m = new Date(o.created_at).toLocaleString("default", {
                month: "long",
                year: "numeric",
              });
              if (!acc[m]) acc[m] = [];
              acc[m].push(o);
              return acc;
            }, {})
          ).map(([month, mOrders]) => (
            <div key={month} className="space-y-4">
              <div className="flex items-center gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                  {month}
                </h3>
                <div className="h-[1px] w-full bg-gray-100"></div>
              </div>

              {/* TABLE CONTAINER - Fixed widths for responsive desktop view */}
              <div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left">
                    <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                      <tr>
                        <th className="p-4 whitespace-nowrap">Order Info</th>
                        {userProfile?.brand_id === "all" && (
                          <th className="p-4 whitespace-nowrap">Brand</th>
                        )}
                        {/* Merged Customer and Address for cleaner UI */}
                        <th className="p-4 whitespace-nowrap">Customer Details</th>
                        <th className="p-4 whitespace-nowrap">Items</th>
                        <th className="p-4 whitespace-nowrap">Amount</th>
                        <th className="p-4 whitespace-nowrap">Status Control</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y text-sm">
                      {mOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          
                          {/* ORDER */}
                          <td className="p-4 align-top whitespace-nowrap">
                            <div className="font-black text-sm text-gray-900">
                              #{o.id.toString().slice(0, 8)}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 mt-1">
                              {new Date(o.created_at).toLocaleDateString()}
                            </div>
                          </td>

                          {/* BRAND */}
                          {userProfile?.brand_id === "all" && (
                            <td className="p-4 align-top whitespace-nowrap">
                              <span className="text-[9px] font-black px-2 py-1 bg-gray-100 rounded-md uppercase">
                                {o.brand_id}
                              </span>
                            </td>
                          )}

                          {/* CUSTOMER DETAILS (Merged Name, Phone, and Address) */}
                          <td className="p-4 align-top max-w-[200px]">
                            <p className="font-bold text-gray-900 text-xs uppercase leading-tight">
                              {o.customer_name || "N/A"}
                            </p>
                            <p className="text-[10px] font-bold text-blue-500 mt-0.5 mb-1">
                              {o.customer_phone || ""}
                            </p>
                            <p className="text-[10px] text-gray-500 leading-snug break-words">
                              {o.customer_address || "N/A"}
                            </p>
                          </td>

                          {/* ITEMS */}
                          <td className="p-4 align-top max-w-[200px]">
                            <div className="text-[11px] text-gray-600 space-y-1">
                              {o.items?.map((i) => (
                                <div key={i.id} className="leading-tight">
                                  <span className="font-black text-gray-800">{i.quantity}×</span> {i.name}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* AMOUNT */}
                          <td className="p-4 align-top font-black text-gray-900 whitespace-nowrap text-sm">
                            ₦{o.total_amount?.toLocaleString()}
                          </td>

                          {/* STATUS */}
                          <td className="p-4 align-top whitespace-nowrap">
                            <select
                              value={o.status || "Pending"}
                              onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                              className="bg-gray-100 border-none text-[9px] font-black uppercase py-2 px-3 rounded-xl cursor-pointer focus:ring-2 focus:ring-black/10 outline-none w-full max-w-[140px]"
                            >
                              <option value="Pending">⏳ Pending</option>
                              <option value="Paid">₦ Paid</option>
                              <option value="Preparing Your Order">🍳 Preparing</option>
                              <option value="Out for delivery">🚚 Out forDelivery</option>
                              <option value="Completed">✅ Completed</option>
                            </select>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 4. ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[40px] border shadow-sm">
            <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-2 tracking-tighter"><FaChartLine /> Top Selling</h3>
            <div className="space-y-6">
              {getTopSellingProducts().map(([name, qty], i) => (
                <div key={name} className="flex justify-between items-center border-b border-gray-50 pb-2">
                  <p className="font-bold text-xs text-gray-600"><span className="text-gray-300 mr-3">0{i+1}</span>{name}</p>
                  <span className="font-black text-[10px] bg-gray-100 px-3 py-1 rounded-lg uppercase">{qty} Units</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black text-white p-10 rounded-[40px] relative overflow-hidden flex flex-col justify-center min-h-[300px]">
             <FaMoneyBillWave className="absolute -right-10 -bottom-10 text-white/5 text-[180px]" />
             <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-4 tracking-widest">Technical Support</h3>
             <p className="text-2xl font-black leading-tight mb-8 uppercase tracking-tighter">Custom development & monthly maintenance active.</p>
             <a href="https://wa.me/2348057080703" target="_blank" rel="noopener noreferrer" style={{ color: brandConfig.accentColor }} className="text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">Contact Developer →</a>
          </div>
        </div>
      )}

      {/* 5. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto">
          <form onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const { error } = await supabase.from('site_settings').upsert({ 
                brand_id: currentSiteBrand, 
                hero_title: settings.hero_title,
                hero_title_accent: settings.hero_title_accent, 
                hero_subtitle: settings.hero_subtitle,
                cta_button_text: settings.cta_button_text,
                about_hero_title: settings.about_hero_title,
                about_hero_accent: settings.about_hero_accent,
                about_hero_description: settings.about_hero_description,
                about_story: settings.about_story,
                established_year: settings.established_year 
              });
              if (error) throw error;
              alert("Store Content Saved!");
            } catch (err) { alert(err.message); } finally { setSaving(false); fetchData(); }
          }} className="bg-white p-8 md:p-10 rounded-[40px] border shadow-xl space-y-6">
            
            <h3 className="text-xl font-black uppercase tracking-tighter">Storefront CMS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Hero Title</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.hero_title || ''} onChange={e => setSettings({...settings, hero_title: e.target.value})} /></div>            
              <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Hero Title Accent</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.hero_title_accent || ''} onChange={e => setSettings({...settings, hero_title_accent: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Button Text</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.cta_button_text || ''} onChange={e => setSettings({...settings, cta_button_text: e.target.value})} /></div>
            </div>

            <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Hero Subtitle</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.hero_subtitle || ''} onChange={e => setSettings({...settings, hero_subtitle: e.target.value})} /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">About Hero Title</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.about_hero_title || ''} onChange={e => setSettings({...settings, about_hero_title: e.target.value})} /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">About Hero Accent</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.about_hero_accent || ''} onChange={e => setSettings({...settings, about_hero_accent: e.target.value})} /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">About Hero Description</label><textarea className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm h-40" value={settings.about_hero_description || ''} onChange={e => setSettings({...settings, about_hero_description: e.target.value})} /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">About Our Story</label><textarea className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm h-40" value={settings.about_story || ''} onChange={e => setSettings({...settings, about_story: e.target.value})} /></div>
            <div><label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Established Year</label><input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold text-sm" value={settings.established_year || ''} onChange={e => setSettings({...settings, established_year: e.target.value})} /></div>
            <button type="submit" disabled={saving} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-transform">
              {saving ? 'Saving...' : 'Update Store Content'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}