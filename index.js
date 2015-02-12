'use strict';

var bencode = require('bencode'),
	config = require('./config'),
	torrentFileDownloader = require('./lib/torrentFileDownloader'),
	TorrentSession = require('./lib/torrentSession'),
	PieceInfo = require('./lib/pieceInfo'),
	trackerConnection = require('./lib/trackerConnection'),
	command_arguments;

/*
* Parse string from command line
*/
// The first element of process.argv is 'node',
// the second element is index (name of file),
// which are unnecessary
command_arguments = process.argv.slice(2);
switch (command_arguments[0]) {
	case 'download':
		var fileLocation = command_arguments[1];

		try {
			var getFile = torrentFileDownloader(fileLocation);
		} catch (error) {
			console.log(error);
			console.log(error.stack);
		}

		getFile(fileLocation, function (err, body) {
			var piece = new PieceInfo(bencode.decode(body));
			trackerConnection(piece, function (err, body) {
				var torrentSession = new TorrentSession(bencode.decode(body), piece, function () {});
				var peersList = torrentSession.peers.forEach(function (peer) {
					peer.connect(function(){});
				})
			});
		});

		break;
	case 'help':
	default:
		console.log("Enter download and a link or path to the torrent file to start downloading\n");
		console.log("Example: node index.js download https://archive.org/download/tristanandisolda16250gut/tristanandisolda16250gut_archive.torrent\n");
		console.log("Example: node index.js download ./tristanandisolda16250gut_archive.torrent");
		break;	
}