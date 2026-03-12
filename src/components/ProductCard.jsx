import React from 'react';

export default function ProductCard({ product, addToCart, onSale }) {
  const discountPrice = onSale ? product.price * 0.8 : null;
  const originalPrice = onSale ? product.price : null;

  return (
    <div className="group relative bg-white rounded-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Sale Badge */}
      {onSale && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-md">
            Sale!
          </span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative h-72 bg-gray-100 overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-300 text-6xl">🏺</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Category */}
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
          {product.category || 'Ceramic'}
        </div>

        {/* Title */}
        <h3 className="text-xl font-serif text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {product.title}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          {onSale && originalPrice ? (
            <>
              <span className="text-gray-400 line-through text-sm">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="text-2xl font-bold text-gray-900">
                ${discountPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}