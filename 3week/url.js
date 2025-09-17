const url = require('url');

const { URL } = url;
const myURL = new URL('https://ecampus.smu.ac.kr/course/view.php?id=94188');
console.log('new URL():', myURL);
console.log('url.format():', url.format(myURL));
console.log('-----------------------------');
const parsedUrl = url.parse('https://ecampus.smu.ac.kr/course/view.php?id=94188');
console.log('url.parse():', parsedUrl);
console.log('url.format():', url.format(parsedUrl));
