import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-orange-500 mb-4">HungerStation</h3>
            <p className="text-gray-400 text-sm">
              Your favorite food delivered fast. Order from the best restaurants in your area.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-orange-500 transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Careers</Link></li>
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Partner</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Become a Partner</Link></li>
              <li><Link to="/" className="hover:text-orange-500 transition-colors">Delivery</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2025 HungerStation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
