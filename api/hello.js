export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello from API!',
    timestamp: new Date().toISOString(),
    node: process.version,
    env_vars: {
      has_url: !!process.env.KV_REST_API_URL,
      has_token: !!process.env.KV_REST_API_TOKEN
    }
  });
}