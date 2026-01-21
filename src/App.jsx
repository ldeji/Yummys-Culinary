import { useState } from 'react'
import './App.css'
import yummyLogo from './assets/yummy.jpeg'

const menuItems = [
  {
    id: 1,
    name: "Classic Burger",
    price: "8000",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    description: "Juicy beef patty with fresh lettuce."
  },
  {
    id: 2,
    name: "Rice and Beans",
    price: "8000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgA_ArjD_7xTlh4CYEQaIF6O5yXMP7XY4OlQ&s",
    description: "Rice and Beans with chicken and salads."
  },
  {
    id: 3,
    name: "Bole and Fish",
    price: "6500",
    image: "/images/BoleAndFish.jpg",
    description: "Grilled fish and bole with our secret sauce."
  },
  {
    id: 4,
    name: "Shawarma",
    price: "3000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7sVUdGKDH1mFwpqMuCbscb9xfUGI1shmIpA&s",
    description: "Shawarma with spicy beef and chicken combo with salads."
  },

  {
    id: 5,
    name: "Pepper Soup",
    price: "10000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw90Br7rTK_vyR65pRXKN6fRXfykzJemF8OQ&s",
    description: "Fish pepper soup with our pepper sauce."
  },

  {
    id: 6,
    name: "Abacha",
    price: "10000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw54Dl2-e7qGAqvW0KzK8-tV1Yji38f8vlgA&s",
    description: "Boiled casava, vegetables with our special pepper sauce."
  },
  

  {
    id: 7,
    name: "Asaro",
    price: "7500",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhj18mF-xjP2W87ujK614lz8WyECeSthLsBA&s",
    description: "Boiled mash yam with assoted meat."
  },

  {
    id: 8,
    name: "Ayamase",
    price: "5000",
    image: "/images/Ayamase.jpg",
    description: "Fried pepper mixed with burnt onions with our secret sauce."
  },
  
  {
    id: 9,
    name: "BBQ Chicken",
    price: "5000",
    image: "/images/BbqChickenSalad.jpg",
    description: "Soft bbq chicken with spicy bbq sauce and salads."
  },
  
]

      // THE LOGIC
function App() {
  // --- STATE ---
  const [cart, setCart] = useState([]) // No <Type> needed here
  const [isCartOpen, setIsCartOpen] = useState(false)

  // --- DERIVED STATE (Calculated automatically) ---
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // --- FUNCTIONS ---
  const addToCart = (product) => { // No type definition for 'product'
    setCart((prevCart) => {
      // Check if item is already in cart
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        // If yes, just increase quantity by 1
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        // If no, add it as a new item with quantity 1
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
    
  }
  
  // 1. Function to increase/decrease quantity
  const updateQuantity = (id, amount) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === id) {
          // Calculate new quantity
          const newQuantity = item.quantity + amount
          // Return item with new quantity
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter((item) => item.quantity > 0) // Automatically remove if quantity reaches 0
    })
  }

  // 2. Function to remove item completely
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const handleCheckout = () => {
    // 1. Safety Check: Don't checkout if empty
    if (cart.length === 0) {
      alert("Your cart is empty! Add some yumminess first.")
      return
    }

    // 2. The "Fake" Payment Processing
    const confirmOrder = window.confirm(`Ready to pay #${cartTotal}?`)
    
    if (confirmOrder) {
      // 3. Success!
      alert("Order Placed Successfully! Sit back and relax, Your food is on the way.")
      
      // 4. Reset the App
      setCart([]) // Clear the cart
      setIsCartOpen(false) // Close the popup
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* --- NAVBAR SECTION --- */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          
          {/*Logo */}
          <div className="flex items-center gap-2">
            <div className='animate-[bounce_3s_linear_infinite]'>
            <img src={yummyLogo} alt="Logo" className="w-20 h-20 rounded-full object-cover animate-[spin_5s_linear_infinite]" />
            </div>
            <h1 className="text-2xl font-bold text-orange-600 tracking-tight">
              The Yummys
            </h1>
          </div>

          {/* 2. Navigation Links (Hidden on mobile, visible on desktop) */}
          <ul className="hidden md:flex gap-8 font-medium text-gray-600">
            <li className="hover:text-orange-600 cursor-pointer transition">Home</li>
            <li className="hover:text-orange-600 cursor-pointer transition">Menu</li>
            <li className="hover:text-orange-600 cursor-pointer transition">About</li>
            <li className="hover:text-orange-600 cursor-pointer transition">Book a Table</li>
          </ul>

          {/* Cart Button */}
          <button  onClick={() => setIsCartOpen(true)} // <--- To open Cart Modal (THIS LINE WAS UPDATED
           className="relative bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-bold
           hover:bg-orange-200 transition">
            🛒 Cart
            {/* The little red notification badge */}
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex 
              items-center justify-center 
              rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

        </div>
      </nav>

      {/* --- HERO SECTION (Placeholder) --- */}
      <section class="h-[500px] flex flex-col justify-center items-center text-center bg-slate-900
       text-white p-4">
    <h1 class="text-5xl md:text-6xl font-extrabold mb-4">Taste the Future</h1>
    <p class="text-xl text-gray-300 mb-8 max-w-lg">
        Experience culinary excellence with locally sourced ingredients and modern atmosphere.
    </p>
    <div class="flex gap-4">
        <button class="bg-orange-500 px-8 py-3 rounded-lg text-brand-green font-bold hover:bg-orange-600
         hover:text-gray-50 
        transition-all duration-300 hover:scale-105">Order Now</button>
        <button class="border border-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-slate-900 
        transition-all duration-300 hover:scale-105">View Menu</button>
    </div>
</section>

         <section class="p-10 max-w-6xl mx-auto">
    <h2 class="text-3xl text-brand-green font-bold text-center mb-10">Our Favourites</h2>
    
     <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
    
    {/* THE LOOP: This creates HTML for every item in the list above */}
    {menuItems.map((item) => (
      <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 
      transition duration-300 hover:-translate-y-2 hover:contrast-130">
        
        {/* Image */}
        <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
        
        {/* Content */}
        <div className="p-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-xl">{item.name}</h3>
            <span className="text-orange-600 font-bold">{item.price}</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">{item.description}</p>
          
          {/* Button Connected to Logic */}
          <button 
            onClick={() => addToCart(item)}    //This was updated
            className="w-full bg-orange-500 text-white py-2 rounded-lg font-bold cursor:pointer hover:bg-orange-600 
            active:scale-95 transition "
          >
            Add to Cart
          </button>
        </div>

      </div>
    ))}


  {/* --- CART MODAL (Popup) --- */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          
          {/* The White Sidebar */}
          <div className="bg-white w-full max-w-md h-full p-6 flex flex-col shadow-2xl">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold">Your Order</h2>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="text-gray-500 hover:text-red-500 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">Your cart is empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-4">
                      {/* Note: Ensure item.image points to a valid public path */}
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                      
                       {/* Control -  + ICONS  */}
                     <div>
                      <h4 className="font-bold">{item.name}</h4>
                      
                      {/* NEW: Controls for Quantity */}
                      <div className="flex items-center gap-2 mt-1">
                        
                        {/* Minus Button */}
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-gray-200 w-6 h-6 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        
                        <span className="text-sm font-bold">{item.quantity}</span>
                        
                        {/* Plus Button */}
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-gray-200 w-6 h-6 rounded hover:bg-gray-300"
                        >
                          +
                        </button>

                        {/* Trash Icon / Remove Button */}
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="ml-4 text-red-500 text-xs hover:underline"
                        >
                          Remove
                        </button>

                      </div>
                    </div>
                        


                    </div>
                    <span className="font-bold text-orange-600">#{item.price * item.quantity}</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between text-xl font-bold mb-4">
                <span>Total:</span>
                <span>#{cartTotal}</span>
              </div>
              <button onClick={handleCheckout} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition">
                Checkout Now
              </button>
            </div>

          </div>
        </div>
      )}


  </div>
</section>
        
    <footer>
      <div class="bg-gray-800 text-gray-300 p-14 text-center">
          &copy; 2026 The Yummy's. All rights reserved.
      </div>
    </footer>

    </div>
  )
}

export default App
