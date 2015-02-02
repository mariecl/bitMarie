/*
* This module creates a peer and manages all the peer to peer relationship and behavior.
*/

var net = require('net'),
	crypto = require('crypto');

/*
* @id @ip @port: information about the peer provided by the tracker
* @info_hash: allows peers to know which torrent our client is trying to access
* @peer_id: allows peers to identify our client
* (note: a single peer can be contacted by a single client for different torrent files)
*/
function Peer (ip, port, pieceInfo, callback) {
	if (net.isIP(ip) == 0) {
		callback(new Error ('Error: invalid IP address' + ip + port));
	}

	this.ip = ip;
	this.port = port;
	this.piece = pieceInfo;
	this.info_hash = this.piece.sha1_info_hash;
	this.peer_id = this.piece.sha1_peer_id;

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

	this.data = new Buffer(0);
	this.id = new Buffer(0);
	this.offset = 0;
	this.socket = this.openSocket(callback);
}

Peer.prototype.openSocket = function (callback) {
	var socket = net.createConnection(this.port, this.ip, function () {
		console.log('Connected to ' + this.ip + ':' + this.port);
		this.connected = true;
		this.sendHandshake();
		this.send_keep_alive();
	}.bind(this));

	socket.on('data', function (data) {
		console.log('Receiving data from ' + this.ip + ':' + this.port);
		this.data = Buffer.concat([this.data, data]);
		this.readData();
	}.bind(this));

	socket.on('error', function(err) {
		callback(err);
	});

	socket.on('end', function() {
		console.log('Ended connection to ' + this.ip + ':' + this.port);
		this.connected = false;
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
};

/*
* Reads from buffer when peer.data holds data
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

	// TODO: find out if "19" can be something else than the first byte ever sent by peer
	if (this.data[0] != 19) {
		while (i < this.data.length && this.data[i] != 19) {
			i ++;
		}
	}
	
	// Checking protocol string
	for (var j = 0; i + j < this.data.length && j < 8; j ++) {
		if (this.data[i + 1 + j] != this.handshake[1 + j]) {
			callback(new Error("Handshake error: peer is using a different protocol"));
		}
	}

	// Checking info_hash
	for (var k = 0; i + k < this.data.length && k < 20; k ++) {
		if (this.data[i + 28 + k] != this.handshake[28 + k]) {
			callback(new Error("Handshake error: info_hash corresponds to another file"));
		}
	}

	// Store id sent by peer for later identification
	this.id = Buffer.concat([this.id, this.data.slice(i + 48, i + 68)]);

	// Remove handshake message from buffer and handle the case where the peer also sent another message
	this.data = this.data.slice(68);

	//this.offset += 69;
	this.received_handshake = true;
	console.log('Has handshake');
	this.send_bitfield(); // TODO: only send if I have at least one piece
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

	length = peer.data.readUInt8(0);

	if (length === 0) {
		peer.parse_keep_alive();

		return true;

	} else {
		// Check if message has been fully received
		if (peer.data.length < length - 1) {
			
			return false;
		
		} else {
			console.log("Another message " + length);
			var message_id = peer.data.readUInt8(1);
			
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
			}

			return true;
		}
		
	}

};

Peer.prototype.parse_keep_alive = function () {
	console.log('Received keep alive message from ' + this.ip + ':' + this.port);
	this.data = this.data.slice(1);
}

Peer.prototype.parse_choke = function () {
	console.log('Received choke from ' + this.ip + ':' + this.port);
	this.peer_choking = 1;
	this.data = this.data.slice(2);
};

Peer.prototype.parse_unchoke = function () {
	console.log('Received unchoke from ' + this.ip + ':' + this.port);
	this.peer_choking = 0;
	this.data = this.data.slice(2);
};

Peer.prototype.parse_interested = function () {
	console.log('Received interested from ' + this.ip + ':' + this.port);
	this.peer_interested = 1;
	this.data = this.data.slice(2);
};

Peer.prototype.parse_not_interested = function () {
	console.log('Received not interested from ' + this.ip + ':' + this.port);
	this.peer_interested = 0;
	this.data = this.data.slice(2);
};

/*
* Consumes have message from peer and updates that peer's bitfield
* Have message structure: <len=0005><id=4><piece index>
*/
Peer.prototype.parse_have = function () {
	console.log('Received have from ' + this.ip + ':' + this.port);
	var pieceIndex = this.data.readUInt32BE(2);

	this.bitfield[pieceIndex] = 1;

	this.data = this.data.slice(6);
};

/*
* Consumes bitField received from peers and parses it to an array representation
* BitField message structure: <len=0001+X><id=5><bitfield>
*/
Peer.prototype.parse_bitfield = function (length) {
	console.log('Received bitfield from ' + this.ip + ':' + this.port);
	// var counter = 0;

	for (var i = 2; i < length + 1; i ++) {
		var bitsString, bitsArray;

		bitsString = this.data.readUInt8(i).toString(2); //reads byte i and converts to binary
		bitsString = "00000000".substr(bitsString.length) + bitsString; //adds leading zeros when necessary
		bitsArray = bitsString.split(''); //converts to array of single bits
		
		for (var j = 0; j < bitsArray.length; j ++) {
			this.bitfield.push(parseInt(bitsArray[j]));
			// counter ++;
		}
		
		// console.log(this.data.readUInt8(i) + " vs. " + bitsArray);
	}
	
	// console.log("Expected " + this.piece.numberOfPieces + " vs. found: " + counter); 

	// bitfield messagelength is length(1) + id(1) + bitfield(x) where declared length is id + bitfield
	this.data = this.data.slice(length + 1);
};

Peer.prototype.parse_request = function () {
	console.log('Received request from ' + this.ip + ':' + this.port);
	this.data = this.data.slice(14);
};

Peer.prototype.parse_piece = function (length) {
	console.log('Received piece from ' + this.ip + ':' + this.port);
	this.data = this.data.slice(length + 1);
};

Peer.prototype.parse_cancel = function () {
	console.log('Received cancel from ' + this.ip + ':' + this.port);
	this.data = this.data.slice(14);
};

Peer.prototype.parse_port = function () {
	console.log('Received port from ' + this.ip + ':' + this.port);
	this.data = this.data.slice(4);
};

/*
* Sends a bitfield to the peer following the expected format:
* <len=0001+X><id=5><bitfield>
*/
Peer.prototype.send_bitfield = function() {
	console.log("Sending bitfield to " + this.ip + ':' + this.port);
	var encodedBitfield, bitfieldLength, bitfield_buffer, length_buffer, id_buffer, final_buffer;

	encodedBitfield = encodeBitField();

	bitfield_buffer = new Buffer(encodedBitfield);
	id_buffer = new Buffer('5');
	length_buffer = new Buffer ((encodedBitfield.length + 1).toString());

	final_buffer = Buffer.concat([length_buffer, id_buffer, bitfield_buffer]);

	this.socket.write(final_buffer); 
};

/*
* Sends a keep_alive message to the given peer every 2 minutes
* TODO: make it only send the keep_alive message if no message
* was received in the past 2 minutes.
*/
Peer.prototype.send_keep_alive = function () {
	console.log("Sending keep alive to " + this.ip + ':' + this.port);
    setTimeout(this.send_keep_alive, 120000);
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