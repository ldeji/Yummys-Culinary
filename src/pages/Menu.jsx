import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';
import { supabase } from '../config/supabaseClient';
import SEO from '../components/SEO';

// ADDED 'cart' to props
export default function Menu({ addToCart, cart = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  // 1. FETCH PRODUCTS & SETUP REAL-TIME SYNC
  useEffect(() => {
    console.log("✅ Menu useEffect started");
    const currentBrandID = import.meta.env.VITE_BRAND || "yummys";

    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("brand_id", currentBrandID)
          .order("id", { ascending: false });

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();

    // REAL-TIME SUBSCRIPTION: This fixes the "must logout to see change" issue
    // It listens for database changes (like stock updates) and refreshes UI instantly
    const channel = supabase
  .channel(`products-${currentBrandID}`)
  .on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "products",
      filter: `brand_id=eq.${currentBrandID}`,
    },
    (payload) => {
      console.log("product update:", payload);
      fetchProducts();
    }
  )
  .subscribe((status) => {
    console.log("Realtime Status:", status);
  });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchProducts();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, []);

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    const folder = (import.meta.env.VITE_BRAND || 'yummys') === 'pantry-co' ? 'pantry' : 'yummys';
    return `/images/${folder}/${url}`;
  };

  const categories = ["All", ...new Set([...(brandConfig.categories || []), ...items.map(i => i.category).filter(Boolean)])];

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name || "").toLowerCase().includes(searchQuery);
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ borderTopColor: brandConfig.primaryColor }} className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
      </div>
    );
  }

  return (
    <section style={{ backgroundColor: brandConfig?.backColor || '#ffffff' }} className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      <SEO title={brandConfig.name === "Yummys" ? "Our Menu" : "Product Catalog"} />

      <div className="mb-10 text-center">
        <h2 style={{ color: brandConfig?.accentColor || '#000000' }} className="text-3xl md:text-5xl font-black tracking-tight uppercase">
          {brandConfig?.name === "Yummys" ? "Our Full Menu" : "Our Catalog"}
        </h2>
      </div>

      <div className="flex gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar justify-start md:justify-center">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{ 
              backgroundColor: selectedCategory === cat ? brandConfig.primaryColor : 'white',
              color: selectedCategory === cat ? 'white' : '#666',
              borderColor: selectedCategory === cat ? brandConfig.primaryColor : '#eee'
            }}
            className="px-6 py-2 rounded-full text-sm font-bold border transition-all active:scale-95 whitespace-nowrap"
          >
            {cat === "All" ? "🛍️ All" : cat}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredItems.map((item) => {
          // LOGIC: Check how many of this item are already in the cart
          const cartItem = cart.find(c => c.id === item.id);
          const quantityInCart = cartItem ? cartItem.cartQuantity : 0;
          
          // EFFECTIVE STOCK: DB Stock minus what user already picked
          const effectiveStock = item.stock_quantity - quantityInCart;
          const isOutOfStock = effectiveStock <= 0 || !item.is_available;
          const isLowStock = effectiveStock > 0 && effectiveStock <= 5;

          return (
            <div 
              key={item.id} 
              className={`group relative bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col border border-gray-100 transition-all duration-500 
                ${isOutOfStock ? 'grayscale opacity-60 scale-[0.98]' : 'hover:shadow-xl hover:-translate-y-1'}`}
            >
              {isOutOfStock ? (
                <div className="absolute top-4 left-4 z-10 bg-gray-800 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
                  {item.stock_quantity <= 0 ? 'Sold Out' : 'Limit Reached'}
                </div>
              ) : isLowStock ? (
                <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase animate-pulse">
                  Only {effectiveStock} left
                </div>
              ) : null}

              <div onClick={() => setSelectedItem(item)} className="cursor-pointer flex-grow">
                <div className="w-full h-60 bg-gray-50 flex items-center justify-center p-6">
                  <img src={getImageUrl(item.image_url)} alt={item.name} className="h-full w-auto object-contain transition duration-700 group-hover:rotate-3 group-hover:scale-110" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl text-gray-800 uppercase tracking-tighter leading-none">{item.name}</h3>
                    <span style={{ color: isOutOfStock ? '#999' : brandConfig.primaryColor }} className="font-black text-lg">
                      ₦{item.price?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                <button 
                  disabled={isOutOfStock}
                  onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                  style={{ backgroundColor: isOutOfStock ? '#E5E7EB' : brandConfig.primaryColor }}
                  className={`w-full py-4 rounded-2xl font-black transition-all duration-300 text-sm uppercase tracking-widest
                    ${isOutOfStock ? 'text-gray-400 cursor-not-allowed' : 'text-white shadow-lg active:scale-95'}`}
                >
                  {isOutOfStock ? (item.stock_quantity <= 0 ? 'Sold Out' : 'Max in Cart') : 'Add to Order'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (() => {
          const cartItem = cart.find(c => c.id === selectedItem.id);
          const quantityInCart = cartItem ? cartItem.cartQuantity : 0;
          const effectiveStock = selectedItem.stock_quantity - quantityInCart;
          const isOutOfStock = effectiveStock <= 0 || !selectedItem.is_available;

          return (
            <div className="fixed inset-0 bg-green-500/20 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
              <div className="relative bg-white rounded-[32px] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-scale-in" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-[210] bg-white/80 backdrop-blur-sm text-gray-500 hover:text-black p-2 rounded-full shadow-sm">
                  <span className="text-xl">✕</span>
                </button>

                <div className="w-full md:w-2/5 h-56 md:h-auto bg-gray-50 flex items-center justify-center p-6">
                  <img src={getImageUrl(selectedItem.image_url)} alt={selectedItem.name} className={`max-w-full max-h-full object-contain drop-shadow-xl ${isOutOfStock ? 'grayscale' : ''}`} />
                </div>

                <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                  <div className="mb-4">
                    <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-400 mb-2">{selectedItem.category}</span>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight leading-tight mb-2 break-words">{selectedItem.name}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{selectedItem.long_description || selectedItem.description}</p>
                    
                    {selectedItem.ingredients && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Ingredients</h4>
                        <p className="text-gray-600 text-[11px] leading-relaxed italic">{selectedItem.ingredients}</p>
                      </div>
                    )}
                    
                    <div className="mb-4">
                       {isOutOfStock ? (
                         <p className="text-red-500 font-black text-[10px] uppercase tracking-widest">❌ {selectedItem.stock_quantity <= 0 ? 'Out of Stock' : 'Max Limit in Cart'}</p>
                       ) : (
                         <p className="text-green-500 font-black text-[10px] uppercase tracking-widest">✅ {effectiveStock} units available</p>
                       )}
                    </div>
                  </div>

                  <button 
                    disabled={isOutOfStock}
                    onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                    style={{ backgroundColor: isOutOfStock ? '#F3F4F6' : brandConfig.primaryColor }}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${isOutOfStock ? 'text-gray-300' : 'text-white shadow-lg active:scale-95'}`}
                  >
                    {isOutOfStock ? 'Unavailable' : `Add - ₦${selectedItem.price?.toLocaleString()}`}
                  </button>
                </div>
              </div>
            </div>
          );
      })()}
    </section>
  );
}