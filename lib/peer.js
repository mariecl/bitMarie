/*
* This module creates a peer and manages all the peer to peer relationship and behavior.
*/

var net = require('net'),
	crypto = require('crypto'),
	utils = require('../utils/utils');

/*
* @id @ip @port: information about the peer provided by the tracker
* @info_hash: allows peers to know which torrent our client is trying to access
* @peer_id: allows peers to identify our client
* (note: a single peer can be contacted by a single client for different torrent files)
*/
function Peer (ip, port, pieceInfo, peerWireProtocol, callback) {
	if (net.isIP(ip) == 0) {
		callback(new Error ('Error: invalid IP address' + ip + port));
	}

	this.ip = ip;
	this.port = port;
	this.piece = pieceInfo;
	this.info_hash = this.piece.sha1_info_hash;
	this.peer_id = this.piece.sha1_peer_id;
	this.peerWireProtocol = peerWireProtocol;

	// Client connections start out as "choked" and "not interested"
	this.am_choking = 1;
	this.am_interested = 0;
	this.peer_choking = 1;
	this.peer_interested = 0;

	this.connected = false;
	this.handshake = this.generateHandshake();
	this.sent_handshake = false;
	this.received_handshake = false;
	this.bitfield = [];
	
	this.sent_bitfield = false;
	this.received_bitfield = false;

	this.data = new Buffer(0);
	this.id = new Buffer(0);
	this.inTransitPieceData = new Buffer(this.piece.pieceLength);
	this.socket = this.openSocket(callback);
}

Peer.prototype.openSocket = function (callback) {
	var socket = net.createConnection(this.port, this.ip, function () {
		console.log('Connected to ' + this.ip + ':' + this.port);
		this.connected = true;
		this.sendHandshake();
		setTimeout((function () {this.send_keep_alive();}).bind(this), 60000);
	}.bind(this));

	socket.on('data', function (data) {
		// console.log('Receiving data from ' + this.ip + ':' + this.port);
		this.data = Buffer.concat([this.data, data]);
		this.readData();
	}.bind(this));

	socket.on('error', function(err) {
		this.connected = false;
		callback(err);
		return this.socket.destroy();
	}.bind(this));

	socket.on('end', function() {
		this.connected = false;
		console.log(this.ip + ':' + this.port + ' ended our connection');
		return this.socket.destroy();
	}.bind(this))

	return socket;
}

/*
* Handshake model: <pstrlen><pstr><reserved><info_hash><peer_id>
* pstrlen: string length of <pstr>, as a single raw byte -> pstrlen = 19
* pstr: string identifier of the protocol -> pstr = "BitTorrent protocol"
* All later integers sent in the protocol are encoded as four bytes big-endian.
* reserved: eight (8) reserved bytes. All current implementations use all zeroes.
* info_hash: 20-byte SHA1 hash of the info key in the metainfo file.
* peer_id: 20-byte string used as a unique ID for the client.
*/
Peer.prototype.generateHandshake = function () {
	var buffer = new Buffer(68),
		pstr = "BitTorrent protocol";

	buffer.writeUInt8(19, 0);
	buffer.write("BitTorrent protocol", 1, 19);
	buffer.fill(null, 20, 28);
	this.info_hash.copy(buffer, 28);
	this.peer_id.copy(buffer, 48);

    return buffer;
};

// TODO: write a generic function to send messages
Peer.prototype.sendHandshake = function () {
	console.log('Sending handshake to ' + this.ip + ':' + this.port);
	this.socket.write(this.handshake);

	this.sent_handshake = 1;
	return
};

/*
* Reads from buffer when this.data is not empty
*/
Peer.prototype.readData = function () {
	if (this.data.length > 0) {
		
		if (!this.received_handshake) {
			this.readHandshake();
		
		} else {	
			var readMessage = false;
			do {
				readMessage = parseNextMessage(this);
			} while (readMessage);
		}

	}

};

/*
* This function scans the buffer to find a handshake sent by a peer
* and checks so it includes the expected values, namely:
* 19 + "BitTorrent protocol" + 8 reserved bytes + info_hash + peer_id
*/
Peer.prototype.readHandshake = function (callback) {
	var i = 0;

	if (this.data[0] != 19) {
		while (i < this.data.length && this.data[i] != 19) {
			i ++;
		}
	}
	
	// Checking protocol string
	for (var j = 0; i + j < this.data.length && j < 8; j ++) {
		if (this.data[i + 1 + j] != this.handshake[1 + j]) {
			callback(new Error("Handshake error: peer is using a different protocol"));
			return
		}
	}

	// Checking info_hash
	for (var k = 0; i + k < this.data.length && k < 20; k ++) {
		if (this.data[i + 28 + k] != this.handshake[28 + k]) {
			callback(new Error("Handshake error: info_hash corresponds to another file"));
			return
		}
	}

	// Store id sent by peer for later identification
	this.id = Buffer.concat([this.id, this.data.slice(i + 48, i + 68)]);

	// Remove handshake message from buffer and handle the case where the peer also sent another message
	this.data = this.data.slice(68);

	this.received_handshake = true;
	console.log('Has handshake');
	this.send_bitfield(); // TODO: only send if I have at least one piece
	return
};

/*
* Parses messages received from the connected peer after the handshake has been validated
* TODO: add to peer prototype.
*/
function parseNextMessage (peer) {
	var length;
	
	if (peer.data.length == 0) {

		return false;
	}

	length = peer.data.readUInt32BE(0);

	if (length === 0) {
		peer.parse_keep_alive();

		return true;

	} else {
		// Check if message has been fully received
		if (peer.data.length < length - 1) {
			
			return false;
		
		} else {
			// console.log("Another message " + length);
			var message_id = peer.data.readUInt8(4);
			
			switch (message_id) {
				case 0:
					peer.parse_choke();
				break;

				case 1:
					peer.parse_unchoke();
				break;

				case 2:
					peer.parse_interested();
				break;

				case 3:
					peer.parse_not_interested();
				break;

				case 4:
					peer.parse_have();
				break;

				case 5:
					peer.parse_bitfield(length);
				break;

				case 6:
					peer.parse_request();
				break;

				case 7:
					peer.parse_piece(length);
				break;

				case 8:
					peer.parse_cancel();
				break;

				case 9:
					peer.parse_port();
				break;
				default:
					throw new Error ('you messed up');
				break;
			}

			return true;
		}
		
	}

};

/*
* keep-alive: <len=0000>
*/
Peer.prototype.parse_keep_alive = function () {
	// console.log('Received keep alive message from ' + this.ip + ':' + this.port);

	this.send_keep_alive();

	this.data = this.data.slice(4);
	return
}

/*
* choke: <len=0001><id=0>
*/
Peer.prototype.parse_choke = function () {
	console.log('Received choke from ' + this.ip + ':' + this.port + '-> peer unchoked me');
	this.peer_choking = 1;

	this.data = this.data.slice(5);
	return
};

/*
* unchoke: <len=0001><id=1>
*/
Peer.prototype.parse_unchoke = function () {
	console.log('Received unchoke from ' + this.ip + ':' + this.port + '-> peer unchoked me');
	this.peer_choking = 0;

	this.data = this.data.slice(5);

	this.request_piece_from_PWC();
	return
};

/*
* interested: <len=0001><id=2>
*/
Peer.prototype.parse_interested = function () {
	console.log('Received interested from ' + this.ip + ':' + this.port);
	this.peer_interested = 1;

	this.send_unchoke();

	this.data = this.data.slice(5);
	return
};

/*
* not interested: <len=0001><id=3>
*/
Peer.prototype.parse_not_interested = function () {
	console.log('Received not interested from ' + this.ip + ':' + this.port);

	this.peer_interested = 0;

	this.data = this.data.slice(5);
	return
};

/*
* Consumes have message from peer and updates that peer's bitfield
* Have message structure: <len=0005><id=4><piece index>
*/
Peer.prototype.parse_have = function () {
	console.log('Received have from ' + this.ip + ':' + this.port);
	var pieceIndex = this.data.readUInt32BE(2);

	this.bitfield[pieceIndex] = 1;

	this.data = this.data.slice(10);
	return
};

/*
* Consumes bitField received from peers and parses it to an array representation
* BitField message structure: <len=0001+X><id=5><bitfield>
*/
Peer.prototype.parse_bitfield = function (length) {
	console.log('Received bitfield from ' + this.ip + ':' + this.port);

	for (var i = 2; i < length + 1; i ++) {
		var bitsString, bitsArray;

		bitsString = this.data.readUInt8(i).toString(2); //reads byte i and converts to binary
		bitsString = "00000000".substr(bitsString.length) + bitsString; //adds leading zeros when necessary
		bitsArray = bitsString.split(''); //converts to array of single bits
		
		for (var j = 0; j < bitsArray.length; j ++) {
			this.bitfield.push(parseInt(bitsArray[j]));
		}
		
	}

	// bitfield messagelength is length(1) + id(1) + bitfield(x) where declared length is id + bitfield
	this.data = this.data.slice(length + 5);
	this.received_bitfield = true;
	
	if (!this.sent_bitfield) {
		this.send_bitfield();
		throw new Error ('Another client initiated the connection'); //still never happened
		return
	}

	// unlock connection to user to be able to request pieces
	// this.send_unchoke();
	this.send_interested();
	return
};

/*
* WIP: not tested yet because message never received
* due to connexion being choked and not interested
*
* Consumes request for a block message from a peer
*
* Request message structure: <len=0013><id=6><index><begin><length>
* @index: integer specifying the zero-based piece index
* @begin: integer specifying the zero-based byte offset within the piece
* @length: integer specifying the requested length.
*/
Peer.prototype.parse_request = function () {
	console.log('Received request from ' + this.ip + ':' + this.port);
	var pieceIndex, blockBegin, blockLength;

	console.log(this.data.readUInt8(2) + ' ' + this.data.readUInt8(3) + ' ' + this.data.readUInt8(4) + ' ' + this.data.readUInt8(5));
	console.log(this.data.readUInt32BE(2));
	console.log(this.data.readUInt8(6) + ' ' + this.data.readUInt8(7) + ' ' + this.data.readUInt8(8) + ' ' + this.data.readUInt8(9));
	console.log(this.data.readUInt32BE(6));
	console.log(this.data.readUInt8(10) + ' ' + this.data.readUInt8(11) + ' ' + this.data.readUInt8(12) + ' ' + this.data.readUInt8(13));
	console.log(this.data.readUInt32BE(10));

	throw new Error ('Read a parse request'); // still never happened -> not tested yet

	if (this.bitfield[pieceIndex] == 1) {
		this.send_block(pieceIndex, blockBegin, blockBegin);
	}

	// this.data = this.data.slice(14);
	this.data = this.data.slice(18);
	return
};

/*
* Consumes a piece block sent by a peer
*
* Piece message structure: <len=0009+X><id=7><index><begin><block>
* 	@length: where X is the length of the block. The payload contains the following information:
*   @index: integer specifying the zero-based piece index
*   @begin: integer specifying the zero-based byte offset within the piece
*   @block: block of data, which is a subset of the piece specified by index.
*/
Peer.prototype.parse_piece = function (length) {
	console.log('Received piece from ' + this.ip + ':' + this.port); // throw new Error('actually received a block');
	var block_length = this.data.readUInt32BE(0) - 9,
		pieceIndex = this.data.readUInt32BE(5),
		begin = this.data.readUInt32BE(9);

	// copy block to the right offset into this.inTransitPieceData
	this.data.copy(this.inTransitPieceData, begin, 13);

	this.data = this.data.slice(length + 5);

	this.request_piece(begin);
	return
};

/*
* WIP
* Used to cancel block requests
* cancel: <len=0013><id=8><index><begin><length>
*/
Peer.prototype.parse_cancel = function () {
	console.log('Received cancel from ' + this.ip + ':' + this.port);
	
	this.data = this.data.slice(14);
	
	return
};

/*
* port: <len=0003><id=9><listen-port>
*/
Peer.prototype.parse_port = function () {
	console.log('Received port from ' + this.ip + ':' + this.port);
	
	this.socket.remotePort = this.data.readUInt16BE(5);
	this.data = this.data.slice(7);
	
	return
};

/*
* Sends a bitfield to the peer following the expected format:
* <len=0001+X><id=5><bitfield>
*/
Peer.prototype.send_bitfield = function() {
	console.log("Sending bitfield to " + this.ip + ':' + this.port);
	var length_buffer = new Buffer (4),
		id_buffer = new Buffer (1),
		encodedBitfield = encodeBitField(),
		bitfield_buffer = new Buffer(encodedBitfield), //creates a buffer of length encodedBitfield
		final_buffer;
	
	length_buffer.writeUInt32BE(encodedBitfield.length + 1, 0);
	id_buffer.writeUInt8(5, 0);
	bitfield_buffer.write(encodedBitfield.toString(), 0); //write a string to the buffer? -> make it an array?

	final_buffer = Buffer.concat([length_buffer, id_buffer, bitfield_buffer]);

	this.socket.write(final_buffer);
	this.sent_bitfield = true;
	return
};

/*
* Sends a keep_alive message to the given peer every 1 minute
*/
Peer.prototype.send_keep_alive = function () {
	console.log("Sending keep alive to " + this.ip + ':' + this.port);
	var length_buffer = new Buffer (4);

	length_buffer.writeUInt32BE(0, 0);

	this.socket.write(length_buffer);

    setTimeout((function () {this.send_keep_alive();}).bind(this), 60000);
};

/*
* WIP (this case has never occured yet)
*/
Peer.prototype.send_block = function(pieceIndex, blockBegin, blockBegin) {
	console.log("I need to send piece #" + pieceIndex);
	return
};

/*
* unchoke: <len=0001><id=1> -> WIP case never occured
*/
Peer.prototype.send_unchoke = function () {
	console.log('Sending unchoke to ' + this.ip + ':' + this.port);
	var length_buffer = new Buffer(4),
		id_buffer = new Buffer(1),
		final_buffer;

	length_buffer.writeUInt32BE(1, 0);
	id_buffer.writeUInt8(1, 0);

	final_buffer = Buffer.concat([length_buffer, id_buffer]); console.log(final_buffer); throw new Error ('buffer send unchoke');

	this.socket.write(final_buffer);
	this.am_choking = 0;
	return
};

/*
* interested: <len=0001><id=2>
*/
Peer.prototype.send_interested = function () {
	console.log('Sending interested to ' + this.ip + ':' + this.port);
	var length_buffer = new Buffer (4),
		id_buffer = new Buffer (1),
		final_buffer;

	length_buffer.writeUInt32BE(1, 0);
	id_buffer.writeUInt8(2, 0);

	final_buffer = Buffer.concat([length_buffer, id_buffer]);

	this.socket.write(final_buffer);
	this.am_interested = 1;
	return
};

/*
* have: <len=0005><id=4><piece index>
*/
Peer.prototype.send_have = function (pieceIndex) {
	console.log('Sending have to ' + this.ip + ':' + this.port);
	var length_buffer = new Buffer (4),
		id_buffer = new Buffer (1),
		pieceIndex_buffer = new Buffer (4),
		final_buffer;

	length_buffer.writeUInt32BE(1, 0);
	id_buffer.writeUInt8(2, 0);
	pieceIndex_buffer.writeUInt32BE(pieceIndex, 0);

	final_buffer = Buffer.concat([length_buffer, id_buffer, pieceIndex_buffer]);

	this.socket.write(final_buffer);
	return
};


/*
* request: <len=0013><id=6><index><begin><length>
*/
Peer.prototype.send_request = function (pieceIndex, pieceBegin, pieceLength) {
	console.log('Sending request for piece ' + pieceIndex + ' to ' + this.ip + ':' + this.port);
	var length_buffer = new Buffer (4),
		id_buffer = new Buffer (1),
		pieceIndex_buffer = new Buffer (4),
		pieceBegin_buffer = new Buffer (4),
		pieceLength_buffer = new Buffer (4),
		final_buffer;

	length_buffer.writeUInt32BE(13, 0);
	id_buffer.writeUInt8(6, 0);
	pieceIndex_buffer.writeUInt32BE(pieceIndex, 0);
	pieceBegin_buffer.writeUInt32BE(pieceBegin, 0);
	pieceLength_buffer.writeUInt32BE(pieceLength, 0);

	final_buffer = Buffer.concat([length_buffer, id_buffer, pieceIndex_buffer, pieceBegin_buffer, pieceLength_buffer]);

	this.socket.write(final_buffer);
	return
}

/*
* Ask parent Peer Wire Protocol for a piece (index) to download and
* starts the downloading logic
*/
Peer.prototype.request_piece_from_PWC = function () {
	this.pieceIndex = this.peerWireProtocol.attribute_piece_index(this);

	this.request_piece();

	return
};

// TODO: move blockLength to a constant status
Peer.prototype.request_piece = function	(lastDownloadedBlock) {
	var blockLength = Math.pow(2, 14),
		i = (typeof lastDownloadedBlock == 'undefined') ? 0 : lastDownloadedBlock + blockLength;

	if (i < this.piece.pieceLength) {
		// requesting blocks 0, 1, ..., n - 1
		this.send_request(this.pieceIndex, i, blockLength);
		
		return;
	}

	if (this.piece.pieceLength % blockLength != 0) {
		// requesting last block (which can be shorter than 2^14 bytes)
		this.send_request(this.pieceIndex, this.piece.pieceLength - i, this.piece.pieceLength % blockLength);
		
		return
	}

	// 1. check if SHA1 sum of downloaded content corresponds to the info from the torrent file
	// TODO: fix indexing of piecesTable in order not to have to use *20 to find the correct element
	// TODO: make check buffer equals buffer a function in utils
	for (var i = 0; i < 20; i ++) {
		
		if (utils.sha1(this.inTransitPieceData)[i] != this.piece.piecesTable[this.pieceIndex * 20][i]) {
			throw new Error('There was a problem while downloading')
			// this.request_piece(); 
			// TODO: find out if trying to download
			// the same piece again from the same peer is a good idea
			return
		}

	}

	//2. copy to disk

	//3. update this.piece.bifield and this.piece.transitfield
	this.piece.bitfield[this.pieceIndex] = 1;
	this.piece.transitfield[this.pieceIndex] = 0;

	//4. have PWC send have messages to all connected peers
	this.peerWireProtocol.advertise(this.pieceIndex);

	//5. clear this.inTransitPieceData
	this.inTransitPieceData = new Buffer(this.piece.pieceLength);

	//6. ask for a new piece index to download
	this.request_piece_from_PWC();
	return;
};

/*
* Encodes bitfield using a serialized string of hex values,
* each of which represents a byte-sized integer that,
* when converted to binary representation, indicates the status of eight pieces.
*/
// TODO: move to util file?
function encodeBitField () {
	var binaryString = '',
		encodedBitfield = [];

	for (var i = 0; i < this.piece.bitfield.length; i ++) {
		binaryString += this.piece.bitfield[i];

		if (binaryString.length == 8) {
			var digit = parseInt(binaryString, 2)
			encodedBitfield.push(digit);
			binaryString = '';
		}

	}

	// add trailing zeros to form the last byte
	if (binaryString != '') {
		while (binaryString.length < 8) {
			binaryString += '0';
		}
		encodedBitfield.push(parseInt(binaryString, 2));
	}

	return encodedBitfield;
}

module.exports = Peer;