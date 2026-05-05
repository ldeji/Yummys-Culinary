import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { brandConfig } from '../config/brands';


export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Use the list from our brand config (with a fallback to an empty array)
  const heroImages = brandConfig?.heroImages || [];

  // 2. The Logic: Change image every 3 seconds
  useEffect(() => {
     if (heroImages.length === 0) return; // Don't start interval if no images
    
     const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 3000) // 3000ms = 3 seconds

    return () => clearInterval(interval) // Cleanup on unmount
  }, [heroImages.length]) // Re-run if the number of images changes

  return (
    <div 
    style={{ backgroundColor:brandConfig.backColor }}
    className="min-h-[85vh] flex items-center justify-center px-4 overflow-hidden">
      
      {/* CONTAINER: Flex Column on Mobile, Row on Desktop */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* --- LEFT SIDE: TEXT --- */}
        <div className="text-center mt-6 md:text-left z-10">
          <div 
          style={{ color: brandConfig.primaryColor }}
          className="inline-block bg-orange-100 px-4 py-4 rounded-full text-sm font-bold mb-6">
             Fast Delivery in 30 mins within ikoyi.
          </div>
          
          <h1 
          style={{ color: brandConfig.accentColor }}
          className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            {brandConfig.name === "Yummys" ? "Hungry?" : "Need Pantry?"} <br />
            
            <span 
            style={{ color: brandConfig.lightColor }}
            >We got you.</span>
          </h1>
          
          <p 
          style={{ color: brandConfig.accentColor }}
          className="text-xl mb-8 max-w-lg mx-auto md:mx-0">
            {brandConfig.name === "Yummys" ? " Experience culinary excellence with locally sourced ingredients and modern atmosphere." : "A curated space for premium imported snacks, drinks, and pantry essentials — bringing global tastes closer to you."}       
          </p>
          
          <div className="flex gap-4 justify-center md:justify-start">
            <Link to="/menu">
              <button 
              style={{ backgroundColor: brandConfig.primaryColor }} 
              className=" px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 shadow-xl hover:scale-95 hover:brightness-130">
                Order Now <span className="text-3xl">{brandConfig.name === "Yummys" ? "🍴" : "🌾"}</span>
              </button>
            </Link>
          </div>
        </div>

        {/* --- RIGHT SIDE: ANIMATION --- */}
        <div className="relative h-112 w-full flex items-center justify-center md:w-1/2">
          
          {/* 1. The Blob Background (Perfectly Round) */}
          {heroImages.length > 0 && (
            <div 
              style={{ backgroundColor: heroImages[currentIndex].blob }}
              className="absolute w-72 h-72 md:w-96 md:h-96 aspect-square rounded-full blur-3xl opacity-40 transition-colors duration-1000"
            ></div>
          )}

          {/* 2. The Rotating Images Container */}
          {/*lock the size and use aspect-square to force a 1:1 circle ratio */}
          <div className="relative w-64 h-64 md:w-96 md:h-96 aspect-square">
            {heroImages.map((item, index) => (
              <img 
                key={item.id}
                src={item.img} 
                alt={`${brandConfig.name} Slide ${index}`}
                /* 
                  Fixes: 
                  - rounded-full + aspect-square = Perfect Circle
                  - object-cover = Content doesn't stretch 
                */
                className={`absolute inset-0 w-full h-full aspect-square object-cover rounded-full shadow-2xl transition-all duration-1000 ease-in-out transform contrast-125
                  ${index === currentIndex 
                    ? "opacity-100 scale-100 rotate-0" 
                    : "opacity-0 scale-90 rotate-12"
                  }
                `}
              />
            ))}
          </div>

        </div>

      </div>
    </div>
  )
}