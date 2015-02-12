var crypto = require('crypto'),
	fs = require('fs'),
	path = require('path'),
	bencode = require('bencode'),
	config = require('../config'),
	download_path = config.download_path,
	utils = require('../utils/utils');

//TO DO: implement persistent storage to register downloaded files and pieces

/*
* Returns an object containing information of the current
* download state of a given torrentFile
* @decodedMetaInfo: decoded meta info file for the current torrent file
*/

function PieceInfo (decodedMetaInfoFile) {
	// TODO: take all the relevant information out of the file, then stop
	// storing the full decoded meta info file.
	this.torrentObject = decodedMetaInfoFile;
	this.pieceLength = decodedMetaInfoFile.info['piece length'];

	// For identification purposes to tracker and other peers
	this.sha1_info_hash = utils.sha1(bencode.encode(this.torrentObject.info));
	this.sha1_peer_id = utils.sha1(generatePeer_id());
	this.URLencoded_info_hash = utils.computeURLEncodedHash(bencode.encode(this.torrentObject.info));
	this.URLencoded_peer_id = utils.computeURLEncodedHash(generatePeer_id());

	// Initialize info for download and communication with peers
	this.piecesTable = this.piecesTable || this.init_piecesTable();
	this.numberOfPieces = this.torrentObject.info.pieces.length / 20; //Pieces is the concatenation of 20-byte SHA1 sum strings
	this.bitfield = this.bitfield || this.init_bitfield();
	this.transitfield = this.transitfield || this.init_transitfield();

	// Single or mulitple-file torrent
	this.multipleFileTorrent = (decodedMetaInfoFile.info.files) ? true : false;

	// Check that download path is valid, then check for '/torrentname'
	if(!download_path) {
		throw new Error('No download path specified');
	} else if (!fs.existsSync(path.resolve(download_path))) {
		throw new Error('Invalid path to download folder');
	} else {
		this.path = path.join(download_path.toString(), this.torrentObject.info.name.toString());

		// If download folder doesn't exist, initialize one
		if (!fs.existsSync(this.path)){
			console.log("New download.");
			fs.mkdirSync(this.path);
			this.init_state();
			return
		} else {
			console.log("Download already started.");
			// TO DO: Compute current state of download -> this.state = computeCurrentState();
			this.state = {downloaded: 1, uploaded: 0, left: 99};
			return
		}
	}
}

/*
* Initializes pieceInfo the first time the user tries to download the given torrent
*/

PieceInfo.prototype.init_state  = function () {
	if (this.multipleFileTorrent) {
		var fileCount,
			fileList,
			totalLength;

		fileList = this.torrentObject.info.files;
		
		this.state = {
			downloaded: 0,
			uploaded: 0,
			left: fileList
					.map(function(currentValue, index, array){
						return currentValue['length']
					}).reduce(function(previousValue, currentValue, index, array) {
							return previousValue + currentValue;
					},
					0)
		}
		return

	} else {
		this.state = {
			downloaded: 0,
			uploaded: 0,
			left: this.torrentObject.info['length']
		}
		return
	}
}

/*
* Returns a key / value object with:
* - key: piece index
* - value: sha1 sum of the key piece
*/
PieceInfo.prototype.init_piecesTable = function () {
	var piecesTable = {},
		length = this.torrentObject.info.pieces.length;

	for (var index = 0; index + 20 <= length; index += 20) {
		piecesTable[index] = this.torrentObject.info.pieces.slice(index, index + 20);
	}

	return piecesTable;
};

/*
* Initializes bitfield to an array holding as many zeros as there are pieces to be downloaded
*/
PieceInfo.prototype.init_bitfield = function () {
	var bitfield = [],
		length = Object.keys(this.piecesTable).length;

	for (var index = 0; index < length; index ++) {
		bitfield.push(0);
	}

	return bitfield;
};

/*
* Initializes bitfield to an array holding as many zeros as there are pieces to be downloaded
*/
PieceInfo.prototype.init_transitfield = function () {
	var transitfield = [],
		length = Object.keys(this.piecesTable).length;

	for (var index = 0; index < length; index ++) {
		transitfield.push(0);
	}

	return transitfield;
};

/*
* Uses Azureus-style convention for generating a peer_id
*/
function generatePeer_id () {
	// '-' followed by two characters for client id
	var peer_id = "-AM";

	// four ascii digits for version number
	peer_id += "1989"; 
	// '-'
	peer_id += "-";

	// followed by random numbers based on timestamp at startup
	var current_date = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	peer_id += utils.sha1(current_date + random);

	return peer_id;
}

module.exports = PieceInfo;
