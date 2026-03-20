import React, { useEffect, useState } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { Moon, Sun, MapPin } from 'lucide-react';

export default function Header() {
  const { state, setLocation } = useLocation();
  const [isDark, setIsDark] = useState(false);

  // Initialize dark mode from localStorage or system pref
  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    const selectedCityData = state.availableCities.find(c => c.city === city);
    setLocation({
      city: city,
      pincode: selectedCityData ? selectedCityData.pincodes[0] : state.currentLocation.pincode
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300 cursor-pointer">
              RealDeal
            </span>
          </div>

          {/* Right Section: Location & Dark Mode */}
          <div className="flex items-center space-x-4">
            
            {/* Location Selector */}
            <div className="relative group flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 border border-transparent hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2 group-hover:text-primary-500 transition-colors" />
              <select 
                title="Select City"
                value={state.currentLocation.city}
                onChange={handleCityChange}
                disabled={state.isLoading}
                className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer appearance-none pr-4"
              >
                {state.availableCities.map((cityData) => (
                  <option key={cityData.city} value={cityData.city} className="dark:bg-gray-800">
                    {cityData.city}
                  </option>
                ))}
                {/* Fallback if cities aren't loaded yet */}
                {state.availableCities.length === 0 && (
                  <option value={state.currentLocation.city} className="dark:bg-gray-800">
                    {state.currentLocation.city}
                  </option>
                )}
              </select>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-300 transform hover:rotate-12"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
