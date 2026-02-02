import React from 'react';
import { Card } from './ui/card';

const CategoryCard = ({ category, onClick }) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
      onClick={onClick}
    >
      <div className="relative h-32">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg">{category.name}</h3>
        </div>
      </div>
    </Card>
  );
};

export default CategoryCard;
