import React from 'react';
import { LocationProvider } from './contexts/LocationContext';
import HomePageEnhanced from './pages/HomePageEnhanced';
import './index.css';

function App() {
  return (
    <LocationProvider>
      <HomePageEnhanced />
    </LocationProvider>
  );
}

export default App;
