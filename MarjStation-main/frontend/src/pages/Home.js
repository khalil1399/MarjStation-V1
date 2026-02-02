import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/firebase/categoryService';
import { restaurantService } from '../services/firebase/restaurantService';
import { sponsoredService } from '../services/firebase/sponsoredService';
import CategoryCard from '../components/CategoryCard';
import RestaurantCard from '../components/RestaurantCard';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Search, Loader2, Star, Clock, Sparkles } from 'lucide-react';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [sponsorshipSettings, setSponsorshipSettings] = useState({ maxSponsoredSlots: 3 });
  const [loading, setLoading] = useState(true);
  const [trackedImpressions, setTrackedImpressions] = useState(new Set());

  useEffect(() => {
    // Set up real-time listeners
    const unsubscribeRestaurants = restaurantService.listenToRestaurants((data) => {
      setRestaurants(data);
      setLoading(false);
    });

    const unsubscribeCategories = categoryService.listenToCategories((data) => {
      setCategories(data);
    });

    const unsubscribeSponsorships = sponsoredService.listenToActiveSponsorships((data) => {
      setSponsorships(data);
    });

    // Load settings
    sponsoredService.getSettings().then(settings => {
      setSponsorshipSettings(settings);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeRestaurants();
      unsubscribeCategories();
      unsubscribeSponsorships();
    };
  }, []);

  // Track impressions when sponsored restaurants are displayed
  useEffect(() => {
    sponsorships.forEach(s => {
      if (!trackedImpressions.has(s.id)) {
        sponsoredService.trackImpression(s.id);
        setTrackedImpressions(prev => new Set([...prev, s.id]));
      }
    });
  }, [sponsorships, trackedImpressions]);

  // Get sponsored restaurants with their data
  const sponsoredRestaurants = useMemo(() => {
    return sponsorships
      .slice(0, sponsorshipSettings.maxSponsoredSlots)
      .map(s => {
        const restaurant = restaurants.find(r => r.id === s.restaurantId);
        return restaurant ? { ...restaurant, sponsorship: s } : null;
      })
      .filter(Boolean);
  }, [sponsorships, restaurants, sponsorshipSettings.maxSponsoredSlots]);

  // Filter out sponsored restaurants from regular list
  const regularRestaurants = useMemo(() => {
    const sponsoredIds = sponsoredRestaurants.map(r => r.id);
    return restaurants.filter(r => !sponsoredIds.includes(r.id));
  }, [restaurants, sponsoredRestaurants]);

  const filteredRestaurants = regularRestaurants.filter(restaurant => {
    const matchesSearch = restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || restaurant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSponsoredRestaurants = sponsoredRestaurants.filter(restaurant => {
    const matchesSearch = !searchQuery || 
                         restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || restaurant.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSponsoredClick = (sponsorship) => {
    sponsoredService.trackClick(sponsorship.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Your Favorite Food Delivered Fast
            </h1>
            <p className="text-xl mb-8 text-orange-50">
              Order from the best restaurants in your area
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for restaurants or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white text-gray-900"
                  data-testid="search-input"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            {/* Sponsored/Featured Section */}
            {filteredSponsoredRestaurants.length > 0 && (
              <section className="mb-12" data-testid="sponsored-section">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="h-7 w-7 text-yellow-500" />
                  <h2 className="text-3xl font-bold text-gray-900">Featured Restaurants</h2>
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                    Sponsored
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSponsoredRestaurants.map(restaurant => (
                    <SponsoredRestaurantCard 
                      key={restaurant.id} 
                      restaurant={restaurant}
                      onClick={() => handleSponsoredClick(restaurant.sponsorship)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Categories Section */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Categories</h2>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                    data-testid="clear-filter-btn"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              {categories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">No categories available yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Check back soon for new categories!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {categories.map(category => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onClick={() => setSelectedCategory(category.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Restaurants Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {selectedCategory ? 'Filtered Restaurants' : 'All Restaurants'}
              </h2>
              {restaurants.length === 0 && !selectedCategory ? (
                <div className="text-center py-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Coming Soon!
                    </h3>
                    <p className="text-gray-600 text-lg mb-2">
                      We are setting up amazing restaurants for you.
                    </p>
                    <p className="text-gray-500">
                      Check back soon to order from your favorite places!
                    </p>
                  </div>
                </div>
              ) : filteredRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRestaurants.map(restaurant => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No restaurants found matching your search.</p>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-orange-600 hover:text-orange-700 font-medium mt-4"
                    >
                      Clear filter to see all restaurants
                    </button>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

// Sponsored Restaurant Card Component with special styling
const SponsoredRestaurantCard = ({ restaurant, onClick }) => {
  const getPriorityStyle = () => {
    switch (restaurant.sponsorship?.priorityLevel) {
      case 'PREMIUM':
        return 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-100';
      case 'STANDARD':
        return 'ring-2 ring-blue-400 shadow-lg shadow-blue-100';
      default:
        return 'ring-1 ring-orange-300';
    }
  };

  return (
    <Link 
      to={`/restaurant/${restaurant.id}`} 
      onClick={onClick}
      data-testid={`sponsored-restaurant-${restaurant.id}`}
    >
      <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${getPriorityStyle()}`}>
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden">
            {restaurant.image ? (
              <img 
                src={restaurant.image} 
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🍽️</span>
              </div>
            )}
          </div>
          {/* Sponsored Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-md">
              <Sparkles className="h-3 w-3 mr-1" />
              Sponsored
            </Badge>
          </div>
          {/* Priority Badge */}
          {restaurant.sponsorship?.priorityLevel === 'PREMIUM' && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-yellow-500 text-white border-0">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Premium
              </Badge>
            </div>
          )}
        </div>
        <div className="p-5 bg-gradient-to-b from-white to-orange-50">
          <h3 className="font-bold text-xl text-gray-900 mb-2">{restaurant.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{restaurant.description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              {restaurant.rating && (
                <span className="flex items-center text-yellow-600 font-medium">
                  <Star className="h-4 w-4 fill-current mr-1" />
                  {restaurant.rating}
                </span>
              )}
              {restaurant.deliveryTime && (
                <span className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {restaurant.deliveryTime}
                </span>
              )}
            </div>
            {restaurant.category && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                {restaurant.category}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default Home;
