var fs = require('fs'),
	chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	fs_extra = require('fs-extra'),
	path  = require('path'),
	sinon = require('sinon'),
	appConfig = require('../config'),
	FileWriter = require('../lib/fileWriter'),
	fileTree, fw1, fw2, fw3, fw4, piece, callback;

describe('fileWriter', function (){
	beforeEach (function () {
		callback = function (err) {return console.log(err);};
		fileTree = [
	     	{ crc32: 'df7c43e9',
		    length: 80674,
		    md5: 'c3f6e4f2b1aba4e93be46cd8c94b42be',
		    mtime: '1120855682',
		    path: [ '16250-8.txt' ],
		    sha1: 'c373acf38628bc5568de0d1060954d83fb145511' },
		  { crc32: '94843af2',
		    length: 31981,
		    md5: 'e94f852a6ab750abf8cf4f7014b578f7',
		    mtime: '1120855684',
		    path: [ '16250-8.zip' ],
		    sha1: 'b9709a57f2a27e1b881c35063817e8764af1554c' },
		  { crc32: '2806eb57',
		    length: 924022,
		    md5: 'd324ea95ba46b2c302e75d742aeee228',
		    mtime: '1120855684',
		    path: [ '16250-h.zip' ],
		    sha1: '2bbf0f4b8793171d7530ef7496dc5c9a54b826c0' }
	    ];
	    fw1 = new FileWriter (fileTree, '/x00/x00', 0, 524288, callback);
		fw2 = new FileWriter (fileTree, '/x00/x00', 1, 524288, callback);
		fw3 = new FileWriter (fileTree, '/x00/x00', 2, 524288, callback);
		fw4 = new FileWriter(fileTree, '/x00/x00', 18, 50000, callback);
	});

	describe('#fileWriter.seek_absolute_start_byte_index()', function () {
		it('should return a number', function () {
			assert.isDefined(fw1.seek_absolute_start_byte_index(), "should return true")
			assert.isNumber(fw1.seek_absolute_start_byte_index(), "should return true")
			assert.isDefined(fw2.seek_absolute_start_byte_index(), "should return true")
			assert.isNumber(fw2.seek_absolute_start_byte_index(), "should return true")
			assert.isDefined(fw3.seek_absolute_start_byte_index(), "should return true")
			assert.isNumber(fw3.seek_absolute_start_byte_index(), "should return true")
		});

		it('should be computed properly', function() {
			assert.strictEqual(fw1.seek_absolute_start_byte_index(), 0, "should return 0");
			assert.strictEqual(fw2.seek_absolute_start_byte_index(), 524288, "should return 524288");
			assert.strictEqual(fw3.seek_absolute_start_byte_index(), 1048576, "should return 1048576");			
		})
	});

	describe('#fileWriter.seek_absolute_end_byte_index()', function () {
		it('should return a number', function () {
			assert.isDefined(fw1.seek_absolute_end_byte_index(), "fw1: should return true")
			assert.isNumber(fw1.seek_absolute_end_byte_index(), "fw1: should return true")
			assert.isDefined(fw2.seek_absolute_end_byte_index(), "fw2: should return true")
			assert.isNumber(fw2.seek_absolute_end_byte_index(), "fw2: should return true")
			assert.isDefined(fw3.seek_absolute_end_byte_index(), "fw3: should return true")
			assert.isNumber(fw3.seek_absolute_end_byte_index(), "fw3: should return true")
		});

		it('should be computed properly', function() {
			assert.strictEqual(fw1.seek_absolute_end_byte_index(), 524288, "fw1: should return 524288");
			assert.strictEqual(fw2.seek_absolute_end_byte_index(), 1048576, "fw2: should return 1048576");
			assert.strictEqual(fw3.seek_absolute_end_byte_index(), 1572864, "fw3: should return 1572864");			
		})
	});

	describe('#fileWriter.get_affected_files_indices()', function () {
		it('should return an array', function () {
			assert.isDefined(fw1.get_affected_files_indices(0, 524288, callback), "fw1: should return true")
			assert.isArray(fw1.get_affected_files_indices(0, 524288, callback), "fw1: should return true")
			assert.isDefined(fw4.get_affected_files_indices(524288, 1048576, callback), "fw2: should return true")
			assert.isArray(fw4.get_affected_files_indices(524288, 1048576, callback), "fw2: should return true")

		});

		it('should be computed properly', function() {
			assert.deepEqual(fw1.get_affected_files_indices(0, 524288, callback), [0, 1, 2], "fw1: should return [0, 1, 2]");
			assert.deepEqual(fw4.get_affected_files_indices(850000, 900000, callback), [2], "fw4: should return [2]");			
		})

		it('should throw an error if the given absolute index is out of bounds', function () {
			fw2.get_affected_files_indices(524288, 1048576, function (err) {
				expect(err).to.exist
				.and.be.instanceof(Error)
				.and.have.property('message', 'absolute index out of bounds');
			});
			fw3.get_affected_files_indices(1048576, 1572864, function (err) {
				expect(err).to.exist
				.and.be.instanceof(Error)
				.and.have.property('message', 'absolute index out of bounds');
			});
		});
	});

	describe('#fileWriter.handle_piece()', function () {
		it('should throw an error if the list of affected pieces is empty', function () {
			fw2.handle_piece(function (err) {
				expect(err).to.exist
				.and.be.instanceof(Error)
				.and.have.property('message', 'No file to write to');
			});
		});

		it('should trigger write_to_file', function () {
			var spy = sinon.spy(FileWriter.prototype, 'write_to_file');
			fw1.handle_piece(callback);
			assert(spy.called, 'it should call fileWriter.write_to_file');
			assert.equal(spy.callCount, 3, 'it should need to write to 3 different files')
		});
	})
});

