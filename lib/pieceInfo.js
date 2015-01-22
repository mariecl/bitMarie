var fs = require('fs'),
	config = require('../config'),
	path = require('path'),
	download_path = config.download_path,
	err;

//TO DO: implement persistent storage to register downloaded files and pieces

/*
* Returns an object containing information of the current
* download state of a given torrentFile
*/

function PieceInfo (torrentInfo) {
	this.torrentInfo = torrentInfo;
	// Check that download path is valid, then check for '/torrentname'
	if(!download_path) {
		throw new Error('No download path specified');
	} else if (!fs.existsSync(path.resolve(download_path))) {
		throw new Error('Invalid path to download folder');
	} else {
		// this.path = path.join(download_path, this.torrentInfo.title);
		this.path = path.join(download_path, "iseult");
		// If download folder doesn't exist, initialize one
		if (!fs.existsSync(this.path)){
			this.init();
			return
		} else {
			console.log("Download already started.")
			// TO DO: Compute current state of download
			this.state = {downloaded: 1, uploaded: 0, left: 99};
			return
		}
	}
}

/*
* Initializes pieceInfo the first time the user tries to download the given torrent
*/

PieceInfo.prototype.init  = function () {
	fs.mkdirSync(this.path);

	// Case of a single file torrent
	if (this.torrentInfo.info.file) {
		// TODO: init sub file info
		// TODO: create one pieceinfo-like object for each file
		this.state = {
			downloaded: 0,
			uploaded: 0,
			left: this.torrentInfo.info['length']
		}

		return
	// Case of a multi-file torrent
	} else if (this.torrentInfo.info.files) {
		var fileCount,
			fileList,
			i,
			totalLength;
		
		// TODO: init sub file info
		// TODO: create one pieceinfo-like object for each file

		fileList = this.torrentInfo.info.files;
		
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

module.exports = PieceInfo;
