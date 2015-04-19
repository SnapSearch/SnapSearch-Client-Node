'use strict';
/*globals describe*/

var SnapSearchException = require( '../src/SnapSearchException' );
var assert = require( 'chai' ).assert;

var snapSearchException = new SnapSearchException( 'Validation error', [{
    url: 'Url is malformed!'
}])

describe( 'SnapSearchException', function () {

    describe( '#SnapSearchException()', function () {

        it( 'should extend Error', function () {
            assert.instanceOf( snapSearchException, Error, 'snapSearchException should be instance of Error' );
        });

    });

    describe( '#getErrors()', function () {

        it( 'should return an object containing detailed errors', function () {
            var errors = snapSearchException.getErrors();
            assert.instanceOf( errors, Array, 'getErrors() should return an array object' );
            assert.equal( 'Url is malformed!', errors[ 0 ].url, 'array object returned by getErrors() contains error messages' );
            assert.equal( 'Validation error', snapSearchException.getMessage(), 'getMessage() returns correct error message' );
        });

    });

    describe( '#getMessage()', function () {

        it( 'should return Error message', function () {
            assert.equal( 'Validation error', snapSearchException.getMessage(), 'getMessage() return correct error message' );
        });

    });

    describe( '#getErrorString()', function () {

        it( 'should return String of error messages', function () {
            assert.equal( '[\n\t{\n\t\t"url": "Url is malformed!"\n\t}\n]', snapSearchException.getErrorString(), 'getErrorString() return string of error messages' );
        });
        
    });

});