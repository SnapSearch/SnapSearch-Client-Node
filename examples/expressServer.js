var express = require('express');
var SnapSearch = require('../');

var app = express();
var client = new SnapSearch.Client('demo@polycademy.com','a2XEBCF6H5Tm9aYiwYRtdz7EirJDKbKHXl7LzA21boJVkxXD3E');
var detector = new SnapSearch.Detector();
var interceptor = new SnapSearch.Interceptor(client,detector);

app.use(function(req,res,next){
   
	try{
		// call interceptor
		interceptor.intercept(req,function(data){
			// if we get data back it was a bot and we have a snapshot back from SnapSearch
			if(data){
				console.log(data);
				res.send('Was a robot and SnapChat Intercepted it Correctly');
			}else{ // It is a normal request continue normally
				next();
			}
		});
	}catch(err){ // Interceptor threw an error

	}

});

app.get('/', function(req, res){
  res.send('Was not a robot and we are here inside app');
});

app.listen(1337);
console.log('Server running at http://127.0.0.1:1337/');