'use strict';

var bencode = require('bencode'),
	fs = require('fs'),
	regexp = require('node-regexp'),
	request = require('request'),
	trackerConnection = require('./trackerConnection'),
	reURL, rePath, downloader, response;

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

function downloadFromURL (argumentURL, callback) {
	console.log("Started downloading from URL " + argumentURL);
	// get torrent file as a buffer
	var file = request({
		method: "GET",
		url: argumentURL,
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error) {
			return callback(error);
		} else if (response.statusCode !== 200) {
			callback(new Error("The request returned the follwing status code: " + response.statusCode));
		} else {
			return trackerConnection(bencode.decode(body));
		}
	})
}

function downloadFromPath (argumentPath, callback) {
	console.log("Started downloading from local file " + argumentPath);

	fs.readFile(argumentPath, function (err, data) {
		if (err) {
			return callback(err);
		}
		trackerConnection(bencode.decode(data));		
	});
}

module.exports = downloader;
