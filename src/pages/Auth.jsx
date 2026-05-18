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

    if (isSignUp) {
      // --- SIGN UP LOGIC ---
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                brand_name: brandConfig.id
            }
        }
      });
      if (error) alert(error.message);
      else alert("Check your email for the confirmation link!");
    } else {
      // --- LOGIN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else navigate('/'); // Go home after login
    }
    setLoading(false);
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
              type="text" placeholder="Full Name" required 
              className="w-full p-3 border rounded-xl focus:outline-none"
              style={{ borderColor: brandConfig.primaryColor }}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input 
            type="email" placeholder="Email Address" required 
            className="w-full p-3 border rounded-xl focus:outline-none"
            style={{ borderColor: brandConfig.primaryColor }}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required 
            className="w-full p-3 border rounded-xl focus:outline-none"
            style={{ borderColor: brandConfig.primaryColor }}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button 
            disabled={loading}
            style={{ backgroundColor: brandConfig.primaryColor }}
            className="w-full py-4 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ color: brandConfig.primaryColor }}
              className="ml-2 font-bold hover:underline"
            >
              {isSignUp ? 'Login' : 'Create one'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}