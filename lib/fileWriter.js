/*
* This module will handle writing pieces to the right files
*/

function fileWriter (fileTree, piece, pieceIndex, pieceLength, callback) {
	if (typeof fileTree === 'undefined' ||
		typeof piece === 'undefined' ||
		typeof pieceIndex === 'undefined' ||
		typeof pieceLength === 'undefined' ||
		typeof callback === 'undefined') {
		
		return callback(new Error('Invalid pieceIndex or pieceLength'));
	}

	for (var i = 0; i < fileTree.length; i ++) {
		if (!fileTree[i].length || !fileTree[i].path || !fileTree[i].sha1) {
			return callback(new Error('The given fileTree doesn\'t have the required fields: length, path and sha1'));
		}
	}

	this.fileTree = fileTree;
	this.piece = piece;
	this.pieceIndex = pieceIndex;
	this.pieceLength = pieceLength;

	// var globalStartIndex = pieceIndex * pieceLength,
	// globalEndIndex = globalStartIndex + pieceLength;

}

fileWriter.prototype.seek_absolute_start_byte_index = function (callback) {
	return this.pieceIndex * this.pieceLength;
};

fileWriter.prototype.seek_absolute_end_byte_index = function (callback) {
	return (this.pieceIndex + 1) * this.pieceLength;
};

fileWriter.prototype.get_affected_files_indices = function (absolute_start, absolute_end, callback) {
	var affected_files = [],
		numberOfFiles = this.fileTree.length,
		currentLength = 0,
		minFile, maxFile;

	if (absolute_end < absolute_start) {
		return callback(new Error('The piece is empty'));
	}

	minFile = this.binarySearch(absolute_start, 0, numberOfFiles, callback);
	maxFile = this.binarySearch(absolute_end, minFile, numberOfFiles, callback);

	for (var i = minFile; i < maxFile + 1; i ++) {
		affected_files.push(i);
	}

	return affected_files;

};

fileWriter.prototype.write_to_file = function (destination_path, destination_start_index, source_start_index, source_end_index, callback) {

};

fileWriter.prototype.handle_piece = function (callback) {

};

fileWriter.prototype.binarySearch = function (absolute_byte_index, min, max, callback) {
	// test if array is empty
	if (max < min) {
		return callback(new Error ('binarySearch impossible with max < min'));
	}

	// test for out of bounds errors
	var totalBytesExpected = this.fileTree
						.map(function (file) {return file.length;})
						.reduce(function (previousValue, currentValue, index, array) {
							return previousValue + currentValue
						});

	if (absolute_byte_index < 0 || absolute_byte_index > totalBytesExpected) {
		return callback(new Error ('absolute index out of bounds'));
	}

	var mid = Math.floor((max - min) / 2) + min,
		currentIndex = this.fileTree
					.map(function (file) {return file.length;})
					.reduce(function (previousValue, currentValue, index, array) {
						if (index < mid) {
							return previousValue + currentValue
						} else {
							return previousValue;
						}
				});

	if (max - min > 1) {
		if (currentIndex > absolute_byte_index) {
			return this.binarySearch(absolute_byte_index, min, mid - 1);
		}

		if (currentIndex < absolute_byte_index) {
			return this.binarySearch(absolute_byte_index, mid + 1, max);
		}
	}

	return mid;
};


module.exports = fileWriter;
