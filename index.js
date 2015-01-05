'use strict';

var express = require('express'),
	app = express(),
	config = require('./config'),
	url = require('url'),
	downloader = require('./downloader'),
	command_arguments, file, data;

/*
* Parse string from command line
*/
// The first element of process.argv is 'node', the second element is index, which are unnecessary
command_arguments = process.argv.slice(2);
switch (command_arguments[0]) {
	case 'download':
		downloader(command_arguments[1]);
		break;
	case 'help':
	default:
		console.log("Enter download and a link or path to the torrent file to start downloading\n");
		console.log("Example: node bitMarie download https://archive.org/download/tristanandisolda16250gut/tristanandisolda16250gut_archive.torrent\n");
		console.log("Example: node bitMarie download ./tristanandisolda16250gut_archive.torrent");
		break;	
}