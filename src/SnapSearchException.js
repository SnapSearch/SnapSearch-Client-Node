'use strict';

/**
 * SnapSearchException extends the Error class to add extra functions to help with extracting the error strings.
 */
module.exports = SnapSearchException;

/**
 * Constructor
 *
 * @param string    message  Error message
 * @param array     errors   Array of errors objects or strings
 * @param integer   code     Exception Code
 * @param Exception previous Previous exception
 */
function SnapSearchException(message, errors) {

    this.message = message || '';
    this.errorsArray = errors;
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
 * Gets an array of all errors. It incorporates the basic single message error of most exceptions.
 * This way you only have to use getErrors() regardless of whether it's multiple errors or a single error.
 *
 * @return array Array of errors
 */
SnapSearchException.prototype.getErrors = function () {

    return this.errorsArray;

};

/**
 * Gets a error string that is combined from the errors array.
 *
 * @return string
 */
SnapSearchException.prototype.getErrorString = function () {

    return JSON.stringify(this.errorsArray, null, "\t");

};

/**
 * Appends an error to the array of errors. This can be useful for multiple errors at the same time.
 *
 * @param  object/string error Message of the error
 */
SnapSearchException.prototype.appendError = function (error) {

    this.errorsArray.push(error);

};

/**
 * Prepends an error to the array of errors.
 *
 * @param  object/string error Message of the error
 */
SnapSearchException.prototype.prependError = function (error) {

    this.errorsArray.unshift(error);

};