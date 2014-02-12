'use strict';

/**
 * Interceptor intercepts the request and checks with the Detector if the request is valid for interception and then calls the Client for scraping and finally returns the content of the snapshot.
 */
module.exports = Interceptor;

/** 
 * Constructor
 *
 * @param Client   client   Client object
 * @param Detector detector Detector object
 */
function Interceptor( client, detector ) {

    this.client = client;
    this.detector = detector;
    
}

/**
 * Intercept begins the detection and returns the snapshot if the request was scraped.
 *
 * @return array|boolean
 */
Interceptor.prototype.intercept = function ( request, callback ) {

    // set current request for processing in detector
    this.detector.setRequest( request );

    if ( this.detector.detect()) {
        var rawCurrentUrl = this.detector.getEncodedUrl();
        this.client.request( rawCurrentUrl, callback );
    } else {
        callback( false );
    }

};