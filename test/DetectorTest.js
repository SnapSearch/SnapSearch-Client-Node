'use strict';
/*globals describe,it*/

var assert = require('chai').assert;
var Detector = require('../src/Detector');
var request = require('supertest');
var express = require('express');


// Mock Server so we can create real NodeJS request objects for testing (helps version testing over different NodeJS versions)
var app = express();
app.get('/getReqObj', function(req,res){
  res.json(JSON.parse(toString(req)));
});
app.post('/getReqObj', function(req,res){
  res.json(JSON.parse(toString(req)));
});


describe('Detector', function(){
  describe('#detect()', function(){



    it('normal browser request should not be intercepted', function(done){

     request(app)
      .get('/getReqObj')
      .set('Accept', 'application/json')
      .set('user-Agent','Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector();
        detector.setRequest(request);

        assert.notOk(detector.detect(), 'should have returned false since its a normal browser request');

        done();
      });
    });



    it('bot request should be intercepted', function(done){

      request(app)
      .get('/getReqObj')
      .set('Accept', 'application/json')
      .set('User-Agent','AdsBot-Google ( http://www.google.com/adsbot.html)')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector();
        detector.setRequest(request);

        assert.ok(detector.detect(), 'should have returned true since its a search bot request');

        done();
      });

    });



    it('SnapSearch bot request should not be intercepted', function(done){

      request(app)
      .get('/getReqObj')
      .set('Accept', 'application/json')
      .set('user-Agent','SnapSearch')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector();
        detector.setRequest(request);

        assert.notOk(detector.detect(), 'should have returned false since its a SnapSearch bot request');

        done();
      });

    });



    it('POST request should not be intercepted', function(done){

      request(app)
      .post('/getReqObj')
      .set('Accept', 'application/json')
      .set('user-Agent','AdsBot-Google ( http://www.google.com/adsbot.html)')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector();
        detector.setRequest(request);

        assert.notOk(detector.detect(), 'should have returned false since its a POST request');

        done();
      });

    });



    it('Ignored User Agent request should not be intercepted', function(done){

      request(app)
      .get('/getReqObj')
      .set('Accept', 'application/json')
      .set('user-Agent','Googlebot-Video/1.0')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector(false,['^\/getReqObj']);
        detector.setRequest(request);

        assert.notOk(detector.detect(), 'should have returned false since its a ignored User Agent request');

        done();
      });

    });



    it('Non Matching User Agent request should not be intercepted', function(done){

      request(app)
      .get('/getReqObj')
      .set('Accept', 'application/json')
      .set('user-Agent','msnbot/1.1 ( http://search.msn.com/msnbot.htm)')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector(false,null, ['^\/non_matched_route']);
        detector.setRequest(request);

        assert.notOk(detector.detect(), 'should have returned false since its a Non Matching User Agent request');

        done();
      });

    });



    it('Matching User Agent request should  be intercepted', function(done){

      request(app)
      .get('/getReqObj')
      .set('Accept', 'application/json')
      .set('user-Agent','msnbot/1.1 ( http://search.msn.com/msnbot.htm)')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector(false,null, ['^\/getReqObj']);
        detector.setRequest(request);

        assert.ok(detector.detect(), 'should have returned true since its a Matching User Agent request');

        done();
      });

    });



    it('Requests with _escape_fragment_ paramter should be intercepted', function(done){

      request(app)
      .get('/getReqObj?blah=yay&_escaped_fragment_=key1%3Dlol')
      .set('Accept', 'application/json')
      .set('user-Agent','AdsBot-Google ( http://www.google.com/adsbot.html)')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector();
         detector.setRequest(request);

        assert.ok(detector.detect(), 'should have returned true since its a request with _escape_fragment_ paramter');

        done();
      });

    });

  });



  describe('#getEncodedUrl()', function(){
    it('_escape_fragment_ parameter should be propely encoded', function(done){

      var a = request(app);
      a.get('/getReqObj?blah=yay&_escaped_fragment_=key1%3Dlol')
      .set('Accept', 'application/json')
      .set('user-Agent','Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);

        var request =res.body;

        var detector = new Detector();
        detector.setRequest(request);

        // hack to change the custom ip and port since we use a mock server to generate the request object
        var url = detector.getEncodedUrl();
        var end = url.split(':')[2].split('/');
        end.splice(0,1);
        url = url.split('://')[0] + '://localhost/' + end.join('/');

        assert.equal(url,'http://localhost/getReqObj?blah=yay#!key1=lol', 'should have encoded _escape_fragment_ paramter properly');

        done();
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
function toString(obj){
  var cache = [];

  function serializer(key, value){
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