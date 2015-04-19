'use strict';

/**
 * SnapSearchException extends the Error class to add extra functions to help with extracting the error strings.
 */
module.exports = SnapSearchException;

/**
 * Constructor
 *
 * @param string    message  Error message
 * @param object    errors   Object containing more details on the error
 * @param integer   code     Exception Code
 * @param Exception previous Previous exception
 */
function SnapSearchException( message, errors ) {

    this.name = 'SnapSearchException';
    this.message = message || '';
    this.errorDetails = errors;
}

SnapSearchException.prototype = new Error();
SnapSearchException.prototype.constructor = SnapSearchException;

/**
 * Gets the error message
 *
 * @return string Error message
 */
SnapSearchException.prototype.getMessage = function () {

    return this.message;

};

/**
 * Gets an object containing more details on the error
 *
 * @return object Error details
 */
SnapSearchException.prototype.getErrors = function () {

    return this.errorDetails;

};

/**
 * Gets a JSON string of the detailed error object
 *
 * @return string
 */
SnapSearchException.prototype.getErrorString = function () {

    return JSON.stringify( this.errorDetails, null, "\t" );

};