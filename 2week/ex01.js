function first(){
    second();
    console.log("first");

}

function second(){
    thrid();
    console.log("second");

}

function thrid(){

    console.log("thrid");

}

function run(){
    console.log("3 초");
}

setTimeout(run,3000);

first();


const a =0;
//a = 1;
let b = 0;
b = 1;
//const c;

// var num1 = 1;
// var num1 = 2;
// var result = 3;
// var string1 = num1+' 더하기 '+ num2+'는 \''+ result + '\'';
// console.log(string1);


const num3 = 1;
const num4 = 2;
const result2 = 3;
const string2 = '${num3} 더하기 ${num4}는 ${result2}';
console.log(string2);


const relationship1 = {
    name: 'zero',
    friends: ['nerp','hero','xero' ],
    address: ['한누리관', '본관'],
    logFriedns: function(){
        const that = this;
        //this는 해당 탭라인에서만 적용 
        //아래처럼 내부로 들어가면 위 this와 다른 개별의 this가 생기는 것이다
        this.address.forEach(function(addressItem){
            that.friends.forEach(function(friend){
            
                console.log(addressItem, that.name, friend)
            })
        })

        /*
        //화살표 쓰면 this가 내부까지 내려옴

        this.address.forEach(addressItem=> {
            this.friends.forEach(friend=> {
            
                console.log(addressItem, that.name, friend)
            })
        })
        */
    }
}

relationship1.logFriedns();

