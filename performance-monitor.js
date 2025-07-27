import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

class PerformanceMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const start = Date.now();
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const duration = Date.now() - start;
      
      return {
        endpoint,
        method,
        status: response.status,
        duration,
        success: response.ok,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - start;
      return {
        endpoint,
        method,
        status: 'ERROR',
        duration,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async testEndpoint(endpoint, method = 'GET', body = null, iterations = 5) {
    console.log(`\n🧪 Testing ${method} ${endpoint} (${iterations} iterations)...`);
    
    const results = [];
    for (let i = 0; i < iterations; i++) {
      const result = await this.makeRequest(endpoint, method, body);
      results.push(result);
      
      // Log progress
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      console.log(`  ${i + 1}/${iterations}: ${result.duration}ms (avg: ${avgDuration.toFixed(0)}ms)`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const minDuration = Math.min(...results.map(r => r.duration));
    const maxDuration = Math.max(...results.map(r => r.duration));
    const successRate = (results.filter(r => r.success).length / results.length) * 100;

    console.log(`  📊 Results: avg=${avgDuration.toFixed(0)}ms, min=${minDuration}ms, max=${maxDuration}ms, success=${successRate.toFixed(1)}%`);

    return {
      endpoint,
      method,
      iterations,
      avgDuration,
      minDuration,
      maxDuration,
      successRate,
      results
    };
  }

  async runPerformanceTests() {
    console.log('🚀 Starting Performance Tests...\n');

    const tests = [
      // User endpoints
      { endpoint: '/api/user/profile', method: 'GET' },
      
      // Tontine endpoints
      { endpoint: '/api/tontines', method: 'GET' },
      
      // Community endpoints
      { endpoint: '/api/community/posts', method: 'GET' },
      
      // Market endpoints
      { endpoint: '/api/market/prices', method: 'GET' },
      
      // Admin endpoints (most critical for performance)
      { endpoint: '/api/admin/stats', method: 'GET' },
      { endpoint: '/api/admin/notifications', method: 'GET' },
      { endpoint: '/api/admin/metrics', method: 'GET' },
      { endpoint: '/api/admin/automation/rules', method: 'GET' },
      { endpoint: '/api/admin/support/tickets', method: 'GET' },
      { endpoint: '/api/admin/tontines/pending', method: 'GET' },
      { endpoint: '/api/admin/prices/pending', method: 'GET' },
      { endpoint: '/api/admin/users/suspended', method: 'GET' },
      { endpoint: '/api/admin/posts/flagged', method: 'GET' },
      
      // Cache endpoints
      { endpoint: '/api/admin/cache/stats', method: 'GET' },
    ];

    const results = [];
    
    for (const test of tests) {
      const result = await this.testEndpoint(test.endpoint, test.method, test.body);
      results.push(result);
    }

    this.results = results;
    this.generateReport();
  }

  generateReport() {
    console.log('\n📈 PERFORMANCE TEST REPORT');
    console.log('=' .repeat(50));

    // Sort by average duration (slowest first)
    const sortedResults = [...this.results].sort((a, b) => b.avgDuration - a.avgDuration);

    console.log('\n🐌 SLOWEST ENDPOINTS:');
    sortedResults.slice(0, 5).forEach((result, index) => {
      const status = result.avgDuration > 1000 ? '🔴' : result.avgDuration > 500 ? '🟡' : '🟢';
      console.log(`${index + 1}. ${status} ${result.method} ${result.endpoint}`);
      console.log(`   Average: ${result.avgDuration.toFixed(0)}ms | Success: ${result.successRate.toFixed(1)}%`);
    });

    console.log('\n⚡ FASTEST ENDPOINTS:');
    sortedResults.slice(-5).reverse().forEach((result, index) => {
      console.log(`${index + 1}. 🟢 ${result.method} ${result.endpoint}`);
      console.log(`   Average: ${result.avgDuration.toFixed(0)}ms | Success: ${result.successRate.toFixed(1)}%`);
    });

    // Overall statistics
    const totalRequests = this.results.reduce((sum, r) => sum + r.iterations, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + (r.avgDuration * r.iterations), 0);
    const overallAvgDuration = totalDuration / totalRequests;
    const overallSuccessRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length;

    console.log('\n📊 OVERALL STATISTICS:');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Overall Average Response Time: ${overallAvgDuration.toFixed(0)}ms`);
    console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    console.log(`Test Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`);

    // Performance recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    
    const slowEndpoints = sortedResults.filter(r => r.avgDuration > 1000);
    if (slowEndpoints.length > 0) {
      console.log('🔴 Critical Issues:');
      slowEndpoints.forEach(result => {
        console.log(`   - ${result.method} ${result.endpoint} is very slow (${result.avgDuration.toFixed(0)}ms)`);
        console.log(`     Consider: Database optimization, caching, or query restructuring`);
      });
    }

    const mediumEndpoints = sortedResults.filter(r => r.avgDuration > 500 && r.avgDuration <= 1000);
    if (mediumEndpoints.length > 0) {
      console.log('🟡 Optimization Opportunities:');
      mediumEndpoints.forEach(result => {
        console.log(`   - ${result.method} ${result.endpoint} could be faster (${result.avgDuration.toFixed(0)}ms)`);
        console.log(`     Consider: Adding caching or optimizing database queries`);
      });
    }

    if (slowEndpoints.length === 0 && mediumEndpoints.length === 0) {
      console.log('🟢 All endpoints are performing well!');
    }

    console.log('\n' + '=' .repeat(50));
  }

  async testCacheEffectiveness() {
    console.log('\n🔥 Testing Cache Effectiveness...\n');

    const cacheTestEndpoint = '/api/admin/stats';
    
    // First request (cache miss)
    console.log('1️⃣ First request (cache miss):');
    const firstResult = await this.makeRequest(cacheTestEndpoint);
    console.log(`   Duration: ${firstResult.duration}ms`);

    // Second request (cache hit)
    console.log('\n2️⃣ Second request (cache hit):');
    const secondResult = await this.makeRequest(cacheTestEndpoint);
    console.log(`   Duration: ${secondResult.duration}ms`);

    const improvement = ((firstResult.duration - secondResult.duration) / firstResult.duration * 100).toFixed(1);
    console.log(`\n📈 Cache Improvement: ${improvement}% faster with cache!`);
  }
}

// Run the performance monitor
async function main() {
  const monitor = new PerformanceMonitor();
  
  try {
    await monitor.runPerformanceTests();
    await monitor.testCacheEffectiveness();
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
}

main(); 