const express = require('express');
const app = express();

app.listen(5000, function(){
    console.log("Start 5000 Server!");
});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});