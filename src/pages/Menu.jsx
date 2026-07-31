import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';
import { supabase } from '../config/supabaseClient';
import SEO from '../components/SEO';

export default function Menu({ addToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  // 1. FETCH PRODUCTS WITH SAFETY TIMEOUT (Prevents Infinite Spinning)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const currentBrandID = import.meta.env.VITE_BRAND || "yummys";

        // If Supabase doesn't respond in 4s, we stop waiting to prevent the UI freeze
        const { data, error } = await Promise.race([
          supabase.from("products").select("*").eq("brand_id", currentBrandID).order("id", { ascending: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
        ]);

        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();

    // Re-sync data when user comes back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchProducts();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.startsWith('http')) return url;
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
    const folder = currentBrand === 'pantry-co' ? 'pantry' : 'yummys';
    return `/images/${folder}/${url}`;
  };

const categories = [
    "All", 
    ...new Set([
      ...(brandConfig.categories || []), 
      ...items.map(item => item.category).filter(Boolean)
    ])
  ];

  // 2. FILTER ITEMS (This is the part that was missing or broken)
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name || "").toLowerCase().includes(searchQuery) || 
                         (item.description || "").toLowerCase().includes(searchQuery);
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

      {/* FILTER BUTTONS */}
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
      
      {/* PRODUCT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filteredItems.map((item) => {
          const isOutOfStock = item.stock_quantity <= 0 || !item.is_available;
          const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= 5;

          return (
            <div 
              key={item.id} 
              className={`group relative bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col border border-gray-100 transition-all duration-500 
                ${isOutOfStock ? 'grayscale opacity-60 scale-[0.98]' : 'hover:shadow-xl hover:-translate-y-1'}`}
            >
              {/* BADGES */}
              {isOutOfStock ? (
                <div className="absolute top-4 left-4 z-10 bg-gray-800 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
                  Sold Out
                </div>
              ) : isLowStock ? (
                <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase animate-pulse">
                  Only {item.stock_quantity} left
                </div>
              ) : null}

              <div onClick={() => setSelectedItem(item)} className="cursor-pointer flex-grow">
                <div className="w-full h-60 bg-gray-50 flex items-center justify-center p-6">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="h-full w-auto object-contain transition duration-700 group-hover:rotate-3 group-hover:scale-110" 
                  />
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
                  {isOutOfStock ? 'Sold Out' : 'Add to Order'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-green-500/20 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row animate-scale-in" onClick={e => e.stopPropagation()}>
            
            <div className="w-full md:w-1/2 h-80 md:h-auto bg-white flex items-center justify-center p-10">
              <img 
                src={getImageUrl(selectedItem.image_url)} 
                alt={selectedItem.name} 
                className={`max-w-full max-h-full object-contain drop-shadow-2xl ${selectedItem.stock_quantity <= 0 ? 'grayscale' : ''}`} 
              />
            </div>

            <div className="w-full md:w-1/2 p-10 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                   <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-400">{selectedItem.category}</span>
                   <button onClick={() => setSelectedItem(null)} className="text-gray-300 hover:text-black text-xl">✕</button>
                </div>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-2">{selectedItem.name}</h2>
                <p className="text-gray-500 leading-relaxed mb-6">{selectedItem.long_description || selectedItem.description}</p>
                
                {/* STOCK STATUS */}
                <div className="mb-8">
                   {selectedItem.stock_quantity <= 0 ? (
                     <p className="text-red-500 font-black text-xs uppercase tracking-widest">❌ Out of Stock</p>
                   ) : (
                     <p className="text-green-500 font-black text-xs uppercase tracking-widest">✅ Ready to ship ({selectedItem.stock_quantity} units left)</p>
                   )}
                </div>
              </div>

              <button 
                disabled={selectedItem.stock_quantity <= 0 || !selectedItem.is_available}
                onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                style={{ backgroundColor: (selectedItem.stock_quantity <= 0 || !selectedItem.is_available) ? '#F3F4F6' : brandConfig.primaryColor }}
                className={`w-full py-5 rounded-[24px] font-black text-lg uppercase tracking-widest transition-all
                  ${(selectedItem.stock_quantity <= 0 || !selectedItem.is_available) ? 'text-gray-300' : 'text-white shadow-xl active:scale-95'}`}
              >
                {selectedItem.stock_quantity <= 0 || !selectedItem.is_available ? 'Currently Unavailable' : `Add to Order - ₦${selectedItem.price?.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}