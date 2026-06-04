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
  const [editingId, setEditingId] = useState(null); // Track which product is being edited
  const navigate = useNavigate();

  // Form State
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', description: '', long_description: '', image_url: '', ingredients: ''
  });

  useEffect(() => {
    checkAdmin();
  }, [user]);

  async function checkAdmin() {
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data?.role !== 'admin') { navigate('/'); } else { fetchData(); }
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

  // IMAGE HELPER: Same logic as Menu.jsx
  const getImageUrl = (url) => {
   if (!url) return "https://via.placeholder.com/150";

  // If the image is a full URL from a Supabase upload
  if (url.includes('supabase.co')) return url;

  // If it's just a local filename (like 'Amala.jpg')
  // We determine the folder based on the brand
  const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
  const folder = currentBrand === 'pantry-co' ? 'pantry' : 'yummys';

  return `/images/${folder}/${url}`;
  };

  // 1. IMPROVED IMAGE UPLOAD
   async function handleImageUpload(e) {
    const file = e.target.files[0];
  if (!file) return;

  try {
    setUploading(true);
    console.log("Starting upload...");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // UPLOAD TO STORAGE
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      alert("Upload failed: " + uploadError.message);
      return;
    }

    // GET THE PUBLIC URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (urlData) {
      console.log("URL Generated:", urlData.publicUrl);
      setNewProduct({ ...newProduct, image_url: urlData.publicUrl });
      alert("Image uploaded successfully! Now you can save the product.");
    }

  } catch (err) {
    console.error("Unexpected Error:", err);
    alert("An error occurred during upload.");
  } finally {
    setUploading(false); // This stops the "Uploading..." text NO MATTER WHAT
  }
  }

  // 2. ADD OR UPDATE PRODUCT
  async function handleSubmit(e) {
    e.preventDefault();
    const brandId = import.meta.env.VITE_BRAND || 'yummys';
    const ingredientsArray = typeof newProduct.ingredients === 'string' 
      ? newProduct.ingredients.split(',').map(i => i.trim()) 
      : newProduct.ingredients;

    if (editingId) {
      // UPDATE LOGIC
      const { error } = await supabase.from('products')
        .update({ ...newProduct, ingredients: ingredientsArray })
        .eq('id', editingId);
      if (error) alert(error.message);
      else alert("Product Updated!");
    } else {
      // INSERT LOGIC
      const { error } = await supabase.from('products')
        .insert([{ ...newProduct, brand_id: brandId, ingredients: ingredientsArray }]);
      if (error) alert(error.message);
      else alert("Product Created!");
    }

    setEditingId(null);
    setNewProduct({ name: '', price: '', description: '', long_description: '', image_url: '', ingredients: '' });
    fetchData();
  }

  // 3. START EDITING
  const startEdit = (product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      long_description: product.long_description || '',
      image_url: product.image_url,
      ingredients: product.ingredients?.join(', ') || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to the form
  };

  async function deleteProduct(id) {
    if (window.confirm("Are you sure? This cannot be undone.")) {
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
          <button onClick={() => setActiveTab('products')} className={`px-6 py-2 rounded-full font-bold ${activeTab === 'products' ? 'bg-black text-white' : 'bg-gray-200'}`}>Products</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-full font-bold ${activeTab === 'orders' ? 'bg-black text-white' : 'bg-gray-200'}`}>Orders</button>
        </div>
      </div>

      {activeTab === 'products' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* FORM (Used for both Add and Edit) */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg h-fit space-y-4 border-2" style={{ borderColor: editingId ? brandConfig.primaryColor : 'transparent' }}>
            <h3 className="text-xl font-bold mb-4">{editingId ? '📝 Edit Product' : 'Add New Product'}</h3>
            <input type="text" placeholder="Product Name" className="w-full border p-2 rounded" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
            <input type="number" placeholder="Price (₦)" className="w-full border p-2 rounded" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
            <textarea placeholder="Short Description" className="w-full border p-2 rounded" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            <input type="text" placeholder="Ingredients (comma separated)" className="w-full border p-2 rounded" value={newProduct.ingredients} onChange={e => setNewProduct({...newProduct, ingredients: e.target.value})} />
            
            <div className="border-2 border-dashed p-4 text-center rounded bg-gray-50">
               <p className="text-xs text-gray-500 mb-2">Upload Photo</p>
               <input type="file" accept="image/*" onChange={handleImageUpload} />
               {uploading && <p className="text-blue-500 font-bold animate-pulse mt-2">Uploading to Cloud...</p>}
               {newProduct.image_url && <img src={getImageUrl(newProduct.image_url)} className="h-32 mx-auto mt-4 rounded shadow-md" alt="preview" />}
            </div>

            <div className="flex gap-2">
                <button style={{ backgroundColor: brandConfig.primaryColor }} className="flex-1 text-white py-3 rounded-xl font-bold shadow-lg">
                    {editingId ? 'Update Product' : 'Save Product'}
                </button>
                {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setNewProduct({name:'', price:'', description:'', long_description:'', image_url:'', ingredients:''}); }} className="bg-gray-200 px-4 rounded-xl">Cancel</button>
                )}
            </div>
          </form>

          {/* PRODUCT LIST */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-400 uppercase text-sm mb-4">Existing Inventory ({products.length})</h3>
            {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                  <img 
                    src={getImageUrl(p.image_url)} 
                    className="h-16 w-16 object-contain bg-gray-50 rounded-lg p-1" 
                    alt="" 
                  />
                  <div>
                    <p className="font-bold text-gray-800">{p.name}</p>
                    <p className="text-sm font-bold" style={{ color: brandConfig.primaryColor }}>₦{p.price.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => startEdit(p)} className="text-blue-500 font-bold hover:underline">Edit</button>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-500 font-bold hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ORDERS TAB (Cleaned up) */
        <div className="space-y-6">
          <h3 className="font-bold text-gray-400 uppercase text-sm">Recent Transactions</h3>
          {orders.map(o => (
            <div key={o.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <div className="flex justify-between mb-4 border-b pb-2">
                  <p className="font-bold text-gray-800">Order #{o.id.slice(0,8)}</p>
                  <p className="text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
               </div>
               <div className="space-y-1">
                 {o.items.map((item, i) => (
                   <p key={i} className="text-sm text-gray-600">{item.quantity}x <span className="font-medium text-black">{item.name}</span></p>
                 ))}
               </div>
               <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-xs text-gray-400">Ref: {o.payment_reference}</span>
                  <p className="font-bold text-xl" style={{ color: brandConfig.primaryColor }}>₦{o.total_amount.toLocaleString()}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}