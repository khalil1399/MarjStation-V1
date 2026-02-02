import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantService } from '../services/firebase/restaurantService';
import { menuItemService } from '../services/firebase/menuItemService';
import MenuItemCard from '../components/MenuItemCard';
import { Button } from '../components/ui/button';
import { ArrowLeft, Clock, Star, DollarSign, MapPin, Loader2 } from 'lucide-react';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribeRestaurant = restaurantService.listenToRestaurant(id, (data) => {
      setRestaurant(data);
      setLoading(false);
    });

    const unsubscribeMenuItems = menuItemService.listenToMenuItemsByRestaurant(id, (data) => {
      setMenuItems(data);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRestaurant();
      unsubscribeMenuItems();
    };
  }, [id]);

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {loading ? (
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
        ) : (
          <p className="text-gray-500">Restaurant not found</p>
        )}
      </div>
    );
  }

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="relative h-64 md:h-80">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {restaurant.name}
            </h1>
            <p className="text-white/90 mb-4">{restaurant.description}</p>
            
            <div className="flex flex-wrap gap-4 text-white text-sm">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                <span>{restaurant.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span>Min ${restaurant.minOrder}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Delivery Fee: ${restaurant.deliveryFee}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        {menuItems.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Menu Coming Soon!
                </h3>
                <p className="text-gray-600 text-lg mb-2">
                  This restaurant is setting up their menu.
                </p>
                <p className="text-gray-500">
                  Check back soon to see delicious items!
                </p>
                <Button 
                  onClick={() => navigate('/')}
                  className="mt-6 bg-orange-600 hover:bg-orange-700"
                >
                  Browse Other Restaurants
                </Button>
              </div>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                restaurantInfo={{
                  id: restaurant.id,
                  name: restaurant.name,
                  deliveryFee: restaurant.deliveryFee
                }}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No items in this category</p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-orange-600 hover:text-orange-700 font-medium mt-4"
              >
                Show all items
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
