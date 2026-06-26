import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, backendUrl } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { Toaster } from 'react-hot-toast';
import './App.css';

const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdminRoute && <Header />}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App = () => {

  // Track Live Visitor Location
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if(data.city) {
           await fetch(backendUrl + '/api/user/log-visit', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ city: data.city })
           });
        }
      } catch (error) {
        // Alternative fallback: ask for location if IP API fails
        if(navigator.geolocation) {
           navigator.geolocation.getCurrentPosition(async (pos) => {
               // We would ideally reverse geocode lat/lng here, but for simplicity we log 'Unknown (Coords)'
               await fetch(backendUrl + '/api/user/log-visit', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify({ city: 'Near ' + pos.coords.latitude.toFixed(1) + ',' + pos.coords.longitude.toFixed(1) })
               });
           }, () => {});
        }
      }
    };
    // Only track once per session to avoid spamming the backend
    if(!sessionStorage.getItem('visited_store')) {
       trackVisit();
       sessionStorage.setItem('visited_store', 'true');
    }
  }, []);

  console.log("Vite cache bust 3 - App.jsx layout extracted");
  return (
    <AppProvider>
      <Router>
        <Toaster position="top-center" />
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
