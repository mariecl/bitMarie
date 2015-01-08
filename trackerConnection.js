var bencode = require('bencode'), 
	crypto = require('crypto'),
	pieceInfo = require('./pieceInfo'),
	querystring = require('querystring'),
	request = require('request'),
	trackerConnection;

trackerConnection = function (torrentObject) {
	var currentState, queryParameters, trackerUrl;

	currentState = pieceInfo(torrentObject);

	queryParameters = {
		info_hash: sha1(bencode.encode(torrentObject.info)),
		peer_id: sha1(generatePeer_id()),
		port: 6881,
		uploaded: pieceInfo(torrentObject).uploaded,
		downloaded: pieceInfo(torrentObject).downloaded,
		left: pieceInfo(torrentObject).left,
		compact: 1,
		no_peer_id: 1,
		event: started // for initial tracker request
	};

	trackerUrl = torrentObject.announce;

	request({
		method: "GET",
		url: trackerUrl + "?" + querystring.stringify(queryParameters),
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			console.log("Error: " + error);
			return;
		} else {
			//decode the bencoded buffer
			return console.log(bencode.decode(body, 'utf8'));
		}
	})
}

/*
* Uses Azureus-style convention for generating a peer_id
* TO-DO: generate it only once on client start-up then re-use it
*/
function generatePeer_id() {
	// '-', two characters for client id
	var peer_id = "-AM";

	// four ascii digits for version number
	peer_id += "0000"; 
	// '-'
	peer_id += "-";

	// followed by random numbers based on process id and timestamp at startup
	peer_id + = process.pid + Date.now().toString();

	return peer_id;
}

/*
* Returns a 20-byte SHA1 hash of the input value
*/
//TODO: move to utils file
function sha1 (inputValue) {
	return crypto.createHash('sha1').update(inputValue).digest();
}	

module.exports = trackerConnection;