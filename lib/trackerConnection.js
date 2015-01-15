var bencode = require('bencode'),
	config = require('../config'), 
	crypto = require('crypto'),
	PieceInfo = require('./pieceInfo'),
	querystring = require('querystring'),
	request = require('request'),
	trackerConnection, testString;

trackerConnection = function (torrentObject) {
	var currentState, queryParameters, trackerUrl;
	this.piece = new PieceInfo (torrentObject);
	currentState = this.piece.state;
	// console.log(hex2urlencode(sha1(testString.substr(0,4468))));
	// console.log(testString.substr(4467, 1));

	/*
	* Proper tracker request that needs to be fixed.
	*/
	/*queryParameters = {
		info_hash: encodeURIComponent(sha1(bencode.encode(this.piece.torrentInfo.info, 'binary'))),
		peer_id: sha1(generatePeer_id()),
		port: config.port,
		uploaded: currentState.uploaded,
		downloaded: currentState.downloaded,
		left: currentState.left,
		compact: 1,
		no_peer_id: 1,
		event: 'started' // for initial tracker request
	};
	*/

	/*
	* Temporary tracker request using data from Wireshark capture
	* (namely info_hash and hashed part of the peer_id)
	*/
	queryParameters = 
		'info_hash' + '=' + 'S%aa%90%5eK%f7%89d%22%01%0a%c2i%d7Yoz%24%0cg' + '&' +
		'peer_id' + '=' + '-AM1989-A%8e%3a%85%887%7f%afs%f8%60%da' + '&' +
		'port' + '=' + config.port + '&' +
		'uploaded' + '=' + currentState.uploaded + '&' +
		'downloaded' + '=' + currentState.downloaded + '&' +
		'left' + '=' + currentState.left + '&' +
		'compact' + '=' + 1 + '&' +
		'no_peer_id' + '=' + 1 + '&' +
		'event' + '=' + 'started'; // for initial tracker request

	// Most torrent files have an announce-list key & an annouce key
	// but some only have the announce key
	trackerUrl = piece.torrentInfo['announce-list'] ? piece.torrentInfo['announce-list'][0] : piece.torrentInfo.announce;

	request({
		method: "GET",
		url: trackerUrl + "?" + queryParameters,
		//url: trackerUrl + "?" + querystring.stringify(queryParameters),
		encoding: null // If null, the body is returned as a Buffer.
	}, function (error, response, body) {
		if (error || response.statusCode !== 200) {
			console.log("Error: " + error);
			console.log(response.statusCode);
			return;
		} else {
			//decode the bencoded buffer
			console.log("- DECODED BODY -");
			return console.log(bencode.decode(body, 'utf8'));
		}
	})
}

/*
* Uses Azureus-style convention for generating a peer_id
*/
// TO-DO: generate it only once on client start-up then re-use it
function generatePeer_id() {
	// '-', two characters for client id
	var peer_id = "-AM";

	// four ascii digits for version number
	peer_id += "0000"; 
	// '-'
	peer_id += "-";

	// followed by random numbers based on timestamp at startup
	peer_id += Date.now().toString();

	return peer_id;
}

/*
* Returns a 20-byte SHA1 hash of the input value
*/
// TODO: move to utils file
function sha1 (inputValue) {
	return crypto.createHash('sha1').update(new Buffer (inputValue, 'binary')).digest('hex');
}

/*
* Returns an array containing 'len'-long substrings of the original string
*/
// TODO: move to utils file
function chopUp (s, len) {
	var l = [];
	while (s != '') {
		l.push(s.substr(0, len));
		s = s.substr(len);
	}
	return l;
}

/*
* Takes a hex encoded string and URL encodes it using the bitTorrent standard
*/
// TODO: move to utils file
function hex2urlencode (s) {
	return chopUp(s, 2).map(function(c) {return '%' + c }).join('');
}

// Bencoded "info" dictionnary.
testString = "d11:collectionsl36:org.archive.tristanandisolda16250gute5:filesld5:crc328:df7c43e96:lengthi80674e3:md532:c3f6e4f2b1aba4e93be46cd8c94b42be5:mtime10:11208556824:pathl11:16250-8.txte4:sha140:c373acf38628bc5568de0d1060954d83fb145511ed5:crc328:94843af26:lengthi31981e3:md532:e94f852a6ab750abf8cf4f7014b578f75:mtime10:11208556844:pathl11:16250-8.zipe4:sha140:b9709a57f2a27e1b881c35063817e8764af1554ced5:crc328:2806eb576:lengthi924022e3:md532:d324ea95ba46b2c302e75d742aeee2285:mtime10:11208556844:pathl11:16250-h.zipe4:sha140:2bbf0f4b8793171d7530ef7496dc5c9a54b826c0ed5:crc328:846e50066:lengthi80744e3:md532:b7697d992973b3aa292a88be786a659a5:mtime10:11208556824:pathl9:16250.txte4:sha140:185e8c895da848b83d290cf1b12fb4fe30b0e8cced5:crc328:9b7b33566:lengthi31960e3:md532:b8d39cda7a1818913e5a45a0408f117d5:mtime10:11208556844:pathl9:16250.zipe4:sha140:9353fe16a0acebec24621198f9611ea0ffbf4212ed5:crc328:83cf738b6:lengthi755e3:md532:2e14d9c22a6f64bf9726a8dab2f7b5625:mtime10:11655436304:pathl33:tristanandisolda16250gut_meta.xmle4:sha140:fb81a38cc008a000701e34a845eada4ea68804d5ed5:crc328:4dc7a93a6:lengthi99895e3:md532:2f58aa36518bc1df7977278e564b463a5:mtime10:11208556824:pathl7:16250-h11:16250-h.htme4:sha140:642927b0b90bc860ada5be1d33d74c794ba504c0ed5:crc327:51701176:lengthi41712e3:md532:905a1dd98e348399d45ae857f97410905:mtime10:11208469064:pathl7:16250-h6:images13:music0007.pnge4:sha140:63f9cf64956a682369cc2475238bca58d4483f17ed5:crc328:d616873b6:lengthi36415e3:md532:ea15078f093bd22d579079cfd15ffc225:mtime10:11208469324:pathl7:16250-h6:images15:music0007_t.pnge4:sha140:468bf99a366f964e868a2112796681e8b311c35ced5:crc328:f5cf28446:lengthi33783e3:md532:0fa7a6daa701d0f663969ddaf7b621a75:mtime10:11208477704:pathl7:16250-h6:images13:music0028.pnge4:sha140:84cd72b2eb8f9230b1f50670c61ddbb3ef7dfe49ed5:crc328:d5d4fe5c6:lengthi30454e3:md532:b03490d1115dfc714956318e7b2d9b5c5:mtime10:11208477184:pathl7:16250-h6:images15:music0028_t.pnge4:sha140:d90bffb8012a89281603ccf66d959637dc531300ed5:crc328:b913ea8d6:lengthi54901e3:md532:02f52a42b6e2b15c47ec2f040ee34a8e5:mtime10:11208478004:pathl7:16250-h6:images13:music0029.pnge4:sha140:89f8dfe5f5489b4ca594d1ab37f4e0c7f3a92384ed5:crc328:24481c986:lengthi52170e3:md532:bfa2ac2b30d4dd5277a5f7b4798a0f085:mtime10:11208478224:pathl7:16250-h6:images15:music0029_t.pnge4:sha140:396b8a73f2068fd02f30c57eca38ec9d7cc78613ed5:crc328:fc9051f36:lengthi68550e3:md532:538cf2101cc8a859a2247d5a0e5128dd5:mtime10:11208482744:pathl7:16250-h6:images13:music0050.pnge4:sha140:a1f2f1bccb8569867df699894b715415c2352dfeed5:crc327:a73800f6:lengthi62020e3:md532:dcd9eb28db5791287a01fa6c65ce73f35:mtime10:11208482884:pathl7:16250-h6:images15:music0050_t.pnge4:sha140:9f5ef750ada5da51e81be9ed73099d475a0d5e6eed5:crc328:f73eb15f6:lengthi89749e3:md532:574c8ee5b766e2ab1d39ce5a553f8cc15:mtime10:11208483524:pathl7:16250-h6:images13:music0051.pnge4:sha140:2bb65c015fbd734f49b05118fe867cb2a436cd2fed5:crc328:675e524b6:lengthi82579e3:md532:a9879a7ddba8e06020d7d4cb2037037d5:mtime10:11208483684:pathl7:16250-h6:images15:music0051_t.pnge4:sha140:4d22452017f7653173e30b55184f1a3d582bec26ed5:crc328:c6e8d6d56:lengthi50519e3:md532:edc5ba4d1ac4421aeb99b1325f68d5855:mtime10:11208484064:pathl7:16250-h6:images13:music0052.pnge4:sha140:c0735633f95c10a1dbfb737304133fbb7f20d574ed5:crc328:6fe448936:lengthi46647e3:md532:7ae1cdf57b1fdcc0ab3ea40bc726aad95:mtime10:11208484204:pathl7:16250-h6:images15:music0052_t.pnge4:sha140:fc96371ea9be03184b6f1aa53b01b722719ae795ed5:crc328:f28f82b96:lengthi14136e3:md532:9b44028af461b5874dddaca9e29367e55:mtime10:11208488864:pathl7:16250-h6:images13:music0065.pnge4:sha140:9c431cbc7e1a90408602c218c810f0f32b239b46ed5:crc328:76aef0916:lengthi14135e3:md532:1d0aad38763ec68b891ebd50ac465fc45:mtime10:11208488984:pathl7:16250-h6:images15:music0065_t.pnge4:sha140:7aa43355c66d9f9799820300de8f65d7d3ee2605ed5:crc328:9bb727ec6:lengthi74647e3:md532:c0aecb7ef4619b572041dc5d49c227635:mtime10:11208489544:pathl7:16250-h6:images13:music0066.pnge4:sha140:c0c781825186e309f3b6ac83932ffe265bb16feaed5:crc328:a917acc46:lengthi43372e3:md532:93fa9a3746da18bd78c42e8ae7c5a36d5:mtime10:11208489664:pathl7:16250-h6:images15:music0066_t.pnge4:sha140:22a745532e061ba04427d07e4569435238e52027ed5:crc327:e7e48b06:lengthi108060e3:md532:84c6e6bbf7725b19ea50fb2cf26207fb5:mtime10:11208496324:pathl7:16250-h6:images9:title.pnge4:sha140:0ed086455f3d2d3e498ae2485a1fa563e74e7cd6ee4:name24:tristanandisolda16250gut12:piece lengthi524288e6:pieces100:à4±¡üÆú¦û/¹ÆÔä—éò9ŠWö°«Šú³¡1Ucˆ†³×)ðçä¬êUôxYŒ2¨PD’wyÌFi	‚Sœ®½Ïþq0à8¡àR÷Æ§0PªÍhÅ¢eüãq'Ke";

module.exports = trackerConnection;
