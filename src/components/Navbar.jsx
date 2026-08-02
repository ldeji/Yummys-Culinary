import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';
import { supabase } from '../config/supabaseClient';
import { CiSearch } from "react-icons/ci";

export default function Navbar({ cartCount, setIsCartOpen, user }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // CHECK IF USER IS ADMIN
 
useEffect(() => {
  if (user) {
    const checkRole = async () => {
      console.group("========== ADMIN CHECK ==========");

      console.log("Logged in user:", user);
      console.log("User ID:", user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("Supabase Profile:", profile);
      console.log("Supabase Error:", error);

      const currentBrand = import.meta.env.VITE_BRAND || "yummys";
      console.log("Current Brand:", currentBrand);

     if (profile) {
  // Super Admin can access every brand
  if (profile.role === "super_admin") {
    setIsAdmin(true);
  }

  // Brand Admin can only access their own brand
  else if (
    profile.role === "admin" &&
    profile.brand_id === currentBrand
  ) {
    setIsAdmin(true);
  }

  // Everyone else
  else {
    setIsAdmin(false);
  }
} else {
        console.log("❌ User is NOT an admin");
        setIsAdmin(false);
      }

      console.log("================================");
      console.groupEnd();
    };

    checkRole();
  } else {
    console.log("❌ No logged in user.");
    setIsAdmin(false);
  }
}, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchTerm.trim())}`);
      setIsMenuOpen(false);
      setSearchTerm("");
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
 <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
    <div className="flex items-center justify-between">

      {/* 1. Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 flex-shrink-0"
      >
        <img
          src={brandConfig.logo}
          alt="Logo"
          className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover"
        />

        <span
          style={{ color: brandConfig.primaryColor }}
          className="hidden sm:block text-sm md:text-2xl font-bold tracking-tight whitespace-nowrap"
        >
          {brandConfig.name}
        </span>
      </Link>

      {/* 2. Desktop Search */}
      <form
        onSubmit={handleSearch}
        className="hidden md:flex flex-1 max-w-md mx-8 relative"
      >
        <input
          type="text"
          placeholder={
            brandConfig.name === "Yummys"
              ? "Search for meals..."
              : "Search groceries..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border-2 rounded-full py-2 px-4 pr-10 focus:outline-none"
          style={{ borderColor: brandConfig.primaryColor }}
        />

        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
        >
          <CiSearch />
        </button>
      </form>

      {/* 3. Right Section */}
      <div className="flex items-center gap-2 md:gap-5 flex-shrink-0">

        {/* Desktop Navigation */}
        <ul
          className="hidden lg:flex gap-6 font-bold text-sm"
          style={{ color: brandConfig.primaryColor }}
        >
          <Link to="/" className="hover:opacity-70">
            Home
          </Link>

          <Link to="/menu" className="hover:opacity-70">
            {brandConfig.name === "Yummys" ? "Menu" : "Shop"}
          </Link>

          <Link to="/about" className="hover:opacity-70">
            About
          </Link>
        </ul>

        {/* User Section */}
       {/* User Auth Section */}
<div className="flex items-center gap-2">

  {/* Desktop only */}
  <div className="hidden lg:flex items-center gap-4">
    {user ? (
      <>
        {isAdmin && (
          <Link
            to="/admin"
            className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold hover:bg-red-700 transition"
          >
            Admin
          </Link>
        )}

        <Link
          to="/profile"
          className="text-gray-600 text-sm font-bold hover:opacity-70"
        >
          Profile
        </Link>

        <Link
          to="/orders"
          className="text-gray-600 text-sm font-bold hover:opacity-70"
        >
          Orders
        </Link>

        <button
          onClick={handleLogout}
          className="text-gray-500 text-sm font-bold hover:text-red-500"
        >
          Logout
        </button>
      </>
    ) : (
      <Link
        to="/login"
        style={{ color: brandConfig.primaryColor }}
        className="font-bold text-sm"
      >
        Login
      </Link>
            )}
  </div>

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: brandConfig.primaryColor }}
            className="relative text-white px-3 py-2 rounded-full font-bold flex items-center gap-2 hover:brightness-95"
          >
            <span>🛒</span>

            <span className="hidden md:inline">
              Cart
            </span>

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <span className="text-2xl">✕</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>
 </div>
          </div>
        </div>

        {/* 4. Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-4">
            <form onSubmit={handleSearch} className="relative mb-4">
              <input 
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border-2 rounded-lg py-2 px-4 focus:outline-none"
                style={{ borderColor: brandConfig.primaryColor }}
              />
              <button type="submit" className="absolute right-3 top-2.5">
                <CiSearch size={20} />
              </button>
            </form>

            <Link to="/" className="text-gray-700 font-medium block p-2 rounded-md hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/menu" className="text-gray-700 font-medium block p-2 rounded-md hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
              {brandConfig.name === "Yummys" ? "Menu" : "Shop"}
            </Link>
            <Link to="/about" className="text-gray-700 font-medium block p-2 rounded-md hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}> About</Link>
            
            {user ? (
              <div className="pt-4 border-t space-y-2">
                {isAdmin && (
                  <Link to="/admin" className="text-white font-bold block p-3 rounded-xl bg-red-600 text-center" onClick={() => setIsMenuOpen(false)}>🛡️ Admin Panel</Link>
                )}
                <Link to="/profile" className="text-gray-700 font-medium block p-2 rounded-md bg-gray-50" onClick={() => setIsMenuOpen(false)}>👤 My Profile</Link>
                <Link to="/orders" className="text-gray-700 font-medium block p-2 rounded-md bg-gray-50" onClick={() => setIsMenuOpen(false)}>📋 My Orders</Link>
                <button onClick={handleLogout} className="w-full text-left text-red-500 font-bold block p-2">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="text-white font-bold block p-3 rounded-xl text-center" style={{ backgroundColor: brandConfig.primaryColor }} onClick={() => setIsMenuOpen(false)}>🔑 Login</Link>
            )}
          </div>
        )}
      </div>
  </nav>
  );
}