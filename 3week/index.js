const {odd, even} = require('./var');
const checkNumber = require('./func');

function checkStringOddOrEven(str){
    if(str.length %2){
        return odd;
    }
    return even;
};

const os = require('os');
const path = require('path');

console.log(checkNumber(10));
console.log(checkStringOddOrEven('hello'));
