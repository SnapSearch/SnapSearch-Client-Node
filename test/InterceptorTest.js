'use strict';
/*globals describe*/

var SnapSearch = require('../');
var assert = require('chai').assert;
var request = require('supertest');
var express = require('express');

// Mock Server so we can create real NodeJS request objects for testing (helps version testing over different NodeJS versions)
var app = express();
app.get('/getReqObj', function (req, res) {
    res.json(JSON.parse(toString(req)));
});
app.post('/getReqObj', function (req, res) {
    res.json(JSON.parse(toString(req)));
});

var client = new SnapSearch.Client('demo@polycademy.com', 'a2XEBCF6H5Tm9aYiwYRtdz7EirJDKbKHXl7LzA21boJVkxXD3E');
var detector = new SnapSearch.Detector();
var interceptor = new SnapSearch.Interceptor(client, detector);

describe('Interceptor', function () {
    describe('#intercept()', function () {

        it('should intercept traffic and return response array from SnapSearch Service', function (done) {

            this.timeout(10000);
            request(app)
                .get('/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2')
                .set('Accept', 'application/json')
                .set('user-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0')
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);

                    detector.getEncodedUrl = function () {
                        return 'http://blah.com';
                    }

                    interceptor.intercept(res.body, function (data) {
                        assert.instanceOf(data, Object, 'should have returned reponse content array');
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
function toString(obj) {

    var cache = [];

    function serializer(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            if (cache.indexOf(value) == -1) {
                cache.push(value);
            }
        }
        return value;
    }

    var string = JSON.stringify(obj, serializer);

    cache = null; // Enable garbage collection
    return string;

}