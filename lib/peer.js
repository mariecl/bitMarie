/*
* This module will create the client connections to peers and manage the handshake protocol
*/

var net = require('net');

/*
* @id @ip @port: information about the peer provided by the tracker
*/
function Peer (id, ip, port) {
	if (net.isIP(ip) == 0) {
		throw new Error ('Error: invalid IP address');
	}

	this.id = id;
	this.ip = ip;
	this.port = port;

	// Client connections start out as "choked" and "not interested"
	this.am_choking = 1;
	this.am_interested = 0;
	this.peer_choking = 1;
	this.peer_interested = 0;
	this.sent_handshake = false;
	this.received_handshaked = false;

	this.socket = [];

	//this.sendHandshake('message');
}

Peer.prototype.sendHandshake = function (message) {
    console.log('Sending handshake to peer ' + this.ip + ':' + this.port);

	this.socket = net.createConnection(this.port, this.ip, function () {
		console.log('connected to ' + this.ip + ":" + this.port);
		this.socket.write(message);
	}.bind(this));

	this.socket.on('data', function (data) {
		console.log(data);
	})

	this.socket.on('error', function(ex) {
  // 		console.log("handled error");
		// console.log(ex);
	});
	
	// this.sent_handshake = true;
}

module.exports = Peer;