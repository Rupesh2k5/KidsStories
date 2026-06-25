import React, { useState, useEffect, useContext } from 'react';
import { Download, Play, Brain, Heart, BookOpen, QrCode, Copy, Check, X } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

import book1 from '../assets/book1.png';
import book2 from '../assets/book2.png';
import book3 from '../assets/book3.png';

const Home = () => {
  const { addToCart } = useContext(AppContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  const slides = [book1, book2, book3];
  const upiId = "mystore@upi";

  useEffect(() => {
    fetchBooks();
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const fetchBooks = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/order/books');
      const data = await res.json();
      if (data.success && data.books.length > 0) {
        setBooks(data.books);
      } else {
        // Fallback to hardcoded if DB is empty or fails
        setBooks([
          { _id: '1', brand: 'The Magic Forest', model: 'Single Book', pricePerDay: 199, image: book1 },
          { _id: '2', brand: 'Space Explorer', model: 'Single Book', pricePerDay: 199, image: book2 },
          { _id: '3', brand: 'Super Combo', model: 'Bundle', pricePerDay: 500, image: book3 }
        ]);
      }
    } catch (err) {
      setBooks([
        { _id: '1', brand: 'The Magic Forest', model: 'Single Book', pricePerDay: 199, image: book1 },
        { _id: '2', brand: 'Space Explorer', model: 'Single Book', pricePerDay: 199, image: book2 },
        { _id: '3', brand: 'Super Combo', model: 'Bundle', pricePerDay: 500, image: book3 }
      ]);
    }
  };

  const scrollToBooks = () => {
    document.getElementById('books')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text glass-panel" style={{ padding: '40px' }}>
            <h1 className="text-gradient">Magical Adventures Await!</h1>
            <p>Spark your child's imagination with our beautifully crafted story books and vibrant digital prints. Perfect for bedtime and playtime!</p>
            <div className="hero-buttons">
              <button className="btn btn-primary animate-bounce-hover" onClick={scrollToBooks}>
                Buy Now 🚀
              </button>
              <a href="/TheMindroo_Kids_Activity_Book.pdf" download="TheMindroo_Kids_Activity_Book.pdf" target="_blank" className="btn btn-secondary animate-bounce-hover">
                <Download size={20} style={{ marginRight: '8px' }} />
                Sample PDF
              </a>
            </div>
          </div>
          
          <div className="slider-container">
            {slides.map((slide, index) => (
              <img 
                key={index}
                src={slide} 
                alt={`Book ${index + 1}`} 
                className={`slide ${index === currentSlide ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        
        {/* Decorative cloud divider */}
        <div className="cloud-divider">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" className="shape-fill"></path>
          </svg>
        </div>
      </section>

      {/* Features - How it helps */}
      <section style={{ backgroundColor: 'white' }}>
        <div className="container">
          <h2 className="text-center text-gradient" style={{ fontSize: '3rem' }}>How Our Books Help Kids</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Brain /></div>
              <h3>Boosts Creativity</h3>
              <p>Engaging storylines that encourage children to think outside the box.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Heart /></div>
              <h3>Builds Empathy</h3>
              <p>Relatable characters teaching valuable life lessons and kindness.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><BookOpen /></div>
              <h3>Early Reading</h3>
              <p>Simple vocabulary and big fonts make learning to read fun and easy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products & Pricing */}
      <section id="books" className="container" style={{ paddingBottom: '80px', paddingTop: '40px' }}>
        <h2 className="text-center text-gradient" style={{ fontSize: '3rem', marginBottom: '20px' }}>Our Magical Collection</h2>
        <div className="products-grid">
          
          {books.map((book) => (
            <div key={book._id} className="product-card glass-panel" style={book.model === 'Bundle' ? { border: '4px solid var(--secondary)' } : {}}>
              {book.model === 'Bundle' && <div className="bundle-badge">BEST VALUE</div>}
              <img src={book.image.startsWith('http') ? book.image : book1} alt={book.brand} className="product-image" style={book.model === 'Bundle' ? {height: '200px', objectFit: 'contain'} : {}} />
              <div className="product-info">
                <h3>{book.brand} {book.model !== 'Single Book' && book.model !== 'Bundle' ? book.model : ''}</h3>
                <p>{book.description || `Magical ${book.brand} adventure.`}</p>
                <div className="product-price">₹{book.pricePerDay}</div>
                <div className="flex gap-4 mt-2" style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn btn-secondary flex-1" onClick={() => addToCart({ id: book._id, name: book.brand, price: book.pricePerDay, image: book.image.startsWith('http') ? book.image : book1 })}>Add to Cart</button>
                  <button className="btn btn-primary flex-1" onClick={() => {
                    addToCart({ id: book._id, name: book.brand, price: book.pricePerDay, image: book.image.startsWith('http') ? book.image : book1 });
                    navigate('/checkout');
                  }}>Buy Now</button>
                </div>
              </div>
            </div>
          ))}

        </div>
      </section>


      {/* Process Section */}
      <section id="process" className="container" style={{ paddingBottom: '80px', paddingTop: '40px' }}>
        <h2 className="text-center text-gradient" style={{ fontSize: '3rem' }}>What Happens After Buying?</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <h3>Complete Payment</h3>
            <p>Scan the QR code and pay securely via UPI.</p>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <h3>Enter Details</h3>
            <p>Provide your Transaction ID and Email address.</p>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <h3>Instant Delivery</h3>
            <p>Your digital books/prints are emailed to you instantly!</p>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <h3>Enjoy Reading</h3>
            <p>Read on any device or print them out for kids.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
