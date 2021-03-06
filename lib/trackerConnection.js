/*
* This module will take care of all the connections to the tracker.
* Currently, only the initial connection to the tracker is handled.
* TODO: implement DHT (trackerless) protocol
*/

var bencode = require('bencode'),
	querystring = require('querystring'),
	request = require('request'),
	config = require('../config');

function trackerConnection (piece, callback) {
	var currentState = piece.state;
	
	var queryParameters =  
		'info_hash' + '=' + piece.URLencoded_info_hash + '&' +
		'peer_id' + '=' + piece.URLencoded_peer_id + '&' +
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
	var trackerUrl = piece.torrentObject['announce-list'] ? piece.torrentObject['announce-list'][0] : piece.torrentObject.announce;
	
	// Sends a get request to the selected tracker
	request({
		method: "GET",
		url: trackerUrl + "?" + queryParameters,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error && response === undefined) {
			callback(new Error("The returned response was undefined and there was an error: " + error));
		} else if (error && response.statusCode !== 200) {
			callback(new Error("The returned response had a " + response.statusCode + " status code and there was an error: " + error))
		} else {
			var decodedBody = bencode.decode(body);
			
			if (decodedBody['failure reason']) {
				callback(new Error("The tracker reported a failure: " + decodedBody['failure reason']));
				//TODO: try another URL in case of announce-list
			} else {
				return callback(null, body)
				
			}
		}
			
	}.bind(this));
}

module.exports = trackerConnection;
