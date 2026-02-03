import React, { useState } from 'react' // Import useState

export default function Menu({ addToCart }) {
   // Track which item is open. Null means no modal is open.
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Move your data here
const menuItems = [
    {
      id: 1,
      name: "Ayamase Rice",
      price: 6500,
      image: "/images/ayamaseRice.jpg",
      description: "Roasted pepper with bleached palm oil with lots of onions.",
      // NEW FIELDS
      longDescription: "Experience the ultimate comfort food. Our Classic Ofada Rice and Ayamase with fried assorted meat, Bleached palm-oil to give features a 100% ayamase aroma, blended green pepper, purple onions, and our secret Yummys sauce.",
      ingredients: ["Knorr Maggi", "Ofada Rice", "Green pepper", "Tomato", "Purple onions", "Palm oil", "Stock fish "]
    },
    {
      id: 2,
      name: "Spicy Pizza",
      price: 9000,
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600",
      description: "Loaded with Green pepperoni, Ata Gungun and jalapenos.",
      longDescription: "Not for the faint of heart! This pizza starts with our homemade spicy tomato sauce, covered in mozzarella, and topped with generous amounts of pepperoni and fresh sliced jalapeños.",
      ingredients: ["Ata Gungun", "Tomato", "Mozzarella", "Greeen Pepper", "Jalapenos", "Tofu Flakes"]
    },
    {
      id: 3,
      name: "Crispy Fries",
      price: 2500,
      image: "/images/CrispyFries.jpg",
      description: "Golden fried potatoes with sea salt.",
      longDescription: "Hand-cut daily from locally sourced potatoes. We double-fry them to ensure a crispy exterior and a fluffy interior. Seasoned perfectly with sea salt.",
      ingredients: ["Potatoes", "Sea Salt", "Vegetable Oil"]
    },
    {
      id: 4,
      name: "Bole and Fish",
      price: 7000,
      image: "/images/Bolefish.jpg",
      description: "Grilled Fish and Bole with sipcy palm oil pepper.",
      longDescription: "Hand-cut daily from locally sourced plantain and fresh fish. We grilled them to ensure a crispy exterior and a fluffy interior. Seasoned perfectly with palm oil sauce.",
      ingredients: ["Plantain", "Fish", "Palm Oil", "Onions and Garlics"]
    },
    {
      id: 5,
      name: "Abacha and Ugba",
      price: 6000,
      image: "/images/Abacha.jpg",
      description: "Shredded Cassava with Ugba and palm oil pepper.",
      longDescription: "Dried shredded fermented cassava with (Ugba) fermented oil bean with ponmo, fish, onions, cayenne pepper and palm oil.",
      ingredients: ["Cassava", "Ugba", "Palm Oil", "Ponmo", "Fish", "Cayenne Pepper", "Onions and Garlics"]
    },
    {
      id: 6,
      name: "Asaro (porridge)",
      price: 6500,
      image: "/images/Asaro.jpg",
      description: "Puna Yam with fried assorted meat and palm oil pepper.",
      longDescription: "Boiled puna yam, cooked in stewed blended palm-oil, Tomatoes, peppers, Onions, and Seasonings.",
      ingredients: ["Yam", "Assorted meat", "Palm Oil", "Onions", "Peppers", "Tomatoes","Ponmo", "Seasonings"]
    },
    {
      id: 7,
      name: "Ewa Agoyin",
      price: 3500,
      image: "/images/EwaAgoyin.jpg",
      description: "Soft mashed beans and with spicy dark palm oil pepper.",
      longDescription: "Soft mashed beans with fried plantain, burnt cayenne pepper, onions, and bleached palm oil.",
      ingredients: ["Beans", "Plantain", "Palm Oil", "Onions", "Cayenne Pepper", "Assorted meat", "Ponmo"]
    },
    {
      id: 8,
      name: "Barbecue Chicken",
      price: 5500,
      image: "/images/Barbecue.jpg",
      description: "Grilled Barbecue chicken, with barbecue sauce and fresh lettuce.",
      longDescription: "Soft juicy grilled chicken with barbecue sauce and fresh lettuce.",
      ingredients: ["Chicken", "Barbecue sauce", "lettuce", "Seasonings"]
    },
    {
      id: 9,
      name: "Roasted Corn",
      price: 2000,
      image: "/images/RoastedCorn.jpg",
      description: "Soft golden roasted corn with pepper and tomatoes sauce.",
      longDescription: "Hand daily picked corn, roasted to give you smoky and caramelized flavour, with pepper and tomato sauce.",
      ingredients: ["Corn", "Tomato", "Pepper", "Onions", "Seasonings"]
    },
    {
      id: 10,
      name: "Suya",
      price: 2000,
      image: "/images/Suya.jpg",
      description: "Spicy Grilled meat skewers with lettuce and tomatoes.",
      longDescription: "Spicy grilled meat skewers with specil pepper, lettuce and tomatoes.",
      ingredients: ["Meat", "Tomato", "Pepper", "Lettuce", "Onions", "Seasonings"]
    },
    {
      id: 11,
      name: "Jollof and Chicken",
      price: 5500,
      image: "/images/Jollof.jpg",
      description: "Long grain rice, chillies, spices and tomatoes.",
      longDescription: "Long grain rice cooked on firewood with chilles, blended rodo, tomatoes and chicken.",
      ingredients: ["Rice", "Meat", "Tomato", "Pepper", "Lettuce", "Onions", "Seasonings"]
    },
    {
      id: 12,
      name: "Amala",
      price: 5000,
      image: "/images/Amala.jpg",
      description: "Amala, ewudu, gbegiri, obe-ata and assorted meat.",
      longDescription: "Amala, ewudu, gbegiri, obe-ata with assorted meat served in a plate",
      ingredients: ["Amala (yam flour)", "Ewedu (Jute-leaf)", "Stew (obe-ata)", "Gbegiri (cooked mashed beans water)", "Assorted meat"]
    },
  ]



 return (
    <section className="bg-yellow-50 p-10 max-w-7xl mx-auto min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-8 text-yellow-500">Our Full Menu</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition duration-300">
            
            {/* WRAP IMAGE & TEXT IN A CLICKABLE DIV */}
            <div onClick={() => setSelectedItem(item)} className="cursor-pointer">
              <img src={item.image} alt={item.name} className="w-full h-60 object-cover transition duration-300 hover:contrast-120" />
              <div className="p-5 pb-0"> {/* Removed bottom padding so button sits low */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-xl">{item.name}</h3>
                  <span className="text-yellow-600 font-bold">#{item.price}</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">{item.description}</p>
                <p className="text-yellow-500 text-xs font-bold mb-4 hover:underline">View Details →</p>
              </div>
            </div>

            {/* BUTTON (Separate, so clicking it doesn't open the modal) */}
            <div className="p-5 pt-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevents opening the modal when clicking Add
                  addToCart(item);
                }}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold hover:bg-yellow-600 active:scale-95 transition"
              >
                Add to Cart
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* --- PRODUCT DETAIL MODAL --- */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          
          {/* The Modal Box */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row animate-scale-in relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 z-10"
            >
              ✕
            </button>

            {/* Left Side: Image */}
            <div className="w-full md:w-1/2 h-64 md:h-auto">
              <img 
                src={selectedItem.image} 
                alt={selectedItem.name} 
                className="w-full h-full object-cover hover:contrast-120" 
              />
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedItem.name}</h2>
                <span className="text-2xl font-bold text-yellow-500 block mb-4">#{selectedItem.price}</span>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {selectedItem.longDescription}
                </p>

                {/* Ingredients List */}
                <h4 className="font-bold text-gray-800 mb-2">Ingredients:</h4>
                <div className="flex flex-wrap gap-2 mb-8">
                  {selectedItem.ingredients.map((ing, index) => (
                    <span key={index} className="bg-orange-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  addToCart(selectedItem);
                  setSelectedItem(null); // Close modal after adding
                }}
                className="w-full bg-yellow-500 text-white py-3 rounded-xl font-bold hover:bg-yellow-600 transition shadow-lg"
              >
                Add to Order - #{selectedItem.price}
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  )

} 
