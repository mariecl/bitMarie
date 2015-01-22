/*
* This file will handle the connection to peers, given a valid tracker response
*/

var bencode = require('bencode'),
    net = require('net'),
	Peer = require('./peer');

function PeerWireProtocol (trackerResponse, info_hash, peer_id) {
	if (trackerResponse && typeof trackerResponse == 'undefined') {
		return new Error ('trackerResponse object is undefined');
	}

	if (trackerResponse['failure reason']) {
		return new Error("Tracker reported failure: " + trackerResponse['failure reason']);
	}

	if (trackerResponse.peers.length == 0 | typeof trackerResponse.peers == 'undefined') {
		return new Error("Tracker returned no peers.");
	}

	this.trackerResponse = trackerResponse;
	this.peers = [];
    this.info_hash = info_hash;
    this.peer_id = peer_id;

	// Peers list received from the tracker can be a buffer or bencoded dictionnary
    if (trackerResponse.peers instanceof Buffer) {
    	this.getPeersListFromBinary();
    } else {
    	this.getPeersListFromDictionnary();
    }

	for(var i = 0; i < this.peers.length; i++) {
		this.peers[i].sendHandshake(this.handshake());

		break;
	}
};

/*
* This will return an array of peer objects
* Each peer value may be a string consisting of multiples of 6 bytes
* in network (big endian) notation:
* - First 4 bytes are the IP address
* - Last 2 bytes are the port number.
*/
PeerWireProtocol.prototype.getPeersListFromBinary = function () {
	var buffer = this.trackerResponse.peers,
		length = buffer.length;

	for (var i = 0; i + 6 < length; i += 6) {
        var ip = [buffer.readUInt8(i), buffer.readUInt8(i + 1), buffer.readUInt8(i + 2), buffer.readUInt8(i + 3)].join('.'),
            port = buffer.readUInt16BE(i + 4);

		this.peers.push(new Peer(this.peers.length + 1, ip, port));
	}
};

/*
* This will return an array of peer objects
* @peersDictionnary: object returned by bencode decoder containing a list of peers with
* their ip address and preferred ports
*/
PeerWireProtocol.prototype.getPeersListFromDictionnary = function () {
	this.trackerResponse.peers.map(function(peerObject) {
		this.peers.push(new Peer(peerObject.id, peerObject.ip, peerObject.port));
	})
};

/*
* Handshake: <pstrlen><pstr><reserved><info_hash><peer_id>
* pstrlen: string length of <pstr>, as a single raw byte -> pstrlen = 19
* pstr: string identifier of the protocol -> pstr = "BitTorrent protocol"
* All later integers sent in the protocol are encoded as four bytes big-endian.
* reserved: eight (8) reserved bytes. All current implementations use all zeroes.
* info_hash: 20-byte SHA1 hash of the info key in the metainfo file.
* peer_id: 20-byte string used as a unique ID for the client.
*/
PeerWireProtocol.prototype.handshake = function () {
    var pstr = "BitTorrent protocol";
    // TODO: proper encoding
    return pstr.length + pstr + "00000000" + this.info_hash + this.peer_id;
}

module.exports = PeerWireProtocol;