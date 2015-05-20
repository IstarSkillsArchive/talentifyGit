//deprecated
//The OpenTok Platform allows developers to integrate live, face-to-face video
//directly into their website and mobile apps using WebRTC.

/* OLD CREDENTIALS
var opentok = require('opentok')
, OPENTOK_API_KEY = '44707312' // add your API key here
, OPENTOK_API_SECRET = '3a238daac7a94d2a9a3f671367f13c0576b5da0d'; // and your secret here
*/

var opentok = require('opentok')
, OPENTOK_API_KEY = '44746492' // add your API key here
, OPENTOK_API_SECRET = '4b692591dd3d42719c32675e0c960d5d3fc56941'; // and your secret here

var ot = new opentok.OpenTokSDK(OPENTOK_API_KEY,OPENTOK_API_SECRET),
sessionId = ot.sessionId;

renderExampleHTML = function(apikey, sessionId, token){
	  return [
	    '<html>\n',
	      '<head>\n',
	        '<title>OpenTok Hello World</title>\n',
	        '<script src="../javascripts/opentok.min.js"></script>\n',
	        '<script>\n',
	          'var apikey = "',apikey,'"\n',
	          '  , sessionId = "',sessionId,'"\n',
	          '  , token = "',token,'";\n',
	        '</script>\n',
	        '<script src="../javascripts/opentok-client.js"></script>\n',
	      '</head>\n',
	      '<body>\n',
	      	'<div style="position: relative; border: 1px solid #ddd">\n',
	      		'<div id="myPublisher" style="height: 400px; width: 90%"></div>\n',
	      		'<div style="position: absolute; bottom: 0px; right: 0px">\n',
	      			'<div id="mySubscriberElement"></div>\n',
	      		'</div>\n',
	      	'</div>\n',	
	      '</body>\n',
	    '</html>\n'
	  ].join("");
	};

module.exports = {
	show: function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write(
        renderExampleHTML(
          OPENTOK_API_KEY,
          ot.sessionId,
          ot.generateToken({
            'connection_data': "userid_" + new Date().getTime(),
            'role': "publisher"
          })
        )
      );
	res.end();
	}
};

console.log("Connecting to TokBox to establish session");

ot.createSession('localhost',{},function(sessionId){
  //server.listen(8000);
  console.log("Session Created, server running on port 3000");
});