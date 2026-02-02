import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Clock, Star, DollarSign } from 'lucide-react';

const RestaurantCard = ({ restaurant }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden group"
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
    >
      <div className="relative h-48">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Closed</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{restaurant.description}</p>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold">{restaurant.rating}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{restaurant.deliveryTime}</span>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>Min ${restaurant.minOrder}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RestaurantCard;
