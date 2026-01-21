import { Link } from 'react-router-dom'


export default function Home() {
  return (
    <div className="text-center py-20 bg-gray-900 min-h-[80vh] flex flex-col justify-center items-center">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-gray-100">Hungry? We got you.</h1>
      <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-lg">
        Experience culinary excellence with locally sourced ingredients and modern atmosphere.
      </p>
      <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-lg">
        Delivered to your doorstep in minutes.
      </p>

      {/* This Link takes us to the Menu Page */}
      <Link to="/menu">
        <button className="bg-yellow-500 text-white px-8 py-3 rounded-full text-lg font-bold hover:bg-yellow-600 transition shadow-lg hover:scale-105">
          View Full Menu 
        </button>
      </Link>
    </div>
  )
}