import React, { useState, useEffect } from 'react'; // FIXED: Added useState and useEffect
import { Link } from 'react-router-dom';
import { brandConfig } from '../config/brands';
import { supabase } from '../config/supabaseClient'; // Import supabase
import SEO from '../components/SEO';

export default function About() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the image from brandConfig or a default
  const aboutImage = brandConfig?.aboutImage || "/images/default-about.jpg";

  useEffect(() => {
    async function fetchSettings() {
      try {
        const bId = import.meta.env.VITE_BRAND || 'yummys';
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('brand_id', bId)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        if (data) setContent(data);
      } catch (err) {
        console.error("Error fetching about story:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <SEO title="About Us" />
      
      {/* --- HERO SECTION --- */}
      <section className="py-20 px-4 bg-gray-900 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          More Than Just <span style={{ color: brandConfig.primaryColor }}>
             {brandConfig.name === "Yummys" ? "Food." : "Ingredients."}
           </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto opacity-90">
          {brandConfig.name === "Yummys" 
            ? "We believe that a great meal can fix a bad day. That’s why we wake up every morning to grill, season, and serve happiness." 
            : "We believe that a well-stocked pantry is the heart of every home. That’s why we source, pack, and deliver the freshest ingredients."
          }
        </p>
      </section>

      {/* --- OUR STORY SECTION --- */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="relative">
            <img 
              src={aboutImage} 
              alt="About us"
              className="rounded-2xl shadow-2xl w-full h-auto object-cover max-h-[500px]"
            />
            <div
              style={{ backgroundColor: brandConfig.lightColor }}
              className="absolute -bottom-6 -right-6 p-6 rounded-xl shadow-xl border border-gray-100"
            >
              <span style={{ color: brandConfig.backColor }} className="block text-xl font-bold leading-none">Established</span>
              <span className="block text-4xl font-black text-gray-800">2024</span>
            </div>
          </div>

          <div>
             <h2 className="text-3xl font-bold mb-6">Our Journey</h2>
             
             {/* --- DYNAMIC STORY TEXT --- */}
             <p className="text-gray-600 leading-relaxed mb-8">
                {content?.about_story || (
                  brandConfig.name === "Yummys" 
                    ? "Starting from a small kitchen, we've grown into a community favorite, serving authentic meals with a modern twist." 
                    : "We started with a simple mission: to make high-quality bulk food and global pantry essentials accessible to everyone."
                )}
             </p>

             <Link 
               to="/menu" 
               style={{ backgroundColor: brandConfig.primaryColor }}
               className="inline-block text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition shadow-lg"
             >
               {/* --- DYNAMIC BUTTON TEXT --- */}
               {content?.cta_button_text || (brandConfig.name === "Yummys" ? "See our Menu" : "Browse our Shop")}
             </Link>
          </div>

        </div>
      </section>
    </div>
  )
}
    