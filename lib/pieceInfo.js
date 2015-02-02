var crypto = require('crypto'),
	fs = require('fs'),
	path = require('path'),
	bencode = require('bencode'),
	config = require('../config'),
	download_path = config.download_path,
	err;

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

	// For identification purposes to tracker and other peers
	this.sha1_info_hash = sha1(bencode.encode(this.torrentObject.info));
	this.sha1_peer_id = sha1(generatePeer_id());
	this.URLencoded_info_hash = computeURLEncodedHash(bencode.encode(this.torrentObject.info));
	this.URLencoded_peer_id = computeURLEncodedHash(generatePeer_id());

	// Initialize info for download and communication with peers
	this.piecesTable = this.piecesTable || this.init_piecesTable();
	this.numberOfPieces = this.torrentObject.info.pieces.length / 20; //Pieces is the concatenation of 20-byte SHA1 sum strings
	this.bitfield = this.bitfield || this.init_bitfield();

	// Check that download path is valid, then check for '/torrentname'
	if(!download_path) {
		throw new Error('No download path specified');
	} else if (!fs.existsSync(path.resolve(download_path))) {
		throw new Error('Invalid path to download folder');
	} else {
		// this.path = path.join(download_path, this.torrentObject.title);
		this.path = path.join(download_path, "iseult");
		// If download folder doesn't exist, initialize one
		if (!fs.existsSync(this.path)){
			console.log("New download.");
			this.init_folder();
			return
		} else {
			console.log("Download already started.");
			// TO DO: Compute current state of download
			this.state = {downloaded: 1, uploaded: 0, left: 99};
			return
		}
	}
}

/*
* Initializes pieceInfo the first time the user tries to download the given torrent
*/

PieceInfo.prototype.init_folder  = function () {
	fs.mkdirSync(this.path);

	// Case of a single file torrent
	if (this.torrentObject.info.file) {

		this.state = {
			downloaded: 0,
			uploaded: 0,
			left: this.torrentObject.info['length']
		}

		return
	// Case of a multi-file torrent
	} else if (this.torrentObject.info.files) {
		var fileCount,
			fileList,
			i,
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
	// Case of a wrongly formated torrent
	} else {
		throw new Error('Torrent not properly formatted');
	}
}

/*
* Holds key / value object with:
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
	peer_id += sha1(current_date + random);

	return peer_id;
}

/*
* Returns a 20-byte SHA1 hash of the input value as a buffer
*/
// TODO: move to utils file
function sha1 (inputValue) {
	return crypto.createHash('sha1').update(inputValue).digest();
}

/*
* Returns a 20-byte SHA1 hash of the input value as a hex string
*/
// TODO: move to utils file
function sha1hex (inputValue) {
	return crypto.createHash('sha1').update(inputValue).digest('hex');
}

/*
* Returns a urlencoded 20-byte SHA1 hash of the given value.
*/
// TODO: move to utils file
function computeURLEncodedHash (data) {
	var hash = sha1hex(data);
	var info_hash = "";

	for (var i = 0; i < hash.length; i += 2) {
		var charCode = parseInt(hash.substr(i, 2), 16); // character code in unicode 
														// 16 -> to read from hex to int
		
		if (charCode <= 127) {
			var encodedChar = encodeURIComponent(String.fromCharCode(charCode));

			if (encodedChar.charAt(0) == "%") {
				info_hash += encodedChar.toLowerCase();
			} else {
				info_hash += encodedChar;
			}
		} else {
			info_hash += "%" + hash.substr(i, 2); // stays in hex
		}
	}
	
	return info_hash;
}

module.exports = PieceInfo;
