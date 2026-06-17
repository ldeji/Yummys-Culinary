import { Helmet } from 'react-helmet-async';
import { brandConfig } from '../config/brands';

export default function SEO({ title, description }) {
  const brandName = brandConfig.name;
  const siteUrl = window.location.origin;
  
  // Use the brand logo as the sharing image
  // Note: WhatsApp requires an ABSOLUTE URL (starts with https://)
  const seoImage = `${siteUrl}${brandConfig.logo}`;

  const seoDescription = description || (
    brandName === "Yummys" 
      ? "Serving the tastiest culinaries in Lagos. Fresh ingredients, fast delivery." 
      : "Premium pantry essentials and global food imports delivered to your door."
  );

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title ? `${title} | ${brandName}` : brandName}</title>
      <meta name="description" content={seoDescription} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={brandName} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={brandName} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />
    </Helmet>
  );
}