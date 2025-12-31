import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

export default function handler(request: VercelRequest, response: VercelResponse) {
  const webhookPath = '/flow/api/trigger-webhook/db8d94317fd960eec7e22bbfe78ee982';
  const hostname = 'www.feishu.cn';

  // 处理 CORS (虽然通常由前端代理处理，但作为 API 这是一个好习惯)
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // 只允许 POST
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const data = JSON.stringify(request.body);

  const options = {
    hostname: hostname,
    port: 443,
    path: webhookPath,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const parsedBody = JSON.parse(body);
        response.status(res.statusCode || 200).json(parsedBody);
      } catch (e) {
        response.status(res.statusCode || 200).send(body);
      }
    });
  });

  req.on('error', (e) => {
    console.error(e);
    response.status(500).json({ error: 'Internal Server Error' });
  });

  req.write(data);
  req.end();
}
