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

  // 1. FETCH PRODUCTS FROM SUPABASE
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const currentBrandID = import.meta.env.VITE_BRAND || 'yummys';
        
        const { data, error } = await supabase  
          .from('products') 
          .select('*')  
          .eq('brand_id', currentBrandID); 

        if (error) throw error;

        setItems(data || []);
      } catch (error) {
        console.error("Critical Error:", error.message);
        if (error.message.includes('fetch')) {
          alert("The store server is currently waking up. Please refresh in a few seconds!");
        }
        setItems([]); 
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // 2. IMAGE HELPER
  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.includes('supabase.co')) return url;
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
    const folder = currentBrand === 'pantry-co' ? 'pantry' : 'yummys';
    return `/images/${folder}/${url}`;
  };

  // 3. CATEGORY & FILTER LOGIC
  const categories = ["All", ...new Set(items.map(item => item.category).filter(Boolean))];

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
      
      <SEO 
        title={brandConfig.name === "Yummys" ? "Our Menu" : "Product Catalog"} 
        description={brandConfig.name === "Yummys" 
          ? `Explore the full menu at ${brandConfig.name}. Fresh local favorites and grilled delicacies.` 
          : `Browse the premium selection at ${brandConfig.name}. Global pantry essentials delivered to you.`
        } 
      />

      {/* HEADER SECTION */}
      <div className="mb-10 text-center">
        {searchQuery ? (
          <>
            <h2 className="text-2xl font-bold">Results for: <span style={{ color: brandConfig.primaryColor }}>"{searchQuery}"</span></h2>
            <button onClick={() => navigate('/menu')} className="text-gray-400 underline text-sm mt-2">Clear search</button>
          </>
        ) : (
          <h2 style={{ color: brandConfig?.accentColor || '#000000' }} className="text-3xl md:text-5xl font-black tracking-tight">
            {brandConfig?.name === "Yummys" ? "Our Full Menu" : "Our Catalog"}
          </h2>
        )}
      </div>

      {/* CATEGORY FILTER BUTTONS */}
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
            className="px-6 py-2 rounded-full text-sm font-bold border transition-all shadow-sm whitespace-nowrap hover:shadow-md active:scale-95"
          >
            {cat === "All" ? "🛍️ All Items" : cat}
          </button>
        ))}
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-inner border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-2xl font-bold text-gray-800">No items available.</p>
          <button onClick={() => {setSelectedCategory("All"); navigate('/menu');}} style={{ backgroundColor: brandConfig.primaryColor }} className="mt-6 px-8 py-3 text-white rounded-full font-bold shadow-lg">Refresh List</button>
        </div>
      ) : (
        /* PRODUCT GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={`group relative bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${!item.is_available ? 'opacity-75 grayscale-[0.5]' : ''}`}
            >
              {/* SOLD OUT BADGE */}
              {!item.is_available && (
                <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                  Sold Out
                </div>
              )}

              {/* CARD CONTENT */}
              <div onClick={() => setSelectedItem(item)} className="cursor-pointer flex-grow">
                <div className="w-full h-56 bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="h-full w-auto object-contain transition duration-500 group-hover:scale-110" 
                  />
                </div>
                
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">{item.name}</h3>
                    <span style={{ color: item.is_available ? brandConfig.accentColor : '#999' }} className="font-bold ml-2 whitespace-nowrap">
                      ₦{item.price?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{item.description}</p>
                  <p style={{ color: brandConfig.primaryColor }} className="text-xs font-bold uppercase tracking-widest hover:underline">
                    View Details →
                  </p>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="p-5 pt-0 mt-auto">
                <button 
                  disabled={!item.is_available}
                  onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                  style={{ backgroundColor: item.is_available ? brandConfig.primaryColor : '#D1D5DB' }}
                  className="w-full text-white py-3 rounded-xl font-bold transition-all duration-200 shadow-md active:scale-95 disabled:cursor-not-allowed"
                >
                  {item.is_available ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col md:flex-row relative animate-scale-in">
            <button onClick={() => setSelectedItem(null)} className="absolute top-5 right-5 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-md z-10 hover:bg-white transition">✕</button>

            <div className="w-full md:w-1/2 h-72 md:h-auto bg-gray-100 flex items-center justify-center p-8">
              <img 
                src={getImageUrl(selectedItem.image_url)} 
                alt={selectedItem.name} 
                className="max-w-full max-h-full object-contain drop-shadow-xl" 
              />
            </div>

            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded uppercase">{selectedItem.category}</span>
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">{selectedItem.name}</h2>
                <span style={{ color: brandConfig.primaryColor }} className="text-2xl font-bold block mb-4">
                  ₦{selectedItem.price?.toLocaleString()}
                </span>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm md:text-base">{selectedItem.long_description || selectedItem.description}</p>
                
                <h4 className="font-bold text-gray-800 mb-3 uppercase text-xs tracking-widest">
                  {brandConfig.name === "Yummys" ? "Ingredients" : "Details"}
                </h4>

                <div className="flex flex-wrap gap-2 mb-8">
                  {Array.isArray(selectedItem.ingredients) ? (
                    selectedItem.ingredients.map((ing, index) => (
                      <span key={index} style={{ backgroundColor: brandConfig.lightColor, color: brandConfig.accentColor }} className="text-[10px] font-bold px-3 py-1.5 rounded-full border border-black/5">
                        {ing}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">{selectedItem.ingredients || "No extra details."}</span>
                  )}
                </div>
              </div>

              <button 
                disabled={!selectedItem.is_available}
                onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                style={{ backgroundColor: selectedItem.is_available ? brandConfig.primaryColor : '#D1D5DB' }}
                className="w-full text-white py-4 rounded-2xl font-bold shadow-lg transition active:scale-95 disabled:cursor-not-allowed"
              >
                {selectedItem.is_available ? `Add to Order - ₦${selectedItem.price?.toLocaleString()}` : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}