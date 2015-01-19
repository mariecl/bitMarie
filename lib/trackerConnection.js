/*
* This module will take care of all the connections to the tracker.
* Currently, only the initial connection to the tracker is handled.
*/

var bencode = require('bencode'),
	crypto = require('crypto'),
	querystring = require('querystring'),
	request = require('request'),
	config = require('../config'), 
	PieceInfo = require('./pieceInfo'),
	PeerWireProtocol = require('./peerWireProtocol');

function trackerConnection (torrentObject) {
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
	// TODO: in case of announce-list, iterate over the list if first URL fails.
	trackerUrl = piece.torrentInfo['announce-list'] ? piece.torrentInfo['announce-list'][0] : piece.torrentInfo.announce;

	request({
		method: "GET",
		url: trackerUrl + "?" + queryParameters,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		// TODO: separate two cases in different if statements
		if (error || response.statusCode !== 200) {
			console.log("Error: " + error);
			console.log("Status code: " + response.statusCode);
			return;
		} else {
			new PeerWireProtocol(bencode.decode(body, 'utf8'));
		}
	})
}

/*
* Uses Azureus-style convention for generating a peer_id
*/
// TO-DO: generate a unique peer_id on client start-up
function generatePeer_id() {
	// '-' followed by two characters for client id
	var peer_id = "-AM";

	// four ascii digits for version number
	peer_id += "1989"; 
	// '-'
	peer_id += "-";

	// followed by random numbers based on timestamp at startup
	var current_date = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	peer_id += sha1(current_date + random);

	return peer_id;
}

/*
* Returns a 20-byte SHA1 hash of the input value
*/
// TODO: move to utils file
function sha1 (inputValue) {
	return crypto.createHash('sha1').update(inputValue).digest('hex');
}

module.exports = trackerConnection;
