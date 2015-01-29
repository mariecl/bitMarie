/*
* This module will handle the connection to peers, given a valid with peers tracker response
*/

var Peer = require('./peer');

function PeerWireProtocol (trackerResponse, pieceInfo, callback) {
	if (trackerResponse && typeof trackerResponse == 'undefined') {
		callback(new Error('The passed trackerResponse object is undefined'));
	}

	if (trackerResponse.peers.length == 0 | typeof trackerResponse.peers == 'undefined') {
		callback(new Error('There tracker did not report any peer'));
	}

	this.trackerResponse = trackerResponse;
	this.peers = [];
	this.piece = pieceInfo;

	// Peers list received from the tracker can be a buffer or bencoded dictionnary
    if (trackerResponse.peers instanceof Buffer) {
    	this.getPeersListFromBinary(callback);
    } else {
    	this.getPeersListFromDictionnary(callback);
    }
};

/*
* This will return an array of peer objects
* Each peer value may be a string consisting of multiples of 6 bytes
* in network (big endian) notation:
* - First 4 bytes are the IP address
* - Last 2 bytes are the port number.
*/
PeerWireProtocol.prototype.getPeersListFromBinary = function (callback) {
	var buffer = this.trackerResponse.peers,
		length = buffer.length;

	for (var i = 0; i + 6 < /*length*/ 7; i += 6) {
        var ip = [buffer.readUInt8(i), buffer.readUInt8(i + 1), buffer.readUInt8(i + 2), buffer.readUInt8(i + 3)].join('.'),
            port = buffer.readUInt16BE(i + 4);

		this.peers.push(new Peer(ip, port, this.piece, callback));
	}
};

/*
* This will return an array of peer objects
* @peersDictionnary: object returned by bencode decoder containing a list of peers with
* their ip address and preferred ports
*/
PeerWireProtocol.prototype.getPeersListFromDictionnary = function (callback) {
	this.trackerResponse.peers.map(function(peerObject) {
		this.peers.push(new Peer(peerObject.id, peerObject.ip, peerObject.port, callback));
	})
};

module.exports = PeerWireProtocol;