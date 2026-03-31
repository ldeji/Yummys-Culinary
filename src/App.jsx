import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import About from './pages/About'
import { brandConfig } from "./config/brands";
import ScrollToTop from "./components/ScrollToTop";


function App() {
  // --- STATE ---
  const [cart, setCart] = useState([]) 
  const [isCartOpen, setIsCartOpen] = useState(false)

  //  DERIVED STATE
  const cartCount = cart.length
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // LOGIC FUNCTIONS
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })
    // Optional: Auto-open cart when adding
    // setIsCartOpen(true) 
  }

  const updateQuantity = (id, amount) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === id) {
          return { ...item, quantity: item.quantity + amount }
        }
        return item
      }).filter((item) => item.quantity > 0)
    })
  }

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty! Add some yumminess first.")
      return
    }
    const confirmOrder = window.confirm(`Ready to pay #${cartTotal}?`)
    if (confirmOrder) {
      alert("Order Placed Successfully!")
      setCart([])
      setIsCartOpen(false)
    }
  }

  //  for the mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false)


  // --- RETURN ---
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans relative">
        
        {/* Scroll To Top  */}
       <ScrollToTop />
      {/* --- NAVBAR --- */}
<nav 
style={{ backgroundColor: brandConfig.accentColor }}
className="bg-white shadow-md sticky top-0 z-50">
    
  <div className="max-w-6xl mx-auto px-4 py-5">
    
    <div className="flex justify-between items-center">     
      {/* 1. Logo & Brand Name */}
      <div className="flex items-center gap-2">
        <div className='animate-[bounce_3s_linear_infinite]'>
          <img 
            src={brandConfig.logo} 
            alt="Logo" 
            className="h-8 w-8 md:w-10 md:h-10 rounded-full object-cover animate-[spin_7s_linear_infinite]" 
          />
        </div>
        
        {/* Dynamic Brand Name and Primary Color */}
        <Link 
          to="/" 
          style={{ color: brandConfig.primaryColor }}
          className="text-sm md:text-3xl font-bold tracking-tight"
        >
          {brandConfig.name}
        </Link>
      </div>

      {/* 2. Desktop Menu */}
      <ul 
      style={{ color: brandConfig.primaryColor }}
      className="hidden md:flex gap-8 font-medium">
        <Link to="/" className="hover:opacity-70 transition duration-300">Home</Link>
        
        {/* Logic: Change "Menu" to "Shop" if it's the Pantry brand */}
        <Link to="/menu" className="hover:opacity-70 transition duration-300">
      {/* TWO WORDS OPTIONS  */}
          {brandConfig.name === "Yummys" ? "Menu" : "Shop"}
        </Link>
        
        <Link to="/about" className="hover:opacity-70 transition duration-300">About</Link>
      </ul>

      {/* 3. Right Side Icons (Cart + Hamburger) */}
      <div className="flex items-center gap-4">
        
        {/* Dynamic Cart Button Color */}
        <button 
          onClick={() => setIsCartOpen(true)} 
          style={{ backgroundColor: brandConfig.primaryColor }}
          className="relative text-white px-4 py-2 rounded-full font-bold filter hover:brightness-90 transition"
        >
          🛒 <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
              {cartCount}
            </span>
          )}
        </button>

        {/* 4. Hamburger Button (Mobile Only) */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="md:hidden text-2xl text-gray-700 focus:outline-none"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>

      </div>
    </div>

    {/* 5. Mobile Menu Dropdown */}
    {isMenuOpen && (
      <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-4 flex flex-col bg-white">
        <Link 
          to="/" 
          className="text-gray-700 font-medium block"
          style={{ borderLeft: `4px solid ${brandConfig.primaryColor}`, paddingLeft: '8px' }}
          onClick={() => setIsMenuOpen(false)}
        >
          Home
        </Link>
        <Link 
          to="/menu" 
          className="text-gray-700 font-medium block"
          style={{ borderLeft: `4px solid ${brandConfig.primaryColor}`, paddingLeft: '8px' }}
          onClick={() => setIsMenuOpen(false)}
        >
          {brandConfig.name === "Yummys" ? "Menu" : "Shop"}
        </Link>
        <Link 
          to="/about" 
          className="text-gray-700 font-medium block"
          style={{ borderLeft: `4px solid ${brandConfig.primaryColor}`, paddingLeft: '8px' }}
          onClick={() => setIsMenuOpen(false)}
        >
          About
        </Link>
      </div>
    )}

  </div>
</nav>

        {/* --- ROUTES --- */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu addToCart={addToCart} />} />
          <Route path="/about" element={<About />} />
        </Routes>

       {/* --- FOOTER --- */}
        <footer className="bg-gray-900 text-white pt-12 pb-8 mt-auto">
          <div className="max-w-6xl mx-auto py-30 px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <img 
                  src={brandConfig.logo} 
                  alt="Logo" 
                  className="h-8 w-8 md:w-10 md:h-10 rounded-full object-cover" 
                />
              </div>
              <p className="text-gray-400 text-sm">
                Serving the tastiest culinaries in town since 2024. Fresh ingredients, fast delivery.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-style={{ color: brandConfig.primaryColor }}">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/menu" className="hover:text-white transition">{brandConfig.name === "Yummys" ? "Full Menu" : "View Products"}</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-style={{ color: brandConfig.primaryColor }}">Contact Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📍 Suite 95 Dolphin Plaza, Ikoyi, Lagos</li>
                <li>📞 +234 8057080703</li>
                <li>✉️ https://portfolio-project-two-ashy.vercel.app/</li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-style={{ color: brandConfig.primaryColor }}">Get Offers</h3>
              <p className="text-gray-400 text-sm mb-4">Subscribe for 10% off your first order!</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter email" 
                  className="w-full px-3 py-2 rounded-l-md text-gray-400 focus:outline-none"
                />
                <button className="bg-style={{ color: brandConfig.primaryColor }} px-4 py-2 rounded-r-md font-bold hover:bg-yellow-600 transition">
                  Go
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
           {brandConfig.footerText}, All rights reserved. Built by Lateef.
          </div>
        </footer>

       {/* --- CART MODAL --- */}
{isCartOpen && (
  <div className="fixed inset-0 z-50 flex">
    
    {/* 1. LEFT SIDE (The Dark Overlay) */}
    {/* 'hidden md:flex' hides this whole section on mobile */}
   

    <div 
      className="hidden md:flex flex-1 bg-gray-900 bg-opacity-80 items-center justify-center p-8"
      onClick={() => setIsCartOpen(false)} // Clicking empty space closes modal
    >
      <div 
        className="max-w-2xl w-full" 
        onClick={(e) => e.stopPropagation()} // Clicking the cards WON'T close modal
      >
        {/* Back to menu button  */}
             <button 
                onClick={() => setIsCartOpen(false)} 
                className="text-white bg-style={{ color: brandConfig.primaryColor }} hover:bg-yellow-600 text-sm rounded-lg px-3 py-2 mb-6 font-bold"
              >
                Back to menu
              </button>
        <h3 className="text-style={{ color: brandConfig.primaryColor }} text-3xl font-bold mb-6">Don't forget drinks and dessert!</h3>
           
        {/* The Mini Menu Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Did you forget anything? 'upsell' list here */}
          {[
            { id: 1, name: "Chocolate Shake", price: 2500, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500" },
            { id: 2, name: "Naija fizz", price: 1200, image: "/images/NaijaFizz.png" },
            { id: 3, name: "CocaCola", price: 500, image: "/images/CocaCola.jpg" },
            { id: 4, name: "Sprite", price: 500, image: "/images/Sprite.jpg" },
            { id: 5, name: "Berry Blast", price: 1500, image: "/images/BerryBlast.jpg" },
            { id: 6, name: "Onion Rings", price: 3000, image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500" }
          ].map((upsell) => (
            <div key={upsell.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-xl hover:scale-105 transition">
              <img src={upsell.image} alt={upsell.name} className="w-24 h-24 object-cover rounded-lg" />
              <div>
                <h4 className="font-bold text-lg">{upsell.name}</h4>
                <p className="text-style={{ color: brandConfig.primaryColor }} font-bold">#{upsell.price}</p>
                <button 
                  onClick={() => addToCart({ ...upsell, quantity: 1, description: "Upsell item" })}
                  style={{ backgroundColor: brandConfig.primaryColor }}
                  className="mt-2 text-white px-4 py-1 rounded text-sm font-bold hover:bg-yellow-600"
                >
                  Add +
                </button>
            <div className="flex justify-center items-center">
           
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 2. RIGHT SIDE (The Actual Cart) */}
    {/* On mobile, this takes full width. On desktop, it stays on the right. */}
    <div className="bg-yellow-50 w-full max-w-md h-full p-6 flex flex-col shadow-2xl animate-slide-in">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 border-b border-orange-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Your Order</h2>
        <button 
          onClick={() => setIsCartOpen(false)} 
          className="text-gray-500 hover:text-red-500 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* --- CART ITEMS LIST --- */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {cart.length === 0 ? (
          <div className="text-center mt-20">
            <span className="text-6xl">🛒</span>
            <p className="text-gray-500 mt-4">Your cart is empty.</p>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="mt-4 text-orange-600 font-bold underline"
            >
              Go to Menu
            </button>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <h4 className="font-bold text-gray-800">{item.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="bg-orange-100 text-orange-600 w-6 h-6 rounded hover:bg-orange-200">-</button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="bg-orange-100 text-orange-600 w-6 h-6 rounded hover:bg-orange-200">+</button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="block font-bold text-style={{ color: brandConfig.primaryColor }}">#{item.price * item.quantity}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-xs text-yellow-600 hover:text-yellow-700 underline">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- CHECKOUT --- */}
      <div className="mt-6 border-t border-orange-200 pt-4">
        <div className="flex justify-between text-xl font-bold mb-4 text-gray-800">
          <span>Total:</span>
          <span>#{cartTotal}</span>
        </div>
        <button 
          onClick={handleCheckout} 
          style={{ backgroundColor: brandConfig.primaryColor }}
          className="w-full text-white py-4 rounded-xl font-bold hover:bg-yellow-600 transition shadow-lg transform hover:-translate-y-1"
        >
          Checkout Now
        </button>
      </div>

    </div>
   </div>
   )}
   </div>
    </BrowserRouter>
  )

}
export default App
