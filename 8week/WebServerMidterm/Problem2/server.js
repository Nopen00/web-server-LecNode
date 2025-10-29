import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static('public'));

// 페이지네이션 라우트 처리
app.get('/page', (req, res) => {
  const offset = parseInt(req.query['article.offset']) || 0;
  
  // offset을 기반으로 페이지 번호 계산 (0-based offset을 1-based page로 변환)
  const pageNumber = Math.floor(offset / 10) + 1;
  
  // pageNumber에 따라 적절한 board 파일로 리다이렉트
  if (pageNumber >= 1 && pageNumber <= 9) {
    res.redirect(`/board${pageNumber}.html`);
  } else {
    // 유효하지 않은 페이지 번호인 경우 board1.html로 리다이렉트
    res.redirect('/board1.html');
  }
});

// 루트 경로에서 board1.html로 리다이렉트
app.get('/', (req, res) => {
  res.redirect('/board1.html');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('페이지네이션 링크가 정상적으로 작동합니다.');
});
