import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';
import { supabase } from '../config/supabaseClient';
import SEO from '../components/SEO'; // Import the SEO component

export default function Menu({ addToCart }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const currentBrandID = import.meta.env.VITE_BRAND || 'yummys';
        
        const { data, error } = await supabase  
          .from('products') 
          .select('*')  
          .eq('brand_id', currentBrandID); 

        if (error) throw error; // Force the code to jump to the catch block if there's an error

        setItems(data || []);
      } catch (error) {
        console.error("Critical Error:", error.message);
        
        // If the error message contains 'fetch', it's usually a DNS/Paused project issue
        if (error.message.includes('fetch')) {
          alert("The store server is currently waking up. Please refresh the page in a few seconds!");
        } else {
          alert("Could not load products. Please check your internet connection.");
        }
        
        setItems([]); // Ensure items is at least an empty array so the app doesn't crash
      } finally {
        setLoading(false); // This always runs, even if the code fails
      }
    }

    fetchProducts();
  }, []);

  const filteredItems = items.filter(item => 
    (item.name || "").toLowerCase().includes(searchQuery) || 
    (item.description || "").toLowerCase().includes(searchQuery)
  );

  // Helper function to handle images safely
  const getImageUrl = (url) => {
    if (!url) return "https://via.placeholder.com/150";

    // If the image is a full URL from a Supabase upload
    if (url.includes('supabase.co')) return url;

    // If it's just a local filename (like 'Amala.jpg')
    const currentBrand = import.meta.env.VITE_BRAND || 'yummys';
    const folder = currentBrand === 'pantry-co' ? 'pantry' : 'yummys';

    return `/images/${folder}/${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ borderTopColor: brandConfig.primaryColor }} className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
      </div>
    );
  }

  return (
    <section style={{ backgroundColor: brandConfig?.backColor || '#ffffff' }} className="p-10 max-w-7xl mx-auto min-h-screen">
      
      {/* --- SEO COMPONENT --- */}
      <SEO 
        title={brandConfig.name === "Yummys" ? "Our Menu" : "Product Catalog"} 
        description={brandConfig.name === "Yummys" 
          ? `Explore the full menu at ${brandConfig.name}. From local favorites to grilled delicacies, find your next meal here.` 
          : `Browse the premium selection at ${brandConfig.name}. Quality imported dry goods, snacks, and essentials for your home.`
        } 
      />

      {searchQuery && (
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">Results for: <span style={{ color: brandConfig.primaryColor }}>"{searchQuery}"</span></h2>
          <button onClick={() => navigate('/menu')} className="text-gray-400 underline text-sm">Clear search</button>
        </div>
      )}

      {!searchQuery && (
        <h2 style={{ color: brandConfig?.accentColor || '#000000' }} className="text-3xl font-bold text-center mb-8">
          Our Full {brandConfig?.name === "Yummys" ? "Menu" : "Catalog"}
        </h2>
      )}
      
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-inner border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-2xl font-bold text-gray-800">No items available.</p>
          <button onClick={() => navigate('/menu')} style={{ backgroundColor: brandConfig.primaryColor }} className="mt-6 px-6 py-2 text-white rounded-full font-bold">Refresh</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col border border-gray-100">
              <div onClick={() => setSelectedItem(item)} className="cursor-pointer">
                <div className="w-full h-48 bg-gray-50 flex items-center justify-center p-6">
                  <img 
                    src={getImageUrl(item.image_url)} 
                    alt={item.name} 
                    className="h-full w-auto object-contain transition duration-300 hover:scale-110" 
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">{item.name}</h3>
                    <span style={{ color: brandConfig.lightColor }} className="font-bold ml-2">
                      ₦{item.price?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-2 line-clamp-2">{item.description}</p>
                  <p style={{ color: brandConfig.primaryColor }} className="text-xs font-bold hover:underline">View Details →</p>
                </div>
              </div>

              <div className="p-4 pt-0 mt-auto">
                <button 
                  onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                  style={{ backgroundColor: brandConfig.primaryColor }}
                  className="w-full text-white py-2 rounded-lg font-bold 
                  transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PRODUCT DETAIL MODAL --- */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col md:flex-row relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md z-10">✕</button>

            <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 flex items-center justify-center p-6">
              <img 
                src={getImageUrl(selectedItem.image_url)} 
                alt={selectedItem.name} 
                className="max-w-full max-h-full object-contain" 
              />
            </div>

            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between text-left">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedItem.name}</h2>
                <span style={{ color: brandConfig.primaryColor }} className="text-2xl font-bold block mb-4">
                  ₦{selectedItem.price?.toLocaleString()}
                </span>
                <p className="text-gray-600 mb-6">{selectedItem.long_description}</p>
                
              <h4 className="font-bold text-gray-800 mb-2">
                {brandConfig.name === "Yummys" ? "Ingredients:" : "Details:"}
              </h4>

              <div className="flex flex-wrap gap-2 mb-8">
                {Array.isArray(selectedItem.ingredients) ? (
                  selectedItem.ingredients.map((ing, index) => (
                    <span 
                      key={index} 
                      style={{ backgroundColor: brandConfig.lightColor, color: brandConfig.accentColor }} 
                      className="text-xs font-bold px-3 py-1 rounded-full"
                    >
                      {ing}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-600 text-sm">
                    {selectedItem.ingredients || "No details provided"}
                  </span>
                )}
              </div>
              </div>

              <button 
                onClick={() => { addToCart(selectedItem); setSelectedItem(null); }}
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="w-full text-white py-4 rounded-xl font-bold 
                transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95"
              >
                Add to Order - ₦{selectedItem.price?.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}