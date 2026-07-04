import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { brandConfig } from '../config/brands';
import SEO from '../components/SEO'; // Import the SEO component
import { FaWhatsapp } from 'react-icons/fa';

export default function Home() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate();

  const heroImages = brandConfig?.heroImages || [];

  useEffect(() => {
     if (heroImages.length === 0) return; 
    
     const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 3000) 

    return () => clearInterval(interval) 
  }, [heroImages.length]) 

  return (
    <div 
       style={{ 
        background: `linear-gradient(${isMobile ? 'to bottom' : 'to right'}, ${brandConfig.newColor} 65%, #dde8ff 100%)` 
      }}
      className="min-h-[85vh] flex items-center justify-center px-4 overflow-hidden"
    >
      {/* --- SEO COMPONENT --- */}
      <SEO 
        title="Home" 
        description={brandConfig.name === "Yummys" 
          ? "Delicious meals delivered fast in Ikoyi. Experience culinary excellence with Yummys." 
          : "Premium imported snacks and pantry essentials. Your global grocery store in Lagos."
        } 
      />

      {/* CONTAINER: Flex Column on Mobile, Row on Desktop */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* --- LEFT SIDE: TEXT --- */}
        <div className="text-center mt-6 md:text-left z-10">
          <div 
            style={{ color: brandConfig.primaryColor }}
            className="inline-block bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-sm border border-white/20"
          >
             Fast Delivery within Ikoyi & envrionments.
          </div>
          
          <h1 
            style={{ color: brandConfig.accentColor }}
            className="text-4xl md:text-7xl font-extrabold leading-tight mb-6"
          >
            {brandConfig.name === "Yummys" ? "Hungry?" : "Need Pantry Items?"} <br />
            <span style={{ color: brandConfig.lightColor }}>We got you.</span>
          </h1>
          
          <p 
            style={{ color: brandConfig.accentColor }}
            className="text-xl mb-8 max-w-lg mx-auto md:mx-0 opacity-90"
          >
            {brandConfig.name === "Yummys" 
              ? "Experience culinary excellence with locally sourced ingredients and a modern atmosphere." 
              : "A curated space for premium imported snacks, drinks, and pantry essentials — bringing global tastes closer to you."
            }       
          </p>
          
          <div className="flex gap-4 justify-center md:justify-start">
            <Link to="/menu">
              <button 
                style={{ backgroundColor: brandConfig.primaryColor }} 
                className="px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 shadow-xl hover:scale-105 hover:brightness-110 text-white"
              >
                Order Now <span className="text-3xl">{brandConfig.name === "Yummys" ? "🍴" : "🌾"}</span>
              </button>
            </Link>
          </div>
        </div>

        {/* --- RIGHT SIDE: ANIMATION --- */}
        <div className="relative h-112 w-full flex items-center justify-center [perspective:1000px]">
          
          {/* 1. The Blob Background */}
          {heroImages.length > 0 && (
            <div 
              style={{ backgroundColor: heroImages[currentIndex].blob }}
              className="absolute w-72 h-72 md:w-96 md:h-96 aspect-square rounded-full blur-3xl opacity-40 transition-colors duration-1000"
            ></div>
          )}

          {/* 2. The Flip Container */}
          <div 
            onClick={() => navigate('/menu')}
            className="relative w-72 h-72 md:w-96 md:h-96 aspect-square cursor-pointer group [transform-style:preserve-3d]"
          >
            {heroImages.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 w-full h-full rounded-full bg-white shadow-2xl overflow-hidden backface-hidden transition-all duration-1000 ease-in-out
                  ${index === currentIndex 
                    ? "opacity-100 [transform:rotateY(0deg)] z-10" 
                    : "opacity-0 [transform:rotateY(180deg)] z-0"
                  }
                `}
              >
                <img 
                  src={item.img} 
                  alt="Product"
                  className="w-full h-full object-contain p-10 md:p-14 transition-transform duration-500 group-hover:scale-110 contrast-125"
                />
              </div>
            ))}
            
            {/* Hover Badge */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
              <span 
                style={{ backgroundColor: brandConfig.primaryColor }}
                className="text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg"
              >
                View {brandConfig.name === "Yummys" ? "Menu" : "Shop"} →
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* --- FLOATING WHATSAPP BUTTON --- */}
    <a
       href={`https://wa.me/${brandConfig.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[100] flex items-center justify-center group"
    >
      {/* Optional Tooltip: Appears on hover */}
      <span className="absolute right-16 bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-gray-100">
        Chat with us! 👋
      </span>

      {/* The Icon Circle */}
      <div 
        className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl animate-bounce hover:animate-none hover:scale-110 transition-all duration-300"
      >
        <FaWhatsapp size={32} />
      </div>
    </a>
    </div>
  );
}