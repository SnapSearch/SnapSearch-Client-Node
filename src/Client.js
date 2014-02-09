'use strict';

var Api = require('request');
var SnapSearchException = require('./SnapSearchException');


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
){

	this.apiEmail = apiEmail;
	this.apiKey = apiKey;
	this.request = null;
	this.requestParameters = (requestParameters) ? requestParameters : {};
	this.apiUrl = (apiUrl) ? apiUrl : 'https://snapsearch.io/api/v1/robot';
	this.api = (api) ? api : Api;
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
Client.prototype.request = function(currentUrl,callback){

	//the current url must contain the entire url with the _escaped_fragment_ parsed out
	this.requestParameters.url = currentUrl;

	this.api({
	    method: 'POST',
	    url: this.apiUrl,
	    auth: {
	        user: this.apiEmail,
	        pass: this.apiKey
	    },
	    timeout: 30000,
	    json: this.requestParameters 
	},

	function(error, status, response){

		//ROGER: don't need to check for 200 status code. The only thing that matters is response.code and what it shows
		//JIBY: Well we need to check for 200 status code. Its the code about connection with SnapSearch, 
		// if it is not 200 means we didnt get a successfull response from SnapSearch and we dont have proper response
		// means we dont have response.code to check if status code of request is not 200
        // the thing you are confusing with is the status code is not about the request SnapSearch made but about our request to SnapSearch
		if (!error && status.statusCode == 200) {

			if(response.code == 'success'){

				//will return status, headers (array of name => value), html, screenshot, date
				callback(response.content);
				return;
			}else if(response.code == 'validation_error'){

				//means that something was incorrect from the request parameters or the url could not be accessed
				throw new SnapSearchException('Validation error from SnapSearch. Check your request parameters.', response.content);
			}else{

				//system error on SnapSearch, nothing we can do
				callback(false);
				return;
			}

		}else{

			//ROGER: in what cases will the error object be true in Node.js? This exception is only relevant in PHP because of the potential that CURL (extension) can fail
			//This should not be thrown in the case that the statusCode is say 4XX, 3XX, 2XX, 1XX and even perhaps in 5XX
			//So it's meant to be a client failure, not server failure
			//Because getting 5XX means that we did establish a connection to SnapSearch

			//JIBY we would come here if we didnt get a response from SnapSearch, it can be either the url cannot be reached, either server crashed,
			// or whatever reason we cant get a reponse back for the request. I think we shouldn't check status codes here as if it is an error 
			// SnapSearch identifies it will return validation error all other cases it something wrong with the connection and the case comes here.
			throw new SnapSearchException('Could not establish a connection to SnapSearch.');

		}
	});
};