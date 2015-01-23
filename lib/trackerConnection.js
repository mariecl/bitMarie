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

//TODO: implement DHT (trackerless) protocol

function trackerConnection (torrentObject) {
	var currentState, queryParameters, trackerUrl;
	this.piece = new PieceInfo (torrentObject);
	currentState = this.piece.state;


	this.sha1_info_hash = sha1(bencode.encode(torrentObject.info));
	this.sha1_peer_id = sha1(generatePeer_id());

	this.URLencoded_info_hash = computeURLEncodedHash(bencode.encode(torrentObject.info));
	this.URLencoded_peer_id = computeURLEncodedHash(generatePeer_id());

	/*
	* Temporary tracker request using data from Wireshark capture
	* (namely info_hash and hashed part of the peer_id)
	*/
	
	queryParameters = 
		'info_hash' + '=' + this.URLencoded_info_hash + '&' +
		'peer_id' + '=' + this.URLencoded_peer_id + '&' +
		'port' + '=' + config.port + '&' +
		'uploaded' + '=' + currentState.uploaded + '&' +
		'downloaded' + '=' + currentState.downloaded + '&' +
		'left' + '=' + currentState.left + '&' +
		'compact' + '=' + 1 + '&' +
		'no_peer_id' + '=' + 1 + '&' +
		'event' + '=' + 'started'; // for initial tracker request

	// Most torrent files have an 'announce-list' key & an annouce key
	// but some only have the 'announce' key
	// TODO: in case of announce-list, iterate over the list if first URL fails.
	trackerUrl = piece.torrentInfo['announce-list'] ? piece.torrentInfo['announce-list'][0] : piece.torrentInfo.announce;
	
	request({
		method: "GET",
		url: trackerUrl + "?" + queryParameters,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		// TODO: separate two cases in different if statements
		if (error && typeof response == 'undefined') {
			console.log("Error: " + error);

			return
		}
		if (error && response.statusCode !== 200) {
			console.log("Error: " + error);
			console.log("Status code: " + response.statusCode);
			
			return;
		}

		new PeerWireProtocol(bencode.decode(body), sha1_info_hash, sha1_peer_id);
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
* Returns a 20-byte SHA1 hash of the input value as a buffer
*/
// TODO: move to utils file
function sha1 (inputValue) {
	return crypto.createHash('sha1').update(inputValue).digest();
}

/*
* Returns a 20-byte SHA1 hash of the input value as a hex string
*/
// TODO: move to utils file
function sha1hex (inputValue) {
	return crypto.createHash('sha1').update(inputValue).digest('hex');
}

/*
* Returns a urlencoded 20-byte SHA1 hash of the given value.
*/
function computeURLEncodedHash (data) {
	var hash = sha1hex(data);
	var info_hash = "";

	for (var i = 0; i < hash.length; i += 2) {
		var charCode = parseInt(hash.substr(i, 2), 16); // character code in unicode 
														// 16 -> to read from hex to int
		
		if (charCode <= 127) {
			var encodedChar = encodeURIComponent(String.fromCharCode(charCode));

			if (encodedChar.charAt(0) == "%") {
				info_hash += encodedChar.toLowerCase();
			} else {
				info_hash += encodedChar;
			}
		} else {
			info_hash += "%" + hash.substr(i, 2); // stays in hex
		}
	}
	
	return info_hash;
}

module.exports = trackerConnection;
