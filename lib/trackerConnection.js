/*
* This module will take care of all the connections to the tracker.
* Currently, only the initial connection to the tracker is handled.
*/

var bencode = require('bencode'),
	querystring = require('querystring'),
	request = require('request'),
	config = require('../config'),
	PeerWireProtocol = require('./peerWireProtocol');

//TODO: implement DHT (trackerless) protocol

function trackerConnection (pieceInfo) {
	var queryParameters, trackerUrl;

	this.piece = pieceInfo;
	this.currentState = this.piece.state;
	
	queryParameters = 
		'info_hash' + '=' + this.piece.URLencoded_info_hash + '&' +
		'peer_id' + '=' + this.piece.URLencoded_peer_id + '&' +
		'port' + '=' + config.port + '&' +
		'uploaded' + '=' + this.currentState.uploaded + '&' +
		'downloaded' + '=' + this.currentState.downloaded + '&' +
		'left' + '=' + this.currentState.left + '&' +
		'compact' + '=' + 1 + '&' +
		'no_peer_id' + '=' + 1 + '&' +
		'event' + '=' + 'started'; // for initial tracker request

	// Most torrent files have an 'announce-list' key & an annouce key
	// but some only have the 'announce' key
	// TODO: in case of announce-list, iterate over the list if first URL fails.
	trackerUrl = this.piece.torrentObject['announce-list'] ? this.piece.torrentObject['announce-list'][0] : this.piece.torrentObject.announce;
	
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

		new PeerWireProtocol(bencode.decode(body), this.piece);
	}.bind(this));
}

module.exports = trackerConnection;
