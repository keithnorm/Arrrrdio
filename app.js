//  token: rx2nazb78x6eerun62wnzwjp
//  secret: AxJKpzMyAshH
//  access_token: rkwa3zkamu9h9mfep7uk6mem87mmd2bxzjxhr9xdskh9p7hchm8ad8feddhmch9j
//  access_secret: PPjCSNFSkKru
var express = require('express');
var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});


