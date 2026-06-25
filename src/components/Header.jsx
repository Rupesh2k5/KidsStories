import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Menu, X, User } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import '../App.css';

const Header = () => {
  const { cart, user, setToken } = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    navigate('/');
  };

  const handleCartClick = (e) => {
    if (!user) {
      e.preventDefault();
      toast.error('Please login to proceed');
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <Star fill="#EF476F" color="#EF476F" />
          KidsStories
        </Link>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'none' }}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <a href="/#books" onClick={() => setIsMenuOpen(false)}>Story Books</a>
          <a href="/#process" onClick={() => setIsMenuOpen(false)}>How it Works</a>
        </nav>

        <div className="right-controls">
          {user ? (
            <div className="user-menu">
              <Link to={user.role === 'owner' ? '/admin' : '/profile'} className="user-badge" style={{ textDecoration: 'none' }}>
                <User size={18} style={{marginRight: 5}}/> {user.role === 'owner' ? 'Admin' : 'Profile'}
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary logout-btn">Logout</button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn-secondary login-btn">Login</Link>
              <Link to="/signup" className="btn btn-primary signup-btn">Sign Up</Link>
            </div>
          )}

          <Link to="/cart" onClick={handleCartClick} className="cart-btn" style={{ textDecoration: 'none' }}>
            <ShoppingCart size={24} />
            {cart.length > 0 && <span className="cart-badge">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
