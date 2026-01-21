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
      alert("Order Placed Successfully! 🍔")
      setCart([])
      setIsCartOpen(false)
    }
  }

  // --- RETURN ---
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans relative">
        
        {/* --- NAVBAR --- */}
        <nav className="bg-white shadow-md sticky top-0 z-50 p-10">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            
             {/*Logo */}
          <div className="flex items-center gap-2">
            <div className='animate-[bounce_3s_linear_infinite]'>
            <img src={yummyLogo} alt="Logo" className="h-12 w-12 md:w-20 md:h-20 rounded-full object-cover animate-[spin_5s_linear_infinite]" />
            </div>
            <h1 className="text-sm md:text-3xl font-bold text-yellow-500 tracking-tight">
              The Yummys
            </h1>
          </div>

            <ul className="text-xs gap-4 md:flex md:gap-8 font-medium text-gray-600">
              <Link to="/" className="hover:text-yellow-600 transition">Home</Link>
              <Link to="/menu" className="hover:text-yellow-600 transition">Menu</Link>
              <Link to="/about" className="hover:text-yellow-600 transition">About</Link>
            </ul>

            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative bg-orange-100 text-yellow-600 px-4 py-2 rounded-full font-bold hover:bg-orange-200 transition"
            >
              🛒 Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* --- ROUTES --- */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu addToCart={addToCart} />} />
        </Routes>

        {/* --- CART MODAL (This was missing!) --- */}
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