import React from 'react'
import { Link } from 'react-router-dom' 
import Chef from '../assets/cheffo.jpeg'

export default function About (){
    return(
        <div className="bg-white min-h-screen">
      
      {/* --- HERO SECTION --- */}
      <section className="py-20 bg-gray-900 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-300 mb-6">
          More Than Just <span className="text-yellow-500">Food.</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          We believe that a great meal can fix a bad day. That’s why we wake up every morning to grill, season, and serve happiness.
        </p>
      </section>

      {/* --- OUR STORY SECTION --- */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Image */}
          <div className="relative">
            <img 
              src={Chef}
              alt="The chef"
              className="rounded-2xl shadow-2xl w-full h-Auto"
            />
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl hidden md:block">
              <span className="block text-4xl font-bold text-yellow-500">Since</span>
              <span className="block text-xl font-bold text-gray-800">2024</span>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">It started in a small kitchen in Lagos...</h2>
            <p className="text-gray-600 mb-4 text-lg leading-relaxed">
              Our founder, Lateef, couldn't find a meal that hit the sweet spot between "Fast" and "Gourmet." So, she decided to make one.
            </p>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              What started as a weekend experiment has grown into "The Yummys"—the town's favorite spot for crispy fries, cheesy pizzas, and food that actually taste like real meat.
            </p>
            <div className="flex gap-4">
              <div className="bg-orange-100 p-4 rounded-lg text-center w-32">
                <span className="block text-2xl font-bold text-yellow-500">15k+</span>
                <span className="text-sm text-gray-600">Happy Eaters</span>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg text-center w-32">
                <span className="block text-2xl font-bold text-yellow-500">30m</span>
                <span className="text-sm text-gray-600">Delivery Time</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- VALUES SECTION --- */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why We Are Different</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Card 1 */}
            <div className="p-6 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
              <div className="text-5xl mb-4">🌿</div>
              <h3 className="text-xl font-bold mb-2">Fresh Ingredients</h3>
              <p className="text-gray-400">We don't use freezers. Everything is bought fresh from local markets every single morning.</p>
            </div>

            {/* Card 2 */}
            <div className="p-6 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-xl font-bold mb-2">Super Fast Delivery</h3>
              <p className="text-gray-400">Our bikes are faster than Lagos traffic. Get your food while it's still steaming hot.</p>
            </div>

            {/* Card 3 */}
            <div className="p-6 border border-gray-700 rounded-xl hover:bg-gray-800 transition">
              <div className="text-5xl mb-4">❤️</div>
              <h3 className="text-xl font-bold mb-2">Made with Love</h3>
              <p className="text-gray-400">We treat every order like we are cooking for our own family. No shortcuts No corner corner.<span className="text-4xl">😉</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-bold mb-6">Ready to taste the difference?</h2>
        <Link to="/menu">
          <button className="bg-yellow-500 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-yellow-600 transition shadow-lg hover:scale-105">
            Order Now <span className="text-3xl">🍴</span>
          </button>
        </Link>
      </section>

    </div>
    )
}
    