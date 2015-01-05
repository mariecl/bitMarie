'use strict';

var bencode = require('bencode'),
	fs = require('fs'),
	regexp = require('node-regexp'),
	request = require('request'),
	reURL, rePath, downloader;

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


downloader = function (argument) {
	switch (reURL.test(argument)) {
		case true:
			switch (rePath.test(argument)) {
				case false:
					downloadFromURL(argument);
					break;
				case true:
				default:
					console.log("URL or path to file is not properly formatted. Please try again.");
					break;
			}
			break;
		case false:
			switch (rePath.test(argument)) {
				case true:
					downloadFromPath(argument);
					break;
				case false:
				default:
					console.log("URL or path to file is not properly formatted. Please try again.");
					break;
			}
			break;
		default:
			console.log("URL or path to file is not properly formatted. Please try again.");
			break;
	}
};

function downloadFromURL (argumentURL) {
	console.log("Started downloading from URL " + argumentURL);
	// get torrent file as a buffer
	var file = request({
		method: "GET",
		url: argumentURL,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			console.log("Error: " + error);
			return;
		} else {
			//decode the bencoded buffer
			return bencode.decode(body, 'utf8');
		}
	})
}

function downloadFromPath (argumentPath) {
	console.log("Started downloading from local file " + argumentPath);

	var returnFile = function (callback) {
	  fs.readFile(argumentPath, function (err, data) {
	    callback(data);
	  });
	}

	var decode = function (dataBuffer) {
		return bencode.decode(dataBuffer, 'utf8');
	}

	returnFile(decode);
}

module.exports = downloader;
