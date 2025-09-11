const { request } = require('undici');

async function testThePornDBAPI(apiKey) {
  try {
    console.log('🧪 Testing ThePornDB API...');
    
    const response = await request('https://theporndb.net/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Stremio-Adult-Addon/1.3.0'
      },
      body: JSON.stringify({
        query: `
          query TestAPI {
            __schema {
              types {
                name
              }
            }
          }
        `
      })
    });

    const result = await response.body.json();
    
    if (result.errors) {
      console.error('❌ API Test Failed:', result.errors);
      return false;
    }
    
    if (result.data?.__schema?.types) {
      console.log('✅ ThePornDB API is working!');
      console.log('📋 Available types:', result.data.__schema.types.slice(0, 5).map(t => t.name));
      return true;
    }
    
    console.log('⚠️ Unexpected response structure');
    return false;
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    return false;
  }
}

module.exports = { testThePornDBAPI };
