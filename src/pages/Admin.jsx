import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { FaChartLine, FaBox, FaHistory, FaCog, FaMoneyBillWave, FaCloudUploadAlt, FaTrash } from 'react-icons/fa';

export default function Admin({ user }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  const [settings, setSettings] = useState({ hero_title: '', about_story: '' });
  const navigate = useNavigate();
  const currentSiteBrand = import.meta.env.VITE_BRAND || 'yummys';

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', image_url: '', 
    category: 'General', is_available: true, stock_quantity: 0 
  });

  useEffect(() => { checkAdmin(); }, [user]);

  async function checkAdmin() {
    if (!user) { navigate('/login'); return; }
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile?.role === 'admin') { 
        setUserProfile(profile); 
        await fetchData(profile); 
      } 
      else { navigate('/'); }
    } catch (err) { navigate('/'); }
  }

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

  // --- IMAGE UPLOAD LOGIC (RESTORED) ---
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: false };
      const compressed = await imageCompression(file, options);
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}.webp`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressed);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setNewProduct(prev => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (err) { 
      alert("Image upload failed: " + err.message); 
    } finally { 
      setUploading(false); 
    }
  }

  // --- REVENUE & ANALYTICS ---
  const totalRevenue = orders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
  const getTopSellingProducts = () => {
    const counts = {};
    orders.forEach(order => {
      order.items?.forEach(item => { counts[item.name] = (counts[item.name] || 0) + (item.quantity || 1); });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  // --- PRODUCT SUBMIT ---
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
      setNewProduct({ name:'', price:'', description:'', image_url:'', category:'General', stock_quantity: 0 });
      fetchData();
      alert("Store Updated!");
    } catch (err) { alert(err.message); } finally { setSaving(false); }
  }

  // --- ORDER STATUS UPDATE ---
  const handleStatusUpdate = async (orderId, newStatus) => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus }) // Ensure the column name is 'status' in Supabase
      .eq('id', orderId);

    if (error) throw error;
    
    // Refresh the local data so the UI reflects the change
    fetchOrders(); 
    alert(`Order updated to: ${newStatus}`);
  } catch (error) {
    console.error("Error updating status:", error.message);
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
    <div className="max-w-7xl mx-auto p-4 md:p-10 min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter" style={{ color: brandConfig.primaryColor }}>Control Panel</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{userProfile?.brand_id === 'all' ? 'System Administrator' : brandConfig.name}</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border overflow-x-auto no-scrollbar">
          {['products', 'orders', 'analytics', 'settings'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {/* 1. PRODUCTS TAB (Restored with Image Upload) */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-100 h-fit space-y-5">
            <h3 className="text-xl font-black uppercase">{editingId ? 'Update Product' : 'Create Product'}</h3>
            
            {/* IMAGE UPLOAD UI */}
            <div className="relative w-full h-48 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden group">
              {newProduct.image_url ? (
                <>
                  <img src={newProduct.image_url} className="w-full h-full object-contain p-4" alt="preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl font-bold text-xs">Change Image</label>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <FaCloudUploadAlt className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Upload Product Image</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-xs">Uploading...</div>}
            </div>

            <input type="text" placeholder="Product Name" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Price" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              <input type="number" placeholder="Stock" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm" required value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} />
            </div>
              
              {/* CATEGORY DROPDOWN */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Category</label>
              <select 
                value={newProduct.category || ""} 
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-sm font-bold appearance-none cursor-pointer"
              >
                <option value="">Select Category</option>
                {brandConfig.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <textarea placeholder="Description" className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-sm h-24" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            
            <button type="submit" disabled={saving || uploading} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:brightness-110 disabled:opacity-50">
              {saving ? 'Syncing...' : 'Save to Cloud'}
            </button>
            {editingId && <button type="button" onClick={() => setEditingId(null)} className="w-full text-gray-400 font-bold text-xs uppercase">Cancel Edit</button>}
          </form>

              {/* PRODUCTS LIST */}
         <div className="lg:col-span-2 space-y-4">
          {products.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <img src={getImageUrl(p.image_url)} className="h-16 w-16 object-contain rounded-2xl bg-gray-50" alt="" />
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight">{p.name}</h4>
                  
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-xs" style={{ color: brandConfig.primaryColor }}>
                      ₦{p.price.toLocaleString()} • {p.stock_quantity} in stock
                    </p>
                    
                    {/* NEW: CATEGORY LABEL */}
                    {p.category && (
                      <span className="bg-gray-100 text-[9px] px-2 py-0.5 rounded-full font-black uppercase text-gray-400">
                        {p.category}
                      </span>
                    )}
                  </div>
                  
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(p.id); setNewProduct(p); window.scrollTo(0,0); }} className="p-3 bg-gray-50 rounded-xl text-blue-600 hover:bg-blue-100"><FaCog /></button>
                <button onClick={async () => { if(confirm("Delete?")) { await supabase.from('products').delete().eq('id', p.id); fetchData(); } }} className="p-3 bg-gray-50 rounded-xl text-red-500 hover:bg-red-100"><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

            {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-1">Total Platform Revenue</h3>
                <p className="text-5xl font-black tracking-tighter">₦{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 text-green-600 px-6 py-3 rounded-full font-black text-xs uppercase">{orders.length} Sales</div>
            </div>
            
            <div className="bg-white rounded-[40px] overflow-hidden border">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                  <tr>
                    <th className="p-6">Order Info</th>
                    <th className="p-6">Items</th>
                    <th className="p-6">Amount</th>
                    <th className="p-6">Status Control</th> {/* New Column */}
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-6 font-bold uppercase">
                        #{o.id.toString().slice(0,8)}
                        <br/>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      
                      <td className="p-6 text-xs text-gray-500">
                        {o.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </td>
                      
                      <td className="p-6 font-black text-gray-900">
                        ₦{o.total_amount?.toLocaleString()}
                      </td>

                      {/* STATUS DROPDOWN COLUMN */}
                      <td className="p-6">
                        <select 
                          value={o.status || "Pending"}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const { error } = await supabase
                              .from('orders')
                              .update({ status: newStatus })
                              .eq('id', o.id);
                            
                            if (!error) {
                              // Call your fetch function here to refresh the UI
                              if (typeof fetchData === 'function') fetchData();
                              else if (typeof fetchOrders === 'function') fetchOrders();
                            } else {
                              alert("Error updating status");
                            }
                          }}
                          className="bg-gray-50 border-none text-[10px] font-black uppercase py-2 px-3 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none"
                        >
                          <option value="Pending">⏳ Pending</option>
                          <option value="Paid">💰 Paid</option>
                          <option value="Out for delivery">🚚 Out for delivery</option>
                          <option value="Completed">✅ Completed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* 3. ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[40px] border">
            <h3 className="text-xl font-black uppercase mb-8 flex items-center gap-2"><FaChartLine /> Top 5 Products</h3>
            <div className="space-y-6">
              {getTopSellingProducts().map(([name, qty], i) => (
                <div key={name} className="flex justify-between items-center">
                  <p className="font-bold text-gray-600"><span className="text-gray-300 mr-3">0{i+1}</span>{name}</p>
                  <span className="font-black text-xs bg-gray-100 px-3 py-1 rounded-lg">{qty} Sold</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-black text-white p-10 rounded-[40px] relative overflow-hidden">
             <FaMoneyBillWave className="absolute -right-10 -bottom-10 text-white/5 text-[180px]" />
             <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-4">Saas Billing</h3>
             <p className="text-2xl font-bold leading-tight">Monthly revenue share is active. Ensure all brand admins settle their commission by the 30th.</p>
          </div>
        </div>
      )}

      {/* 4. SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl">
          <form onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await supabase.from('site_settings').upsert({ brand_id: currentSiteBrand, hero_title: settings.hero_title, about_story: settings.about_story });
            setSaving(false);
            alert("Updated!");
          }} className="bg-white p-10 rounded-[40px] border space-y-6">
            <h3 className="text-xl font-black uppercase">CMS Content</h3>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Home Title</label>
              <input type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold" value={settings.hero_title} onChange={e => setSettings({...settings, hero_title: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Our Story</label>
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl font-bold h-40" value={settings.about_story} onChange={e => setSettings({...settings, about_story: e.target.value})} />
            </div>
            <button type="submit" disabled={saving} style={{ backgroundColor: brandConfig.primaryColor }} className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg">
              {saving ? 'Saving...' : 'Update Store Content'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}