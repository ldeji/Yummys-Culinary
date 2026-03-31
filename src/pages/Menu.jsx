import React, { useState } from 'react'
import { brandConfig } from '../config/brands';

export default function Menu({ addToCart }) {
  const [selectedItem, setSelectedItem] = useState(null)

  // SAFETY CHECK: If brandConfig.items is missing, an empty list [] instead of crashing
  const menuItems = brandConfig?.items || [];

  return (
    <section 
      style={{ backgroundColor: brandConfig?.backColor || '#ffffff' }} 
      className="p-10 max-w-7xl mx-auto min-h-screen"
    >
      <h2 
        style={{ color: brandConfig?.accentColor || '#000000' }} 
        className="text-3xl font-bold text-center mb-8"
      >
        Our Full {brandConfig?.name === "Yummys" ? "Menu" : "Catalog"}
      </h2>
      
      {/* If there are no items, show a message instead of crashing */}
      {menuItems.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500">No items found. Please check your data files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-102 transition duration-300">
              
              <div onClick={() => setSelectedItem(item)} className="cursor-pointer">
                <img 
                  src={`${brandConfig.imageFolder}/${item.image}`} 
                  alt={item.name} 
                  className="w-full h-90 aspect-video object-cover transition duration-300 hover:contrast-120" 
                />
                
                <div className="p-5 pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <span style={{ color: brandConfig.lightColor }} className="font-bold">
                      ₦{item.price?.toLocaleString()}
                    </span>
                  </div>
                  <p style={{ color: brandConfig.primaryColor }} className="text-3xl mb-4">{item.description}</p>
                  <p style={{ color: brandConfig.primaryColor }} className="text-xs font-bold mb-4 hover:underline">
                    View Details →
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}
                  style={{ backgroundColor: brandConfig.primaryColor }}
                  className="w-full text-white py-2 rounded-lg font-bold filter hover:brightness-90 active:scale-95 transition"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row animate-scale-in relative">
            
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
            >
              ✕
            </button>

            <div className="w-full md:w-1/2 h-64 md:h-auto">
              <img 
                src={`${brandConfig.imageFolder}/${selectedItem.image}`} 
                alt={selectedItem.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedItem.name}</h2>
                <span style={{ color: brandConfig.primaryColor }} className="text-2xl font-bold block mb-4">
                  ₦{selectedItem.price?.toLocaleString()}
                </span>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {selectedItem.longDescription}
                </p>

                <h4 className="font-bold text-gray-800 mb-2">
                  {brandConfig.name === "Yummys" ? "Ingredients:" : "Specifications:"}
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

              <button 
                onClick={() => {
                  addToCart(selectedItem);
                  setSelectedItem(null);
                }}
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="w-full text-white py-3 rounded-xl font-bold filter hover:brightness-90 transition shadow-lg"
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