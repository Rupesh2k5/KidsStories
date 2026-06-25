import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Trash2, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <div className="container" style={{ minHeight: '80vh', paddingTop: '120px', paddingBottom: '60px' }}>
      <h2 className="text-gradient mb-4" style={{ fontSize: '2.5rem' }}>Your Magical Cart</h2>
      
      {cart.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '20px' }}>Your cart is empty!</h3>
          <Link to="/" className="btn btn-primary">Discover Stories</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '20px', marginBottom: '20px', gap: '20px' }}>
                <img src={item.image} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px' }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{item.name}</h3>
                  <div style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>₹{item.price}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'var(--light)', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}><Minus size={16}/></button>
                  <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'var(--light)', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}><Plus size={16}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', marginLeft: '20px' }}>
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary glass-panel" style={{ padding: '30px', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Order Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '1.1rem' }}>
              <span>Subtotal</span>
              <span>₹{getCartTotal()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.1rem' }}>
              <span>Shipping</span>
              <span style={{ color: 'var(--success)' }}>Free</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '1.5rem', fontWeight: 'bold', borderTop: '2px solid #eee', paddingTop: '15px' }}>
              <span>Total</span>
              <span className="text-gradient">₹{getCartTotal()}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
