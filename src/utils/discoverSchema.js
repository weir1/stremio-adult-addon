const { request } = require('undici');

async function discoverThePornDBSchema(apiKey) {
  try {
    console.log('🔍 Discovering ThePornDB schema...');
    
    const response = await request('https://theporndb.net/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'Stremio-Adult-Addon/1.3.0'
      },
      body: JSON.stringify({
        query: `
          query IntrospectSchema {
            __schema {
              types {
                name
                fields {
                  name
                  type {
                    name
                  }
                }
              }
            }
          }
        `
      })
    });

    const result = await response.body.json();
    
    if (result.errors) {
      console.error('❌ Schema introspection failed:', result.errors);
      return null;
    }
    
    // Find Scene, Image, and Performer types
    const types = result.data.__schema.types;
    const sceneType = types.find(t => t.name === 'Scene');
    const imageType = types.find(t => t.name === 'Image');
    const performerType = types.find(t => t.name === 'PerformerAppearance' || t.name === 'Performer');
    
    console.log('📋 Scene fields:', sceneType?.fields?.map(f => f.name) || 'Not found');
    console.log('🖼️ Image fields:', imageType?.fields?.map(f => f.name) || 'Not found');
    console.log('👤 Performer fields:', performerType?.fields?.map(f => f.name) || 'Not found');
    
    return {
      sceneFields: sceneType?.fields?.map(f => f.name) || [],
      imageFields: imageType?.fields?.map(f => f.name) || [],
      performerFields: performerType?.fields?.map(f => f.name) || []
    };
  } catch (error) {
    console.error('❌ Schema discovery error:', error.message);
    return null;
  }
}

module.exports = { discoverThePornDBSchema };
