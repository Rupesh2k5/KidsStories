import React from 'react';
import { Star, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'var(--dark)', color: 'white', padding: '60px 0 20px 0', marginTop: 'auto', width: '100%', overflowX: 'hidden' }}>
      <div className="container footer-grid" style={{ marginBottom: '40px' }}>
        
        <div>
          <Link to="/" className="logo" style={{ color: 'white', textDecoration: 'none', marginBottom: '20px', display: 'flex' }}>
            <Star fill="#EF476F" color="#EF476F" />
            KidsStories
          </Link>
          <p style={{ color: '#ccc', lineHeight: '1.6' }}>Sparking imagination through magical stories and vibrant digital prints. Bringing joy to kids everywhere!</p>
        </div>

        <div>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link to="/" style={{ color: '#ccc', textDecoration: 'none' }}>Home</Link></li>
            <li><a href="/#books" style={{ color: '#ccc', textDecoration: 'none' }}>Story Books</a></li>
            <li><a href="/#process" style={{ color: '#ccc', textDecoration: 'none' }}>How it Works</a></li>
            <li><Link to="/cart" style={{ color: '#ccc', textDecoration: 'none' }}>Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Contact Us</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><Mail size={18} color="var(--secondary)" /> sruthikommalapati1998@gmail.com</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><Phone size={18} color="var(--secondary)" /> +91 91821 36240</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ccc' }}><MapPin size={18} color="var(--secondary)" /> Hyderabad, Yerragadda</li>
          </ul>
        </div>

      </div>
      <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', textAlign: 'center', color: '#888' }}>
        <p>© 2026 KidsStories. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
