const express = require('express');
const morgan = require('morgan');
const { sequelize } = require('./models');



const app = express();
app.set('port', 3001);


sequelize.sync({force : false})
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    });


app.use(morgan('dev'));

app.listen(app.get('port'),()=>{
    console.log(app.get('port'), '번 포트에 연결되었습니다')
});
