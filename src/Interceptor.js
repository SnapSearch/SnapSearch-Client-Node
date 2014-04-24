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
 * Before intercept callback.
 *
 * This is intended for client side caching. It can be used for requesting a client cached resource.
 * However it can also be used for other purposes such as logging.
 * The callable should accept a string parameter which will be the current URL that is being requested.
 * If the callable returns an object, the object will be used as the data variable to Interceptor.intercept callback.
 * 
 * @param  function beforeCallback Anonymous function to be executed before interception
 * 
 * @return Interceptor this
 */
Interceptor.prototype.beforeIntercept = function ( beforeCallback ) {
    if ( typeof beforeCallback === 'function' ) {
        this.before = beforeCallback;
    }
    return this;
};

/**
 * After intercept callback.
 *
 * This is intended for client side caching or as an alternative way to respond to interception when integrated into middleware stacks.
 * However it can also be used for other purposes such as logging.
 * The callable should accept a string parameter and array parameter which will be respectively the current url being requested, and the snapshot response. 
 * 
 * @param  function afterCallback Anonymous function to be executed after interception
 * 
 * @return Interceptor this
 */
Interceptor.prototype.afterIntercept = function ( afterCallback ) {
    if ( typeof afterCallback === 'function' ) {
        this.after = afterCallback;
    }
    return this;
};

/**
 * Intercept begins the detection and returns the snapshot if the request was scraped.
 *
 * @param object   request  Request object
 * @param function callback Function accepting a single data object that runs once SnapSearch responds
 */
Interceptor.prototype.intercept = function ( request, callback ) {

    // set current request for processing in detector
    this.detector.setRequest( request );

    if ( this.detector.detect() ) {

        var rawCurrentUrl = this.detector.getEncodedUrl();

        var self = this;

        //wrap the callback with the after first (this allows the after to run last)
        if ( this.after ) {
            callback = function ( originalCallback ) {
                return function ( data ) {
                    originalCallback( data );
                    self.after( rawCurrentUrl, data );
                };
            }(callback);
        }

        //wrap the callback with the before second (this allows the before to run first)
        if ( this.before ) {
            callback = function ( originalCallback ) {
                return function ( data ) {
                    var result = self.before( rawCurrentUrl );
                    if ( Object.prototype.toString.call( result ) === '[object Object]' ) {
                        originalCallback( result );
                    } else {
                        originalCallback( data );
                    }
                };
            }(callback);
        }

        //send the callback to be called when the request has finished
        this.client.request( rawCurrentUrl, callback );

    } else {

        callback( false );
    
    }

};