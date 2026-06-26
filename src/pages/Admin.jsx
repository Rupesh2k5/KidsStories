import React, { useContext, useEffect, useState } from 'react';
import { AppContext, backendUrl } from '../context/AppContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css'; // New CSS file for the Admin Dashboard

const Admin = () => {
  const { user } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const [dashRes, booksRes] = await Promise.all([
        fetch(`${backendUrl}/api/owner/dashboard`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch(`${backendUrl}/api/owner/books`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      ]);
      const dashData = await dashRes.json();
      const booksData = await booksRes.json();

      if (dashData.success && booksData.success) {
        setDashboardData(dashData.dashboardData);
        setBooks(booksData.books);
      } else {
        toast.error("Failed to load admin data");
      }
    } catch (err) {
      toast.error("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (bookId) => {
    try {
      const res = await fetch(`${backendUrl}/api/owner/toggle-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBooks(books.map(b => b._id === bookId ? { ...b, isAvailable: !b.isAvailable } : b));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error updating book");
    }
  };

  const handleUpdateCover = async (bookId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('bookId', bookId);
    formData.append('image', file);

    try {
      const res = await fetch(`${backendUrl}/api/owner/update-book-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBooks(books.map(b => b._id === bookId ? { ...b, image: data.image } : b));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to update cover");
    }
  };

  const handleUpdatePdf = async (bookId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('bookId', bookId);
    formData.append('pdf', file);

    const toastId = toast.loading("Uploading new PDF...");

    try {
      const res = await fetch(`${backendUrl}/api/owner/update-book-pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to update PDF", { id: toastId });
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`${backendUrl}/api/owner/delete-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Book deleted");
        setBooks(books.filter(b => b._id !== bookId));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Failed to delete book");
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.target);
      const bookData = {
        brand: formData.get('brand'),
        model: formData.get('model'),
        pricePerDay: Number(formData.get('pricePerDay')),
        description: formData.get('description'),
      };
      
      const payload = new FormData();
      payload.append('bookData', JSON.stringify(bookData));
      payload.append('image', formData.get('image'));
      payload.append('pdf', formData.get('pdf'));

      const toastId = toast.loading("Uploading book and PDF... This may take a minute.");

      const res = await fetch(`${backendUrl}/api/owner/add-book`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: payload
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Book Added Successfully!");
        e.target.reset();
        fetchData();
        setShowAddForm(false);
      } else {
        toast.error(data.message || "Failed to add book");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
      toast.dismiss();
    }
  };

  if (loading || !dashboardData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Dashboard...</div>;
  }

  // Live visitor logic simulation
  const visitorCount = Math.floor(Math.random() * 5) + 3;

  return (
    <div className="shell">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div className="logo-text">KidsStories</div>
            <div className="logo-sub">Admin Panel</div>
          </div>
        </div>
        <nav>
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><i className="fas fa-home"></i> <span>Home</span></div>
          <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}><i className="fas fa-shopping-cart"></i> <span>Orders</span> <span className="badge">{dashboardData.totalOrders}</span></div>
          <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}><i className="fas fa-book"></i> <span>Products</span></div>
          <div className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}><i className="fas fa-users"></i> <span>Customers</span></div>

          <div className="nav-section">Marketing</div>
          <div className={`nav-item ${activeTab === 'meta-ads' ? 'active' : ''}`} onClick={() => setActiveTab('meta-ads')}><i className="fab fa-meta"></i> <span>Meta Ads</span></div>
          <div className={`nav-item ${activeTab === 'email-mktg' ? 'active' : ''}`} onClick={() => setActiveTab('email-mktg')}><i className="fas fa-envelope"></i> <span>Email campaigns</span></div>

          <div className="nav-section">Growth</div>
          <div className={`nav-item ${activeTab === 'seo' ? 'active' : ''}`} onClick={() => setActiveTab('seo')}><i className="fas fa-search"></i> <span>SEO</span></div>
          <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><i className="fas fa-chart-bar"></i> <span>Analytics</span></div>
          <div className={`nav-item ${activeTab === 'liveview' ? 'active' : ''}`} onClick={() => setActiveTab('liveview')}><i className="fas fa-eye"></i> <span>Live view</span></div>

          <div className="nav-section">Store</div>
          <div className={`nav-item ${activeTab === 'discounts' ? 'active' : ''}`} onClick={() => setActiveTab('discounts')}><i className="fas fa-tag"></i> <span>Discounts</span></div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><i className="fas fa-cog"></i> <span>Settings</span></div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <div className="main">
        <div className="topbar">
          <div className="search-box"><i className="fas fa-search"></i> Search orders, products, customers… <span style={{marginLeft: 'auto', fontSize: '11px', background: 'var(--surface-0)', border: '0.5px solid var(--border)', padding: '2px 6px', borderRadius: '4px'}}>Ctrl K</span></div>
          <div className="topbar-right">
            <button className="btn btn-sm"><i className="fas fa-bell"></i></button>
            <div className="avatar">A</div>
          </div>
        </div>

        <div className="content">
          
          {/* ========== HOME ========== */}
          {activeTab === 'home' && (
            <div className="page active">
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                <div className="live-dot"></div>
                <div className="page-title">Live view</div>
                <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Just now</span>
              </div>
              <div className="page-sub">Real-time snapshot of your store</div>
              
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">Visitors right now</div><div className="stat-value">{visitorCount}</div></div>
                <div className="stat-card"><div className="stat-label">Total Revenue</div><div className="stat-value">₹{dashboardData.monthlyRevenue}</div><div className="stat-delta delta-up"><i className="fas fa-arrow-up" style={{fontSize: '11px'}}></i> Real-time</div></div>
                <div className="stat-card"><div className="stat-label">Total Orders</div><div className="stat-value">{dashboardData.totalOrders}</div><div className="stat-delta delta-up"><i className="fas fa-arrow-up" style={{fontSize: '11px'}}></i> Lifetime</div></div>
                <div className="stat-card"><div className="stat-label">Weekend Bookings</div><div className="stat-value">{dashboardData.weekendOrders}</div></div>
              </div>
              
              <div className="two-col">
                <div className="card">
                  <div className="card-header"><span className="card-title">Customer behavior (Demo)</span></div>
                  <div className="funnel-row"><div className="funnel-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Active carts</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{width: '30%', background: 'var(--fill-accent)'}}></div></div><div className="funnel-val">3</div></div>
                  <div className="funnel-row"><div className="funnel-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Checking out</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{width: '15%', background: 'var(--fill-warning)'}}></div></div><div className="funnel-val">1</div></div>
                  <div className="funnel-row"><div className="funnel-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Purchased</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{width: '20%', background: 'var(--fill-success)'}}></div></div><div className="funnel-val">{dashboardData.completedOrders}</div></div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Recent orders</span></div>
                  {dashboardData.recentOrders.length === 0 ? <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>No recent orders.</p> : dashboardData.recentOrders.map(order => (
                    <div className="metric-row" key={order._id} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                      <span style={{fontSize: '13px'}}>{order.book?.brand || 'Unknown'} - ₹{order.price}</span>
                      <span className={`pill ${order.status === 'confirmed' ? 'pill-green' : 'pill-amber'}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== ORDERS ========== */}
          {activeTab === 'orders' && (
            <div className="page active">
              <div className="page-title">Orders</div>
              <div className="page-sub">Manage customer orders and fulfillment</div>
              <div className="card" style={{padding: 0}}>
                <div style={{padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '0.5px solid var(--border)'}}>
                  <button className="btn btn-sm">All <span className="badge" style={{background: 'var(--surface-0)', color: 'var(--text-primary)', border: '0.5px solid var(--border)'}}>{dashboardData.totalOrders}</span></button>
                  <button className="btn btn-sm">Pending <span className="badge">{dashboardData.pendingOrders}</span></button>
                  <button className="btn btn-sm">Confirmed <span className="badge" style={{background: 'var(--fill-success)'}}>{dashboardData.completedOrders}</span></button>
                </div>
                <div style={{overflowX: 'auto'}}>
                  <table className="table">
                    <thead><tr><th>Order ID</th><th>Customer ID</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {dashboardData.recentOrders.length === 0 ? (
                        <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No orders found</td></tr>
                      ) : dashboardData.recentOrders.map(order => (
                        <tr key={order._id}>
                          <td><code>#{order._id.substring(0, 8)}</code></td>
                          <td>{order.user ? order.user.substring(0, 8) : 'Guest'}</td>
                          <td>{order.book ? order.book.brand : 'Book'}</td>
                          <td>₹{order.price}</td>
                          <td><span className={`pill ${order.status === 'confirmed' ? 'pill-green' : 'pill-amber'}`}>{order.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== PRODUCTS ========== */}
          {activeTab === 'products' && (
            <div className="page active">
              <div className="page-title">Products</div>
              <div className="page-sub">Books and bundles in your store</div>
              
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '14px'}}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
                  <i className={`fas ${showAddForm ? 'fa-times' : 'fa-plus'}`}></i> {showAddForm ? 'Cancel' : 'Add product'}
                </button>
              </div>

              {showAddForm && (
                <div className="card" style={{marginBottom: '20px'}}>
                  <div className="card-header"><span className="card-title">Add New Product</span></div>
                  <form onSubmit={handleAddBook} style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div className="form-row"><label className="form-label">Book Title</label><input className="form-input" name="brand" required placeholder="e.g. The Magic Forest" /></div>
                    <div className="form-row"><label className="form-label">Type / Format</label>
                      <select className="form-input" name="model" required>
                        <option value="Single Book">Single Book</option>
                        <option value="Bundle">Bundle (Multiple Books)</option>
                        <option value="E-Book">E-Book Only</option>
                      </select>
                    </div>
                    <div className="form-row"><label className="form-label">Price (₹)</label><input className="form-input" type="number" name="pricePerDay" required placeholder="199" min="0" /></div>
                    <div className="form-row"><label className="form-label">Description</label><textarea className="form-input" name="description" required rows="3" placeholder="A magical journey..."></textarea></div>
                    <div className="two-col">
                      <div className="form-row"><label className="form-label">Cover Image</label><input className="form-input" type="file" name="image" required accept="image/*" /></div>
                      <div className="form-row"><label className="form-label">PDF Content</label><input className="form-input" type="file" name="pdf" required accept=".pdf" /></div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Uploading...' : 'Publish Book'}</button>
                  </form>
                </div>
              )}

              <div className="card" style={{padding: 0}}>
                <div style={{overflowX: 'auto'}}>
                  <table className="table">
                    <thead><tr><th>Cover</th><th>Title</th><th>Type</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {books.length === 0 ? <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No products yet</td></tr> : books.map(book => (
                        <tr key={book._id}>
                          <td><img src={book.image} alt="cover" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} /></td>
                          <td><b>{book.brand}</b></td>
                          <td>{book.model}</td>
                          <td>₹{book.pricePerDay}</td>
                          <td><span className={`pill ${book.isAvailable ? 'pill-green' : 'pill-gray'}`}>{book.isAvailable ? 'Active' : 'Disabled'}</span></td>
                          <td>
                            <div style={{display: 'flex', gap: '6px'}}>
                              <button className="btn btn-sm" onClick={() => toggleAvailability(book._id)}>{book.isAvailable ? 'Disable' : 'Enable'}</button>
                              
                              <label className="btn btn-sm" style={{cursor: 'pointer'}}>
                                Cover <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => handleUpdateCover(book._id, e.target.files[0])} />
                              </label>

                              <label className="btn btn-sm" style={{cursor: 'pointer'}}>
                                PDF <input type="file" accept=".pdf" style={{display: 'none'}} onChange={(e) => handleUpdatePdf(book._id, e.target.files[0])} />
                              </label>

                              <button className="btn btn-sm" style={{color: 'var(--text-danger)'}} onClick={() => handleDeleteBook(book._id)}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STATIC PLACEHOLDER PAGES */}
          {['customers', 'meta-ads', 'email-mktg', 'seo', 'analytics', 'liveview', 'discounts', 'settings'].includes(activeTab) && (
            <div className="page active">
              <div className="page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</div>
              <div className="page-sub">This section is currently in development (Static Demo).</div>
              <div className="card">
                <p style={{fontSize: '14px', color: 'var(--text-secondary)'}}>This page is part of the new Admin Dashboard template but has not been connected to a backend API yet. It will be implemented in future updates.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Admin;
