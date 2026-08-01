// src/config/brands.js
import { yummysItems, yummysUpsells } from '../data/yummysData';
import { pantryItems, pantryUpsells } from '../data/pantryData';

const brands = {
  yummys: {
    name: "Yummys",
    logo: "/images/yummys/yummy.jpeg",
    imageFolder: "/images/yummys", // <--- Points to restaurant photos
    supportEmail: "support@yummys.com",
    address: "123 Adebola Ojomu Street, Aguda, Lagos",
    titleFont: "'Fredoka', sans-serif", // Playful & Rounded
    web3FormsKey: import.meta.env.VITE_YUMMYS_WEB3_KEY, // Inject key here
    footerText: "© 2026 Yummys Restaurant",
    items: yummysItems, // Attach the restaurant data
    categories: ["Rice", "Starter", "Finger Foods", "Pasta", "Breakfast", "Drinks", "Desserts"],
    upsells: yummysUpsells, // Attach the upsell data
    aboutImage: "/images/yummys/cheffo.jpeg",
    ctaImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200", // People eating
    whatsapp: "2348057080703", // added WhatsApp number for Yummys
    paystackKey: "pk_test_f5cf2aa44a08c1cf4af8e848b3967cce5285c637", // Add your key here
    currency: "NGN",
    primaryColor: "#EA580C", // orange-600
    lightColor: "#EAB308",   // yellow-500
    accentColor: "#14532D",  // blue-900
    whiteColor: "#ffffff", // white
    backColor: "#111827", // dark-gray-900
    newColor: "blue", // dark-gray-900
     heroImages: [
      { id: 1, img: "/images/yummys/Amala.webp", blob: "#FDE047" },
      { id: 2, img: "/images/yummys/Abacha.webp", blob: "#FDE047" },
      { id: 3, img: "/images/yummys/JollofAndChicken.webp", blob: "#FEFCE8" }, // yellow-100
      { id: 4, img: "/images/yummys/Asaro.webp", blob: "#FDE047" },
    ]
  },
  "pantry-co": {
    name: "Pantry & Co.",
    logo: "/images/pantry/pantryLogo.webp",
    titleFont: "'Lilita', cursive", // Elegant & Friendly
    imageFolder: "/images/pantry", // <--- Points to dry goods photos
    supportEmail: "Address: pantrygroceries@gmail.com",
    address: "Suite 95, First Floor, Dolphin Plaza, Corporation Drive, Dolphin Estate, Ikoyi, Lagos",
    web3FormsKey: import.meta.env.VITE_PANTRY_WEB3_KEY, // Inject key here
    footerText: "© 2026 Pantry & Co",
    items: pantryItems,
    categories: ["Cleaning", "Tea","Beverages", "Kitchen Consumables", "Dry Goods","Condiments"],
    upsells: pantryUpsells,
    aboutImage: "/images/pantry/PantryCollection.webp",
    ctaImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200", // People cooking
    primaryColor: "#14532d", // green-700
    lightColor: "#16a34a",   // fushia
    accentColor: "#c5a47f", // gold color
    backColor: "#24150f", // dark-brown
    newColor: "#24150f", // green-300
    whiteColor: "#ffffff", // white
    whatsapp: "2348035304415", // added WhatsApp number for Pantry & Co.
    paystackKey: "pk_test_f5cf2aa44a08c1cf4af8e848b3967cce5285c637", // Add your key here
    currency: "NGN",
     heroImages: [
      { id: 1, img: "/images/pantry/NesquikChocolate.webp", blob: "#86EFAC" }, // green-300
      { id: 2, img: "/images/pantry/PancakeMix.webp", blob: "#86EFAC" },
      { id: 3, img: "/images/pantry/BarillaPasta.webp", blob: "#DCFCE7" }, // green-100
      { id: 4, img: "/images/pantry/QuakerQuickOne-MinuteOats.webp", blob: "#86EFAC" },
      { id: 5, img: "/images/pantry/GoyaAdobo.webp", blob: "#86EFAC" },
      { id: 6, img: "/images/pantry/Colgate.webp", blob: "#86EFAC" },
      { id: 7, img: "/images/pantry/Fabuloso.webp", blob: "#86EFAC" },
      { id: 8, img: "/images/pantry/Knorr.webp", blob: "#86EFAC" }
    ]
  }
};


const currentBrandKey = import.meta.env.VITE_BRAND || 'yummys';
console.log("Looking for brand key:", currentBrandKey);
export const brandConfig = brands[currentBrandKey] || brands['yummys'];
export default brands;