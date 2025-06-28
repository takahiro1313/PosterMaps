import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// CORSヘッダーを付与
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// リクエストパスのログ出力
app.use((req, res, next) => {
  console.log('Proxying:', req.url);
  next();
});

app.use(
  '/gas',
  createProxyMiddleware({
    target: 'https://script.google.com',
    changeOrigin: true,
    pathRewrite: {
      '^/gas': '',
    },
  })
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}/gas`);
}); 