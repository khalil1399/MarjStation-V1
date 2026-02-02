import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';

const MenuItemCard = ({ item, restaurantInfo }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item, restaurantInfo);
    toast({
      title: 'Added to cart',
      description: `${item.name} has been added to your cart`,
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="flex">
        <div className="w-32 h-32 flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
            <p className="text-orange-600 font-bold">${item.price}</p>
          </div>
          
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MenuItemCard;
