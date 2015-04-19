'use strict';
/*globals describe,it*/

var SnapSearch = require('../');
var assert = require('chai').assert;

var client;

describe( 'Client', function () {

    it('should accept a custom exception callback that can catch connection establishment errors', function (done) {

        client = new SnapSearch.Client(null, null, {}, function (error, debugging) {
            assert.equal(error.getMessage(), 'Could not establish a connection to SnapSearch.');
            assert.equal(error.getErrors(), 'aahh this is an error!');
            assert.instanceOf(error, SnapSearch.SnapSearchException);
        });

        client.api = function (options, handler) {
            handler('aahh this is an error!');
        };

        client.request('test.url', function (data) {
            assert.isFalse(data, 'data returned to response callback should be false during an exception');
            done();
        });

        

    });

    it('should accept a custom exception callback that can catch validation errors', function (done) {

        client = new SnapSearch.Client(null, null, {}, function (error, debugging) {
            assert.equal(error.getMessage(), 'Validation error from SnapSearch. Check your request parameters.');
            assert.equal(error.getErrors(), 'some validation object from the API');
            assert.instanceOf(error, SnapSearch.SnapSearchException);
        });

        client.api = function (options, handler) {
            handler(null, null, { code: 'validation_error', content: 'some validation object from the API' });
        };

        client.request('test.url', function (data) {
            assert.isFalse(data, 'data returned to response callback should be false during an exception');
            done();
        });

    });

    it('should accept a custom exception callback that can catch system errors', function (done) {

        client = new SnapSearch.Client(null, null, {}, function (error, debugging) {
            assert.equal(error.getMessage(), 'System error from SnapSearch. Check your request parameters for localhost URLs, otherwise this is a temporary problem from the API.');
            assert.equal(error.getErrors(), 'some response object from the API');
            assert.instanceOf(error, SnapSearch.SnapSearchException);
        });

        client.api = function (options, handler) {
            handler(null, null, { code: 'system_error', content: 'some response object from the API' });
        };

        client.request('test.url', function (data) {
            assert.isFalse(data, 'data returned to response callback should be false during an exception');
            done();
        });

    });

    it('should accept a custom exception callback that can catch unknown error codes', function (done) {

        client = new SnapSearch.Client(null, null, {}, function (error, debugging) {
            assert.equal(error.getMessage(), 'Unknown API code from SnapSearch.');
            assert.equal(error.getErrors(), 'some unknown object from the API');
            assert.instanceOf(error, SnapSearch.SnapSearchException);
        });

        client.api = function (options, handler) {
            handler(null, null, { code: 'unknown_error', content: 'some unknown object from the API' });
        };

        client.request('test.url', function (data) {
            assert.isFalse(data, 'data returned to response callback should be false during an exception');
            done();
        });

    });

    it('should accept a custom exception callback that also receives a debugging object', function (done) {

        client = new SnapSearch.Client(null, null, {}, function (error, debugging) {
            assert.isObject(debugging, 'debugging parameter is a object');
            assert.property(debugging, 'apiUrl');
            assert.property(debugging, 'apiKey');
            assert.property(debugging, 'apiEmail');
            assert.property(debugging, 'requestParameters');
        });

        client.api = function (options, handler) {
            handler(true);
        };

        client.request('test.url', function (data) {
            assert.isFalse(data, 'data returned to response callback should be false during an exception');
            done();
        });

    });

});