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

    it('should accept a custom exception callback that can catch any errors in the middelware', function (done) {

        interceptor.intercept = function () {
            throw new Error('haha');
        };

        app.use(SnapSearch.connect(interceptor, null, function (error, request) {
            assert.equal(error.message, 'haha');
            assert.instanceOf(request, http.IncomingMessage);
        }));

        request(app)
            .get('/getReqObj')
            .set('User-Agent', 'Adsbot-Google')
            .end(function (error, response) {
                if (error) return done(error);
                done();
            });

    });

});