import React, { useContext, useEffect, useState } from 'react';
import { AppContext, backendUrl } from '../context/AppContext';
import { Package, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/order/user-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ minHeight: '80vh', paddingTop: '120px', paddingBottom: '60px' }}>
      <h2 className="text-gradient mb-4" style={{ fontSize: '2.5rem' }}>Your Magical Profile</h2>
      
      <div className="profile-grid">
        
        {/* User Info */}
        <div className="glass-panel" style={{ padding: '30px', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' }}>
              <User size={40} color="white" />
            </div>
            <h3>{user.name}</h3>
            <p style={{ color: 'var(--dark)', opacity: 0.7 }}>{user.email}</p>
          </div>
          <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <p><strong>Role:</strong> {user.role === 'owner' ? 'Admin' : 'Explorer'}</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package color="var(--secondary)" /> Your Books Collection
          </h3>
          
          {loading ? (
            <p>Loading your magic...</p>
          ) : orders.length === 0 ? (
            <p style={{ color: '#888' }}>You haven't purchased any books yet. <a href="/#books" style={{ color: 'var(--accent)' }}>Explore now!</a></p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {orders.map(order => (
                <div key={order._id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{order.book ? order.book.brand + ' ' + order.book.model : 'Magical Book'}</h4>
                    <span style={{ fontSize: '0.9rem', color: '#888' }}>Order ID: {order._id.substring(0, 8)}...</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>₹{order.price}</div>
                    <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '12px', background: order.status === 'confirmed' ? 'var(--success)' : '#ffb703', color: 'white' }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
