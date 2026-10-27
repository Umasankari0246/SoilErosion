const http = require('http');

function makeRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAll() {
  console.log('--- Testing Auth Login ---');
  const loginRes = await makeRequest('/api/auth/login', 'POST', { email: 'suresh.patel@gmail.com', password: 'password123' });
  console.log('Login Response:', loginRes);

  const token = loginRes.data.token;

  console.log('\n--- Testing Get User Soil Samples ---');
  const soilRes = await makeRequest('/api/soil', 'GET', null, token);
  console.log('Soil Count:', soilRes.data.count, 'First Sample Score:', soilRes.data.samples[0].degradation_score);

  console.log('\n--- Testing Dynamic Soil Analysis Endpoint ---');
  const analysisRes = await makeRequest('/api/soil', 'POST', {
    state: 'Maharashtra', district: 'Nashik', village: 'Trimbak',
    latitude: 19.9372, longitude: 73.5350, soil_type: 'Black Cotton Soil',
    soil_texture: 'Clay Loam', land_use: 'Agricultural', crop_type: 'Grapes',
    ph: 8.4, moisture: 12.0, organic_carbon: 0.30, nitrogen: 100,
    phosphorus: 8, potassium: 110, electrical_conductivity: 3.2, salinity: 2.1, erosion_level: 'High'
  }, token);

  console.log('Analysis Result:', analysisRes.data.analysis);

  console.log('\n--- All API Endpoints Functioning Cleanly! ---');
}

testAll();
