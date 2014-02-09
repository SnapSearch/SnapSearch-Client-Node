'use strict';

var fs 	= require('fs');
var jf 	= require('jsonfile');
var url = require('url');

/**
 * Detector detects if the current request is from a search engine robot using the Robots.json file
 */
module.exports = Detector;

/**
 * Constructor
 * 
 * @param boolean trustedProxy   Indicated if header from proxy is to be trusted
 * @param array   ignoredRoutes  Array of blacklised route regexes that will be ignored during detection, you can use relative directory paths
 * @param array   matchedRoutes  Array of whitelisted route regexes, any route not matching will be ignored during detection
 * @param Request request        Symfony Request Object
 * @param boolean robotsJson     Absolute path to a the Robots.json file
 */
function Detector(
	trustedProxy,
	ignoredRoutes,
	matchedRoutes,
	request,
	robotsJson
){
	var self = this;

	this.trustedProxy 	= (trustedProxy) ? true : false;
	this.ignoredRoutes 	= (ignoredRoutes) ? ignoredRoutes : [];
	this.matchedRoutes 	= (matchedRoutes) ? matchedRoutes : [];
	this.request 		= (request) ? request : null; 
	robotsJson 			= (robotsJson) ? robotsJson : __dirname + '/Robots.json';
	this.robots 		= this.parseRobotsJson(robotsJson);

}


/**
 * Sets the request object.
 * 
 * @param object request      Request object
 */
Detector.prototype.setRequest = function(request){
	this.request = request;
};

/**
 * Only run in HTTP and HTTPS server
 * Donot run in requests for static files.
 *
 * Detects if the request came from a search engine robot. It will intercept in cascading order:
 * 1. on a GET request
 * 2. not on any ignored robot user agents
 * 3. not on any route not matching the whitelist
 * 4. not on any route matching the blacklist
 * 5. not on any static files that is not a PHP file if it is detected
 * 6. on requests with _escaped_fragment_ query parameter
 * 7. on any matched robot user agents
 * 
 * @return boolean
 */
Detector.prototype.detect =  function(){

	var userAgent = this.request.headers['user-agent'];
	var realPath = this.getDecodedPath();
	var i;

	//only intercept on get requests, SnapSearch robot cannot submit a POST, PUT or DELETE request
	if(this.request.method != 'GET'){
		return false;
	}

	//detect ignored user agents, if true, then return false
	var ignoreRegex =[];
	for(i=0;i<this.robots.ignore.length;i++){
		ignoreRegex[i] = pregQuote(this.robots.ignore[i]);
	}
	ignoreRegex = new RegExp(ignoreRegex.join('|'), 'i');
   
	if(ignoreRegex.test(userAgent)){
		return false;
	}

	//if the requested route doesn't match any of the whitelisted routes, then the request is ignored
	//of course this only runs if there are any routes on the whitelist
	if(this.matchedRoutes.length > 0){
		var matchedWhitelist = false;
		for(i=0;i<this.matchedRoutes.length;i++){
			var matched_route_regex = new RegExp(this.matchedRoutes[i],'i');
			if(matched_route_regex.test(realPath)){
				matchedWhitelist = true;
				break;
			}
		}
		if (!matchedWhitelist){
			return false;
		}
	}

	//detect ignored routes
	for(i=0;i<this.ignoredRoutes.length;i++){
		var ignored_route_regex = new RegExp(this.ignoredRoutes[i],'i');
		if(ignored_route_regex.test(realPath)){
			return false;
		}
	}

	//detect escaped fragment (since the ignored user agents has been already been detected, SnapSearch won't continue the interception loop)
	if(url.parse(this.request.url,true).query._escaped_fragment_){
		return true;
	}

	//detect matched robots, if true, then return true
	var matchRegex =[];
	for(i=0;i<this.robots.match.length;i++){
		matchRegex[i] = pregQuote(this.robots.match[i]);
	}

	matchRegex = new RegExp(matchRegex.join('|'),'i');
	if(matchRegex.test(userAgent)){
		return true;
	}

	//if no match at all, return false
	return false;

};


/**
 * Gets the encoded URL that is passed to SnapSearch so that SnapSearch can scrape the encoded URL.
 * If _escaped_fragment_ query parameter is used, this is converted back to a hash fragment URL.
 * 
 * @return string URL intended for SnapSearch
 */
Detector.prototype.getEncodedUrl = function(){

	if(this.request.url.indexOf('_escaped_fragment_')!=-1){

		var qsAndHash = this.getRealQsAndHashFragment(true);

		url = this.getProtocolString()+'://' + this.request.headers.host + this.request.url.split('?')[0] + qsAndHash.qs + qsAndHash.hash;

		return url;

	}else{

		return this.request.headers.host + this.request.url;

	}
};


/**
 * Detected whether its a http ot https request.
 * If trustedProxy is set we trust the proxy and look at its headers to determine if request was https or http.
 * 
 * @return returns the protocol string
 */
Detector.prototype.getProtocolString = function(){
	if(this.request.connection && this.request.connection.encrypted){
		return 'https';
	}
	if(!this.trustedProxy){
		return 'http';
	}
	var proto = this.request.headers['x-forwarded-for'] || 'http';
	return proto.split(/\s*,\s*/)[0];
};


/**
 * Gets the decoded URL path relevant for detecting matched or ignored routes during detection.
 * It is also used for static file detection. 
 * 
 * @return string
 */
Detector.prototype.getDecodedPath = function(){

	if(this.request.url.indexOf('_escaped_fragment_')!=-1){

		var qsAndHash = this.getRealQsAndHashFragment(false);

		var path = this.request.url.split('&')[0] + qsAndHash.qs + qsAndHash.hash;

		return path;

	}else{

		return decodeURIComponent(this.request.url);
	}

};

/**
 * Gets the real query string and hash fragment by reversing the Google's _escaped_fragment_ protocol to the hash bang mode.
 * Google will convert the original url from:
 * http://example.com/path#!key=value to http://example.com/path?_escaped_fragment_=key%26value
 * Therefore we have to reverse this process to the original url which will be used for snapshotting purposes.
 * https://developers.google.com/webmasters/ajax-crawling/docs/specification
 * This is used for both getting the encoded url for scraping and the decoded path for detection.
 * 
 * @param  boolean $encode Whether to rawurlencode the query string or not
 * 
 * @return array           Array of query string and hash fragment
 */
Detector.prototype.getRealQsAndHashFragment = function(encode){
	
	var queryParameters = url.parse(this.request.url,true).query;

	var hashString = queryParameters._escaped_fragment_;

	delete queryParameters._escaped_fragment_;

	var queryString=[],i;

	for(i in queryParameters){
		if(encode){
			queryString.push(encodeURIComponent(i)+'='+encodeURIComponent(queryParameters[i]));
		}else{
			queryString.push(i+'='+queryParameters[i]);
		}
	}

	queryString = '?'+queryString.join('&');

	if(hashString){
		hashString = '#!' + hashString;
	}else{
		hashString = '';
	}
	
	return {
		qs: queryString,
		hash: hashString
	};
};

/**
 * Parses the Robots.json file by decoding the JSON and throwing an exception if the decoding went wrong.
 * 
 * @param  string $robotsJson Absolute path to Robots.json
 * 
 * @return array
 *
 * @throws Exception If json decoding didn't work
 */
Detector.prototype.parseRobotsJson = function(robotsJson){
	return JSON.parse(fs.readFileSync(robotsJson, 'utf8'));
};

// Helper Functions for php preg_quote (We have this here since we need to maintain compatability for Robots.json from php Client)
function pregQuote(str, delimiter) {
  return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}
