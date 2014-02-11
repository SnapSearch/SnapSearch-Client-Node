var http = require('http');

var options = {
    host: 'localhost',
    path: '/',
    port: '1337',
    // Setting custom User Agent
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0'
    }
};

http.request(options, function (response) {

    var str = '';

    response.on('data', function (chunk) {
        str += chunk;
    });

    response.on('end', function () {
        console.log(str);
    });

}).end();