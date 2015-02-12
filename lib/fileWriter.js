/*
* This module will handle writing pieces to the right files
*/

var fs = require('fs'),
	path = require('path');

function fileWriter (fileTree, parentPath, dataBuffer, pieceIndex, pieceLength, callback) {
	if (typeof fileTree === 'undefined' ||
		typeof parentPath === 'undefined' ||
		typeof dataBuffer === 'undefined' ||
		typeof pieceIndex === 'undefined' ||
		typeof pieceLength === 'undefined' ||
		typeof callback === 'undefined') {
		
		return callback(new Error('Invalid data passed to FileWriter'));
	}

	// verify that fileTree has the required fields
	for (var i = 0; i < fileTree.length; i ++) {
		if (!fileTree[i].length || !fileTree[i].path || !fileTree[i].sha1) {
			return callback(new Error('The given fileTree doesn\'t have the required fields: length, path and sha1'));
		}
	}

	this.fileTree = fileTree;
	this.parentPath = parentPath;
	this.dataBuffer = dataBuffer;
	this.pieceIndex = pieceIndex;
	this.pieceLength = pieceLength;
	this.filesList = this.get_affected_files_indices(this.seek_absolute_start_byte_index(callback), this.seek_absolute_end_byte_index(callback), callback);

}

fileWriter.prototype.seek_absolute_start_byte_index = function (callback) {
	return this.pieceIndex * this.pieceLength;
};

fileWriter.prototype.seek_absolute_end_byte_index = function (callback) {
	return (this.pieceIndex + 1) * this.pieceLength;
};

fileWriter.prototype.seek_relative_start_byte_index = function (absolute_start, fileIndex, callback) {
	var start_of_file = this.fileTree
						.map(function (file) {return file.length;})
						.reduce(function (previousValue, currentValue, index, array) {
							if (index < fileIndex) {
								return previousValue + currentValue;
							
							} else {
								return previousValue;
							}

						}, 0);
	
	// The piece overlaps several files
	if (start_of_file > absolute_start) {
		return 0;

	} else {
		return absolute_start - start_of_file;
	}

};

fileWriter.prototype.seek_relative_end_byte_index = function (absolute_end, fileIndex, callback) {
	var end_of_file = this.fileTree
						.map(function (file) {return file.length;})
						.reduce(function (previousValue, currentValue, index, array) {
							if (index <= fileIndex) {
								return previousValue + currentValue;
							
							} else {
								return previousValue;
							}

						}, 0);

	// The piece overlaps several files
	if (absolute_end > end_of_file) {
		return this.fileTree[fileIndex].length;

	} else {
		return end_of_file - absolute_end; 
	}

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


/*fs.write(fd, buffer, offset, length[, position], callback)#
* Write buffer to the file specified by fd.
* @offset and length determine the part of the buffer to be written.
* @position refers to the offset from the beginning of the file where this data should be written.
* If typeof position !== 'number', the data will be written at the current position. See pwrite(2).
* @callback will be given three arguments (err, written, buffer)
* where written specifies how many bytes were written from buffer.
*/

fileWriter.prototype.write_to_file = function (destination_path, source_start_index, length, destination_start, callback) {	
	if (destination_path.length < 1) {
		throw new Error ('FileWriter: destination_path is invalid');
	}

	var pathToFile = this.parentPath,
		dataBuffer = this.dataBuffer;

	if (destination_path.length > 1) {
		for (var i = 0; i < destination_path.length - 1; i ++) {
			pathToFile = path.join(pathToFile, destination_path[i]);
		}
	}

	// check if path exists / or create it
	if (!fs.existsSync(pathToFile)){
		fs.mkdirSync(pathToFile);
	}

	// check if the file exists // create it
	pathToFile = path.join(pathToFile, destination_path[destination_path.length - 1]);

	if (!fs.existsSync(pathToFile)) {
		var writeStream = fs.createWriteStream(pathToFile, {
			flags: 'w',
			mode: 0666,
			start: destination_start,
			end: destination_start + length,
		});
		
		writeStream.on('error', function (err) {
			throw new Error('Could not create file: ' + err);
		});
		
		writeStream.on('open', function (file_descriptor) {
			fs.write(file_descriptor, dataBuffer);
		});
		
		writeStream.end();

	} else {
		fs.open(pathToFile, 'r+', function (err, file_descriptor) {
			fs.write(file_descriptor, dataBuffer, 0, length, destination_start, function (err) {
				if (err) {
					throw new Error ('Could not write to file: ' + err);
				} else {
					fs.close(file_descriptor, function () {});
				}
			});
		});
	}
	// TODOcheck sha1 sum of file
	callback();
};

fileWriter.prototype.handle_piece = function (callback) {
	if (this.filesList.length < 1) {
		return callback(new Error('No file to write to'));
	}

	var file_index = this.filesList[0],
		file = this.fileTree[file_index],
		relative_start = this.seek_relative_start_byte_index(),
		relative_end = this.seek_relative_end_byte_index(),
		length = relative_end - relative_start;

	this.write_to_file(file.path, 0, length, relative_start, function () {
		this.dataBuffer.slice(length)
		this.filesList.shift();
		
		if (this.filesList.length > 0) {
			this.handle_piece(callback);
		}

	}.bind(this));
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
