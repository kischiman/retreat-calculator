import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check environment variables
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.error('Missing environment variables:', {
      url: !!process.env.KV_REST_API_URL,
      token: !!process.env.KV_REST_API_TOKEN
    });
    return res.status(500).json({ 
      success: false, 
      message: 'Server configuration error: Missing database credentials' 
    });
  }

  try {
    const { participants, settings, additionalActivities, existingId } = req.body;
    
    if (!participants || !settings) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required data' 
      });
    }

    // Use existing ID or generate a new one
    const calculationId = existingId || `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const data = {
      participants,
      settings,
      additionalActivities: additionalActivities || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Redis with expiration (30 days)
    await redis.setex(calculationId, 30 * 24 * 60 * 60, JSON.stringify(data));
    
    res.status(200).json({ 
      success: true, 
      calculationId,
      message: 'Calculation saved successfully' 
    });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save calculation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}