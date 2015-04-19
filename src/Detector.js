'use strict';

var fs = require( 'fs' );
var url = require( 'url' );

/**
 * Detector detects if the current request is from a search engine robot using the robots.json file
 */
module.exports = Detector;

/**
 * Constructor
 *
 * @param array   ignoredRoutes       Array of blacklised route regexes that will be ignored during detection, you can use relative directory paths
 * @param array   matchedRoutes       Array of whitelisted route regexes, any route not matching will be ignored during detection
 * @param boolean checkFileExtensions Boolean to check if the url is going to a static file resource that should not be intercepted. This is prevent SnapSearch from attempting to scrape files which are not HTML. This is false by default as it depends on your routing structure.
 * @param boolean trustedProxy        Indicated if header from proxy is to be trusted
 * @param string  robotsJson          Absolute path to a robots.json file
 * @param string  extensionsJson      Absolute path to a extensions.json file
 */
function Detector(
    ignoredRoutes,
    matchedRoutes,
    checkFileExtensions,
    trustedProxy,
    robotsJson,
    extensionsJson
) {

    this.ignoredRoutes = ( ignoredRoutes ) ? ignoredRoutes : [];
    this.matchedRoutes = ( matchedRoutes ) ? matchedRoutes : [];

    this.checkFileExtensions = ( checkFileExtensions ) ? true : false;
    this.trustedProxy = ( trustedProxy ) ? true : false;

    robotsJson = ( robotsJson ) ? robotsJson : __dirname + '/../resources/robots.json';
    this.robots = this.parseJson( robotsJson );

    extensionsJson = ( extensionsJson ) ? extensionsJson : __dirname + '/../resources/extensions.json';
    this.extensions = this.parseJson( extensionsJson );

}

/**
 * Sets the request object.
 *
 * @param object request      Request object
 */
Detector.prototype.setRequest = function ( request ) {

    this.request = request;
    //we want work on the originalUrl in case the request object has this property such as the express framework
    this.request.originalUrl = (this.request.originalUrl) ? this.request.originalUrl : this.request.url;

};

/**
 * Detects if the request came from a search engine robot. It will intercept in cascading order:
 * 
 * 1. on an HTTP or HTTPS protocol
 * 2. on a GET request
 * 3. not on any ignored robot user agents (ignored robots take precedence over matched robots)
 * 4. not on any route not matching the whitelist
 * 5. not on any route matching the blacklist
 * 6. not on any invalid file extensions if there is a file extension
 * 7. on requests with _escaped_fragment_ query parameter
 * 8. on any matched robot user agents
 *
 * @return boolean
 */
Detector.prototype.detect = function () {

    var userAgent = this.request.headers[ 'user-agent' ];
    var realPath = this.getDecodedPath();
    var i;

    //only intercept on http or https protocols
    if ( this.getProtocolString() !== 'http' && this.getProtocolString() !== 'https' ) {
        return false;
    }

    //only intercept on get requests, SnapSearch robot cannot submit a POST, PUT or DELETE request
    if ( this.request.method != 'GET' ) {
        return false;
    }

    //detect ignored user agents, if true, then return false
    var ignoreRegex = [];
    for ( i = 0; i < this.robots.ignore.length; i++ ) {
        ignoreRegex[ i ] = regExpEscape( this.robots.ignore[ i ]);
    }
    ignoreRegex = new RegExp( ignoreRegex.join( '|' ), 'i' );

    if ( ignoreRegex.test( userAgent )) {
        return false;
    }

    //if the requested route doesn't match any of the whitelisted routes, then the request is ignored
    //of course this only runs if there are any routes on the whitelist
    if ( this.matchedRoutes.length > 0 ) {
        var matchedWhitelist = false;
        for ( i = 0; i < this.matchedRoutes.length; i++ ) {
            var matched_route_regex = new RegExp( this.matchedRoutes[ i ], 'i' );
            if ( matched_route_regex.test( realPath )) {
                matchedWhitelist = true;
                break;
            }
        }
        if ( !matchedWhitelist ) {
            return false;
        }
    }

    //detect ignored routes
    for ( i = 0; i < this.ignoredRoutes.length; i++ ) {
        var ignored_route_regex = new RegExp( this.ignoredRoutes[ i ], 'i' );
        if ( ignored_route_regex.test( realPath )) {
            return false;
        }
    }

    //detect extensions in order to prevent direct requests to static files
    if ( this.checkFileExtensions ) {

        var genericExtensions = ( Array.isArray( this.extensions['generic'] ) && this.extensions['generic'].length > 0 ) ? this.extensions['generic'] : [];

        var jsExtensions = ( Array.isArray( this.extensions['js'] ) && this.extensions['js'].length > 0 ) ? this.extensions['js'] : [];

        //merge, reduce to unique, and map to lowercase strings
        var validExtensions = genericExtensions
            .concat(jsExtensions)
            .reduce(function ( previous, current ) {
                if ( previous.indexOf (current) < 0 ) previous.push( current );
                return previous;
            }, [])
            .map(function (element) {
                return element.toString().toLowerCase();
            });

        //regex for url file extensions, it looks for "/{file}.{extension}" in an url that is not preceded by ? (query parameters) or # (hash fragment)
        //it will acquire the last extension that is present in the URL
        //so with "/{file1}.{extension1}/{file2}.{extension2}" the extension2 will be the extension that is matched 
        //furthermore if a file has multiple extensions "/{file}.{extension1}.{extension2}", it will only match extension2 because unix systems don't consider extensions to be metadata, and windows only considers the last extension to be valid metadata. Basically the {file}.{extension1} could actually just be the filename
        var extensionRegex = new RegExp(
            '^' +                 // Regex begins at the beginning of the string
            '(?:' +               // Begin non-capturing group
                '(?!' +           // Negative lookahead, this presence of such a sequence will fail the regex
                    '[?#]' +      // Question mark or hash character
                    '[\\s\\S]*' + // Any or more wildcard characters
                    '\\/' +       // Literal slash
                    '[^/?#]+' +   // {file} - has one or more of any character except forward slash, question mark or hash
                    '\\.' +       // Literal dot
                    '[^/?#]+' +   // {extension} - has one or more of any character except forward slash, question mark or hash
                ')' +             // This negative lookahead prevents any ? or # that precedes the {file}.{extension} by any characters
                '[\\s\\S]' +      // Wildcard
            ')*' +                // Non-capturing group that will capture any number of wildcard that passes the negative lookahead
            '\\/' +               // Literal slash
            '[^/?#]+' +           // {file} - has one or more of any character except forward slash, question mark or hash
            '\\.' +               // Literal dot
            '([^/?#]+)'           // {extension} - Subgroup has one or more of any character except forward slash, question mark or hash
        );

        //extension regex will be tested against the decoded path, not the full url to avoid domain extensions
        //if no extensions were found, then it's a pass
        var match = realPath.match(extensionRegex);
        if ( match ) {
            var urlExtension = match[1].toLowerCase();
            //found an extension, check if it is valid
            if ( validExtensions.indexOf( urlExtension ) === -1 ) {
                return false;
            }
        }

    }

    //detect escaped fragment (since the ignored user agents has been already been detected, SnapSearch won't continue the interception loop)
    if ( this.request.originalUrl.indexOf( '_escaped_fragment_' ) != -1 ) {
        return true;
    }

    //detect matched robots, if true, then return true
    var matchRegex = [];
    for ( i = 0; i < this.robots.match.length; i++ ) {
        matchRegex[ i ] = regExpEscape( this.robots.match[ i ]);
    }

    matchRegex = new RegExp( matchRegex.join( '|' ), 'i' );
    if ( matchRegex.test( userAgent )) {
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
Detector.prototype.getEncodedUrl = function () {

    if ( this.request.originalUrl.indexOf( '_escaped_fragment_' ) != -1 ) {

        var qsAndHash = this.getRealQsAndHashFragment( true );

        var url = this.getProtocolString() + '://' + this.getHost() + this.request.originalUrl.split( '?' )[ 0 ] + qsAndHash.qs + qsAndHash.hash;

        return url;

    } else {

        return this.getProtocolString() + '://' + this.getHost() + this.request.originalUrl;

    }

};

/**
 * Detect whether its a http or https request.
 * If trustedProxy is set we trust the proxy and look at its headers.
 *
 * @return string Protocol string
 */
Detector.prototype.getProtocolString = function () {

    var proto = (this.request.connection && this.request.connection.encrypted) ? 'https' : 'http';

    if ( !this.trustedProxy ) {
        return proto;
    }

    proto = this.request.headers[ 'X-Forwarded-Proto' ] || proto;
    
    //X-Forwarded-Proto is normally only ever a single value, but this is to be safe.
    return proto.split(/\s*,\s*/)[0];

};

/**
 * Detect host name and port.
 * If trustedProxy is set we trust the proxy and look at its headers.
 * 
 * @return string Host
 */
Detector.prototype.getHost = function () {

    var host = this.request.headers.host;

    if ( this.trustedProxy ) {
        host = this.request.headers[ 'X-Forwarded-Host' ] || host;
    }

    //HTTP 1.0 doesn't require the host header, but 1.1 requires the host header
    if ( !host ) return '';

    return host;

};

/**
 * Gets the decoded URL path relevant for detecting matched or ignored routes during detection.
 * It is also used for static file detection.
 *
 * @return string
 */
Detector.prototype.getDecodedPath = function () {

    if ( this.request.originalUrl.indexOf( '_escaped_fragment_' ) != -1 ) {

        var qsAndHash = this.getRealQsAndHashFragment( false );

        var path = this.request.originalUrl.split( '&' )[ 0 ] + qsAndHash.qs + qsAndHash.hash;

        return path;

    } else {

        return decodeURIComponent( this.request.originalUrl );
    }

};

/**
 * Gets the real query string and hash fragment by reversing the Google's _escaped_fragment_ protocol to the hash bang mode. This is used for both getting the encoded url for scraping and the decoded path for detection.
 * Google will convert convert URLs like so:
 * Original URL: http://example.com/path1?key1=value1#!/path2?key2=value2
 * Original Structure: DOMAIN - PATH - QS - HASH BANG - HASH PATH - HASH QS
 * Search Engine URL: http://example.com/path1?key1=value1&_escaped_fragment_=%2Fpath2%3Fkey2=value2
 * Search Engine Structure: DOMAIN - PATH - QS - ESCAPED FRAGMENT
 * Everything after the hash bang will be stored as the _escaped_fragment_, even if they are query strings.
 * Therefore we have to reverse this process to get the original url which will be used for snapshotting purposes.
 * This means the original URL can have 2 query strings components.
 * The QS before the HASH BANG will be received by both the server and the client. However not all client side frameworks will process this QS.
 * The HASH QS will only be received by the client as anything after hash does not get sent to the server. Most client side frameworks will process this HASH QS.
 * See this for more information: https://developers.google.com/webmasters/ajax-crawling/docs/specification
 *
 * @param  boolean $encode Whether to encodeURIComponent the query string or not
 *
 * @return array           Array of query string and hash fragment
 */
Detector.prototype.getRealQsAndHashFragment = function ( encode ) {

    var queryParameters = url.parse( this.request.originalUrl, true ).query;

    var hashString = queryParameters._escaped_fragment_;

    delete queryParameters._escaped_fragment_;

    var queryString = [],
    i;

    for ( i in queryParameters ) {
        if ( encode ) {
            queryString.push( encodeURIComponent( i ) + '=' + encodeURIComponent( queryParameters[ i ]));
        } else {
            queryString.push( i + '=' + queryParameters[ i ]);
        }
    }

    queryString = '?' + queryString.join( '&' );

    if ( hashString ) {
        hashString = '#!' + hashString;
    } else {
        hashString = '';
    }

    return {
        qs: queryString,
        hash: hashString
    };

};

/**
 * Parses a json file by decoding the JSON and throwing an exception if the decoding went wrong.
 *
 * @param  string jsonFile Absolute path to json file
 *
 * @return array
 *
 * @throws Exception If json decoding didn't work
 */
Detector.prototype.parseJson = function ( jsonFile ) {

    return JSON.parse( fs.readFileSync( jsonFile, 'utf8' ));

};

/**
 * Escapes regexp String
 *
 * @param  string regexp string to escape
 *
 * @return string
 */
function regExpEscape( str ) {

    return str.replace( /([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1' ).replace( /\x08/g, '\\x08' );
    
}