/*
* This module will take care of all the connections to the tracker.
* Currently, only the initial connection to the tracker is handled.
* TODO: implement DHT (trackerless) protocol
*/

var bencode = require('bencode'),
	querystring = require('querystring'),
	request = require('request'),
	config = require('../config'),
	PeerWireProtocol = require('./peerWireProtocol');

function trackerConnection (pieceInfo, callback) {
	this.piece = pieceInfo;
	this.currentState = this.piece.state;
	
	this.queryParameters =  
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
	this.trackerUrl = this.piece.torrentObject['announce-list'] ? this.piece.torrentObject['announce-list'][0] : this.piece.torrentObject.announce;
	
	// Sends a get request to the selected tracker
	request({
		method: "GET",
		url: this.trackerUrl + "?" + this.queryParameters,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			return new PeerWireProtocol(bencode.decode(body), this.piece);

		} else if (error) {
			if (typeof response == 'undefined') {
				callback(new Error("The returned response was undefined and there was an error: " + error));

			} else {
				callback(new Error("The returned response had a " + response.statusCode + " status code and there was an error: " + error))
			}

		}

	}.bind(this));
}

module.exports = trackerConnection;
