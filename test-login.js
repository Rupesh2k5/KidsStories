const testLogin = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rupesh.madhuvarsu2005@gmail.com', password: 'Rupesh@2k5' })
    });
    const data = await res.json();
    console.log('Login Response:', data);

    if (data.token) {
      console.log('Fetching user data with token...');
      const userRes = await fetch('http://localhost:3000/api/user/data', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      const userData = await userRes.json();
      console.log('User Data Response:', userData);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
};

testLogin();
