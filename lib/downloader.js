'use strict';

var fs = require('fs'),
	bencode = require('bencode'),
	regexp = require('node-regexp'),
	request = require('request'),
	trackerConnection = require('./trackerConnection'),
	PieceInfo = require('./pieceInfo'),
	reURL, rePath, downloader, response;

downloader = function (argument, callback) {
	if (reURL.test(argument)) {

		if (!rePath.test(argument)) {
			downloadFromURL(argument, callback);

		} else {
			// return an error
			setImmediate(callback.bind(null, new Error("URL or path to file is not properly formatted. Please try again.")));
		}

	} else {
		if (rePath.test(argument)) {
			downloadFromPath(argument, callback);

		} else {
			// return an error
			setImmediate(callback.bind(null, new Error("URL or path to file is not properly formatted. Please try again.")));
		}

	}
};

/*
* Reads torrent file using the torrent file URL
*/
function downloadFromURL (argumentURL, callback) {
	console.log("Started downloading from URL " + argumentURL);
	// get torrent file as a buffer
	var file = request({
		method: "GET",
		url: argumentURL,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error) {
			callback(error);

		} else if (response.statusCode !== 200) {
			callback(new Error("The request returned the follwing status code: " + response.statusCode));

		} else {
			return trackerConnection(new PieceInfo(bencode.decode(body)), callback);
		}
		
	})
}

/*
* Reads torrent file using the path to the torrent file on disk
*/
function downloadFromPath (argumentPath, callback) {
	console.log("Started downloading from local file " + argumentPath);

	fs.readFile(argumentPath, function (err, data) {
		if (err) {
			return callback(err);
		}

		trackerConnection(new PieceInfo (bencode.decode(data)), callback);		
	});
}

/*
* Regular expression for URL
*/
reURL = regexp()
			.start('http')
			.maybe('s')
			.must('://')
			.maybe('WWW.')
			.somethingBut(regexp.space)
			.end('.torrent')
			.ignoreCase()
			.toRegExp();

/*
* Regular expression for path to local file
*/
rePath = regexp()
			.start('.')
			.maybe('.')
			.must('/')
			.somethingBut(regexp.space)
			.end('.torrent')
			.ignoreCase()
			.toRegExp();

module.exports = downloader;
