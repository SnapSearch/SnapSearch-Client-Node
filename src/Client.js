'use strict';

var Api = require( 'request' );
var SnapSearchException = require( './SnapSearchException' );

/**
 * Client contacts SnapSearch and retrieves the snapshot
 */
module.exports = Client;

/**
 * Constructor
 *
 * @param string   apiEmail          Email used for HTTP Basic
 * @param string   apiKey            Key used for HTTP Basic
 * @param object   requestParameters Parameters passed to SnapSearch API
 * @param function exceptionCallback Custom exception callback accepting a SnapSearchException and a 
 *                                   debugging object: {apiUrl, apiEmail, apiKey, requestParameters}
 * @param boolean  apiUrl            Custom API Url
 * @param Request  api               HTTP Request Library extending Httpful\Request
 */
function Client(
    apiEmail,
    apiKey,
    requestParameters,
    exceptionCallback, 
    apiUrl,
    api
) {

    this.apiEmail = apiEmail;
    this.apiKey = apiKey;
    this.requestParameters = ( requestParameters ) ? requestParameters : {};
    this.exceptionCallback = ( typeof exceptionCallback == "function" ) ? exceptionCallback : null;
    this.apiUrl = ( apiUrl ) ? apiUrl : 'https://snapsearch.io/api/v1/robot';
    this.api = ( api ) ? api : Api;
}

/**
 * Sends a request to SnapSearch using the current url.
 *
 * @param  string        currentUrl Current URL that the Robot is going to be accessing
 *
 * @return array|boolean Response array from SnapSearch or boolean false if there was an system error
 *
 * @throws SnapSearchException If connection error
 * @throws SnapsearchException If validation error
 */
Client.prototype.request = function ( currentUrl, callback ) {

    //the current url must contain the entire url with the _escaped_fragment_ parsed out
    this.requestParameters.url = currentUrl;

    var that = this;
    this.api(
        {
            method: 'POST',
            url: this.apiUrl,
            auth: {
                user: this.apiEmail,
                pass: this.apiKey
            },
            timeout: 30000,
            json: this.requestParameters,
            strictSSL: true
        },
        function ( error, response, body ) {

            if ( that.exceptionCallback ) {
                
                try {

                    handleResponse();

                } catch (e) {
                    
                    that.exceptionCallback( e, {
                        apiUrl:            that.apiUrl,
                        apiEmail:          that.apiEmail,
                        apiKey:            that.apiKey,
                        requestParameters: that.requestParameters
                    } );

                    callback( false ); // pass on to the next middleware
                    return;
                
                }

            } else {

                handleResponse();
            
            }

            function handleResponse () {

                // we always have a response from SnapSearch Service if the request doesn't end up in an error
                if ( !error ) {

                    if ( body.code == 'success' ) {

                        //will return status, headers (array of name => value), html, screenshot, date
                        callback( body.content );
                        return;

                    } else if ( body.code == 'validation_error' ) {

                        //means that something was incorrect from the request parameters or the url could not be accessed
                        throw new SnapSearchException( 'Validation error from SnapSearch. Check your request parameters.', body.content );

                    } else if ( body.code == 'system_error' ) {

                        throw new SnapSearchException( 'System error from SnapSearch. Check your request parameters for localhost URLs, otherwise this is a temporary problem from the API.', body.content );

                    } else {

                        throw new SnapSearchException( 'Unknown API code from SnapSearch.', body.content );

                    }

                } else {

                    throw new SnapSearchException( 'Could not establish a connection to SnapSearch.', error );

                }

            }

        }
    );

};