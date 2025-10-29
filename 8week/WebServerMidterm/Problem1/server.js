// server.js (일부)
import http from 'http';
import { dispatch } from './router.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // CORS 헤더 공통 추가
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS 프리플라이트 즉시 응답
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  console.log(`${req.method} ${req.url}`);
  await dispatch(req, res);
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});