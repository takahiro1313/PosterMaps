export default async function handler(req, res) {
  const targetUrl = process.env.GAS_URL;
  if (!targetUrl) {
    res.status(500).send('GAS_URL is not set');
    return;
  }
  // クエリやパスをそのまま付与
  const url = `${targetUrl}${req.url.replace('/api/gas-proxy', '')}`;
  const method = req.method;
  const headers = { ...req.headers };
  delete headers.host;

  const fetchOptions = {
    method,
    headers,
  };

  if (method !== 'GET' && req.body) {
    fetchOptions.body = req.body;
  }

  try {
    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || 'text/plain';
    const data = await response.text();
    res.status(response.status);
    res.setHeader('content-type', contentType);
    res.send(data);
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
} 