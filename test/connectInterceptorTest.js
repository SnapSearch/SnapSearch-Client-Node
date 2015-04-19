'use strict';
/*globals describe,it,beforeEach*/

var SnapSearch = require('../');
var assert = require('chai').assert;
var request = require('supertest');
var express = require('express');
var http = require('http');

var client, detector, interceptor, response, app;

describe('connectInterceptor', function () {

    beforeEach(function () {

        client = new SnapSearch.Client();
        detector = new SnapSearch.Detector();
        interceptor = new SnapSearch.Interceptor(client, detector);

        response = {
            status: 203,
            headers: [
                {
                    name: 'Location',
                    value: 'http://blah.com/'
                }
            ],
            html: '<html>Wassup?</html>',
            screenshot: '',
            date: '324836',
            cache: false
        };

        client.request = function (url, callback) {
            callback(response);
        };

        app = express();

    });

    it('should return html snapshot, status and location header', function (done) {

        app.use(SnapSearch.connect(interceptor));

        request(app)
            .get('/getReqObj')
            .set('User-Agent', 'Adsbot-Google')
            .expect('Location', 'http://blah.com/')
            .expect(203, '<html>Wassup?</html>')
            .end(function (error, response) {
                if (error) return done(error);
                done();
            });

    });

    it('should accept a custom response callback that can modify the final response', function (done) {

        app.use(SnapSearch.connect(interceptor, function (data) {
            assert.deepEqual(data, response, 'response callback data should equal the response returned from the client.request');
            return {
                status: 202,
                html: '<html>a new message</html>',
                headers: [
                    {
                        name: 'Date',
                        value: 'Example Date'
                    },
                    {
                        name: 'Another Header',
                        value: 'Another Header Value'
                    }
                ]
            };
        }));

        request(app)
            .get('/getReqObj')
            .set('User-Agent', 'Adsbot-Google')
            .expect('Date', 'Example Date')
            .expect('Another Header', 'Another Header Value')
            .expect(202, '<html>a new message</html>')
            .end(function (error, response) {
                if (error) return done(error);
                done();
            });

    });

    it('should accept a custom exception callback that can catch connection establishment errors', function (done) {

        client = new SnapSearch.Client(null, null, {}, function (error, debugging) {
            assert.equal(error.getMessage(), 'Could not establish a connection to SnapSearch.');
            assert.equal(error.getErrors(), 'aahh this is an error!');
            assert.instanceOf(error, SnapSearch.SnapSearchException);
        });

        client.api = function (options, handler) {
            handler('aahh this is an error!');
        };

        interceptor = new SnapSearch.Interceptor(client, detector);

        app.use(SnapSearch.connect(interceptor));

        request(app)
            .get('/getReqObj')
            .set('User-Agent', 'Adsbot-Google')
            .end(function (error, response) {
                if (error) return done(error);
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

        interceptor = new SnapSearch.Interceptor(client, detector);

        app.use(SnapSearch.connect(interceptor));

        request(app)
            .get('/getReqObj')
            .set('User-Agent', 'Adsbot-Google')
            .end(function (error, response) {
                if (error) return done(error);
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

        interceptor = new SnapSearch.Interceptor(client, detector);

        app.use(SnapSearch.connect(interceptor));

        request(app)
            .get('/getReqObj')
            .set('User-Agent', 'Adsbot-Google')
            .end(function (error, response) {
                if (error) return done(error);
                done();
            });

    });

});