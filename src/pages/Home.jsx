import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { brandConfig } from '../config/brands';

// 1. The list of images to rotate
const heroImages = [
  {
    id: 1,
    img: brandConfig.name === "Yummys" ? "images/yummys/Amala.jpg" : "images/pantry/NesquikChocolate.webp",
    color: "bg-yellow-300" // Background blob color
  },
  {
    id: 1,
    img: brandConfig.name === "Yummys" ? "images/yummys/Abacha.jpg" : "images/pantry/PancakeMix.webp", // Bbq
    color: "bg-yellow-300" // Background blob color
  },
  {
    id: 2,
    img: brandConfig.name === "Yummys" ? "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600" : "images/pantry/BarillaPasta.webp", // Pizza
    color: "bg-yellow-100"
  },
  {
    id: 3,
    img: brandConfig.name === "Yummys" ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600" : "images/pantry/QuakerQuickOne-MinuteOats.webp", // Salad/Bowl
    color: "bg-yellow-300"
  },
]

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // 2. The Logic: Change image every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 3000) // 3000ms = 3 seconds

    return () => clearInterval(interval) // Cleanup on unmount
  }, [])

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
        <div className="relative h-100 w-full flex items-center justify-center">
          
          {/* The Blob Background (Changes color) */}
          <div 
            className={`absolute w-87.5 h-87.5 md:w-112.5 md:h-112.5 rounded-full blur-2xl opacity-50 transition-colors duration-1000 ${heroImages[currentIndex].color}`}
          ></div>

          {/* The Rotating Images */}
          <div className="relative w-75 h-75 md:w-100 md:h-100">
            {heroImages.map((item, index) => (
              <img 
                key={item.id}
                src={item.img} 
                alt="Food"
                className={`absolute inset-0 w-full h-full object-cover rounded-full shadow-2xl transition-all duration-1000 ease-in-out transform contrast-130
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