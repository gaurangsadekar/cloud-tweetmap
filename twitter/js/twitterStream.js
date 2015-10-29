 var socket = io.connect();
 var newKeyword;
var prevKeyword;
 var markers = [];
 var heatmap;
 var liveTweets = new google.maps.MVCArray();
 heatmap = new google.maps.visualization.HeatmapLayer({
   data: liveTweets,
   radius: 25
 });
function initialize() {
  //Setup Google Map
  var myLatlng = new google.maps.LatLng(17.7850,-12.4183);
  var light_grey_style = [{"featureType":"landscape","stylers":[{"saturation":-100},{"lightness":65},{"visibility":"on"}]},{"featureType":"poi","stylers":[{"saturation":-100},{"lightness":51},{"visibility":"simplified"}]},{"featureType":"road.highway","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"road.arterial","stylers":[{"saturation":-100},{"lightness":30},{"visibility":"on"}]},{"featureType":"road.local","stylers":[{"saturation":-100},{"lightness":40},{"visibility":"on"}]},{"featureType":"transit","stylers":[{"saturation":-100},{"visibility":"simplified"}]},{"featureType":"administrative.province","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"visibility":"on"},{"lightness":-25},{"saturation":-100}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffff00"},{"lightness":-25},{"saturation":-97}]}];
  var myOptions = {
    zoom : 1,
    minZoom : 2,
    maxZoom : 10,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    styles: light_grey_style
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

  //Setup heat map and link to Twitter array we will append data to

  heatmap.setMap(map);

  if(io !== undefined) {
    // Storage for WebSocket connections
    // This listens on the "twitter-steam" channel and data is
    // received everytime a new tweet is receieved.
    socket.on('twitter-stream', function (data) {

      if(prevKeyword != newKeyword)
      {
        liveTweets = new google.maps.MVCArray();
        heatmap = new google.maps.visualization.HeatmapLayer({
          data: liveTweets,
          radius: 25
        });

        heatmap.setMap(map);
        prevKeyword = newKeyword;
      }
      var keywordElement = document.getElementById('keyword');
      var keyword = keywordElement.value;
      //Add tweet to the heat map array.
      var tweetText = data.text.toLowerCase();

      if (data.sentiment == "positive" || data.sentiment === null || data.sentiment == undefined) {
        var image = "css/map-marker-green.png";
      }
      else if (data.sentiment == "neutral"){
        var image = "css/map-marker-yellow.png";
      }
      else {
        var image = "css/map-marker-red.png";
      }

      if(keyword == "all")
      {
        console.log("Entered keyword " + keyword);
        var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
        liveTweets.push(tweetLocation);
        var marker = new google.maps.Marker({
          position: tweetLocation,
          map: map,
          icon: image
        });

      setTimeout(function(){
        marker.setMap(null);
      },1000);
      }
      else if(tweetText.indexOf(keyword) > -1)
    	{
        console.log("Entered keyword " + keyword);
        console.log(keyword + " should be present in " + tweetText);
        var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
        liveTweets.push(tweetLocation);

        //Flash a dot onto the map quickly
        //var image = "css/small-dot-icon.png";
        var marker = new google.maps.Marker({
          position: tweetLocation,
          map: map,
          icon: image
        });

      setTimeout(function(){
        marker.setMap(null);
      },1000);
    	  }
    });

    socket.on('keyword-twitter-stream', function (data) {
      if(prevKeyword != newKeyword)
        {
        liveTweets = new google.maps.MVCArray();
        heatmap = new google.maps.visualization.HeatmapLayer({
          data: liveTweets,
          radius: 25
        });

        heatmap.setMap(map);
        prevKeyword = newKeyword;
        }
        var keywordElement = document.getElementById('keyword');
        var keyword = keywordElement.value;
        //Add tweet to the heat map array.
        console.log(keyword + " in keyword stream");

        var tweetText = data.text.toLowerCase();
        console.log(tweetText);

        if (data.sentiment == "positive") {
          var image = "css/map-marker-green.png";
        }
        else if (data.sentiment == "neutral" || data.sentiment === null || data.sentiment == undefined){
          var image = "css/map-marker-yellow.png";
        }
        else {
          var image = "css/map-marker-red.png";
        }
        //Filtering logic
        if(keyword == "all")
        {
          console.log("Entered keyword " + keyword);
          var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
          liveTweets.push(tweetLocation);

          //Flash a dot onto the map quickly
          //var image = "css/small-dot-icon.png";
          var marker = new google.maps.Marker({
            position: tweetLocation,
            map: map,
            icon: image
          });

        setTimeout(function(){
          marker.setMap(null);
        },1000);
        }
        else if(tweetText.indexOf(keyword) > -1)
      	  {
            console.log("Entered keyword" + keyword);
            var tweetLocation = new google.maps.LatLng(data.lng,data.lat);
            liveTweets.push(tweetLocation);

            //Flash a dot onto the map quickly
            //var image = "css/small-dot-icon.png";
            var marker = new google.maps.Marker({
              position: tweetLocation,
              map: map,
              icon: image
            });
            setTimeout(function(){
              marker.setMap(null);
            },1000);
      	  }
      });


    socket.on("connected", function(r) {
      console.log("Starting to emit tweets");
      socket.emit("start tweets");
            });

  }
}

function sendKeywordToServer()
{
	var keywordElement = document.getElementById('keyword');
	var keyword = keywordElement.value;
  newKeyword = keyword;
	console.log(keyword + " will be sent to server");
  heatmap.setMap(null);

	socket.emit("start tweets with keyword" , keyword);

}
