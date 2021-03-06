/*
* This module will handle the connection to peers, given a valid with peers tracker response
*/

var Peer = require('./peer');

function TorrentSession (trackerResponse, pieceInfo, callback) {
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
TorrentSession.prototype.getPeersListFromBinary = function (callback) {
	var buffer = this.trackerResponse.peers,
		length = buffer.length;

	for (var i = 0; i + 6 < length; i += 6) {
        var ip = [buffer.readUInt8(i), buffer.readUInt8(i + 1), buffer.readUInt8(i + 2), buffer.readUInt8(i + 3)].join('.'),
            port = buffer.readUInt16BE(i + 4);

		this.peers.push(new Peer(ip, port, this.piece, this, callback));
	}
};

/*
* This will return an array of peer objects
* @peersDictionnary: object returned by bencode decoder containing a list of peers with
* their ip address and preferred ports
*/
TorrentSession.prototype.getPeersListFromDictionnary = function (callback) {
	this.trackerResponse.peers.map(function(peerObject) {
		this.peers.push(new Peer(peerObject.id, peerObject.ip, peerObject.port, this, callback));
	})
};

TorrentSession.prototype.attribute_piece_index = function (peer) {
	var pieceIndex;

	// find rarest piece
	pieceIndex = this.findRarestPiece(peer);

	// mark that piece as in transit in piece.transitfield
	this.piece.transitfield[pieceIndex] = 1;

	return pieceIndex;
};

/*
* Returns the index of the rarest piece that meet the following conditions:
* - the peer has advertised having it
* - AND I haven't downloaded it yet
* - AND it is not aleady in transit
*/
TorrentSession.prototype.findRarestPiece = function (peer) {
	var minimumAvailability = this.peers.length,
		lastRarestPieceIndex = 0;

	for (var index = 0; index < peer.bitfield.length; index ++) {

		if (peer.bitfield[index] === 1
			&& this.piece.bitfield[index] === 0
			&& this.piece.transitfield[index] === 0) {
			
			var pieceAvailability = 0;
			
			// compute availability (number of peers who have the given piece)
			for (var id = 0; id < this.peers.length; id ++) {
				if (this.peers[id].bitfield[index] === 1) {
					pieceAvailability ++;
				}
			}

			if (pieceAvailability === 0) {
				return index;
			}

			if (pieceAvailability < minimumAvailability) {
				minimumAvailability = pieceAvailability;
				lastRarestPieceIndex = index;
			}
		}
	}

	return lastRarestPieceIndex;
};

/*
* Advertise a newly received piece to all connected peers
*/
TorrentSession.prototype.advertise = function (pieceIndex) {
	for (var i = 0; i < this.peers.length; i ++) {
		var peer = this.peers[i];
		
		if (peer.connected === true) {
			peer.send_have(pieceIndex);
		}
	
	}

	return
};

module.exports = TorrentSession;