'use strict';

/**
 * Connect Interceptor. 
 * This integrates the SnapSearch Client as a declarative connect middleware.
 * You can use it like this:
 *
 * var snapsearch = require('snapsearch-client-nodejs');
 * app.use(snapsearch.connect(
 *     new snapsearch.Interceptor(
 *         new snapsearch.Client(EMAIL, KEY),
 *         new snapsearch.Detector()
 *     ),
 *     function (data) {
 *         //custom response callback
 *         //return {status: 200, html: '', headers: [{name: '', value: ''}]}
 *     },
 *     function (error, request) {
 *         //custom exception handler
 *     }
 * ));
 * 
 * @param object   interceptor       Interceptor object
 * @param function responseCallback  Optional custom response callback accepting data parameter.
 *                                   It can return an object {status:200, html:'', headers:[{name:'', value: ''}]} 
 *                                   which will be sent as the HTTP response.
 * @param function exceptionCallback Optional custom exception callback accepting error and request parameters.
 *
 * @return function Connect middleware function accepting request, response and next
 */
module.exports = function (interceptor, responseCallback, exceptionCallback) {

    return function (request, response, next) {

        try {

            interceptor.intercept(request, function (data) {

                if (data) {

                    if (responseCallback) {

                        data = responseCallback(data);

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

            if (exceptionCallback) {
                exceptionCallback(error, request);
            }

            next();

        }

    };

};