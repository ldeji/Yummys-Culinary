import React from 'react'
import { Link } from 'react-router-dom' 
import { brandConfig } from '../config/brands';

export default function About (){

  const aboutImage = brandConfig?.aboutImage || "/images/default-about.jpg";

    return(
        <div className="bg-white min-h-screen">
      
      {/* --- HERO SECTION --- */}
      <section className="py-26 px-4 bg-gray-900 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-300 mb-4">
          More Than Just <span
           style={{ color: brandConfig.primaryColor }}>{brandConfig.name === "Yummys" ? "Food." : "Pantry."}</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {brandConfig.name === "Yummys" ? "We believe that a great meal can fix a bad day. That’s why we wake up every morning to grill, season, and serve happiness." : "We believe that a well-stocked pantry is the heart of every home. That’s why we wake up every morning to source, pack, and deliver the freshest ingredients right to your doorstep."}
          
        </p>
      </section>

      {/* OUR STORY SECTION  */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Image */}
          <div className="relative">
            <img 
              src={brandConfig.aboutImage}
              alt="About Us"
              className="rounded-2xl shadow-2xl w-full h-auto"
            />

            {/* Floating Badge */}
             <div
              style={{ backgroundColor: brandConfig.lightColor }} // Fixed name to lightColor
              className="absolute -bottom-6 -right-6 p-6 rounded-xl shadow-xl border-2" 
              // Added padding (p-6) and rounded corners to the badge
            >
              <span 
                style={{ color: brandConfig.primaryColor }}
                className="block text-xl font-bold leading-none" 
              >
                Established
              </span>
              <span className="block text-4xl font-black text-gray-800">
                2024
              </span>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              {brandConfig.name === "Yummys" ? "It started in a small kitchen in Lagos..." : "Our Story"}
            </h2>
            <p className="text-gray-600 mb-4 text-lg leading-relaxed">
              {brandConfig.name === "Yummys" ? "Our founder, Lateef, couldn't find a meal that hit the sweet spot between fast and gourmet. So, he decided to make one." : "Our story is one of passion, dedication, and a commitment to quality. We started with a simple idea: to bring the best pantry essentials directly to your home."}
            </p>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              {brandConfig.name === "Yummys" ? "What started as a weekend experiment has grown into The Yummys—the town's favorite spot for crispy fries, cheesy pizzas, and food that actually taste like real meat." : "From sourcing the freshest ingredients to ensuring timely delivery, every step of our process is designed to provide you with the best possible experience. We are proud to have built a community of food lovers who trust us to keep their kitchens stocked with quality products."}
            </p>
            <div className="flex gap-4">
              <div className="bg-orange-100 p-4 rounded-lg text-center w-32">
                <span className="block text-2xl font-bold" style={{ color: brandConfig.primaryColor }}>15k+</span>
                <span className="text-sm text-gray-600">Happy Eaters</span>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center w-32">
                <span className="block text-2xl font-bold" style={{ color: brandConfig.primaryColor }}>30m</span>
                <span className="text-sm text-gray-600">Delivery Time</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- VALUES SECTION --- */}
      <section className="bg-gray-900 text-white py-26 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why We Are Different</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Card 1 */}
            <div className="p-6 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-xl font-bold mb-2">Fresh Ingredients</h3>
              <p className="text-gray-400">
                {brandConfig.name === "Yummys" ? "We don't use freezers. Everything is bought fresh from local markets every single morning." : "We are committed to using only the freshest ingredients in all our products."}</p>
            </div>

            {/* Card 2 */}
            <div className="p-6 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
              <div className="text-5xl mb-4">🏍️</div>
              <h3 className="text-xl font-bold mb-2">Super Fast Delivery</h3>
              <p className="text-gray-400">
                {brandConfig.name === "Yummys" ? "Our bikes are faster than Lagos traffic. Get your food while it's still steaming hot." : "We are committed to providing fast and reliable delivery services."}</p>
            </div>

            {/* Card 3 */}
            <div className="p-6 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-xl font-bold mb-2">Made with Love</h3>
              <p className="text-gray-400">
                {brandConfig.name === "Yummys" ? "We treat every order like we are cooking for our own family. No shortcuts No corner corner." : "We are committed to creating products that bring joy to every bite."}<span className="text-4xl">😉</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-bold mb-6">
          {brandConfig.name === "Yummys" ? "Ready to taste the difference?" : "Join Our Community!"}</h2>
        <Link to="/menu">
          <button 
          style={{ backgroundColor: brandConfig.primaryColor }}
          className=" text-white px-10 py-4 rounded-full text-lg font-bold hover:brightness-125 transition shadow-lg hover:scale-95">
            Order Now <span className="text-3xl">
              {brandConfig.name === "Yummys" ? "🍴" : "🌾"}</span>
          </button>
        </Link>
      </section>

    </div>
    )
}
    