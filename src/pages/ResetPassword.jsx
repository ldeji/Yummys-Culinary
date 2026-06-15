import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else {
      alert("Password updated! Logging you in...");
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Set New Password</h2>
        <input 
          type="password" placeholder="New Password" required
          className="w-full border p-3 rounded-xl mb-4"
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="w-full bg-black text-white py-3 rounded-xl font-bold">
          Update Password
        </button>
      </form>
    </div>
  );
}