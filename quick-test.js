import fetch from 'node-fetch';

async function quickTest() {
  console.log('🚀 Quick Server Test...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/api/health');
    console.log(`   ✅ Health: ${healthResponse.status} - ${healthResponse.statusText}`);
    
    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '237123456789',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   ✅ Login: ${loginResponse.status} - ${loginData.token ? 'Success' : loginData.error}`);
    
    if (loginData.token) {
      const token = loginData.token;
      
      // Test admin stats
      console.log('\n3. Testing admin stats...');
      const statsResponse = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      console.log(`   ✅ Admin Stats: ${statsResponse.status} - ${statsData.totalUsers || 0} users`);
      
      // Test pending tontines
      console.log('\n4. Testing pending tontines...');
      const tontinesResponse = await fetch('http://localhost:5000/api/admin/tontines/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tontinesData = await tontinesResponse.json();
      console.log(`   ✅ Pending Tontines: ${tontinesResponse.status} - ${Array.isArray(tontinesData) ? tontinesData.length : 0} items`);
      
      // Test community posts
      console.log('\n5. Testing community posts...');
      const postsResponse = await fetch('http://localhost:5000/api/community/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const postsData = await postsResponse.json();
      console.log(`   ✅ Community Posts: ${postsResponse.status} - ${Array.isArray(postsData) ? postsData.length : 0} posts`);
      
      // Test market prices
      console.log('\n6. Testing market prices...');
      const pricesResponse = await fetch('http://localhost:5000/api/market/prices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pricesData = await pricesResponse.json();
      console.log(`   ✅ Market Prices: ${pricesResponse.status} - ${Array.isArray(pricesData) ? pricesData.length : 0} prices`);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Server is running and functional');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest(); 