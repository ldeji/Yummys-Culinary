import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const navigate = useNavigate();

 const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Safety check: Is the client even loaded?
    if (!supabase) {
      alert("Database connection not initialized.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, brand_name: brandConfig.name } }
        });
        if (error) throw error;
        alert("Check your email for confirmation!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      console.error("Auth Error:", error.message);
      alert(error.message);
    } finally {
      setLoading(false); // This stops the "Processing" hang
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Branded Header */}
        <div style={{ backgroundColor: brandConfig.primaryColor }} className="p-8 text-center text-white">
          <img src={brandConfig.logo} className="h-16 w-16 rounded-full mx-auto mb-4 border-2 border-white shadow-lg" alt="Logo" />
          <h2 className="text-3xl font-bold">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="opacity-90">{brandConfig.name}</p>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-4">
      {isSignUp && (
        <input 
          id="full_name" // Added ID
          name="full_name" // Added Name
          type="text" placeholder="Full Name" required 
          className="w-full p-3 border rounded-xl"
          onChange={(e) => setFullName(e.target.value)}
        />
      )}
      <input 
        id="email" // Added ID
        name="email" // Added Name
        type="email" placeholder="Email Address" required 
        className="w-full p-3 border rounded-xl"
        autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        id="password" // Added ID
        name="password" // Added Name
        type="password" placeholder="Password" required 
        className="w-full p-3 border rounded-xl"
        autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button 
        disabled={loading}
        style={{ backgroundColor: brandConfig.primaryColor }}
        className="w-full py-4 text-white rounded-xl font-bold disabled:opacity-50"
      >
        {loading ? 'Connecting to Server...' : isSignUp ? 'Sign Up' : 'Login'}
      </button>
      {/* ... footer parts ... */}
    </form>
      </div>
    </div>
  );
}