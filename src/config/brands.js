// src/config/brands.js
import { yummysItems, yummysUpsells } from '../data/yummysData';
import { pantryItems, pantryUpsells } from '../data/pantryData';

const brands = {
  yummys: {
    name: "Yummys",
    logo: "/images/yummys/yummy.jpeg",
    imageFolder: "/images/yummys", // <--- Points to restaurant photos
    supportEmail: "support@yummys.com",
    footerText: "© 2026 Yummys Restaurant",
    items: yummysItems, // Attach the restaurant data
    upsells: yummysUpsells, // Attach the upsell data
    aboutImage: "/images/yummys/cheffo.jpeg",
    primaryColor: "#EAB308", // yellow-500
    lightColor: "#EAB308",   // yellow-500
    accentColor: "#E5E7EB",  // gray-200
    backColor: "#111827", // dark-gray-900
     heroImages: [
      { id: 1, img: "/images/yummys/Amala.jpg", blob: "#FDE047" }, // yellow-300
      { id: 2, img: "/images/yummys/Abacha.jpg", blob: "#FDE047" },
      { id: 3, img: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600", blob: "#FEFCE8" }, // yellow-100
      { id: 4, img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600", blob: "#FDE047" }
    ]
  },
  "pantry-co": {
    name: "Pantry & Co.",
    logo: "/images/pantry/pantryLogo.webp",
    imageFolder: "/images/pantry", // <--- Points to dry goods photos
    supportEmail: "info@pantryandco.com",
    footerText: "© 2026 Pantry & Co",
    items: pantryItems,
    upsells: pantryUpsells,
    aboutImage: "/images/pantry/PantryCollection.jpeg",
    primaryColor:  "#4a6d43", // green-700
    lightColor: "#d40785",   // fushia
    accentColor: "#c5a47f",  // peach
    backColor: "#24150f", // dark-brown
     heroImages: [
      { id: 1, img: "/images/pantry/NesquikChocolate.webp", blob: "#86EFAC" }, // green-300
      { id: 2, img: "/images/pantry/PancakeMix.webp", blob: "#86EFAC" },
      { id: 3, img: "/images/pantry/BarillaPasta.webp", blob: "#DCFCE7" }, // green-100
      { id: 4, img: "/images/pantry/QuakerQuickOne-MinuteOats.webp", blob: "#86EFAC" }
    ]
  }
};


const currentBrandKey = import.meta.env.VITE_BRAND || 'yummys';
console.log("Looking for brand key:", currentBrandKey);
export const brandConfig = brands[currentBrandKey] || brands['yummys'];
export default brands;