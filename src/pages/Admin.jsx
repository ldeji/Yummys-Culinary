import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';

export default function Admin({ user }) {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', long_description: '', image_url: '', ingredients: ''
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

  // 1. You are the Super Admin
  const isSuperAdmin = profile.brand_id === 'all';
  
  // 2. This is a Client Admin for THIS specific brand
  const isBrandOwner = profile.brand_id === currentBrand;

  if (profile.role === 'admin' && (isSuperAdmin || isBrandOwner)) {
    // ACCESS GRANTED
    fetchData(); 
  } else {
    // ACCESS DENIED
    const brandMessage = isSuperAdmin ? "Super Admin" : profile.brand_id;
    alert(`Access Denied: You are registered as a ${brandMessage} admin. This site is ${currentBrand}.`);
    navigate('/');
  }
}

async function fetchData() {
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('brand_id, role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // SAVE TO STATE SO JSX CAN SEE IT
      setUserProfile(profileData); 

      const isSuperAdmin = profileData?.brand_id === 'all';
      const currentSiteBrand = import.meta.env.VITE_BRAND || 'yummys';

      let productQuery = supabase.from('products').select('*');
      let orderQuery = supabase.from('orders').select('*');

      if (!isSuperAdmin) {
        productQuery = productQuery.eq('brand_id', profileData?.brand_id);
        orderQuery = orderQuery.eq('brand_id', profileData?.brand_id);
      }

      const [prodRes, ordRes] = await Promise.all([
        productQuery,
        orderQuery.order('created_at', { ascending: false })
      ]);

      setProducts(prodRes.data || []);
      setOrders(ordRes.data || []);

    } catch (error) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // IMAGE HELPER
const getImageUrl = (product) => {
  const url = product.image_url;
  
  // 1. If there's no URL, show placeholder
  if (!url) return "https://via.placeholder.com/150";

  // 2. If it's a cloud upload from Supabase (starts with http), use it directly
  if (url.startsWith('http')) return url;

  // 3. THE FIX: Look at the product's OWN brand_id from the database row
  // We don't care which site you are currently logged into.
  const folder = product.brand_id === 'pantry-co' ? 'pantry' : 'yummys';
  
  return `/images/${folder}/${url}`;
};

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setNewProduct({ ...newProduct, image_url: urlData.publicUrl });
      alert("Image uploaded successfully!");
    } catch (error) {
      alert("Upload error: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const brandId = import.meta.env.VITE_BRAND || 'yummys';
    const ingredientsArray = typeof newProduct.ingredients === 'string' 
      ? newProduct.ingredients.split(',').map(i => i.trim()) 
      : newProduct.ingredients;

    const productData = { ...newProduct, brand_id: brandId, ingredients: ingredientsArray };

    if (editingId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingId);
      if (error) alert(error.message); else alert("Updated!");
    } else {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) alert(error.message); else alert("Created!");
    }
    setEditingId(null);
    setNewProduct({ name:'', price:'', description:'', long_description:'', image_url:'', ingredients:'' });
    fetchData();
  }

  // --- EDIT PRODUCT FUNCTION ---
  const startEdit = (product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      price: product.price,
      description: product.description || '',
      long_description: product.long_description || '',
      image_url: product.image_url || '',
      ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : (product.ingredients || '')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  async function deleteProduct(id) {
    if (window.confirm("Delete this item?")) {
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    }
  }

     // --- ANALYTICS CALCULATIONS ---
const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
const totalOrders = orders.length;
const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

// Find Top Selling Products
const productSales = {};
orders.forEach(order => {
  order.items.forEach(item => {
    productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
  });
});

const topProducts = Object.entries(productSales)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5); // Get top 5

  if (loading) return <div className="p-20 text-center">Loading Dashboard...</div>;

return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold" style={{ color: brandConfig.primaryColor }}>Admin Panel</h1>
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
          <button onClick={() => setActiveTab('products')} className={`px-4 md:px-6 py-2 rounded-full font-bold transition whitespace-nowrap ${activeTab === 'products' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>Products</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 md:px-6 py-2 rounded-full font-bold transition whitespace-nowrap ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>Orders</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 md:px-6 py-2 rounded-full font-bold transition whitespace-nowrap ${activeTab === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>Analytics</button>
        </div>
      </div>

      {/* --- PRODUCTS TAB --- */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg h-fit space-y-4 border-2" style={{ borderColor: editingId ? brandConfig.primaryColor : 'transparent' }}>
            <h3 className="text-xl font-bold">{editingId ? '📝 Edit Product' : 'Add New Product'}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Name" className="w-full border p-3 rounded-xl focus:outline-none" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <input type="number" placeholder="Price (₦)" className="w-full border p-3 rounded-xl focus:outline-none" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              <textarea placeholder="Description" className="w-full border p-3 rounded-xl h-24 focus:outline-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              <input type="text" placeholder="Ingredients (comma separated)" className="w-full border p-3 rounded-xl focus:outline-none" value={newProduct.ingredients} onChange={e => setNewProduct({...newProduct, ingredients: e.target.value})} />
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
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                  <img src={getImageUrl(p)} className="h-16 w-16 object-contain bg-gray-50 rounded-xl p-1 border" alt="" />
                  <div>
                    <p className="font-bold text-gray-800">{p.name}</p>
                    <p className="text-sm font-bold" style={{ color: brandConfig.primaryColor }}>₦{p.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-4 pr-2">
                  <button onClick={() => startEdit(p)} className="text-blue-500 text-sm font-bold hover:underline">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-400 text-sm font-bold hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

     {/* --- UPDATED ORDERS TAB IN ADMIN.JSX --- */}
{activeTab === 'orders' && (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <h3 className="font-bold text-gray-400 uppercase text-sm mb-4 tracking-widest">Recent Transactions</h3>
    {orders.map(o => (
      <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {/* Status Badge */}
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

          {/* STATUS UPDATE DROPDOWN */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Update Progress:</p>
            <select 
              value={o.status || 'Paid'}
              onChange={async (e) => {
                const newStatus = e.target.value;
                const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', o.id);
                if (!error) fetchData(); // Refresh list to show change
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
            <p className="text-[10px] text-gray-300 font-mono">REF: {o.payment_reference}</p>
            {userProfile?.brand_id === 'all' && (
               <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 uppercase font-bold">{o.brand_id}</span>
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
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</p>
              <h2 className="text-4xl font-black" style={{ color: brandConfig.primaryColor }}>₦{totalRevenue.toLocaleString()}</h2>
              <p className="text-xs text-gray-400 mt-1">Combined Brand Earnings</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Total Orders</p>
              <h2 className="text-4xl font-black" style={{ color: brandConfig.primaryColor }}>{totalOrders}</h2>
              <p className="text-xs text-gray-400 mt-1">Global Sales Count</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Avg. Order Value</p>
              <h2 className="text-4xl font-black" style={{ color: brandConfig.primaryColor }}>₦{Math.round(averageOrderValue).toLocaleString()}</h2>
              <p className="text-xs text-gray-400 mt-1">Average per customer</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
    <span>🏆</span> Top Selling Items Across Brands
  </h3>
  <div className="space-y-4">
    {topProducts.length > 0 ? (
      topProducts.map(([name, qty], index) => {
        
        // --- THIS IS THE NEW LINE YOU ASKED FOR ---
        // It looks through your products list to see which brand owns this item name
        const itemBrand = products.find((p) => p.name === name)?.brand_id;

        return (
          <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-3">
            <div>
              <p className="font-bold text-gray-700">{name}</p>
              
              {/* BRAND LABEL: Shows 'yummys' or 'pantry-co' next to the product */}
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-400">
                {itemBrand || "Unknown"}
              </span>
            </div>
            
            <span 
              style={{ backgroundColor: brandConfig.lightColor, color: brandConfig.backColor }} 
              className="px-3 py-1 rounded-full text-xs font-black"
            >
              {qty} Sold
            </span>
          </div>
        );
      })
    ) : (
      <p className="text-gray-400 italic">No sales data yet.</p>
    )}
  </div>
</div>
        </div>
      )}
    </div>
  );
}