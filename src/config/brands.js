// src/config/brands.js
import { yummysItems } from '../data/yummysData';
import { pantryItems } from '../data/pantryData';

const brands = {
  yummys: {
    name: "Yummys",
    logo: "/images/yummys/yummy.jpeg",
    imageFolder: "/images/yummys", // <--- Points to restaurant photos
    supportEmail: "support@yummys.com",
    footerText: "© 2026 Yummys Restaurant",
    items: yummysItems, // <--- Attach the restaurant data
    primaryColor: "#EAB308", // yellow-500
    lightColor: "#EAB308",   // yellow-500
    accentColor: "#E5E7EB",  // gray-200
    backColor: "#111827", // dark-gray-900
  },
  "pantry-co": {
    name: "Pantry & Co.",
    logo: "/images/pantry/pantryLogo.webp",
    imageFolder: "/images/pantry", // <--- Points to dry goods photos
    supportEmail: "info@pantryandco.com",
    footerText: "© 2026 Pantry & Co",
    items: pantryItems,
    primaryColor:  "#4a6d43", // green-700
    lightColor: "#d40785",   // fushia
    accentColor: "#c5a47f",  // peach
    backColor: "#24150f", // dark-brown
  }
};


const currentBrandKey = import.meta.env.VITE_BRAND || 'yummys';
console.log("Looking for brand key:", currentBrandKey);
export const brandConfig = brands[currentBrandKey] || brands['yummys'];
export default brands;