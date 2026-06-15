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

  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', long_description: '', image_url: '', ingredients: ''
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

 async function checkAdmin() {
  if (!user) { navigate('/login'); return; }

  const currentBrand = import.meta.env.VITE_BRAND || 'yummys';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, brand_id')
    .eq('id', user.id)
    .single();

  // Logic: Must be an admin AND the brand_id must match the current site
  if (profile?.role === 'admin' && profile?.brand_id === currentBrand) {
    fetchData();
  } else {
    alert("You are not authorized to manage this specific brand.");
    navigate('/');
  }
}

  async function fetchData() {
    setLoading(true);
    const brandId = import.meta.env.VITE_BRAND || 'yummys';
    const { data: prodData } = await supabase.from('products').select('*').eq('brand_id', brandId);
    const { data: ordData } = await supabase.from('orders').select('*').eq('brand_id', brandId).order('created_at', { ascending: false });
    setProducts(prodData || []);
    setOrders(ordData || []);
    setLoading(false);
  }

  // IMAGE HELPER
  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
    const folder = currentBrand === 'pantry-co' ? 'pantry' : 'yummys';
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

  if (loading) return <div className="p-20 text-center">Loading Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold" style={{ color: brandConfig.primaryColor }}>Admin Panel</h1>
        <div className="flex gap-4">
          <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'products' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>Products</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-full font-bold transition ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>Orders</button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg h-fit space-y-4 border-2" style={{ borderColor: editingId ? brandConfig.primaryColor : 'transparent' }}>
            <h3 className="text-xl font-bold">{editingId ? '📝 Edit Product' : '✨ Add New Product'}</h3>
            
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
                 <img src={getImageUrl(newProduct.image_url)} className="h-32 w-full object-contain rounded-lg mt-4 bg-white p-2 border" alt="preview" />
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
            <h3 className="font-bold text-gray-400 uppercase text-sm">Inventory ({products.length})</h3>
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                  <img src={getImageUrl(p.image_url)} className="h-16 w-16 object-contain bg-gray-50 rounded-xl p-1 border" alt="" />
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
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between">
              <div className="flex-1">
                <p className="text-sm font-mono text-gray-400 mb-2">Order ID: {o.id.toString().slice(0,8)}</p>
                <div className="space-y-1">
                  {o.items.map((item, i) => (
                    <p key={i} className="text-sm text-gray-700"><span className="font-bold" style={{ color: brandConfig.primaryColor }}>{item.quantity}x</span> {item.name}</p>
                  ))}
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:text-right">
                <p className="text-2xl font-black" style={{ color: brandConfig.primaryColor }}>₦{o.total_amount.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}