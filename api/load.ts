import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid calculation ID' });
    }

    const data = await redis.get(id);
    
    if (!data) {
      return res.status(404).json({ message: 'Calculation not found' });
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    
    res.status(200).json({ 
      success: true, 
      data: parsedData 
    });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load calculation',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}