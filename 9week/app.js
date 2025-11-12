const express = require('express');
const morgan = require('morgan');
//const { sequelize } = require('./models');
const { User, sequelize } = require('./models');
const { Op } = require('sequelize');



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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우터 등록
app.use('/users', require('./routes/user'));
app.use('/comments', require('./routes/comments'));

// 문제점:
// - require('./models')에서 대소문자를 구분해야 하는데 'User'와 'user' 혼용되어 있음.
// - user.findAll 등에서 소문자 user는 정의되어 있지 않음.
// - User.findAll에서 name 조건에 [Op.gt]: 30은 문자열 기준으로 비교해서 의도와 다를 수 있음(숫자 비교 시에는 age를 써야 함).
// - Op와 User require가 중복되고, 코드가 섞여있음.
// - await 또는 then이 없어서 비동기 처리가 안 됨(하지만 여기선 단순 예시니까 생략).



// 예시 데이터 삽입
User.create({
    name: 'zero',
    age: 24,
    married: false,
    comment: '자기소개1',
});

// 전체 조회
User.findAll({});

// name과 married 컬럼만 조회
User.findAll({
    attributes: ['name', 'married'],
});

// 결혼했으면서 나이가 30 이상인 사용자만 조회 (조건 수정, 변수명 일치)
User.findAll({
    attributes: ['name', 'married'],
    where: {
        married: true,
        age: {
            [Op.gt]: 30,
        },
    },
});

/*const{Op} = require('sequelize');
const{user} = require('./models');
user.findAll({
    attributes: ['name', 'id'],
    where: {
      [Op.or]: [{married:0},{age:{[Op.gt]:30}}],
    },
});*/


app.listen(app.get('port'),()=>{
    console.log(app.get('port'), '번 포트에 연결되었습니다')
});

