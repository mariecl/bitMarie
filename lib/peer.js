/*
* This module will create the client connections to peers and manage the handshake protocol
*/

var net = require('net'),
	crypto = require('crypto');

/*
* @id @ip @port: information about the peer provided by the tracker
* @info_hash: allows peers to know which torrent our client is trying to access
* @peer_id: allows peers to identify our client
* (note: a single peer can be contacted by a single client for different torrent files)
*/
function Peer (ip, port, pieceInfo) {
	if (net.isIP(ip) == 0) {
		throw new Error ('Error: invalid IP address');
	}

	this.ip = ip;
	this.port = port;
	this.piece = pieceInfo;
	this.info_hash = this.piece.sha1_info_hash;
	this.peer_id = this.piece.sha1_peer_id;
	// this.keep_alive();

	// Client connections start out as "choked" and "not interested"
	this.am_choking = 1;
	this.am_interested = 0;
	this.peer_choking = 1;
	this.peer_interested = 0;

	this.connected = false;
	this.handshake = this.generateHandshake();
	this.sent_handshake = false;
	this.received_handshake = false;

	this.data = new Buffer(0);
	this.id = new Buffer(0);
	this.offset = 0;
	this.socket = this.openSocket();
}

Peer.prototype.openSocket = function () {
	var socket = net.createConnection(this.port, this.ip, function () {
		console.log('connected to ' + this.ip + ":" + this.port);
		this.connected = true;
		this.sendHandshake();
	}.bind(this));

	socket.on('data', function (data) {
		console.log('DATA');
		this.data = Buffer.concat([this.data, data]);

		if (!this.received_handshake) {
			this.readHandshake();
		} else {
			this.parseMessages();
		}

	}.bind(this));

	socket.on('error', function(err) {
		console.log("handled error");
		console.log(err);
	});

	socket.on('end', function() {
		console.log('end');
		this.connected = false;
	})

	return socket;
}

Peer.prototype.sendHandshake = function () {
	console.log("Sending handshake");
	this.socket.write(this.handshake);

	this.sent_handshake = 1;
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

/*
* This function scans the buffer to find a handshake sent by a peer
* and checks so it includes the expected values, namely:
* 19 + "BitTorrent protocol" + 8 reserved bytes + info_hash + peer_id
*/
Peer.prototype.readHandshake = function () {
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
			console.log('error1');
			return new Error("Handshake error: peer is using a different protocol");
		}
	}

	// Checking info_hash
	for (var k = 0; i + k < this.data.length && k < 20; k ++) {
		if (this.data[i + 28 + k] != this.handshake[28 + k]) {
			console.log('error2');
			return new Error("Handshake error: info_hash corresponds to another file");
		}
	}

	// Store id sent by peer for later identification
	this.id = Buffer.concat([this.id, this.data.slice(i + 48, i + 68)]);

	this.offset += 69;
	this.received_handshake = true;
	this.send_bitfield();
};

Peer.prototype.parseMessages = function () {
	var length = this.data[this.offset];

	if (this.data[this.offset] == 0) {
		this.parse_keep_alive();

	} else {
		var message_id = this.data[this.offset + 1];

		switch (message_id) {
			case 0:
				this.parse_choke();
			break;

			case 1:
				this.parse_unchoke();
			break;

			case 2:
				this.parse_interested();
			break;

			case 3:
				this.parse_not_interested();
			break;

			case 4:
				this.parse_have();
			break;

			case 5:
				this.parse_bitfield();
			break;

			case 6:
				this.parse_request();
			break;

			case 7:
				this.parse_piece();
			break;

			case 8:
				this.parse_cancel();
			break;

			case 9:
				this.parse_port();
			break;
		}

		this.offset += length + 1;
	}

};

Peer.prototype.parse_keep_alive = function () {
	//console.log('Received keep alive message');
}

Peer.prototype.parse_choke = function () {
	console.log('Received choke');
	//this.choked
};

Peer.prototype.parse_unchoke = function () {
	console.log('Received unchoke');

};

Peer.prototype.parse_interested = function () {
	console.log('Received interested');

};

Peer.prototype.parse_not_interested = function () {
	console.log('Received not interested');

};

Peer.prototype.parse_have = function () {
	console.log('Received have');

};

Peer.prototype.parse_bitfield = function () {
	console.log('Received bitfield');

};

Peer.prototype.parse_request = function () {
	console.log('Received request');

};

Peer.prototype.parse_piece = function () {
	console.log('Received piece');

};

Peer.prototype.parse_cancel = function () {
	console.log('Received cancel');

};

Peer.prototype.parse_port = function () {
	console.log('Received port');

};

/*
* <len=0001+X><id=5><bitfield>
*/
Peer.prototype.send_bitfield = function() {
	console.log("Sending bitfield");

	/*this.socket.write(this.bitfield);

	this.sent_bitfield = 1;*/
};

/*
* Sends a keep_alive message to the given peer every 2 minutes
* TODO: make it only send the keep_alive message if no message
* was received in the past 2 minutes.
*/
Peer.prototype.keep_alive = function () {
	console.log("Sending keep alive");
    setTimeout(this.keep_alive, 120000);
}.bind(this);

module.exports = Peer;