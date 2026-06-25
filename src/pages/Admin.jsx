import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings, BookOpen, Activity, Calendar, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [dashRes, booksRes] = await Promise.all([
        fetch('http://localhost:3000/api/owner/dashboard', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
        fetch('http://localhost:3000/api/owner/books', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
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
      const res = await fetch('http://localhost:3000/api/owner/toggle-book', {
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
      const res = await fetch('http://localhost:3000/api/owner/update-book-image', {
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
      const res = await fetch('http://localhost:3000/api/owner/update-book-pdf', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
        // Optionally update local state if needed, though PDF isn't displayed
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
      const res = await fetch('http://localhost:3000/api/owner/delete-book', {
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

      const res = await fetch('http://localhost:3000/api/owner/add-book', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: payload
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Book Added Successfully!");
        e.target.reset();
        fetchData(); // Refresh list
        setActiveTab('books');
      } else {
        toast.error(data.message || "Failed to add book");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
      toast.dismiss(); // Clear any loading toasts
    }
  };

  if (loading || !dashboardData) return <div className="container" style={{ paddingTop: '120px' }}>Loading Admin Dashboard...</div>;

  return (
    <div className="container" style={{ minHeight: '80vh', paddingTop: '120px', paddingBottom: '60px' }}>
      <h2 className="text-gradient mb-4" style={{ fontSize: '2.5rem', textAlign: 'center' }}>Admin Dashboard</h2>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 120px', fontSize: '1rem', padding: '10px' }} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`btn ${activeTab === 'books' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 120px', fontSize: '1rem', padding: '10px' }} onClick={() => setActiveTab('books')}>Manage Books</button>
        <button className={`btn ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 120px', fontSize: '1rem', padding: '10px' }} onClick={() => setActiveTab('add')}>+ Add New Book</button>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '30px' }}>
          
          <div className="admin-cards-grid">
            <div className="glass-panel admin-card">
              <Package size={40} color="var(--primary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '2rem' }}>{dashboardData.totalOrders}</h3>
                <p style={{ margin: 0, color: '#666' }}>Total Bookings</p>
              </div>
            </div>
            
            <div className="glass-panel admin-card">
              <Calendar size={40} color="var(--secondary)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '2rem' }}>{dashboardData.weekendOrders}</h3>
                <p style={{ margin: 0, color: '#666' }}>Weekend Bookings</p>
              </div>
            </div>

            <div className="glass-panel admin-card">
              <DollarSign size={40} color="var(--success)" />
              <div>
                <h3 style={{ margin: 0, fontSize: '2rem' }}>₹{dashboardData.monthlyRevenue}</h3>
                <p style={{ margin: 0, color: '#666' }}>Total Earned</p>
              </div>
            </div>
          </div>

          <div className="glass-panel admin-panel">
            <h3 style={{ marginBottom: '20px' }}>Recent Bookings</h3>
            {dashboardData.recentOrders.length === 0 ? <p>No recent bookings.</p> : (
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Order ID</th>
                      <th style={{ padding: '10px' }}>Book</th>
                      <th style={{ padding: '10px' }}>Amount</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentOrders.map(order => (
                      <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{order._id.substring(0, 8)}...</td>
                        <td style={{ padding: '10px' }}>{order.book ? order.book.brand : 'Book'}</td>
                        <td style={{ padding: '10px' }}>₹{order.price}</td>
                        <td style={{ padding: '10px' }}><span style={{ padding: '3px 8px', borderRadius: '12px', background: order.status === 'confirmed' ? 'var(--success)' : '#ffb703', color: 'white', fontSize: '0.8rem' }}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'books' && (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>Enable/Disable Books</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {books.length === 0 ? <p>No books added yet.</p> : books.map(book => (
              <div key={book._id} style={{ border: '1px solid #eee', borderRadius: '10px', padding: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <img src={book.image} alt="book" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0' }}>{book.brand} {book.model}</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>₹{book.pricePerDay}</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => toggleAvailability(book._id)}
                      style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: book.isAvailable ? 'var(--success)' : '#ccc', color: book.isAvailable ? 'white' : '#333' }}
                    >
                      {book.isAvailable ? 'Active' : 'Disabled'}
                    </button>
                    
                    <label style={{ padding: '5px 10px', borderRadius: '5px', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Change Cover
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUpdateCover(book._id, e.target.files[0])} />
                    </label>

                    <label style={{ padding: '5px 10px', borderRadius: '5px', background: 'var(--secondary)', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                      Change PDF
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleUpdatePdf(book._id, e.target.files[0])} />
                    </label>

                    <button 
                      onClick={() => handleDeleteBook(book._id)}
                      style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', background: '#ff4d4d', color: 'white' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '20px' }}>Upload a New Book</h3>
          <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Book Title</label>
              <input type="text" name="brand" required placeholder="e.g. The Magic Forest" />
            </div>
            <div className="form-group">
              <label>Type / Format</label>
              <select name="model" required style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #ddd' }}>
                <option value="Single Book">Single Book</option>
                <option value="Bundle">Bundle (Multiple Books)</option>
                <option value="E-Book">E-Book Only</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="pricePerDay" required placeholder="199" min="0" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" required rows="3" placeholder="A magical journey..." style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #ddd' }}></textarea>
            </div>
            <div className="form-group">
              <label>Book Cover Image</label>
              <input type="file" name="image" required accept="image/*" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #ddd', background: 'white' }} />
            </div>
            <div className="form-group">
              <label>Book Content (PDF)</label>
              <input type="file" name="pdf" required accept=".pdf" style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '2px solid #ddd', background: 'white' }} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '10px' }}>
              {submitting ? 'Uploading...' : 'Publish Book'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default Admin;
