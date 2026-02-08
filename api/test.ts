export default function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check environment variables
    const hasUrl = !!process.env.KV_REST_API_URL;
    const hasToken = !!process.env.KV_REST_API_TOKEN;
    
    res.status(200).json({
      success: true,
      message: 'API is working',
      env: {
        hasUrl,
        hasToken,
        url: hasUrl ? 'Set' : 'Missing',
        token: hasToken ? 'Set' : 'Missing'
      },
      timestamp: new Date().toISOString(),
      node_version: process.version
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: String(error)
    });
  }
}