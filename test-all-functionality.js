const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function test() {
  let userId;
  let token;
  let resetToken;
  const testUser = {
    phone: "+237600000001",
    password: "TestPass123!",
    pin: "1234",
    email: "testuser1@example.com",
    name: "Test User",
    region: "TestRegion"
  };

  // Register
  let res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  let data = await res.json();
  console.log('Register:', data);
  userId = data.user?.id;
  token = data.token;

  // Login
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testUser.phone, password: testUser.password, pin: testUser.pin })
  });
  data = await res.json();
  console.log('Login:', data);
  token = data.token;

  // Initiate password reset
  res = await fetch('http://localhost:5000/api/auth/reset/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testUser.phone, type: 'password', method: 'email' })
  });
  data = await res.json();
  console.log('Reset Initiate:', data);
  resetToken = data.token || data.resetToken || 'dummy-token';

  // Complete password reset
  res = await fetch('http://localhost:5000/api/auth/reset/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: testUser.phone, type: 'password', token: resetToken, newValue: 'NewTestPass123!' })
  });
  data = await res.json();
  console.log('Reset Complete:', data);

  // Create yield
  res = await fetch('http://localhost:5000/api/yields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crop: 'Maize', yield: 100, region: testUser.region })
  });
  data = await res.json();
  console.log('Insert Yield:', data);

  // Fetch yields
  res = await fetch(`http://localhost:5000/api/yields?region=${encodeURIComponent(testUser.region)}`);
  data = await res.json();
  console.log('Get Yields:', data);

  // Backup user
  res = await fetch('http://localhost:5000/api/backup-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, ...testUser })
  });
  data = await res.json();
  console.log('Backup User:', data);

  // Analytics
  res = await fetch(`http://localhost:5000/api/analytics/user/${userId}`);
  data = await res.json();
  console.log('User Analytics:', data);

  // Admin stats
  res = await fetch('http://localhost:5000/api/admin/stats');
  data = await res.json();
  console.log('Admin Stats:', data);

  // Health
  res = await fetch('http://localhost:5000/api/health');
  data = await res.json();
  console.log('Health:', data);

  // Performance
  res = await fetch('http://localhost:5000/api/performance/stats');
  data = await res.json();
  console.log('Performance:', data);
}

test().catch(console.error); 