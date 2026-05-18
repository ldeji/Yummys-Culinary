import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';
import { supabase } from '../config/supabaseClient';
import { CiSearch } from "react-icons/ci";


export default function Navbar({ cartCount, setIsCartOpen, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsMenuOpen(false);
      setSearchTerm("");
    }
  };

  // Correct Logout Function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Successfully logged out - Refresh and go home
      window.location.href = "/"; 
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  return (
    <nav 
      style={{ borderBottom: `2px solid ${brandConfig.primaryColor}` }}
      className="bg-white shadow-md sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center gap-4">
          
          {/* 1. Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src={brandConfig.logo} 
              alt="Logo" 
              className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover" 
            />
            <span 
              style={{ color: brandConfig.primaryColor }}
              className="hidden sm:block text-sm md:text-2xl font-bold tracking-tight"
            >
              {brandConfig.name}
            </span>
          </Link>

          {/* 2. SEARCH BAR (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-grow max-w-md relative">
            <input 
              type="text"
              placeholder={brandConfig.name === "Yummys" ? "Search for meals..." : "Search groceries..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-2 rounded-full py-1.5 px-4 pr-10 focus:outline-none"
              style={{ borderColor: brandConfig.primaryColor }}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-lg hover:opacity-70 transition">
              <CiSearch />
            </button>
          </form>

          {/* 3. Desktop Menu & Icons */}
          <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
            <ul className="hidden lg:flex gap-6 font-medium" style={{ color: brandConfig.primaryColor }}>
              <Link to="/" className="hover:opacity-70 transition">Home</Link>
              <Link to="/menu" className="hover:opacity-70 transition">
                {brandConfig.name === "Yummys" ? "Menu" : "Shop"}
              </Link>
              <Link to="/about" className="hover:opacity-70 transition">About</Link>
            </ul>

            <div className="flex items-center gap-3">
               {/* 4. AUTH SECTION (Orders + Logout/Login) */}
               {user && (
                  <Link to="/orders" className="text-sm font-bold text-gray-600 hover:opacity-70">
                    My Orders
                  </Link>
                )}

               {user ? (
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 text-sm font-bold hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <Link 
                  to="/login" 
                  style={{ color: brandConfig.primaryColor }}
                  className="font-bold text-sm"
                >
                  Login
                </Link>
              )}

              {/* Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)} 
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="relative text-white px-4 py-2 rounded-full font-bold filter hover:brightness-90 transition flex items-center gap-2"
              >
                <span>🛒</span>
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Hamburger Button (Mobile) */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="md:hidden text-2xl text-gray-700 focus:outline-none"
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>

        {/* 5. Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-4">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input 
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 rounded-lg py-2 px-4 focus:outline-none"
                style={{ borderColor: brandConfig.primaryColor }}
              />
              <button type="submit" className="absolute right-3 top-2.5 hover:opacity-70 transition hover: scale-115">
                <CiSearch />
              </button>
            </form>

            <Link to="/" className="text-gray-700 font-medium block p-2 rounded-md" style={{ backgroundColor: brandConfig.lightColor }} onClick={() => setIsMenuOpen(false)}>🏠 Home</Link>
            <Link to="/menu" className="text-gray-700 font-medium block p-2 rounded-md" style={{ backgroundColor: brandConfig.lightColor }} onClick={() => setIsMenuOpen(false)}>🍴 {brandConfig.name === "Yummys" ? "Menu" : "Shop"}</Link>
            <Link to="/about" className="text-gray-700 font-medium block p-2 rounded-md" style={{ backgroundColor: brandConfig.lightColor }} onClick={() => setIsMenuOpen(false)}>ℹ️ About</Link>
            
            {/* Added Orders & Logout to Mobile Menu */}
            {user ? (
              <>
                <Link to="/orders" className="text-gray-700 font-medium block p-2 rounded-md bg-gray-100" onClick={() => setIsMenuOpen(false)}>📋 My Orders</Link>
                <button onClick={handleLogout} className="w-full text-left text-red-500 font-medium block p-2">🚪 Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-gray-700 font-medium block p-2 rounded-md bg-gray-100" onClick={() => setIsMenuOpen(false)}>🔑 Login</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}