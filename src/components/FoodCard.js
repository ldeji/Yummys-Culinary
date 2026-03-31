// src/components/FoodCard.js
import React from 'react';
import { brandConfig } from '../config/brands';
import BrandImage from './BrandImage'; // Simple import since they are in the same folder

// We use "props" (title, fileName, price) so the card can show any item
const FoodCard = ({ title, fileName, price, description }) => {
  return (
    <div className="food-card" style={{ 
      border: `1px solid #ddd`, 
      borderRadius: '8px', 
      padding: '16px',
      textAlign: 'center' 
    }}>
      {/* 1. The Dynamic Image */}
      <BrandImage 
        fileName={fileName} 
        alt={title} 
        className="product-image" 
      />
      
      {/* 2. The Dynamic Title */}
      <h3 style={{ color: '#333', marginTop: '10px' }}>{title}</h3>
      
      {/* 3. The Dynamic Description */}
      <p style={{ fontSize: '14px', color: '#666' }}>{description}</p>
      
      {/* 4. The Dynamic Price */}
      <div style={{ fontWeight: 'bold', margin: '10px 0', fontSize: '18px' }}>
        {price}
      </div>
      
      {/* 5. The Brand-Colored Button */}
      <button style={{ 
        backgroundColor: brandConfig.lightColor, 
        color: 'white', 
        border: 'none', 
        padding: '10px 20px', 
        borderRadius: '5px',
        cursor: 'pointer'
      }}>
        Add to Cart
      </button>
    </div>
  );
};

export default FoodCard;