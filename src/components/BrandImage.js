import React from 'react';
import { brandConfig } from '../config/brands';

const BrandImage = ({ fileName, alt, className }) => {
  // This combines "/images/yummys" + "/" + "fish.jpg"
  const fullPath = `${brandConfig.imageFolder}/${fileName}`;

  return (
    <img 
      src={fullPath} 
      alt={alt || "Product image"} 
      className={className} 
    />
  );
};

export default BrandImage;