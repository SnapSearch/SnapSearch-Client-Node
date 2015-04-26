var express = require('express');
var snapsearch = require('snapsearch-client-nodejs');

var app = express();

app.use(snapsearch.connect(
    new snapsearch.Interceptor(
        new snapsearch.Client('EMAIL', 'KEY', {}, function (error, debugging) {
                //custom exception handler for Client errors such as HTTP errors or validation errors from the API
                console.log(error);
                console.log(debugging);
        }),
        new snapsearch.Detector()
    ),
    function (data) {

        // this function is optional, and you can remove it
        // by default SnapSearch does not pass through all the headers from the snapshot

        // unless you know what you're doing, the location header is most likely sufficient
        // if you are setting up gzip compression, see the heroku example https://github.com/SnapSearch/SnapSearch-Client-Node-Heroku-Demo
        var newHeaders = [];
        data.headers.forEach(function (header) {
            if (header.name.toLowerCase() === 'location') {
                newHeaders.push({name: header.name, value: header.value});
            }
        });

        return {
            status: data.status,
            headers: newHeaders,
            html: data.html
        };

    }
));

app.get('/', function (req, res) {
    res.send('Was not a robot and we are here inside app');
});

app.listen(1337);

console.log('Server running at http://127.0.0.1:1337/');