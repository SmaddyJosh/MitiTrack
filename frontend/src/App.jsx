
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage.jsx';
import MapView from './Components/MapView.jsx';
function App() {
  return (
    <Routes>

      <Route path="/" element={<LandingPage />} />
      <Route path="/map" element={<MapView />} />

    </Routes>
  );
}

export default App;