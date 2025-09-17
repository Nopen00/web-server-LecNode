const fs = require('fs').promises;

fs.readFile('./readme.txt')
    .then((data)=>{
        console.log(data);
        console.lof(data.toString());
    })
    .catch((err)=>{
        console.error(err);
    });