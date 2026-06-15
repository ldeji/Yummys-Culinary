import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { 
              full_name: fullName, 
              // We save which brand they signed up on
              brand_id: import.meta.env.VITE_BRAND || 'yummys' 
            } 
          }
        });
        if (error) throw error;
        alert("Registration Successful! Please check your email to confirm your account.");
        setMode('login');
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else if (mode === 'forgot') {
        // This sends the email with a link to your reset-password page
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        alert("Password reset link has been sent to your email!");
        setMode('login');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header - Brand Colored */}
        <div style={{ backgroundColor: brandConfig.primaryColor }} className="p-8 text-center text-white">
          <h2 className="text-3xl font-bold">
            {mode === 'signup' ? 'Create Account' : mode === 'login' ? 'Welcome Back' : 'Forgot Password'}
          </h2>
          <p className="opacity-90">{brandConfig.name}</p>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-4">
          
          {/* 1. Full Name (Only for Sign Up) */}
          {mode === 'signup' && (
            <input 
              type="text" placeholder="Full Name" required 
              className="w-full p-3 border rounded-xl focus:outline-none border-gray-200" 
              onChange={(e) => setFullName(e.target.value)} 
            />
          )}
          
          {/* 2. Email (Always visible) */}
          <input 
            type="email" placeholder="Email Address" required 
            className="w-full p-3 border rounded-xl focus:outline-none border-gray-200" 
            onChange={(e) => setEmail(e.target.value)} 
          />
          
          {/* 3. Password (Hidden for "Forgot" mode) */}
          {mode !== 'forgot' && (
            <div>
              <input 
                type="password" placeholder="Password" required 
                className="w-full p-3 border rounded-xl focus:outline-none border-gray-200" 
                onChange={(e) => setPassword(e.target.value)} 
              />
              {/* FORGOT PASSWORD LINK */}
              {mode === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setMode('forgot')} 
                  className="text-xs text-gray-400 mt-2 hover:underline float-right"
                >
                  Forgot Password?
                </button>
              )}
            </div>
          )}

          {/* 4. MAIN ACTION BUTTON */}
          <button 
            disabled={loading} 
            style={{ backgroundColor: brandConfig.primaryColor }} 
            className="w-full py-4 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition mt-4"
          >
            {loading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : mode === 'login' ? 'Login' : 'Send Reset Link'}
          </button>

          {/* 5. TOGGLE BETWEEN LOGIN AND SIGNUP */}
          <div className="text-center mt-6">
            <button 
              type="button" 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
              className="text-sm text-gray-500 hover:underline font-medium"
            >
              {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </button>
          </div>
          
          {/* Back button for Forgot Mode */}
          {mode === 'forgot' && (
            <button 
              type="button" 
              onClick={() => setMode('login')} 
              className="w-full text-center text-xs text-gray-400 mt-2 hover:underline"
            >
              Back to Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}