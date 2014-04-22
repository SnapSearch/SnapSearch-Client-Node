'use strict';

/*
app.use(require('snapsearch-client-nodejs').connect({
    email: '',
    key: '',
    parameters:{},
    apiUrl: '',
    api: require('requests'),
    ignoredRoutes: [],
    matchedRoutes: [],
    checkFileExtensions: true,
    trustedProxy: true,
    robotsJson: '',
    extensionsJson: '',
    beforeIntercept: function () {
    
    },
    afterIntercept: function () {
    
    },
    responseCallback: function () {
    
    },
    exceptionCallback: function () {
    
    }
}));
*/
module.exports = function (options) {

    var Client = require('./Client');
    var Detector = require('./Detector');
    var Interceptor = require('./Interceptor'); 

    var client = new Client (
        options.email,
        options.key,
        options.parameters,
        options.apiUrl,
        options.api
    );

    var detector = new Detector (
        options.ignoredRoutes,
        options.matchedRoutes,
        options.checkFileExtensions,
        options.trustedProxy,
        options.robotsJson,
        options.extensionsJson
    );

    var interceptor = new Interceptor (
        client,
        detector
    );

    interceptor.beforeIntercept(options.beforeIntercept);
    interceptor.afterIntercept(options.afterIntercept);

    return function (request, response, next) {

        try {

            interceptor.intercept(request, function (data) {

                if (data) {

                    if (options.responseCallback) {

                        data = options.responseCallback(data);

                        if (!data.status) {
                            data.status = 200;
                        }

                        if (!data.html) {
                            data.html = '';
                        }

                        if (data.headers) {
                            data.headers.forEach(function (header) {
                                response.set(header.name, header.value);
                            });
                        }

                        return response.send(data.status, data.html);

                    } else {

                        // to be safe we only set the location header by default
                        if (data.headers) {
                            data.headers.forEach(function (header) {
                                if (header.name.toLowerCase() === 'location') {
                                    response.location(header.value);
                                }
                            });
                        }

                        return response.send(data.status, data.html);

                    }

                } else {

                    next();

                }

            });

        } catch (error) {

            if (options.exceptionCallback) {
                options.exceptionCallback(error, request, response);
            }

            next();

        }

    };

};