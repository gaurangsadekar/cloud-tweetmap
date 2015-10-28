// Set up web server, express and socket
var twitter = require('twitter'),

express = require('express'),
app = express(),

http = require('http'),
server = http.createServer(app),
io = require('socket.io').listen(server);

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var AlchemyAPI = require('alchemy-api')
var url = 'mongodb://54.200.167.60:27017/tweetDB';

//Setup twitter stream api
var twit = new twitter({
  consumer_key: 'CLbQDiBRjNn1NGEE0wJ2yNtxb',
  consumer_secret: 'sJRdATSUzFWYJ1F2Ko28iLcWAQpYOsRjEX3EE0OoWW4XHoNGIl',
  access_token_key: '140911269-fETxwkzza6f4n0MX1j6Saf7btgV7Vd1OBWdJKjVr',
  access_token_secret: 'yOkNGkoOvtqtNre0L0rsNyYhhlIltkRWHz5sWVLFsmWFj'
}),
stream = null;

//Use the default port (for beanstalk) or default to 8081 locally
server.listen(process.env.PORT || 8081);
//Setup rotuing for app
app.use(express.static(__dirname + '/twitter'));
MongoClient.connect(url, function(err, db) {
console.log("Connected to Mongo");
assert.equal(null, err);
//Create web sockets connection.
io.sockets.on('connection', function (socket) {

  socket.on("start tweets", function() {
    if(stream === null) {
      //Connect to twitter stream passing in filter for entire world.
      twit.stream('statuses/filter', {track : 'love, football, tech, trump, india, sanders, modi, ferguson, assault'}, function(stream) {
          stream.on('data', function(data) {
              // Does the JSON result have coordinates
              if (data.coordinates){
                console.log(data.text);
                if (data.coordinates !== null){
                var alchemy = new AlchemyAPI('3c592701a603462b55abad073040d969cb9bea5c');
                alchemy.sentiment(data.text, {}, function(err, response) {
                  if (err) throw err;
                  // See http://www.alchemyapi.com/api/ for format of returned object
                  var sentiment = response.docSentiment;
                  console.log(JSON.stringify(sentiment));
                  // Send lat, lng and tweet text to the web socket
                  if (sentiment) {
                  var outputPoint = {"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1], "text" : data.text, "sentiment":sentiment.type};
                  console.log(outputPoint);
                  }
                  else {
                    var outputPoint = {"lat": data.coordinates.coordinates[0],"lng": data.coordinates.coordinates[1], "text" : data.text};
                    console.log(outputPoint);
                  }
                  socket.broadcast.emit("twitter-stream", outputPoint);
                  //Send out to web sockets channel.
                  socket.emit('twitter-stream', outputPoint);
                  console.log("Storing tweet into MongoDB");
                  db.collection('tweetRecords').insertOne({
	    		             "tweet_id" : data.id,
	    	               "tweet_id_str" : data.id_str,
	    	               "tweet_created_at" : data.created_at,
	    	               "tweet_timestamp" : data.timestamp_ms,
	    	               "tweet_lang" : data.lang,
	    	               "tweet_text" : data.text,
	    	               "geo":data.geo,
	    	               "retweet_count" : data.retweet_count,
	    	               "favourite_count" : data.favorite_count,
	    	               "coordinate":data.coordinates
	                  }
	    	            , function(err, result) {
                          if(err) throw err;
                });

              });
              }
                else if(data.place){
                  if(data.place.bounding_box === 'Polygon'){
                    // Calculate the center of the bounding box for the tweet
                    var coord, _i, _len;
                    var centerLat = 0;
                    var centerLng = 0;

                    for (_i = 0, _len = coords.length; _i < _len; _i++) {
                      coord = coords[_i];
                      centerLat += coord[0];
                      centerLng += coord[1];
                    }
                    centerLat = centerLat / coords.length;
                    centerLng = centerLng / coords.length;

                    // Build json object and broadcast it
                    var outputPoint = {"lat": centerLat,"lng": centerLng};
                    socket.broadcast.emit("twitter-stream", outputPoint);

                  }
                }
              }
              stream.on('limit', function(limitMessage) {
                return console.log(limitMessage);
              });

              stream.on('warning', function(warning) {
                return console.log(warning);
              });

              stream.on('disconnect', function(disconnectMessage) {
                return console.log(disconnectMessage);
              });
            });
      });
    }
  });

  socket.on("start tweets with keyword", function(keyword) {
	     var capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
       console.log(capitalizedKeyword);
       var cursor;
       if(keyword == "all")
       {
		   cursor = db.collection('tweetRecords').find();
            }
     else {
       cursor = db.collection('tweetRecords').find(  { $or: [ { "tweet_text" :  new RegExp(keyword) } , {"tweet_text" :  new RegExp(capitalizedKeyword)} ] });
      }
		   cursor.each(function(err, doc) {
		      assert.equal(err, null);
		      if (doc != null) {
		    	  console.log("Entered cursor");
		    	  console.log(doc.tweet_text);
		    	  if(doc.coordinate !== null)
		    		  {
		    	        var outputPoint = {"lat": doc.coordinate.coordinates[0],"lng": doc.coordinate.coordinates[1],"text" : doc.tweet_text};
                  socket.broadcast.emit("keyword-twitter-stream", outputPoint);
                  //Send out to web sockets channel.
                  socket.emit('keyword-twitter-stream', outputPoint);
              }
		    	  }

		   });
		});



  console.log("Emitting connected");
  socket.emit("connected");
});
});
