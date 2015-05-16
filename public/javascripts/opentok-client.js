window.onload = function(){
		var connectionCount = 0;
		
		if (OT.checkSystemRequirements() == 1) {
		    var session = OT.initSession(apikey, sessionId);
		    session.on("sessionConnected", sessionConnectedHandler);
			session.on("streamCreated", streamCreatedHandler);
			
			session.on({
		      connectionCreated: function (event) {
		        connectionCount++;
		        OT.log(connectionCount + " connections.");
		      },
		      connectionDestroyed: function (event) {
		        connectionCount--;
		        OT.log(connectionCount + " connections.");
		      },
		      sessionDisconnected: function sessionDisconnectHandler(event) {
		        // The event is defined by the SessionDisconnectEvent class
		        if (event.reason == "networkDisconnected") {
		          alert("Your network connection terminated.");
		        }
		      }
		    });
			
			session.connect(token, function (error) {
			  if (error) {
			    if (error.code == 1006) {
			      alert("You are not connected to the internet. Check your network connection.");
			    }
			    console.log("Failed to connect: ", error.message);
			  } else {
			    console.log("Connected");
			  }
			});
		} else {
		    alert("The browser doesnt support Web Real Time Communication.");
		}
		
	  function sessionConnectedHandler(event) {
	     subscribeToStreams(event.streams);
	     var publisher = OT.initPublisher(
	             "mySubscriberElement",
	             {width:200, height:200});
	     session.publish(publisher);
	     //session.publish();
	  }
	
	  function streamCreatedHandler(event) {
	    subscribeToStreams(event.streams);
	  }
	
	  function subscribeToStreams(streams) {
	    for (var i = 0; i < streams.length; i++) {
	      var stream = streams[i];
	      if (stream.connection.connectionId != session.connection.connectionId) {
	        session.subscribe(stream, "myPublisher", {width: 500, height: 400});
	      }
	    }
	  }
  
};


