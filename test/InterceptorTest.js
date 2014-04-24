'use strict';
/*globals describe,it,beforeEach*/

var SnapSearch = require( '../' );
var assert = require( 'chai' ).assert;
var request = require( 'supertest' );
var express = require( 'express' );

// Mock Server so we can create real NodeJS request objects for testing (helps version testing over different NodeJS versions)
var app = express();
app.get( '/getReqObj', function ( req, res ) {
    res.json( JSON.parse( toString( req )));
});
app.post( '/getReqObj', function ( req, res ) {
    res.json( JSON.parse( toString( req )));
});

var client, detector, interceptor;

describe( 'Interceptor', function () {

    describe( '#intercept()', function () {

        //setup new clients, detector and interceptors on each test
        beforeEach(function () {
            client = new SnapSearch.Client();
            detector = new SnapSearch.Detector();
            interceptor = new SnapSearch.Interceptor( client, detector );
        });

        it( 'should accept a before intercept callback that receives the current url', function (done) {

            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var url = 'http://blah.com';

                detector.getEncodedUrl = function () {
                    return url;
                };

                interceptor.beforeIntercept(function (currentUrl) {
                    assert.equal(currentUrl, url, 'should receive the same url as the current url');
                });

                client.request = function ( url, callback ) {

                    var response = {
                        status : 200,
                        headers : {
                            Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                        },
                        html : '<html>Hi!</html>',
                        screenshot : '',
                        date : '324836',
                        cache: false
                    };

                    callback(response);

                };

                interceptor.intercept( res.body, function ( data ) {
                    done();
                });

            });

        });

        it( 'should accept a before intercept callback that can return an object which will be the final response data', function (done) {

            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var url = 'http://blah.com';

                detector.getEncodedUrl = function () {
                    return url;
                };

                var response = {
                    status : 201,
                    headers : {
                        Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                    },
                    html : '<html>Hi!</html>',
                    screenshot : '',
                    date : '324836',
                    cache: false
                };

                interceptor.beforeIntercept(function (currentUrl) {
                    return response;
                });

                client.request = function ( url, callback ) {
                    callback();
                };

                interceptor.intercept( res.body, function ( data ) {
                    assert.deepEqual( data, response, 'should have returned object equal to the returned object from before intercept callback' )
                    done();
                });

            });

        });

        it( 'should ignore any returned data from the before intercept callback if it returned something other than an object', function (done) {

            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var url = 'http://blah.com';

                detector.getEncodedUrl = function () {
                    return url;
                };

                interceptor.beforeIntercept(function (currentUrl) {
                    return ['blah'];
                });

                var response = {
                    status : 304,
                    headers : {
                        Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                    },
                    html : '<html>Hi!</html>',
                    screenshot : '',
                    date : '324836',
                    cache: false
                };

                client.request = function ( url, callback ) {
                    callback(response);
                };

                interceptor.intercept( res.body, function ( data ) {
                    assert.deepEqual( data, response, 'should have returned object equal to the returned object from client.request' );
                    done();
                });

            });

        });

        it( 'should accept a after intercept callback that receives the current url and client response object', function (done) {

            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var url = 'http://blah.com';

                var response = {
                    status : 404,
                    headers : {
                        Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                    },
                    html : '<html>Hi!</html>',
                    screenshot : '',
                    date : '324836',
                    cache: false
                };

                detector.getEncodedUrl = function () {
                    return url;
                };

                client.request = function ( url, callback ) {
                    callback(response);
                };

                interceptor.afterIntercept( function ( currentUrl, data ) {
                    assert.equal(currentUrl, url, 'should receive the same url as the current url');
                    assert.deepEqual( data, response, 'should have returned object equal to the returned object from client.request' );
                    done();
                } );

                interceptor.intercept( res.body, function ( data ) {});

            });

        });

        it( 'should accept chainable before and after intercept callbacks', function (done) {

            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var url = 'http://blah.com';

                var response = {
                    status : 100,
                    headers : {
                        Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                    },
                    html : '<html>Hi!</html>',
                    screenshot : '',
                    date : '324836',
                    cache: false
                };

                detector.getEncodedUrl = function () {
                    return url;
                };

                client.request = function ( url, callback ) {
                    callback({
                        status : 404,
                        headers : {
                            Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                        },
                        html : '<html>Hi!</html>',
                        screenshot : '',
                        date : '324836',
                        cache: false
                    });
                };

                interceptor.beforeIntercept(function (currentUrl) {
                    assert.equal(currentUrl, url, 'should receive the same url as the current url');
                    return response;
                }).afterIntercept(function (currentUrl, data) {
                    assert.equal(currentUrl, url, 'should receive the same url as the current url');
                    assert.deepEqual( data, response, 'should have returned object equal to the returned object from client.request' );
                    done();
                });

                interceptor.intercept( res.body, function ( data ) {});

            });

        });

        it( 'should intercept traffic and return response array from SnapSearch Service', function ( done ) {

            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                detector.getEncodedUrl = function () {
                    return 'http://blah.com';
                };

                client.request = function ( url, callback ) {
                    var response = {
                        status : 200,
                        headers : {
                            Date : 'Tue, 19 Nov 2013 18:23:41 GMT'
                        },
                        html : '<html>Hi!</html>',
                        screenshot : '',
                        date : '324836',
                        cache: false
                    };

                    callback(response);
                };

                interceptor.intercept( res.body, function ( data ) {
                    assert.instanceOf( data, Object, 'should have returned response content array' );
                    done();
                });

            });

        });

    });

});

/**
 * Helper to serialize the circular request object.
 *
 * @param  object obj   Javascript object to be serialised
 *
 * @return string       Serialised JSON String
 */
function toString( obj ) {

    var cache = [];

    function serializer( key, value ) {
        if ( typeof value === 'object' && value !== null ) {
            if ( cache.indexOf( value ) !== -1 ) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            if ( cache.indexOf( value ) == -1 ) {
                cache.push( value );
            }
        }
        return value;
    }

    var string = JSON.stringify( obj, serializer );

    cache = null; // Enable garbage collection
    return string;

}