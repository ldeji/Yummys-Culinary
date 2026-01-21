import React from 'react'

export default function Menu({ addToCart }) {
  // Move your data here
  const menuItems = [
    {
    id: 1,
    name: "Classic Burger",
    price: "8000",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    description: "Juicy beef patty with fresh lettuce."
  },
  {
    id: 2,
    name: "Rice and Beans",
    price: "8000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgA_ArjD_7xTlh4CYEQaIF6O5yXMP7XY4OlQ&s",
    description: "Rice and Beans with chicken and salads."
  },
  {
    id: 3,
    name: "Bole and Fish",
    price: "6500",
    image: "/images/BoleAndFish.jpg",
    description: "Grilled fish and bole with our secret sauce."
  },
  {
    id: 4,
    name: "Shawarma",
    price: "3000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7sVUdGKDH1mFwpqMuCbscb9xfUGI1shmIpA&s",
    description: "Shawarma with spicy beef and chicken combo with salads."
  },

  {
    id: 5,
    name: "Pepper Soup",
    price: "10000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw90Br7rTK_vyR65pRXKN6fRXfykzJemF8OQ&s",
    description: "Fish pepper soup with our signature mint pepper sauce."
  },

  {
    id: 6,
    name: "Abacha",
    price: "10000",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRw54Dl2-e7qGAqvW0KzK8-tV1Yji38f8vlgA&s",
    description: "Boiled casava, vegetables with our special pepper sauce."
  },
  

  {
    id: 7,
    name: "Asaro",
    price: "7500",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhj18mF-xjP2W87ujK614lz8WyECeSthLsBA&s",
    description: "Boiled mash yam with assoted meat."
  },

  {
    id: 8,
    name: "Ayamase",
    price: "5000",
    image: "/images/Ayamase.jpg",
    description: "Fried pepper mixed with secrete sauce."
  },

  {
    id: 8,
    name: "Bbq with Rice",
    price: "5000",
    image: "/images/Bbq.jpg",
    description: "Grilled Bbq with rice and veggies."
  },
  ]




 return (
    <section className="p-10 max-w-6xl mx-auto min-h-screen">
      <h2 className="text-3xl font-bold text-center mb-8 text-yellow-500">Our Full Menu</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:scale-105 transition duration-300">
            <img src={item.image} alt={item.name} className="w-full h-48 object-cover hover:contrast-120" />
            <div className="p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-xl">{item.name}</h3>
                <span className="text-yellow-600 font-bold">#{item.price}</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">{item.description}</p>
              
              {/* Note: We use the addToCart function passed from App.jsx */}
              <button 
                onClick={() => addToCart(item)}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold hover:bg-yellow-600 active:scale-95 transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )

} 
