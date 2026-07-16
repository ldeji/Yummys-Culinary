import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { brandConfig } from '../config/brands';
import SEO from '../components/SEO';

export default function Profile({ user }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // FIXED: Added this state
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // SAFETY: If a value is null in database, use an empty string ""
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setUpdating(true); // FIXED: This will now work
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
        })
        .eq('id', user.id);

      if (error) throw error;
      alert("Profile updated successfully! ✅");
    } catch (error) {
      alert("Update error: " + error.message);
    } finally {
      setUpdating(false); // FIXED: This will now work
    }
  }

  if (loading) return <div className="p-20 text-center">Loading your details...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen">
      <SEO title="My Profile" />
      
      <h2 className="text-3xl font-bold mb-8" style={{ color: brandConfig.primaryColor }}>
        Account Settings
      </h2>

      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
          <input 
            type="text" 
            disabled 
            value={user?.email || ""} 
            className="w-full p-3 bg-gray-50 border rounded-xl text-gray-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name</label>
          <input 
            type="text" 
            required
            value={profile.full_name} 
            onChange={(e) => setProfile({...profile, full_name: e.target.value})}
            className="w-full p-3 border rounded-xl focus:outline-none"
            style={{ borderColor: '#eee' }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
          <input 
            type="tel" 
            placeholder="e.g. +234..."
            value={profile.phone} 
            onChange={(e) => setProfile({...profile, phone: e.target.value})}
            className="w-full p-3 border rounded-xl focus:outline-none"
            style={{ borderColor: '#eee' }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delivery Address</label>
          <textarea 
            placeholder="Your house address, street, and city"
            value={profile.address} 
            onChange={(e) => setProfile({...profile, address: e.target.value})}
            className="w-full p-3 border rounded-xl h-24 focus:outline-none"
            style={{ borderColor: '#eee' }}
          />
        </div>

        <button 
          disabled={updating}
          style={{ backgroundColor: brandConfig.primaryColor }}
          className="w-full py-4 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition active:scale-95 disabled:opacity-50"
        >
          {updating ? 'Saving Changes...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}