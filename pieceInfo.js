var fs = require('fs'),
	config = require('./config'),
	download_path = config.download_path;

//TO DO: implement persistent storage to register downloaded files and pieces

/*
* Returns an object containing information of the current
* download state of a given torrentFile
*/

function pieceInfo (torrentInfo) {
	var path;

	// Check that download path is valid, then check for '/torrentname'
	if(!download_path) {
		throw new Error('Specified download path is not valid')
	} else {
		path = download_path + torrentInfo.title;
		// If download folder doesn't exist, initialize one
		if (!fs.existsSync(path)){
			return initPieceInfo(torrentInfo);
		} else {
			console.log("Download already started.")
			// TO DO: Compute current state of download
			return {downloaded: 1, uploaded: 0, left: 99};
		}
	}
}

/*
* Initializes pieceInfo the first time the user tries to download the given torrent
*/

function initPieceInfo (torrentInfo) {
	var path = download_path + torrentInfo.title;
	// Create download folder using specified download path
	// TODO: use a more proper structure cf http://stackoverflow.com/questions/21194934/node-how-to-create-a-directory-if-doesnt-exist
	if (!fs.existsSync(path)){
	    fs.mkdirSync(path);
	} else {
		throw new Error('Torrent already downloaded.');
	}
	// Case of a single file torrent
	if (torrentInfo.info.file) {
		//TODO: init sub file info
		//TODO: create one pieceinfo-like object for each file
		return {
			downloaded: 0,
			uploaded: 0,
			left: torrentInfo.info['length']
		}
	
	// Case of a multi-file torrent
	} else if (torrentInfo.info.files) {
		var fileCount,
			fileList,
			i,
			totalLength;
		//TODO: init sub file info
		//TODO: create one pieceinfo-like object for each file

		fileList = torrentInfo.info.files;
		
		
		return {
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
	// Case of a wrongly formated torrent
	} else {
		throw new Error('Torrent not properly formatted');
	}
}

module.exports = pieceInfo;
