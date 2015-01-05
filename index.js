'use strict';

var express = require('express'),
	app = express(),
	bencode = require('bencode'),
	config = require('./config'),
	fs = require('fs'),
	regexp = require('node-regexp'),
	request = require('request'),
	url = require('url'),
	
	command_arguments, file, data, reURL, rePath;

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

/*
* Parse string from command line
*/
// The first element of process.argv is 'node', the second element is index, which are unnecessary
command_arguments = process.argv.slice(2);
switch (command_arguments[0]) {
	case 'download':
		switch (reURL.test(command_arguments[1])) {
			case true:
				switch (rePath.test(command_arguments[1])) {
					case false:
						console.log("Started downloading from URL " + command_arguments[1]);
						// get torrent file as a buffer
						file = request({
							method: "GET",
							url: command_arguments[1],
							encoding: null // If null, the body is returned as a Buffer.
						}, function (error, response, body) {
							if (error || response.statusCode !== 200) {
								console.log("Error: " + error);
								return;
							} else {
								//decode the bencoded buffer
								return bencode.decode(body, 'utf8');
							}
						});
						break;
					case true:
					default:
						console.log("URL or path to file is not properly formatted. Please try again.");
						break;
				}
				break;
			case false:
				switch (rePath.test(command_arguments[1])) {
					case true:
						console.log("Started downloading from local file " + command_arguments[1]);

						var returnFile = function (callback) {
						  fs.readFile(command_arguments[1], function (err, data) {
						    callback(data);
						  });
						}

						var decode = function (dataBuffer) {
							return bencode.decode(dataBuffer, 'utf8');
						}

						returnFile(decode);
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
		break;
	case 'help':
	default:
		console.log("Enter download and a link or path to the torrent file to start downloading\n");
		console.log("Example: node bitMarie download https://archive.org/download/tristanandisolda16250gut/tristanandisolda16250gut_archive.torrent\n");
		console.log("Example: node bitMarie download ./tristanandisolda16250gut_archive.torrent");
		break;	
}