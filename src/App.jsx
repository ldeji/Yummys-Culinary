import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import yummyLogo from './assets/yummy.jpeg'

function App() {
  // --- STATE ---
  const [cart, setCart] = useState([]) 
  const [isCartOpen, setIsCartOpen] = useState(false)

  // --- DERIVED STATE ---
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // --- LOGIC FUNCTIONS ---
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
        
       
        {/* --- NAVBAR --- */}
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4">
            
            <div className="flex justify-between items-center">
              {/* 1. Logo */}
              <div className="flex items-center gap-2">
                <div className='animate-[bounce_3s_linear_infinite]'>
                  <img src={yummyLogo} alt="Logo" className="h-12 w-12 md:w-20 md:h-20 rounded-full object-cover animate-[spin_5s_linear_infinite]" />
                </div>
                <h1 className="text-sm md:text-3xl font-bold text-yellow-500 tracking-tight">
                  The Yummys
                </h1>
          </div>

              {/* 2. Desktop Menu (Hidden on Mobile) */}
              <ul className="hidden md:flex gap-8 font-medium text-gray-600">
                <Link to="/" className="hover:text-orange-600 transition">Home</Link>
                <Link to="/menu" className="hover:text-orange-600 transition">Menu</Link>
                <Link to="/about" className="hover:text-orange-600 transition">About</Link>
              </ul>

              {/* 3. Right Side Icons (Cart + Hamburger) */}
              <div className="flex items-center gap-4">
                
                {/* Cart Button */}
                <button 
                  onClick={() => setIsCartOpen(true)} 
                  className="relative bg-orange-100 text-yelow-500 px-4 py-2 rounded-full font-bold hover:bg-yellow-600 transition"
                >
                  🛒 <span className="hidden sm:inline">Cart</span> {/* Hides text "Cart" on very small phones */}
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* 4. Hamburger Button (Visible ONLY on Mobile) */}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="md:hidden text-2xl text-gray-700 focus:outline-none"
                >
                  {/* Toggles between Hamburger (☰) and Close (✕) icon */}
                  {isMenuOpen ? "✕" : "☰"}
                </button>

              </div>
            </div>

            {/* 5. Mobile Menu Dropdown (Only shows when isMenuOpen is true) */}
            {isMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-4 flex flex-col bg-white">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-orange-600 font-medium block"
                  onClick={() => setIsMenuOpen(false)} // Close menu when clicked
                >
                  Home
                </Link>
                <Link 
                  to="/menu" 
                  className="text-gray-700 hover:text-orange-600 font-medium block"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Menu
                </Link>
                <Link 
                  to="/about" 
                  className="text-gray-700 hover:text-orange-600 font-medium block"
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
        </Routes>

       {/* --- FOOTER --- */}
        <footer className="bg-gray-900 text-white pt-12 pb-8 mt-auto">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl"></span>
                <h2 className="text-2xl font-bold text-yellow-500">The Yummys</h2>
              </div>
              <p className="text-gray-400 text-sm">
                Serving the tastiest culinaries in town since 2024. Fresh ingredients, fast delivery.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-500">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white transition">Home</Link></li>
                <li><Link to="/menu" className="hover:text-white transition">Full Menu</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About Us</Link></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-500">Contact Us</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📍 suite 95 Dolphin Plaza, Ikoyi, Lagos</li>
                <li>📞 +234 8057080703</li>
                <li>✉️ https://portfolio-project-two-ashy.vercel.app/</li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-500">Get Offers</h3>
              <p className="text-gray-400 text-sm mb-4">Subscribe for 10% off your first order!</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter email" 
                  className="w-full px-3 py-2 rounded-l-md text-gray-400 focus:outline-none"
                />
                <button className="bg-yellow-500 px-4 py-2 rounded-r-md font-bold hover:bg-yellow-600 transition">
                  Go
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} The Yummys. All rights reserved. Built by Lateef.
          </div>
        </footer>

        {/* --- CART MODAL --- */}
        {isCartOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full p-6 flex flex-col shadow-2xl animate-slide-in">
              
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold">Your Order</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-yellow-500 text-xl font-bold">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 mt-10">Your cart is empty.</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-4">
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-md object-cover" />
                        <div>
                          <h4 className="font-bold">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="bg-gray-200 w-6 h-6 rounded hover:bg-gray-300">-</button>
                            <span className="text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="bg-gray-200 w-6 h-6 rounded hover:bg-gray-300">+</button>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-yellow-600">#{item.price * item.quantity}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between text-xl text-yellow-600 font-bold mb-4">
                  <span>Total:</span>
                  <span>#{cartTotal}</span>
                </div>
                <button onClick={handleCheckout} className="w-full bg-yellow-500 text-white py-3 rounded-lg font-bold hover:bg-yellow-600 transition">
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