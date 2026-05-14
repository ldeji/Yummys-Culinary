import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';

export default function Menu({ addToCart }) {
  const [selectedItem, setSelectedItem] = useState(null); // State for the Product Detail Modal
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 1. Search Logic
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const menuItems = brandConfig?.items || []; 

  // 2. Filter logic based on the search query
  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery) || 
    item.description?.toLowerCase().includes(searchQuery)
  );

  return (
    <section 
      style={{ backgroundColor: brandConfig?.backColor || '#ffffff' }} 
      className="p-10 max-w-7xl mx-auto min-h-screen"
    >
      {/* --- SEARCH HEADER --- */}
      {searchQuery && (
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold">
            Results for: <span style={{ color: brandConfig.primaryColor }}>"{searchQuery}"</span>
          </h2>
          <button 
            onClick={() => navigate('/menu')} 
            className="text-gray-400 hover:text-gray-600 underline text-sm"
          >
            Clear search and show all
          </button>
        </div>
      )}

      {!searchQuery && (
        <h2 
          style={{ color: brandConfig?.accentColor || '#000000' }} 
          className="text-3xl font-bold text-center mb-8"
        >
          Our Full {brandConfig?.name === "Yummys" ? "Menu" : "Catalog"}
        </h2>
      )}
      
      {/* --- PRODUCTS GRID --- */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-inner">
          <div className="text-6xl mb-4">🔍❌</div>
          <p className="text-2xl font-bold text-gray-800">
             {brandConfig.name === "Yummys" 
               ? "Sorry, this dish is not available." 
               : "Sorry, we don't have that in stock."}
          </p>
          <button 
            onClick={() => navigate('/menu')}
            style={{ backgroundColor: brandConfig.primaryColor }}
            className="mt-6 px-6 py-2 text-white rounded-full font-bold hover:brightness-110"
          >
            Browse everything else →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
           <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-102 transition duration-300 flex flex-col border border-gray-100">
  
  {/* TOP PART: Clickable area for Modal */}
  <div onClick={() => setSelectedItem(item)} className="cursor-pointer">
    
    {/* 1. Image Container - Made smaller (h-48) and centered */}
    <div className="w-full h-40 md:h-48 bg-gray-50 flex items-center justify-center p-6">
      <img 
        src={`${brandConfig.imageFolder}/${item.image}`} 
        alt={item.name} 
        /* object-contain ensures 100% visibility, h-full keeps it within bounds */
        className="h-full w-auto object-contain transition duration-300 hover:scale-110"  
      />
    </div>

    {/* 2. Content Container - Tightened spacing */}
    <div className="p-4">
      {/* Name and Price Row */}
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-base md:text-lg text-gray-800 leading-tight">
          {item.name}
        </h3>
        <span 
          style={{ color: brandConfig.primaryColor }} 
          className="font-bold text-sm md:text-base whitespace-nowrap ml-2"
        >
          ₦{item.price?.toLocaleString()}
        </span>
      </div>

      {/* Description - Smaller text to save space */}
      <p className="text-gray-500 text-xs md:text-sm line-clamp-2 mb-2 leading-snug">
        {item.description}
      </p>

      {/* View Details Link */}
      <p 
        style={{ color: brandConfig.primaryColor }} 
        className="text-[10px] md:text-xs font-bold uppercase tracking-wider hover:underline"
      >
        View Details →
      </p>
    </div>
  </div>

  {/* BOTTOM PART: Add to Cart Button */}
  <div className="p-4 pt-0 mt-auto">
    <button 
      onClick={(e) => {
        e.stopPropagation(); 
        addToCart(item);
      }}
      style={{ backgroundColor: brandConfig.primaryColor }}
      className="w-full text-white py-2 rounded-lg font-bold text-sm filter hover:brightness-90 active:scale-95 transition shadow-sm"
    >
      Add to Cart
    </button>
  </div>
</div>
          ))}
        </div>
      )}

      {/* --- MODAL MORE DETAILS OF THE PRODUCT --- */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col md:flex-row animate-scale-in relative">
            
            {/* Close Modal Button */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-300 z-10"
            >
              ✕
            </button>

            {/* Left Side: Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto">
              <img 
                src={`${brandConfig.imageFolder}/${selectedItem.image}`} 
                alt={selectedItem.name} 
                className="w-full h-full object-cover hover:contrast-125 transition-transform duration-300" 
              />
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedItem.name}</h2>
                <span style={{ color: brandConfig.primaryColor }} className="text-2xl font-bold block mb-4">
                  ₦{selectedItem.price?.toLocaleString()}
                </span>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {selectedItem.longDescription}
                </p>

                {/* Dynamic Label: Ingredients for Food, Specifications for Groceries */}
                <h4 className="font-bold text-gray-800 mb-2">
                  {brandConfig.name === "Yummys" ? "Ingredients:" : "Details:"}
                </h4>
                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedItem.ingredients?.map((ing, index) => (
                    <span 
                      key={index} 
                      style={{ backgroundColor: brandConfig.lightColor, color: brandConfig.accentColor }}
                      className="text-xs font-bold px-3 py-1 rounded-full"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Add to Order Button inside Modal */}
              <button 
                onClick={() => {
                  addToCart(selectedItem);
                  setSelectedItem(null); // Close modal after adding
                }}
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="w-full text-white py-4 rounded-xl font-bold filter hover:brightness-90 transition shadow-lg"
              >
                Add to Order - ₦{selectedItem.price?.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}