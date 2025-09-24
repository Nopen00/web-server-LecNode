const http = require('http');
const fs = require('fs').promises;

const users = {};

http.createServer(async(req,res)=>{
    try{
        if(req.method === 'GET'){
            if(req.url === '/'){
                const data = await fs.readFile('./restFront.html');
                res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
                return res.end(data);
            } else if (req.url ==='/about'){
                const data = await fs.readFile('./restFront.html');
                res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
                return res.end(data);
            } else if (req.url ==='/users'){
                const data = await fs.readFile('./restFront.html');
                res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
                return res.end(JSON.stringify(users));
            }
        }else if (req.method === 'POST'){
            if(req.url === '/user'){
                let body ='';
                req.on('data', (data)=>{
                    body += data;
                });
                return req.on('end',()=>{
                    console.log('POST 본문 :',body);
                    const {name} = JSON.parse(bady);
                    const id = Data.now();
                    users(id) = name;
                    res.writeHead(201,{ 'Content-Type': 'text/html; charset=utf-8'});
                    res.end('OK');
                })
            }
        }
        res.writeHead(404);
        return res.end('NOT FOUND');

    } catch(err){
        console.error(err);
        res.writeHead(500,{ 'Content-Type': 'text/html; charset=utf-8'});
        res.end(err.message);
    }
})
    .listen(8082,()=>{
        console.log('8082번 포트에서 서버 대기 중입니다!');
    })