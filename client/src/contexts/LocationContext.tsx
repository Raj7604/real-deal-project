import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { LocationData, Location } from '../types';
import { locationApi } from '../services/api';

interface LocationState {
  currentLocation: Location;
  availableCities: LocationData[];
  isLoading: boolean;
  error: string | null;
}

type LocationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOCATION'; payload: Location }
  | { type: 'SET_CITIES'; payload: LocationData[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'DETECT_LOCATION' };

const initialState: LocationState = {
  currentLocation: {
    city: 'Bangalore',
    pincode: '560001',
  },
  availableCities: [],
  isLoading: false,
  error: null,
};

const locationReducer = (state: LocationState, action: LocationAction): LocationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOCATION':
      return { ...state, currentLocation: action.payload, error: null };
    case 'SET_CITIES':
      return { ...state, availableCities: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'DETECT_LOCATION':
      return { ...state, isLoading: true, error: null };
    default:
      return state;
  }
};

interface LocationContextType {
  state: LocationState;
  setLocation: (location: Location) => void;
  detectLocation: () => void;
  loadCities: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(locationReducer, initialState);

  const setLocation = (location: Location) => {
    // Save to localStorage
    localStorage.setItem('userLocation', JSON.stringify(location));
    dispatch({ type: 'SET_LOCATION', payload: location });
  };

  const detectLocation = async () => {
    dispatch({ type: 'DETECT_LOCATION' });

    try {
      // First try to get location from localStorage
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        dispatch({ type: 'SET_LOCATION', payload: location });
        return;
      }

      // Try browser geolocation
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // In a real app, you'd use a reverse geocoding service
              // For now, we'll use a simple mapping or default
              const defaultLocation: Location = {
                city: 'Bangalore',
                pincode: '560001',
              };
              setLocation(defaultLocation);
            } catch (error) {
              console.error('Error detecting location:', error);
              dispatch({ type: 'SET_ERROR', payload: 'Failed to detect location' });
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Set default location
            const defaultLocation: Location = {
              city: 'Bangalore',
              pincode: '560001',
            };
            setLocation(defaultLocation);
          }
        );
      } else {
        // Browser doesn't support geolocation, set default
        const defaultLocation: Location = {
          city: 'Bangalore',
          pincode: '560001',
        };
        setLocation(defaultLocation);
      }
    } catch (error) {
      console.error('Error in detectLocation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to detect location' });
    }
  };

  const loadCities = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await locationApi.getCities();
      if (response.success) {
        dispatch({ type: 'SET_CITIES', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load cities' });
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cities' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    detectLocation();
    loadCities();
  }, []);

  const value: LocationContextType = {
    state,
    setLocation,
    detectLocation,
    loadCities,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};
