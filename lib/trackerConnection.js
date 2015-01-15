var bencode = require('bencode'),
	config = require('../config'), 
	crypto = require('crypto'),
	PieceInfo = require('./pieceInfo'),
	querystring = require('querystring'),
	request = require('request'),
	trackerConnection;

trackerConnection = function (torrentObject) {
	var currentState, queryParameters, trackerUrl;
	this.piece = new PieceInfo (torrentObject);
	currentState = this.piece.state;

	/*
	* Temporary tracker request using data from Wireshark capture
	* (namely info_hash and hashed part of the peer_id)
	*/
	queryParameters = 
		'info_hash' + '=' + 'S%aa%90%5eK%f7%89d%22%01%0a%c2i%d7Yoz%24%0cg' + '&' +
		'peer_id' + '=' + '-AM1989-A%8e%3a%85%887%7f%afs%f8%60%da' + '&' +
		'port' + '=' + config.port + '&' +
		'uploaded' + '=' + currentState.uploaded + '&' +
		'downloaded' + '=' + currentState.downloaded + '&' +
		'left' + '=' + currentState.left + '&' +
		'compact' + '=' + 1 + '&' +
		'no_peer_id' + '=' + 1 + '&' +
		'event' + '=' + 'started'; // for initial tracker request

	// Most torrent files have an announce-list key & an annouce key
	// but some only have the announce key
	trackerUrl = piece.torrentInfo['announce-list'] ? piece.torrentInfo['announce-list'][0] : piece.torrentInfo.announce;

	request({
		method: "GET",
		url: trackerUrl + "?" + queryParameters,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			console.log("Error: " + error);
			console.log(response.statusCode);
			return;
		} else {
			//decode the bencoded buffer
			console.log("- DECODED BODY -");
			return console.log(bencode.decode(body, 'utf8'));
		}
	})
}

/*
* Uses Azureus-style convention for generating a peer_id
*/
// TO-DO: generate it only once on client start-up then re-use it
function generatePeer_id() {
	// '-', two characters for client id
	var peer_id = "-AM";

	// four ascii digits for version number
	peer_id += "0000"; 
	// '-'
	peer_id += "-";

	// followed by random numbers based on timestamp at startup
	peer_id += Date.now().toString();

	return peer_id;
}

/*
* Returns a 20-byte SHA1 hash of the input value
*/
// TODO: move to utils file
function sha1 (inputValue) {
	return crypto.createHash('sha1').update(new Buffer (inputValue, 'binary')).digest('hex');
}

module.exports = trackerConnection;
