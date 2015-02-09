var assert = require('chai').assert,
	downloader = require('../lib/downloader');

describe('downloader', function () {
	it.only ('#downloadFromURL', function () {
		var wasRun = false;
		
		// overwrite downloadFromURL to make sure the function was called
		downloader.downloadFromURL = function () {
			wasRun = true;
		}
		
		downloader('http://www.test.com.torrent');

		assert.equal(wasRun, true, 'it should run downloadFromURL');
	})
})

