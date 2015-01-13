var fs = require('fs'),
	chai = require('chai'),
	assert = chai.assert,
	expect = chai.expect,
	fs_extra = require('fs-extra'),
	path  = require('path'),
	request = require('request'),
	appConfig = require('../config'),
	PieceInfo = require('../lib/pieceInfo'),
	decodedTorrentFile, piece, path_to_clear, err;

decodedTorrentFile = { 
	announce: 'http://bt1.archive.org:6969/announce',
	'announce-list': [
		[ 'http://bt1.archive.org:6969/announce' ],
     	[ 'http://bt2.archive.org:6969/announce' ]
     ],
  	comment: 'This content hosted at the Internet Archive at http://archive.org/details/tristanandisolda16250gut\nFiles may have changed, which prevents torrents from downloading correctly or completely; please check for an updated torrent at http://archive.org/download/tristanandisolda16250gut/tristanandisolda16250gut_archive.torrent\nNote: retrieval usually requires a client that supports webseeding (GetRight style).\nNote: many Internet Archive torrents contain a \'pad file\' directory. This directory and the files within it may be erased once retrieval completes.\nNote: the file tristanandisolda16250gut_meta.xml contains metadata about this torrent\'s contents.',
  	'created by': 'ia_make_torrent',
  	'creation date': 1417621541,
  	info: 
	   { collections: [ 'org.archive.tristanandisolda16250gut' ],
	     files: [
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
		    sha1: '2bbf0f4b8793171d7530ef7496dc5c9a54b826c0' },
		  { crc32: '846e5006',
		    length: 80744,
		    md5: 'b7697d992973b3aa292a88be786a659a',
		    mtime: '1120855682',
		    path: [ '16250.txt' ],
		    sha1: '185e8c895da848b83d290cf1b12fb4fe30b0e8cc' },
		  { crc32: '9b7b3356',
		    length: 31960,
		    md5: 'b8d39cda7a1818913e5a45a0408f117d',
		    mtime: '1120855684',
		    path: [ '16250.zip' ],
		    sha1: '9353fe16a0acebec24621198f9611ea0ffbf4212' },
		  { crc32: '83cf738b',
		    length: 755,
		    md5: '2e14d9c22a6f64bf9726a8dab2f7b562',
		    mtime: '1165543630',
		    path: [ 'tristanandisolda16250gut_meta.xml' ],
		    sha1: 'fb81a38cc008a000701e34a845eada4ea68804d5' },
		  { crc32: '4dc7a93a',
		    length: 99895,
		    md5: '2f58aa36518bc1df7977278e564b463a',
		    mtime: '1120855682',
		    path: [ '16250-h', '16250-h.htm' ],
		    sha1: '642927b0b90bc860ada5be1d33d74c794ba504c0' },
		  { crc32: '5170117',
		    length: 41712,
		    md5: '905a1dd98e348399d45ae857f9741090',
		    mtime: '1120846906',
		    path: [ '16250-h', 'images', 'music0007.png' ],
		    sha1: '63f9cf64956a682369cc2475238bca58d4483f17' },
		  { crc32: 'd616873b',
		    length: 36415,
		    md5: 'ea15078f093bd22d579079cfd15ffc22',
		    mtime: '1120846932',
		    path: [ '16250-h', 'images', 'music0007_t.png' ],
		    sha1: '468bf99a366f964e868a2112796681e8b311c35c' },
		  { crc32: 'f5cf2844',
		    length: 33783,
		    md5: '0fa7a6daa701d0f663969ddaf7b621a7',
		    mtime: '1120847770',
		    path: [ '16250-h', 'images', 'music0028.png' ],
		    sha1: '84cd72b2eb8f9230b1f50670c61ddbb3ef7dfe49' },
		  { crc32: 'd5d4fe5c',
		    length: 30454,
		    md5: 'b03490d1115dfc714956318e7b2d9b5c',
		    mtime: '1120847718',
		    path: [ '16250-h', 'images', 'music0028_t.png' ],
		    sha1: 'd90bffb8012a89281603ccf66d959637dc531300' },
		  { crc32: 'b913ea8d',
		    length: 54901,
		    md5: '02f52a42b6e2b15c47ec2f040ee34a8e',
		    mtime: '1120847800',
		    path: [ '16250-h', 'images', 'music0029.png' ],
		    sha1: '89f8dfe5f5489b4ca594d1ab37f4e0c7f3a92384' },
		  { crc32: '24481c98',
		    length: 52170,
		    md5: 'bfa2ac2b30d4dd5277a5f7b4798a0f08',
		    mtime: '1120847822',
		    path: [ '16250-h', 'images', 'music0029_t.png' ],
		    sha1: '396b8a73f2068fd02f30c57eca38ec9d7cc78613' },
		  { crc32: 'fc9051f3',
		    length: 68550,
		    md5: '538cf2101cc8a859a2247d5a0e5128dd',
		    mtime: '1120848274',
		    path: [ '16250-h', 'images', 'music0050.png' ],
		    sha1: 'a1f2f1bccb8569867df699894b715415c2352dfe' },
		  { crc32: 'a73800f',
		    length: 62020,
		    md5: 'dcd9eb28db5791287a01fa6c65ce73f3',
		    mtime: '1120848288',
		    path: [ '16250-h', 'images', 'music0050_t.png' ],
		    sha1: '9f5ef750ada5da51e81be9ed73099d475a0d5e6e' },
		  { crc32: 'f73eb15f',
		    length: 89749,
		    md5: '574c8ee5b766e2ab1d39ce5a553f8cc1',
		    mtime: '1120848352',
		    path: [ '16250-h', 'images', 'music0051.png' ],
		    sha1: '2bb65c015fbd734f49b05118fe867cb2a436cd2f' },
		  { crc32: '675e524b',
		    length: 82579,
		    md5: 'a9879a7ddba8e06020d7d4cb2037037d',
		    mtime: '1120848368',
		    path: [ '16250-h', 'images', 'music0051_t.png' ],
		    sha1: '4d22452017f7653173e30b55184f1a3d582bec26' },
		  { crc32: 'c6e8d6d5',
		    length: 50519,
		    md5: 'edc5ba4d1ac4421aeb99b1325f68d585',
		    mtime: '1120848406',
		    path: [ '16250-h', 'images', 'music0052.png' ],
		    sha1: 'c0735633f95c10a1dbfb737304133fbb7f20d574' },
		  { crc32: '6fe44893',
		    length: 46647,
		    md5: '7ae1cdf57b1fdcc0ab3ea40bc726aad9',
		    mtime: '1120848420',
		    path: [ '16250-h', 'images', 'music0052_t.png' ],
		    sha1: 'fc96371ea9be03184b6f1aa53b01b722719ae795' },
		  { crc32: 'f28f82b9',
		    length: 14136,
		    md5: '9b44028af461b5874dddaca9e29367e5',
		    mtime: '1120848886',
		    path: [ '16250-h', 'images', 'music0065.png' ],
		    sha1: '9c431cbc7e1a90408602c218c810f0f32b239b46' },
		  { crc32: '76aef091',
		    length: 14135,
		    md5: '1d0aad38763ec68b891ebd50ac465fc4',
		    mtime: '1120848898',
		    path: [ '16250-h', 'images', 'music0065_t.png' ],
		    sha1: '7aa43355c66d9f9799820300de8f65d7d3ee2605' },
		  { crc32: '9bb727ec',
		    length: 74647,
		    md5: 'c0aecb7ef4619b572041dc5d49c22763',
		    mtime: '1120848954',
		    path: [ '16250-h', 'images', 'music0066.png' ],
		    sha1: 'c0c781825186e309f3b6ac83932ffe265bb16fea' },
		  { crc32: 'a917acc4',
		    length: 43372,
		    md5: '93fa9a3746da18bd78c42e8ae7c5a36d',
		    mtime: '1120848966',
		    path: [ '16250-h', 'images', 'music0066_t.png' ],
		    sha1: '22a745532e061ba04427d07e4569435238e52027' },
		  { crc32: 'e7e48b0',
		    length: 108060,
		    md5: '84c6e6bbf7725b19ea50fb2cf26207fb',
		    mtime: '1120849632',
		    path: [ '16250-h', 'images', 'title.png' ],
		    sha1: '0ed086455f3d2d3e498ae2485a1fa563e74e7cd6' }
		],
		name: 'tristanandisolda16250gut',
	    'piece length': 524288,
	    pieces: '\u0019�\u001a4�\b�������/�������\u00119�W򰫊���1Uc��\u0014���)�����U�xY�2�PD�wy\u001a�Fi\t�S�\f����q0\u0001�8��\bR\b�Ƨ0P��hŢ\be��q\'K\u0015'
		},
	locale: 'en',
	title: 'tristanandisolda16250gut',
	'url-list': [
		'http://archive.org/download/',
	    'http://ia600600.us.archive.org/9/items/',
	    'http://ia700600.us.archive.org/9/items/'
	]
};

describe('pieceInfo', function(){
	before (function() {
		path_to_clear = path.join(appConfig.download_path, decodedTorrentFile.title);
		if (fs.existsSync(path_to_clear)) {
			fs_extra.removeSync(path_to_clear);
		}
	});

	beforeEach(function(){
		piece = new PieceInfo (decodedTorrentFile);
	});

	after(function() {
		fs_extra.removeSync(path_to_clear);
	});
	
	describe('#pieceInfo()', function(){
		it('should call initPieceInfo() when it is the first contact to the torrent', function() {
			assert.strictEqual(piece.state.downloaded, 0, "First contact to torrent: file should not have been downloaded");
			assert.strictEqual(piece.state.uploaded, 0, "Uploading not implemented");
			assert.strictEqual(piece.state.left, 2153880, "First contact to torrent: everything has yet to be downloaded");
			assert.strictEqual(fs.existsSync(piece.path), true, "Should result in creating a specific download folder");
		});

		it('should create a folder for the new torrent file', function() {
			assert.strictEqual(fs.existsSync(piece.path), true, "Should result in creating a specific download folder");
		});

		it('should return the current state when it is not the first contact to the torrent', function() {
			assert.strictEqual(piece.state.downloaded, 1, "First contact to torrent: file should not have been downloaded");
			assert.strictEqual(piece.state.uploaded, 0, "Uploading not implemented");
			assert.strictEqual(piece.state.left, 99, "First contact to torrent: everything has yet to be downloaded");
		});
	});
});

describe('initPieceInfo - error', function() {
	before(function () {
		decodedTorrentFile = { 
			announce: 'http://bt1.archive.org:6969/announce',
			'announce-list': [
				[ 'http://bt1.archive.org:6969/announce' ],
				[ 'http://bt2.archive.org:6969/announce' ]
			],
			comment: 'This content hosted at the Internet Archive at http://archive.org/details/tristanandisolda16250gut\nFiles may have changed, which prevents torrents from downloading correctly or completely; please check for an updated torrent at http://archive.org/download/tristanandisolda16250gut/tristanandisolda16250gut_archive.torrent\nNote: retrieval usually requires a client that supports webseeding (GetRight style).\nNote: many Internet Archive torrents contain a \'pad file\' directory. This directory and the files within it may be erased once retrieval completes.\nNote: the file tristanandisolda16250gut_meta.xml contains metadata about this torrent\'s contents.',
			'created by': 'ia_make_torrent',
			'creation date': 1417621541,
			info: {
				collections: [ 'org.archive.tristanandisolda16250gut' ],
				name: 'tristanandisolda16250gut',
				'piece length': 524288,
				pieces: '\u0019�\u001a4�\b�������/�������\u00119�W򰫊���1Uc��\u0014���)�����U�xY�2�PD�wy\u001a�Fi\t�S�\f����q0\u0001�8��\bR\b�Ƨ0P��hŢ\be��q\'K\u0015'
			},
			locale: 'en',
			title: 'tristanandisolda16250gut',
			'url-list': [
				'http://archive.org/download/',
				'http://ia600600.us.archive.org/9/items/',
				'http://ia700600.us.archive.org/9/items/'
			]
		};
		path_to_clear = path.join(appConfig.download_path, decodedTorrentFile.title);
	});

	after(function() {
		fs_extra.removeSync(path_to_clear);
	});

	describe('#initPieceInfo()', function() {
		it ('should throw an error', function () {
			expect(function() {new PieceInfo(decodedTorrentFile);}).to.throw('Torrent not properly formatted');
		});
	});
});



