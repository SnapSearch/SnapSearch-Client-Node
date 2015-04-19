var http = require('http');
var snapsearch = require('snapsearch-client-nodejs');

var client = new snapsearch.Client('EMAIL', 'KEY', {}, function (error, debugging) {
    //custom exception handler for Client errors such as HTTP errors or validation errors from the API
    console.log(error);
    console.log(debugging);
});
var detector = new snapsearch.Detector();
var interceptor = new snapsearch.Interceptor(client, detector);

// robots object can be manipulated in code
// detector.robots.ignore.push('Adsbot-Google');

http.createServer(function (req, res) {
    
    try {

        // call interceptor
        interceptor.intercept(req, function (data) {
            // if we get data back it was a bot and we have a snapshot back from SnapSearch
            if (data) {

                if (data.headers) {
                    data.headers.forEach(function (header) {
                        if (header.name.toLowerCase() === 'location') {
                            res.setHeader('Location', header.value);
                        }
                    });
                }

                res.statusCode = data.status;

                res.end(data.html);

            } else {

                // Request is not intercepted, proceed with the rest of the application...

            }
        });

    } catch (err) {}

}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');