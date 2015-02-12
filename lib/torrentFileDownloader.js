'use strict';

var fs = require('fs'),
	regexp = require('node-regexp'),
	request = require('request'),
	reURL, rePath, response;

function torrentFileDownloader (argument) {
	if (reURL.test(argument)) { 
		return torrentFileDownloader.downloadFromURL;

	} else if (rePath.test(argument)) { 
		return torrentFileDownloader.downloadFromPath;

	} else {
		// return an error
		throw new Error("URL or path to file is not properly formatted. Please try again.");
	}
};

/*
* Reads torrent file using the torrent file URL
*/
function downloadFromURL (argumentURL, callback) {
	console.log("Started downloading from URL " + argumentURL);
	// get torrent file as a buffer
	var file = request.get(argumentURL, {
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error) {
			callback(error);
		} else if (response.statusCode !== 200) {
			callback(new Error("The request returned the following status code: " + response.statusCode));
		} else {
			callback(null, body);
		}	
	});
};

/*
* Reads torrent file using the path to the torrent file on disk
*/
function downloadFromPath (argumentPath, callback) {
	console.log("Started downloading from local file " + argumentPath);

	fs.readFile(argumentPath, function (err, data) {
		callback(err, data);		
	});
};

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

// For testing purposes
torrentFileDownloader.downloadFromURL = downloadFromURL;
torrentFileDownloader.downloadFromPath = downloadFromPath;
module.exports = torrentFileDownloader;
