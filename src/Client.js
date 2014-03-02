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
 * @param string  apiEmail          Email used for HTTP Basic
 * @param string  apiKey            Key used for HTTP Basic
 * @param object  requestParameters Parameters passed to SnapSearch API
 * @param boolean apiUrl            Custom API Url
 * @param Request api               HTTP Request Library extending Httpful\Request
 */
function Client(
    apiEmail,
    apiKey,
    requestParameters,
    apiUrl,
    api
) {

    this.apiEmail = apiEmail;
    this.apiKey = apiKey;
    this.requestParameters = ( requestParameters ) ? requestParameters : {};
    this.apiUrl = ( apiUrl ) ? apiUrl : 'https://snapsearch.io/api/v1/robot';
    this.api = ( api ) ? api : Api;
    this.errors = null;
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
        function ( error, status, response ) {

            // we always have a response from SnapSearch Service if the request doesn't end up in an error
            if ( !error ) {

                if ( response.code == 'success' ) {

                    //will return status, headers (array of name => value), html, screenshot, date
                    callback( response.content );
                    return;

                } else if ( response.code == 'validation_error' ) {

                    //means that something was incorrect from the request parameters or the url could not be accessed
                    throw new SnapSearchException( 'Validation error from SnapSearch. Check your request parameters.', response.content );

                } else {

                    //system error on SnapSearch, nothing we can do
                    callback( false );
                    return;

                }

            } else {

                throw new SnapSearchException( 'Could not establish a connection to SnapSearch.' );

            }

        }
    );

};