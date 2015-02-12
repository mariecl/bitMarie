var assert = require('chai').assert,
	sinon = require('sinon'),
	request = require('request'),
	torrentFileDownloader = require('../lib/torrentFileDownloader');

describe('torrentFileDownloader', function () {
	it ('#downloadFromURL', function () {
		var spy = sinon.spy(torrentFileDownloader, 'downloadFromURL');
		var URL = 'http://www.test.com.torrent';
		var stub = sinon.stub(request, 'get');
		
		torrentFileDownloader(URL)(URL);

		assert(spy.called, 'it should run downloadFromURL');

	});

	it ('#downloadFromPath', function () {
		var spy = sinon.spy(torrentFileDownloader, 'downloadFromPath');
		var path = './archlinux.torrent';

		torrentFileDownloader(path)(path);

		assert(spy.called, 'it should run downloadFromPath');
	});
})

