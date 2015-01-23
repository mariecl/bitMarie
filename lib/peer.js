/*
* This module will create the client connections to peers and manage the handshake protocol
*/

var net = require('net');

/*
* @id @ip @port: information about the peer provided by the tracker
* @info_hash: allows peers to know which torrent our client is trying to access
* @peer_id: allows peers to identify our client
* (note: a single peer can be contacted by a single client for different torrent files)
*/
function Peer (ip, port, info_hash, peer_id) {
	if (net.isIP(ip) == 0) {
		throw new Error ('Error: invalid IP address');
	}

	this.ip = ip;
	this.port = port;
	this.info_hash = info_hash;
	this.peer_id = peer_id;

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
	this.socket = this.openSocket();

/*	while (this.connected == false) {
		this.socket = this.openSocket();
	}

	while (this.connected == true) {
		while (this.sent_handshake == false) {
			this.sendHandshake();
		}
	}*/
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
			this.readMessages();
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
}

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
			return new Error("Handshale error: info_hash corresponds to another file");
		}
	}

	// Store id sent by peer for later identification
	this.id = Buffer.concat([this.id, this.data.slice(i + 48, i + 68)]);

	this.received_handshake = true;
};

Peer.prototype.readMessages = function () {
};

module.exports = Peer;