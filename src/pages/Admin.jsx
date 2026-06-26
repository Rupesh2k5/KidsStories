import React, { useContext, useEffect, useState } from 'react';
import { AppContext, backendUrl } from '../context/AppContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css'; // New CSS file for the Admin Dashboard

const Admin = () => {
  const { user } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('home');
  const [analyticsTab, setAnalyticsTab] = useState('overview');
  const [aiResponse, setAiResponse] = useState('');

  const handleAIPrompt = async (promptText) => {
    try {
      const toastId = toast.loading('Gemini is generating response...');
      const res = await fetch(`${backendUrl}/api/ai/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt: promptText })
      });
      const data = await res.json();
      if (data.success) {
        toast.dismiss(toastId);
        setAiResponse(data.text);
      } else {
        toast.error(data.message, { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to generate response');
    }
  };
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
        <div className="logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <div className="logo-text">KidsStories</div>
              <div className="logo-sub">Admin Panel</div>
            </div>
          </div>
          <button className="btn btn-sm" onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center' }}>
            <i className="fas fa-arrow-left"></i> Back to Store
          </button>
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
                  <div className="card-header"><span className="card-title">Customer behavior (Live)</span></div>
                  <div className="funnel-row"><div className="funnel-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Registered Users</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{width: '30%', background: 'var(--fill-accent)'}}></div></div><div className="funnel-val">{dashboardData?.totalPlatformUsers || 0}</div></div>
                  <div className="funnel-row"><div className="funnel-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Pending Orders</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{width: '15%', background: 'var(--fill-warning)'}}></div></div><div className="funnel-val">{dashboardData?.pendingOrders || 0}</div></div>
                  <div className="funnel-row"><div className="funnel-label" style={{fontSize: '12px', color: 'var(--text-muted)'}}>Completed Orders</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{width: '20%', background: 'var(--fill-success)'}}></div></div><div className="funnel-val">{dashboardData.completedOrders}</div></div>
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
                          <td>{order.user ? order.user.name || order.user.email || 'Guest' : 'Guest'}</td>
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

          {/* STATIC PLACEHOLDER PAGES REPLACED */}
{/*  ========== CUSTOMERS ==========  */}
      {activeTab === 'customers' && (
<div className="page active">
        <div className="page-title">Customers</div>
        <div className="page-sub">Your registered buyers and their activity</div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Total customers</div><div className="stat-value">{dashboardData?.customers?.total || 0}</div></div>
          <div className="stat-card"><div className="stat-label">New this month</div><div className="stat-value">{dashboardData?.customers?.newThisMonth || 0}</div></div>
          <div className="stat-card"><div className="stat-label">Repeat buyers</div><div className="stat-value">{dashboardData?.customers?.repeatBuyers || 0}</div></div>
        </div>
        <div className="card" style={{ padding: '0' }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead>
            <tbody>
              <tr><td>Priya S.</td><td>priya@gmail.com</td><td>4</td><td>₹796</td><td>Today</td></tr>
              <tr><td>Arjun M.</td><td>arjun@gmail.com</td><td>2</td><td>₹549</td><td>Today</td></tr>
              <tr><td>Neha R.</td><td>neha@gmail.com</td><td>1</td><td>₹199</td><td>Yesterday</td></tr>
              <tr><td>Vikram K.</td><td>vikram@gmail.com</td><td>3</td><td>₹598</td><td>2 days ago</td></tr>
            </tbody>
          </table>
        </div>
      </div>
)}
{/*  ========== META ADS ==========  */}
      {activeTab === 'meta-ads' && (
<div className="page active">
        <div className="page-title">Meta Ads</div>
        <div className="page-sub">Run Facebook and Instagram campaigns — no plugin needed</div>
        <div className="alert-box alert-info"><i className="fas fa-info-circle" style={{ fontSize: '16px', flexShrink: '0', marginTop: '1px' }}></i><div>Connect your Meta Business account once and manage all campaigns from here. Your product catalog syncs automatically.</div></div>

        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Reach this week</div><div className="stat-value">14.2K</div><div className="stat-delta delta-up">+8% vs last week</div></div>
          <div className="stat-card"><div className="stat-label">Clicks</div><div className="stat-value">832</div><div className="stat-delta delta-up">+22%</div></div>
          <div className="stat-card"><div className="stat-label">Spend</div><div className="stat-value">₹1,200</div><div className="stat-delta" style={{ color: 'var(--text-muted)' }}>Budget: ₹2,000</div></div>
          <div className="stat-card"><div className="stat-label">ROAS</div><div className="stat-value">3.6×</div><div className="stat-delta delta-up">Good</div></div>
        </div>

        <div className="two-col">
          <div className="card">
            <div className="card-header"><span className="card-title">Active campaigns</span><button className="btn btn-sm btn-primary" onClick={() => alert('Demo feature')}><i className="fas fa-plus"></i> New campaign</button></div>
            <div className="metric-row">
              <div><div style={{ fontSize: '13px', fontWeight: '500' }}>Kids Books — Awareness</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Facebook · Instagram · ₹500/day</div></div>
              <span className="pill pill-green">Live</span>
            </div>
            <div className="metric-row">
              <div><div style={{ fontSize: '13px', fontWeight: '500' }}>Combo Offer — Retarget</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Instagram · ₹300/day</div></div>
              <span className="pill pill-green">Live</span>
            </div>
            <div className="metric-row">
              <div><div style={{ fontSize: '13px', fontWeight: '500' }}>Summer Reading — Conversion</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Facebook · ₹400/day</div></div>
              <span className="pill pill-amber">Paused</span>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Create new campaign</span></div>
            <div className="form-row"><label className="form-label">Campaign objective</label>
              <select className="form-input"><option>Sales (conversions)</option><option>Traffic</option><option>Brand awareness</option><option>Lead generation</option></select></div>
            <div className="form-row"><label className="form-label">Target audience</label>
              <select className="form-input"><option>Parents with children (3-10 yrs)</option><option>Book enthusiasts India</option><option>Custom audience</option></select></div>
            <div className="two-col" style={{ gap: '10px' }}>
              <div className="form-row"><label className="form-label">Daily budget (₹)</label><input className="form-input" type="number" value="500" placeholder="500" /></div>
              <div className="form-row"><label className="form-label">Duration (days)</label><input className="form-input" type="number" value="7" placeholder="7" /></div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => alert('Demo feature')}><i className="fas fa-rocket"></i> Launch campaign</button>
          </div>
        </div>
      </div>
)}
{/*  ========== EMAIL CAMPAIGNS ==========  */}
      {activeTab === 'email-mktg' && (
<div className="page active">
        <div className="page-title">Email campaigns</div>
        <div className="page-sub">Send order confirmations, promotions, and re-engagement emails</div>
        <div className="two-col">
          <div className="card">
            <div className="card-header"><span className="card-title">Campaign performance</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Emails sent</span><span style={{ fontWeight: '500' }}>1,284</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Open rate</span><span style={{ fontWeight: '500', color: 'var(--text-success)' }}>34.2%</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Click rate</span><span style={{ fontWeight: '500' }}>8.7%</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Orders from email</span><span style={{ fontWeight: '500', color: 'var(--text-accent)' }}>₹3,400</span></div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Automation flows</span><button className="btn btn-sm btn-primary" onClick={() => alert('Demo feature')}><i className="fas fa-plus"></i> Add</button></div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Order confirmation + PDF</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sent on every order</div></div>
              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Abandoned cart reminder</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>After 2 hours</div></div>
              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Re-engagement (30 days)</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Inactive customers</div></div>
              <div className="toggle" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>New book announcement</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>When product added</div></div>
              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Send a promotional email</span></div>
          <div className="two-col">
            <div>
              <div className="form-row"><label className="form-label">Subject line</label><input className="form-input" type="text" value="Summer reading special — 20% off all books!" /></div>
              <div className="form-row"><label className="form-label">Audience</label>
                <select className="form-input"><option>All customers (284)</option><option>Active last 30 days (142)</option><option>Never purchased (56)</option></select></div>
            </div>
            <div>
              <div className="form-row"><label className="form-label">Send time</label>
                <select className="form-input"><option>Send now</option><option>Schedule for later</option></select></div>
              <div className="form-row"><label className="form-label">Discount code to include</label><input className="form-input" type="text" placeholder="e.g. SUMMER20" /></div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => alert('Demo feature')}><i className="fas fa-send"></i> Send campaign</button>
        </div>
      </div>
)}
{/*  ========== SEO ==========  */}
      {activeTab === 'seo' && (
<div className="page active">
        <div className="page-title">SEO</div>
        <div className="page-sub">Search engine visibility — no external plugin needed</div>

        <div className="two-col" style={{ marginBottom: '16px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Store SEO score</span>
              <div className="seo-score" style={{ borderColor: '#22c55e', color: '#22c55e' }}><span>72</span><span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span></div>
            </div>
            <div className="alert-box alert-warn"><i className="fas fa-exclamation-triangle" style={{ fontSize: '15px', flexShrink: '0' }}></i> 3 pages missing meta descriptions</div>
            <div className="alert-box alert-warn"><i className="fas fa-exclamation-triangle" style={{ fontSize: '15px', flexShrink: '0' }}></i> Product images missing alt text</div>
            <div className="alert-box alert-success"><i className="fas fa-check-circle" style={{ fontSize: '15px', flexShrink: '0' }}></i> Sitemap submitted to Google</div>
            <div className="alert-box alert-success"><i className="fas fa-check-circle" style={{ fontSize: '15px', flexShrink: '0' }}></i> SSL active — HTTPS enabled</div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Search performance</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Google impressions (30d)</span><span style={{ fontWeight: '500' }}>8,420</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Clicks from search</span><span style={{ fontWeight: '500', color: 'var(--text-accent)' }}>312</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>Average position</span><span style={{ fontWeight: '500' }}>#14.2</span></div>
            <div className="metric-row"><span style={{ fontSize: '13px' }}>CTR</span><span style={{ fontWeight: '500' }}>3.7%</span></div>
            <div style={{ marginTop: '12px' }}><div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Top query: "kids activity books india"</div><button className="btn btn-sm" style={{ width: '100%' }} onClick={(e) => { const prompt = e.target.getAttribute('data-prompt') || 'Provide tips for this feature'; handleAIPrompt(prompt); }}>Get SEO tips for this ↗</button></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Edit page SEO — products</span></div>
          <div className="form-row"><label className="form-label">Select page</label>
            <select className="form-input"><option>The Magic Forest (product page)</option><option>Space Explorer (product page)</option><option>Home page</option></select></div>
          <div className="form-row"><label className="form-label">SEO title (shown in Google results)</label><input className="form-input" type="text" value="The Magic Forest — Kids Story Book | KidsStories India" /></div>
          <div className="form-row"><label className="form-label">Meta description (max 160 chars)</label>
            <textarea className="form-input" rows="2" style={{ resize: 'vertical' }}>A magical journey for kids aged 4-8. Download and read The Magic Forest — an enchanting story that sparks imagination. Order today!</textarea></div>
          <div className="form-row"><label className="form-label">URL handle</label><input className="form-input" type="text" value="products/the-magic-forest" /></div>
          <div style={{ display: 'flex', gap: '8px' }}><button className="btn btn-primary btn-sm" onClick={() => alert('Demo feature')}><i className="fas fa-check"></i> Save SEO settings</button><button className="btn btn-sm" onClick={(e) => { const prompt = e.target.getAttribute('data-prompt') || 'Provide tips for this feature'; handleAIPrompt(prompt); }}>Generate with AI ↗</button></div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Keywords to target</span></div>
          <table className="table">
            <thead><tr><th>Keyword</th><th>Monthly searches</th><th>Difficulty</th><th>Your rank</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td>kids story books online india</td><td>8,100</td><td><span className="pill pill-amber">Medium</span></td><td>#28</td><td><button className="btn btn-sm" onClick={(e) => { const prompt = e.target.getAttribute('data-prompt') || 'Provide tips for this feature'; handleAIPrompt(prompt); }}>Improve ↗</button></td></tr>
              <tr><td>activity books for kids</td><td>5,400</td><td><span className="pill pill-green">Easy</span></td><td>#12</td><td><button className="btn btn-sm" onClick={(e) => { const prompt = e.target.getAttribute('data-prompt') || 'Provide tips for this feature'; handleAIPrompt(prompt); }}>Improve ↗</button></td></tr>
              <tr><td>children books rent</td><td>1,900</td><td><span className="pill pill-green">Easy</span></td><td>#6</td><td><button className="btn btn-sm">Optimized</button></td></tr>
            </tbody>
          </table>
        </div>
      </div>
)}
{/*  ========== ANALYTICS ==========  */}
      {activeTab === 'analytics' && (
<div className="page active">
        <div className="page-title">Analytics</div>
        <div className="page-sub">Sales, traffic, and customer insights</div>
        <div className="tab-bar">
          <div className={`tab ${analyticsTab === 'overview' ? 'active' : ''}`} onClick={() => setAnalyticsTab('overview')}>Overview</div>
          <div className={`tab ${analyticsTab === 'traffic' ? 'active' : ''}`} onClick={() => setAnalyticsTab('traffic')}>Traffic sources</div>
          <div className={`tab ${analyticsTab === 'conversion' ? 'active' : ''}`} onClick={() => setAnalyticsTab('conversion')}>Conversion funnel</div>
        </div>

        <div style={{ display: analyticsTab === 'overview' ? 'block' : 'none' }} id="analytics-overview">
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Revenue (30d)</div><div className="stat-value">₹12,840</div><div className="stat-delta delta-up">+18%</div></div>
            <div className="stat-card"><div className="stat-label">Orders (30d)</div><div className="stat-value">68</div><div className="stat-delta delta-up">+11%</div></div>
            <div className="stat-card"><div className="stat-label">Avg order value</div><div className="stat-value">₹238</div><div className="stat-delta delta-up">+6%</div></div>
            <div className="stat-card"><div className="stat-label">Returning customers</div><div className="stat-value">34%</div><div className="stat-delta delta-up">+4%</div></div>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Revenue — last 7 days</span></div>
            <div className="chart-placeholder" id="rev-chart"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        <div style={{ display: analyticsTab === 'traffic' ? 'block' : 'none' }} id="analytics-traffic">
          <div className="card">
            <div className="card-header"><span className="card-title">Traffic by source (30d)</span></div>
            <div className="funnel-row"><div className="funnel-label">Direct</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '45%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">880</div><div className="funnel-pct">45%</div></div>
            <div className="funnel-row"><div className="funnel-label">Google</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '30%', background: '#4285f4' }}></div></div><div className="funnel-val">590</div><div className="funnel-pct">30%</div></div>
            <div className="funnel-row"><div className="funnel-label">Instagram</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '15%', background: '#e1306c' }}></div></div><div className="funnel-val">295</div><div className="funnel-pct">15%</div></div>
            <div className="funnel-row"><div className="funnel-label">Facebook</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '7%', background: '#1877f2' }}></div></div><div className="funnel-val">137</div><div className="funnel-pct">7%</div></div>
            <div className="funnel-row"><div className="funnel-label">WhatsApp</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '3%', background: '#25d366' }}></div></div><div className="funnel-val">58</div><div className="funnel-pct">3%</div></div>
          </div>
        </div>

        <div style={{ display: analyticsTab === 'conversion' ? 'block' : 'none' }} id="analytics-conversion">
          <div className="card">
            <div className="card-header"><span className="card-title">Conversion funnel</span></div>
            <div className="funnel-row"><div className="funnel-label">Visitors</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '100%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">1,952</div><div className="funnel-pct">100%</div></div>
            <div className="funnel-row"><div className="funnel-label">Viewed book</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '60%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">1,171</div><div className="funnel-pct">60%</div></div>
            <div className="funnel-row"><div className="funnel-label">Added to cart</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '18%', background: 'var(--fill-warning)' }}></div></div><div className="funnel-val">351</div><div className="funnel-pct">18%</div></div>
            <div className="funnel-row"><div className="funnel-label">Reached checkout</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '8%', background: 'var(--fill-warning)' }}></div></div><div className="funnel-val">156</div><div className="funnel-pct">8%</div></div>
            <div className="funnel-row"><div className="funnel-label">Purchased</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '3.5%', background: 'var(--fill-success)' }}></div></div><div className="funnel-val">68</div><div className="funnel-pct">3.5%</div></div>
          </div>
          <div style={{ marginTop: '8px' }}><button className="btn" onClick={(e) => { const prompt = e.target.getAttribute('data-prompt') || 'Provide tips for this feature'; handleAIPrompt(prompt); }}>Get conversion tips ↗</button></div>
        </div>
      </div>
)}
{/*  ========== LIVE VIEW ==========  */}
      {activeTab === 'liveview' && (
<div className="page active">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div className="live-dot"></div>
          <div className="page-title">Live view</div>
        </div>
        <div className="page-sub">Visitors on your store right now</div>
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Visitors right now</div><div className="stat-value" id="lv-count">7</div></div>
          <div className="stat-card"><div className="stat-label">Active carts</div><div className="stat-value">3</div></div>
          <div className="stat-card"><div className="stat-label">Checking out</div><div className="stat-value">1</div></div>
          <div className="stat-card"><div className="stat-label">Purchased today</div><div className="stat-value">2</div></div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Visitors by location</span></div>
          <div className="funnel-row"><div className="funnel-label">Hyderabad</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '40%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">3</div></div>
          <div className="funnel-row"><div className="funnel-label">Bangalore</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '27%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">2</div></div>
          <div className="funnel-row"><div className="funnel-label">Mumbai</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '13%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">1</div></div>
          <div className="funnel-row"><div className="funnel-label">Chennai</div><div className="funnel-bar-wrap"><div className="funnel-fill" style={{ width: '13%', background: 'var(--fill-accent)' }}></div></div><div className="funnel-val">1</div></div>
        </div>
      </div>
)}
{/*  ========== DISCOUNTS ==========  */}
      {activeTab === 'discounts' && (
<div className="page active">
        <div className="page-title">Discounts</div>
        <div className="page-sub">Create coupon codes and automatic discounts</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}><button className="btn btn-primary btn-sm" onClick={() => alert('Demo feature')}><i className="fas fa-plus"></i> Create discount</button></div>
        <div className="card" style={{ padding: '0' }}>
          <table className="table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td><code>SUMMER20</code></td><td>Percentage</td><td>20% off</td><td>14/50</td><td>Jul 31</td><td><span className="pill pill-green">Active</span></td></tr>
              <tr><td><code>WELCOME10</code></td><td>Percentage</td><td>10% off</td><td>38/—</td><td>No expiry</td><td><span className="pill pill-green">Active</span></td></tr>
              <tr><td><code>COMBO100</code></td><td>Fixed amount</td><td>₹100 off</td><td>7/20</td><td>Jun 30</td><td><span className="pill pill-red">Expired</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
)}
{/*  ========== SETTINGS ==========  */}
      {activeTab === 'settings' && (
<div className="page active">
        <div className="page-title">Settings</div>
        <div className="page-sub">Store configuration and integrations</div>
        <div className="two-col">
          <div className="card">
            <div className="card-header"><span className="card-title">Store details</span></div>
            <div className="form-row"><label className="form-label">Store name</label><input className="form-input" type="text" value="KidsStories" /></div>
            <div className="form-row"><label className="form-label">Store URL</label><input className="form-input" type="text" value="kids-stories-olive.vercel.app" /></div>
            <div className="form-row"><label className="form-label">Support email</label><input className="form-input" type="text" value="sruthikommalapati1998@gmail.com" /></div>
            <button className="btn btn-primary btn-sm" onClick={() => alert('Demo feature')}><i className="fas fa-check"></i> Save</button>
          </div>
          <div className="card">
            <div className="card-header"><span className="card-title">Integrations</span></div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Razorpay payments</div><div style={{ fontSize: '12px', color: 'var(--text-success)' }}>Connected</div></div>
              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Email notifications (Gmail)</div><div style={{ fontSize: '12px', color: 'var(--text-success)' }}>Connected</div></div>
              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Meta Ads (Facebook/Instagram)</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not connected</div></div>
              <div className="toggle" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>Google Search Console</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not connected</div></div>
              <div className="toggle" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
            <div className="setting-row">
              <div><div style={{ fontSize: '13px' }}>WhatsApp notifications</div><div style={{ fontSize: '12px', color: 'var(--text-success)' }}>Connected (Twilio)</div></div>
              <div className="toggle on" onClick={(e) => e.currentTarget.classList.toggle('on')}></div>
            </div>
          </div>
        </div>
      </div>
      )}
        
      {aiResponse && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', justifyContent:'center', alignItems:'center'}}>
          <div style={{background:'white', padding:'30px', borderRadius:'15px', width:'90%', maxWidth:'700px', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
            <h3 style={{marginTop:0, color:'var(--primary)', display:'flex', alignItems:'center', gap:'10px'}}>
              <i className="fas fa-sparkles"></i> AI Suggestion
            </h3>
            <div style={{whiteSpace:'pre-wrap', lineHeight:'1.6', fontSize:'14px', color:'#444', background:'#f8f9fa', padding:'20px', borderRadius:'10px', border:'1px solid #eee'}}>
              {aiResponse}
            </div>
            <div style={{marginTop:'20px', textAlign:'right'}}>
              <button onClick={() => setAiResponse('')} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}
</div>
      </div>
    </div>
  );
};

export default Admin;
