'use strict';
/*globals describe,it*/

var assert = require( 'chai' ).assert;
var Detector = require( '../src/Detector' );
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
app.get( '/getReqObj/song.html', function ( req, res ) {
    res.json( JSON.parse ( toString( req )));
});
app.get( '/getReqObj/song.html.mp3', function ( req, res) {
    res.json( JSON.parse ( toString( req )));
});
app.get( '/getReqObj.mp3', function ( req, res) {
    res.json( JSON.parse ( toString( req )));
});

describe( 'Detector', function () {

    describe( '#detect()', function () {

        it( 'normal browser request should not be intercepted', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {
                
                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                assert.notOk( detector.detect(), 'should have returned false since its a normal browser request' );

                done();

            });

        });

        it( 'bot request should be intercepted', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'AdsBot-Google ( http://www.google.com/adsbot.html)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                assert.ok( detector.detect(), 'should have returned true since its a search bot request' );

                done();

            });

        });

        it( 'SnapSearch bot request should not be intercepted', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'SnapSearch' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                assert.notOk( detector.detect(), 'should have returned false since its a SnapSearch bot request' );

                done();

            });

        });

        it( 'POST request should not be intercepted', function ( done ) {

            request( app )
            .post( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'AdsBot-Google ( http://www.google.com/adsbot.html)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                assert.notOk( detector.detect(), 'should have returned false since its a POST request' );

                done();

            });

        });

        it( 'Ignored User Agent request should not be intercepted', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'Googlebot-Video/1.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector( [ '^\/getReqObj' ]);
                detector.setRequest( request );

                assert.notOk( detector.detect(), 'should have returned false since its a ignored User Agent request' );

                done();

            });

        });

        it( 'Non Matching User Agent request should not be intercepted', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'msnbot/1.1 ( http://search.msn.com/msnbot.htm)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector( null, [ '^\/non_matched_route' ]);
                detector.setRequest( request );

                assert.notOk( detector.detect(), 'should have returned false since its a Non Matching User Agent request' );

                done();

            });

        });

        it( 'Matching User Agent request should be intercepted', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'msnbot/1.1 ( http://search.msn.com/msnbot.htm)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector( null, [ '^\/getReqObj' ]);
                detector.setRequest( request );

                assert.ok( detector.detect(), 'should have returned true since its a Matching User Agent request' );

                done();

            });

        });

        it( 'Valid file extensions should be intercepted if other factors allow it', function (done) {

            request( app )
            .get( '/getReqObj/song.html?key=value' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'AdsBot-Google ( http://www.google.com/adsbot.html)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector(null, null, true);
                detector.setRequest( request );

                assert.ok( detector.detect(), 'should have returned true since it has a valid html file extension' );

                done();

            });

        });

        it( 'Invalid file extensions should not be intercepted', function (done) {

            request( app )
            .get( '/getReqObj/song.html.mp3?key=value' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'AdsBot-Google ( http://www.google.com/adsbot.html)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector(null, null, true);
                detector.setRequest( request );

                assert.notOk( detector.detect(), 'should have returned false since it has a invalid mp3 file extension' );

                done();

            });

        });

        it( 'Requests with _escaped_fragment_ parameter should be intercepted', function ( done ) {

            //this should be working with an empty _escaped_fragment_
            request( app )
            .get( '/getReqObj?key1=value1&_escaped_fragment_=' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                assert.ok( detector.detect(), 'should have returned true since its a request with _escaped_fragment_ parameter' );

                done();

            });

        });

    });

    describe( '#getEncodedUrl()', function () {

        it( '_escape_fragment_ parameter should be properly encoded', function ( done ) {

            var a = request( app );

            a.get( '/getReqObj?key1=value1&_escaped_fragment_=%2Fhashpath%3Fkey2=value2' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'Mozilla/5.0 (Windows NT 6.2; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                // hack to change the custom ip and port since we use a mock server to generate the request object
                var url = detector.getEncodedUrl();
                var end = url.split( ':' )[ 2 ].split( '/' );
                end.splice( 0, 1 );
                url = url.split( '://' )[ 0 ] + '://localhost/' + end.join( '/' );

                assert.equal( url, 'http://localhost/getReqObj?key1=value1#!/hashpath?key2=value2', 'should have encoded _escaped_fragment_ parameter properly' );

                done();

            });

        });

    });

    describe( '#robots', function () {

        it( 'robots array should be modifiable', function ( done ) {

            request( app )
            .get( '/getReqObj' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'Adsbot-Google' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector();
                detector.setRequest( request );

                detector.robots.ignore.push('Adsbot-Google');

                assert.notOk( detector.detect(), 'should have returned false since UserAgent is in ignore list' );

                done();

            });

        });

    });
    
    describe( '#extensions', function () {

        it( 'extensions array should be modifiable', function ( done ) {

            request( app )
            .get( '/getReqObj.mp3' )
            .set( 'Accept', 'application/json' )
            .set( 'User-Agent', 'AdsBot-Google ( http://www.google.com/adsbot.html)' )
            .expect( 200 )
            .end(function ( err, res ) {

                if ( err ) return done( err );

                var request = res.body;

                var detector = new Detector(null, null, true);
                detector.setRequest( request );

                detector.extensions['js'] = [];
                detector.extensions['js'].push('mp3');

                assert.ok( detector.detect(), 'should have returned true since mp3 was added as a valid extension, and the user agent is a robot' );

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