var http = require('http');

var options = {
  host: 'localhost',
  path: '/',
  port: '1337',
  // Setting custom User Agent
  headers: {'User-Agent': 'AdsBot-Google ( http://www.google.com/adsbot.html)'}
};

http.request(options, function(response) {

  var str = '';

  response.on('data', function (chunk) {
    str += chunk;
  });

  response.on('end', function () {
    console.log(str);
  });
  
}).end();
