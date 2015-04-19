SnapSearch-Client-Node
======================

[![Build Status](https://travis-ci.org/SnapSearch/SnapSearch-Client-Node.png?branch=master)](https://travis-ci.org/SnapSearch/SnapSearch-Client-Node)

Snapsearch Client Node is Node.js based framework agnostic HTTP client library for SnapSearch (https://snapsearch.io/).

Snapsearch is a search engine optimisation (SEO) and robot proxy for complex front-end javascript & AJAX enabled (potentially realtime) HTML5 web applications.

Search engines like Google's crawler and dumb HTTP clients such as Facebook's image extraction robot cannot execute complex javascript applications. Complex javascript applications include websites that utilise AngularJS, EmberJS, KnockoutJS, Dojo, Backbone.js, Ext.js, jQuery, JavascriptMVC, Meteor, SailsJS, Derby, RequireJS and much more. Basically any website that utilises javascript in order to bring in content and resources asynchronously after the page has been loaded, or utilises javascript to manipulate the page's content while the user is viewing them such as animation.

Snapsearch intercepts any requests made by search engines or robots and sends its own javascript enabled robot to extract your page's content and creates a cached snapshot. This snapshot is then passed through your own web application back to the search engine, robot or browser.

Snapsearch's robot is an automated load balanced Firefox browser. This Firefox browser is kept up to date with the nightly versions, so we'll always be able to serve the latest in HTML5 technology. Our load balancer ensures your requests won't be hampered by other user's requests.

For more details on how this works and the benefits of usage see https://snapsearch.io/

SnapSearch provides similar libraries in other languages: https://github.com/SnapSearch/Snapsearch-Clients

Installation
------------

Install it from NPM.

```
npm install snapsearch-client-nodejs --save
```

Usage
-----

SnapSearch's NodeJS client is broken up into 3 basic classes, Client, Detector and Interceptor. All it needs is a request object extended from NodeJS's `http.IncomingMessage` prototype. This allows you to use it any NodeJS framework. However we have bundled a connect compatible middleware for ease of use. This middleware should be used at the entry/bootstrap point of your NodeJS application. There are more examples are in the examples folder.

For full documentation on the API and API request parameters see: https://snapsearch.io/documentation

### Basic Connect/Express Usage

```javascript
var express = require('express');
var snapsearch = require('snapsearch-client-nodejs');

var app = express();

//by default the it will only intercept and return a response with only status, header location, and html body
app.use(snapsearch.connect(
    new snapsearch.Interceptor(
        new snapsearch.Client('ENTER YOUR EMAIL', 'ENTER YOUR KEY', {}, function (error, debugging) {
                //mandatory custom exception handler for Client errors such as HTTP errors or validation errors from the API
                console.log(error); 
                // error is a SnapSearchException containing a message and errorDetails which can acquired from `getMessage()` `getErrors()`
                console.log(debugging); 
                // debugging is an object containing these: {apiUrl, apiKey, apiEmail, requestParameters}
                // if an exception happens, the middleware is a no-op and passes through to the next stage of your application
        }),
        new snapsearch.Detector()
    )
);

app.get('/', function (request, response) {
    response.send('Was not a robot and we are here inside app');
});

app.listen(1337);
```

Here's an example response coming back from SnapSearch's API (not all variables are available, you need to check your request parameters):

```javascript
{
    "code": "success",
    "content": {
        "cache"             => true/false,
        "callbackResult"    => "",
        "date"              => 1390382314,
        "headers"           => [
            {
                "name"  => "Content-Type",
                "value" => "text/html"
            }
        ],
        "html"              => "<html></html>",
        "message"           => "Success/Failed/Validation Errors",
        "pageErrors"        => [
            {
                "error"   => "Error: document.querySelector(...) is null",
                "trace"   => [
                    {
                        "file"      => "filename",
                        "function"  => "anonymous",
                        "line"      => "41",
                        "sourceURL" => "urltofile"
                    }
                ]
            }
        ],
        "screenshot"         => "BASE64 ENCODED IMAGE CONTENT",
        "status"            => 200
    }
}
```

### Advanced Connect/Express Usage

```javascript
var express = require('express');
var snapsearch = require('snapsearch-client-nodejs');

var app = express();

app.use(snapsearch.connect(
    new snapsearch.Interceptor(
        new snapsearch.Client('ENTER YOUR EMAIL', 'ENTER YOUR KEY', {}, function (error, debugging) {
                //mandatory custom exception handler for Client errors such as HTTP errors or validation errors from the API
                //exceptions will only be called in the event that SnapSearchClient could not contact the API or when there are validation errors
                //in production you'll just ignore these errors, but log them here, the middleware is a no-op and will just pass through, and will not halt your application
                console.log(error);
                console.log(debugging);
        }),
        new snapsearch.Detector()
    ),
    function (response) {
        
        //optional customised response callback
        //if intercepted, this allows you to specify what kind of status, headers and html body to return
        //remember headers is in the format of [ { name: '', value: '' },... ]

        return {
            status: response.status,
            headers: response.headers,
            html: response.html
        };

    }
);

app.get('/', function (request, response) {
    response.send('Was not a robot and we are here inside app');
});

app.listen(1337);
```

### Advanced Usage

The below shows how you can manipulate the properties and parameters of the client, detector and interceptor. The example shows them being applied on a simple HTTP server, however the principle is the same with Express/Connect integrations.

```javascript
var http = require('http');
var snapsearch = require('snapsearch-client-nodejs');

var apiRequestParameters = {
    //add your API request parameters if you have any...
};

var blackListedRoutes = [
    //add your black listed routes in regex if you have any...
];

var whiteListedRoutes = [
    //add your white listed routes in regex if you have any...
];

var checkFileExtensions = false; //if you wish for SnapSearch Client to check if the URL leads to a static file, switch this on to a boolean true, however this is expensive and time consuming, so it's better to use black listed or white listed routes

var trustedProxy = false; //if you are behind a reverse proxy, switch this to true so we can acquire the real protocol from X-Forwarded-Proto header

var pathToCustomRobotsJson = ''; //custom robots json path

var pathToCustomExtensionsJson = ''; //custom extensions json path

var client = new snapsearch.Client(
    'ENTER YOUR EMAIL', 
    'ENTER YOUR KEY',
    apiRequestParameters,
    function (error, debugging) {
        // mandatory
        console.log(error);
        console.log(debugging);
    }
);

var detector = new snapsearch.Detector(
    blackListedRoutes,
    whiteListedRoutes,
    checkFileExtensions,
    trustedProxy,
    pathToCustomRobotsJson,
    pathToCustomExtensionsJson
);

var interceptor = new snapsearch.Interceptor(client, detector);

//robots can be direct accessed and manipulated
detector.robots.ignore.push('Adsbot-Google');
detector.robots.match.push('SomeBotIWantToMatch');

//extensions can as well, add to 'generic' or 'js'
detector.extensions.generic.push('valid generic extension');
detector.extensions.js = ['valid js extension']; //there is currently no js extensions

//the beforeIntercept callback is called after the Detector has detected a search engine robot
//if this callback returns an object, the object will be used as the response to interceptor.intercept
//use it for client side caching in order to have millisecond responses to search engines
//the afterIntercept callback can be used to store the snapshot from SnapSearch as a client side cached resource
//this is of course optional as SnapSearch caches your snapshot as well!
clientCache = require('hypothetical-client-cache-object');
interceptor.beforeIntercept(function (url) {
    return clientCache.get(url);
}).afterIntercept(function (url, data) {
    clientCache.put(url, data);    
});

http.createServer(function (request, response) {
    try {
        // call interceptor
        interceptor.intercept(request, function (data) {
            // if we get data back it was a bot and we have a snapshot back from SnapSearch
            if (data) {
                if (data.headers) {
                    data.headers.forEach(function (header) {
                        if (header.name.toLowerCase() === 'location') {
                            response.setHeader('Location', header.value);
                        }
                    });
                }
                response.statusCode = data.status;
                response.end(data.html);
            } else {
                // Proceed with the rest of the application...
            }
        });
    } catch (error) {}
}).listen(1337, '127.0.0.1');
```

That's pretty much it. Check the source code for more, it's tiny and well documented.

Reverse Proxies
---------------

If you are behind a reverse proxy such as NGINX or Apache, certain HTTP information between the client and the proxy needs to be explicitly passed by the proxy to the backend, this includes the HTTP protocol and hostname. This information is usually passed in `X-Forwarded-Proto` & `X-Forwarded-Host` headers. Because these headers can be forged, by default we do not automatically trust these headers. But if you control the proxy, and you trust these headers, then you need to switch true the `trustedProxy` boolean flag in the `Detector` function constructor. You may call it like: 

```
var trustedProxy = true;

var detector = new snapsearch.Detector(
    [],
    [],
    false,
    trustedProxy
);
```

If you use Express, you may also need to enable `app.enable('trust proxy');`. See http://expressjs.com/guide/behind-proxies.html

Development
-----------

Install/update all dependencies:

```
npm install
```

Make your changes. Then use this to create a version in the package.json, ti also creates a new git tag.

```
npm version [<newversion> | major | minor | patch] -m "New release"
```

Synchronise and push the tag with:

```
git push
git push --tags
```

Push the version to NPM:

```
npm publish
```

Tests
----

Unit tests are written using Mocha and Chai. To run tests use `npm test`.

To run tests in Windows use `./node_modules/.bin/mocha --reporter spec`.