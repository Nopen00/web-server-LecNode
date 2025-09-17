const {odd, even} = require('./var');

function checkOddOrEven(num){
    if(num%2){
        return odd;
    }
    return even;
}

//함수를 다른데서 쓰려면 모듈 이거를 써야한다
module.exports = checkOddOrEven; 