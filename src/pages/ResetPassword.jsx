import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { brandConfig } from '../config/brands';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // Track success state
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Show success message
      setSuccess(true);
      
      // Wait 3 seconds then redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl text-center">
        
        {!success ? (
          <>
            <h2 className="text-3xl font-bold mb-2">Set New Password</h2>
            <p className="text-gray-500 mb-8">Enter your new secure password below.</p>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <input 
                type="password" 
                placeholder="New Password" 
                required 
                className="w-full border p-3 rounded-xl focus:outline-none border-gray-200"
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button 
                disabled={loading}
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="w-full py-4 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        ) : (
          <div className="py-10 animate-fade-in">
            <div className="text-6xl mb-4 text-green-500">✅</div>
            <h2 className="text-2xl font-bold text-gray-800">Password Updated!</h2>
            <p className="text-gray-500 mt-2">You will be redirected to the login page in a moment...</p>
            <button 
                onClick={() => navigate('/login')}
                className="mt-6 text-sm font-bold underline"
                style={{ color: brandConfig.primaryColor }}
            >
                Click here if not redirected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}