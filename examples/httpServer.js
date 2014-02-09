'use strict';

var http = require('http');
var SnapSearch = require('../');

var client = new SnapSearch.Client('demo@polycademy.com','a2XEBCF6H5Tm9aYiwYRtdz7EirJDKbKHXl7LzA21boJVkxXD3E');
var detector = new SnapSearch.Detector();
var interceptor = new SnapSearch.Interceptor(client,detector);


http.createServer(function (req, res) {
	try{
		// call interceptor
		interceptor.intercept(req,function(data){
			// if we get data back it was a bot and we have a snapshot back from SnapSearch
			if(data){
			  console.log(data);

			  res.writeHead(200, {
			  'Content-Type': 'text/plain'
			  });

			  res.end('Was a robot and SnapChat Intercepted it Correctly');

			}else{ // It is a normal request process it normally

			  res.writeHead(200, {
			  'Content-Type': 'text/plain'
			  });
			    
			  res.end('Was not a robot and we are here inside app');
			}
		});
	}catch(err){ // Interceptor threw an error

	}

}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');