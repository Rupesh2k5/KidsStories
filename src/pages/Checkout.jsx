import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext, backendUrl } from '../context/AppContext';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cart, getCartTotal, clearCart, user } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login first to proceed with checkout!");
      navigate('/login');
      return;
    }
    setLoading(true);

    try {
      // 1. Create order
      const res = await fetch(`${backendUrl}/api/order/cart/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ totalAmount: getCartTotal() })
      });
      const data = await res.json();
      
      if (!data.success) {
        toast.error("Failed to create order");
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Widget
      const options = {
        key: data.key_id, // Dynamically loaded from backend to prevent key mismatch
        amount: data.order.amount,
        currency: "INR",
        name: "KidsStories",
        description: "Magical Books Checkout",
        order_id: data.order.id,
        handler: async function (response) {
          // 3. Verify Payment
          const verifyRes = await fetch(`${backendUrl}/api/order/cart/verify-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cart: cart
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSuccess(true);
            clearCart();
            toast.success("Payment successful!");
          } else {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#EF476F"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        toast.error("Payment failed");
      });
      rzp.open();
      setLoading(false);

    } catch (err) {
      toast.error("An error occurred during payment");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', maxWidth: '500px' }}>
          <CheckCircle size={80} color="var(--success)" style={{ margin: '0 auto 20px' }} />
          <h2 className="text-gradient mb-4">Payment Successful!</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>Your magical books will be emailed to <strong>{user?.email}</strong> shortly. The admin has been notified.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ minHeight: '80vh', paddingTop: '120px', paddingBottom: '60px' }}>
      <h2 className="text-gradient mb-4" style={{ fontSize: '2.5rem' }}>Checkout</h2>
      
      <div className="checkout-grid">
        
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Billing Details</h3>
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" defaultValue={user?.name || ''} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" defaultValue={user?.email || ''} required />
            </div>
            <div className="form-group">
              <label>Shipping Address (For physical prints)</label>
              <textarea rows="4" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #ddd' }} required></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.3rem' }} disabled={loading || cart.length === 0}>
              {loading ? 'Processing Payment...' : `Pay ₹${getCartTotal()} (Test Mode)`}
            </button>
          </form>
        </div>

        <div className="cart-summary glass-panel" style={{ padding: '30px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Order Summary</h3>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>{item.name} x {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #eee', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <span>Total</span>
            <span className="text-gradient">₹{getCartTotal()}</span>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', color: '#856404', borderRadius: '10px', fontSize: '0.9rem' }}>
            <strong>Note:</strong> This is running in Razorpay Test Mode. Admin will receive an email notification upon success.
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
