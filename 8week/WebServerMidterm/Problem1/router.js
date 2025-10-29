import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'notes.json');

// JSON 파일에서 데이터 읽기
async function readNotes() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // 파일이 존재하지 않으면 빈 배열 반환
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

// JSON 파일에 데이터 쓰기
async function writeNotes(notes) {
  await fs.writeFile(DATA_FILE, JSON.stringify(notes, null, 2), 'utf8');
}

// 요청 본문 파싱
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// 에러 응답 전송
function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

// 성공 응답 전송
function sendSuccess(res, statusCode, data = null) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  if (data !== null) {
    res.end(JSON.stringify(data));
  } else {
    res.end();
  }
}

// 정적 파일 제공
async function serveStatic(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'public', req.url === '/' ? 'index.html' : req.url);
    const data = await fs.readFile(filePath, 'utf8');
    
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json'
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    sendError(res, 404, 'File not found');
  }
}

// GET /notes - 모든 노트 조회
async function getNotes(req, res) {
  try {
    const notes = await readNotes();
    sendSuccess(res, 200, notes);
  } catch (error) {
    console.error('GET /notes error:', error);
    sendError(res, 500, 'Internal server error');
  }
}

// GET /notes/:id - 특정 노트 조회
async function getNoteById(req, res, id) {
  try {
    const notes = await readNotes();
    const note = notes.find(n => n.id === id);
    
    if (!note) {
      return sendError(res, 404, 'Note not found');
    }
    
    sendSuccess(res, 200, note);
  } catch (error) {
    console.error('GET /notes/:id error:', error);
    sendError(res, 500, 'Internal server error');
  }
}

// POST /notes - 새 노트 생성
async function createNote(req, res) {
  try {
    const body = await parseBody(req);
    
    if (!body.title || !body.content) {
      return sendError(res, 400, 'Title and content are required');
    }

    const notes = await readNotes();
    const newId = Date.now().toString(); // 간단한 ID 생성
    const newNote = {
      id: newId,
      title: body.title,
      content: body.content
    };
    
    notes.push(newNote);
    await writeNotes(notes);
    
    sendSuccess(res, 201, newNote);
  } catch (error) {
    if (error.message === 'Invalid JSON') {
      return sendError(res, 400, 'Invalid JSON');
    }
    console.error('POST /notes error:', error);
    sendError(res, 500, 'Internal server error');
  }
}

// PUT /notes/:id - 노트 수정
async function updateNote(req, res, id) {
  try {
    const body = await parseBody(req);
    const notes = await readNotes();
    const noteIndex = notes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return sendError(res, 404, 'Note not found');
    }

    // 제목이나 내용이 제공되면 업데이트
    if (body.title !== undefined) {
      notes[noteIndex].title = body.title;
    }
    if (body.content !== undefined) {
      notes[noteIndex].content = body.content;
    }
    
    await writeNotes(notes);
    sendSuccess(res, 200, notes[noteIndex]);
  } catch (error) {
    if (error.message === 'Invalid JSON') {
      return sendError(res, 400, 'Invalid JSON');
    }
    console.error('PUT /notes/:id error:', error);
    sendError(res, 500, 'Internal server error');
  }
}

// DELETE /notes/:id - 노트 삭제
async function deleteNote(req, res, id) {
  try {
    const notes = await readNotes();
    const noteIndex = notes.findIndex(n => n.id === id);
    
    if (noteIndex === -1) {
      return sendError(res, 404, 'Note not found');
    }
    
    notes.splice(noteIndex, 1);
    await writeNotes(notes);
    
    res.writeHead(204);
    res.end();
  } catch (error) {
    console.error('DELETE /notes/:id error:', error);
    sendError(res, 500, 'Internal server error');
  }
}

// 라우터 메인 함수
export async function dispatch(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // 정적 파일 제공 (루트 경로 또는 public 폴더의 파일들)
    if (pathname === '/' || !pathname.startsWith('/notes')) {
      return await serveStatic(req, res);
    }

    // /notes 경로 처리
    if (pathname.startsWith('/notes')) {
      const pathParts = pathname.split('/').filter(Boolean);
      
      if (method === 'GET') {
        if (pathParts.length === 1) {
          // GET /notes
          return await getNotes(req, res);
        } else if (pathParts.length === 2) {
          // GET /notes/:id
          return await getNoteById(req, res, pathParts[1]);
        }
      } else if (method === 'POST' && pathParts.length === 1) {
        // POST /notes
        return await createNote(req, res);
      } else if (method === 'PUT' && pathParts.length === 2) {
        // PUT /notes/:id
        return await updateNote(req, res, pathParts[1]);
      } else if (method === 'DELETE' && pathParts.length === 2) {
        // DELETE /notes/:id
        return await deleteNote(req, res, pathParts[1]);
      }
    }

    // 404 처리
    sendError(res, 404, 'Not found');
  } catch (error) {
    console.error('Router error:', error);
    sendError(res, 500, 'Internal server error');
  }
}
