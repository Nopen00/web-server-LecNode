const { error } = require('console');
const http = require('http');
const fs = require('fs').promises;

//=====================================================
// http.createServer((req,res)=>{
//     res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
//     res.write('<h1>Hello Node!</h1>');
//     res.end('<p>Hello Server!</p>');
// })
//     .listen(8080,()=>{
//         console.log('8080번 포트에서 서버 대기 중입니다!');
//     });
//=====================================================


// const server1 = http.createServer((req,res)=>{
//     res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
//     res.write('<h1>Hello Node!</h1>');
//     res.end('<p>Hello Server!</p>');
// });
// const server2 = http.createServer((req,res)=>{
//     res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
//     res.write('<h1>Hello Node!</h1>');
//     res.write('<p>Hello world!</p>');
//     res.end('<p>Hello Server!</p>');
// });
// server1.listen(8080);
// server2.listen(8081);

// server1.on('listening',()=>{
//     console.log('8080번 포트에서 서버 대기 중입니다!');
// });
// server2.on('listening',()=>{
//     console.log('8081번 포트에서 서버 대기 중입니다!');
// });

// server1.on('error',(error)=>{
//     console.error(error);
// });
// server2.on('error',(error)=>{
//     console.error(error);
// });
//=====================================================

http.createServer(async(req,res)=>{
    try{
        const data = await fs.readFile('./server2.html');
        res.writeHead(200,{ 'Content-Type': 'text/html; charset=utf-8'});
        res.end(data);
    } catch(err){
        console.error(err);
        res.writeHead(500,{ 'Content-Type': 'text/html; charset=utf-8'});
        res.end(err.message);
    }
})
    .listen(8081,()=>{
        console.log('8081번 포트에서 서버 대기 중입니다!');
    });